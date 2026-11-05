const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'routes', 'products.js');
let content = fs.readFileSync(p, 'utf8');
const marker = '// EXCEL PRICING IMPORT';
const index = content.indexOf(marker);
if (index !== -1) {
    content = content.substring(0, index);
}

const newPart = `// EXCEL PRICING IMPORT
// ==========================================
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
const xlsx = require('xlsx');

const SUPPORTED_COUNTRIES = [
    { key: 'India', name: 'India', currency: 'INR' },
    { key: 'UnitedStates', name: 'United States', currency: 'USD' },
    { key: 'UnitedKingdom', name: 'United Kingdom', currency: 'GBP' },
    { key: 'Germany', name: 'Germany', currency: 'EUR' },
    { key: 'France', name: 'France', currency: 'EUR' },
    { key: 'Spain', name: 'Spain', currency: 'EUR' },
    { key: 'Italy', name: 'Italy', currency: 'EUR' },
    { key: 'Portugal', name: 'Portugal', currency: 'EUR' },
    { key: 'UnitedArabEmirates', name: 'United Arab Emirates', currency: 'AED' },
    { key: 'SaudiArabia', name: 'Saudi Arabia', currency: 'SAR' },
    { key: 'China', name: 'China', currency: 'CNY' },
    { key: 'Japan', name: 'Japan', currency: 'JPY' },
    { key: 'Russia', name: 'Russia', currency: 'RUB' },
    { key: 'SouthKorea', name: 'South Korea', currency: 'KRW' }
];

router.post('/pricing/import-preview', adminAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Parse as array of arrays to handle the hierarchical format
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!rows || rows.length === 0) {
            return res.status(400).json({ error: 'Excel file is empty' });
        }

        const Product = require('../models/Product');
        // Fetch all products for matching
        const products = await Product.find({}, '_id legacyId isbn title type language countryPricing');
        const preview = [];
        
        let validRows = 0;
        let errorsFound = 0;

        let currentCountry = null;
        let currentCurrencyCode = null;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Skip completely empty rows
            if (!row || row.length === 0 || (!row[0] && !row[1] && !row[2])) continue;
            
            const colA = String(row[0] || '').trim();
            const colB = String(row[1] || '').trim();
            const colC = String(row[2] || '').trim();
            
            if (!colA) continue;
            if (colA.toLowerCase().includes('country name') || colA.toLowerCase().includes('country')) continue;

            const colBHasNumbers = /\\d/.test(colB);
            
            if (!colBHasNumbers) {
                currentCountry = colA; 
                continue;
            }

            if (!currentCountry) continue;

            const productTitleRaw = colA;
            const priceStr = colB;
            
            const match = priceStr.match(/^([^\\d\\s]+)?\\s*([\\d,.]+)/);
            let currencyStr = '';
            let rawPriceNum = null;
            
            if (match) {
                currencyStr = (match[1] || '').trim();
                rawPriceNum = parseFloat(match[2].replace(/,/g, ''));
            } else {
                rawPriceNum = parseFloat(priceStr.replace(/[^\\d.-]/g, ''));
            }

            let errors = [];

            let product = null;
            const pTitle = productTitleRaw.toLowerCase();
            
            let volume = null;
            if (pTitle.includes('volume 1')) volume = 'VOL 1';
            else if (pTitle.includes('volume 2')) volume = 'VOL 2';
            
            let language = null;
            if (pTitle.includes('english')) language = 'English';
            else if (pTitle.includes('hindi')) language = 'Hindi';
            
            let type = null;
            if (pTitle.includes('hardcover')) type = 'HARDCOVER';
            else if (pTitle.includes('paperback')) type = 'PAPERBACK';
            else if (pTitle.includes('e-book') || pTitle.includes('ebook')) type = 'EBOOK';
            else if (pTitle.includes('audiobook') || pTitle.includes('audio')) type = 'AUDIOBOOK';

            if (volume && language && type) {
                product = products.find(p => 
                    p.title && p.title.toUpperCase().includes(volume) && 
                    p.language === language && 
                    p.type === type
                );
            }

            if (!product) {
                errors.push('Missing Book');
            }

            const countryKey = currentCountry.replace(/\\s+/g, '');

            if (isNaN(rawPriceNum) || rawPriceNum === null) {
                errors.push('Invalid Price');
            } else if (rawPriceNum < 0) {
                errors.push('Negative Price');
            }

            if (errors.length === 0) validRows++;
            else errorsFound++;

            preview.push({
                rowIndex: i + 1,
                sku: product ? product.legacyId : '',
                isbn: product ? product.isbn : '',
                title: productTitleRaw,
                productId: product ? String(product._id) : null,
                countryName: currentCountry,
                countryKey: countryKey,
                currency: currencyStr,
                importedPrice: rawPriceNum,
                errors: errors,
                isValid: errors.length === 0
            });
        }

        res.json({
            preview: preview,
            summary: {
                totalRows: rows.length,
                validRows,
                errorsFound
            }
        });
    } catch (e) {
        console.error('Import preview error:', e);
        res.status(500).json({ error: 'Failed to process Excel file. Please check format.' });
    }
});

router.post('/pricing/import-confirm', adminAuth, async (req, res) => {
    const mongoose = require('mongoose');
    const Product = require('../models/Product');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { importMode, previewData } = req.body;
        
        if (!previewData || !Array.isArray(previewData)) {
            return res.status(400).json({ error: 'Invalid data' });
        }

        const updatesByProduct = {};
        for (const row of previewData) {
            if (!row.isValid || !row.productId || !row.countryKey) continue;
            
            if (!updatesByProduct[row.productId]) {
                updatesByProduct[row.productId] = {};
            }
            updatesByProduct[row.productId][row.countryKey] = row.importedPrice;
        }

        let productsUpdated = 0;
        let countriesUpdated = 0;

        for (const [productId, countryUpdates] of Object.entries(updatesByProduct)) {
            const product = await Product.findById(productId).session(session);
            if (!product) continue;

            let currentPricing = product.countryPricing || {};
            currentPricing = (typeof currentPricing.toObject === 'function') ? currentPricing.toObject() : JSON.parse(JSON.stringify(currentPricing));

            if (importMode === 'replace') {
                currentPricing = {};
            }

            for (const [countryKey, newPrice] of Object.entries(countryUpdates)) {
                if (!currentPricing[countryKey]) {
                    currentPricing[countryKey] = { enabled: true };
                }
                currentPricing[countryKey].price = newPrice;
                if (!currentPricing[countryKey].mrp || currentPricing[countryKey].mrp < newPrice) {
                    currentPricing[countryKey].mrp = newPrice;
                }
                countriesUpdated++;
            }

            await Product.updateOne({ _id: productId }, { $set: { countryPricing: currentPricing } }, { session });
            productsUpdated++;
        }

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            message: \`Import successful. Updated \${countriesUpdated} prices across \${productsUpdated} products.\`,
            stats: { productsUpdated, countriesUpdated }
        });
    } catch (e) {
        await session.abortTransaction();
        session.endSession();
        console.error('Import confirm error:', e);
        res.status(500).json({ error: 'Failed to confirm import. Changes rolled back.' });
    }
});

module.exports = router;
`;

fs.writeFileSync(p, content + newPart);
console.log('Fixed products.js');
