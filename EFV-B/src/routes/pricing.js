const express = require('express');
const router = express.Router();
const { Product, Volume } = require('../models');
const adminAuth = require('../middleware/adminAuth');
const multer = require('multer');
const xlsx = require('xlsx');
const mongoose = require('mongoose');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB limit

// Helper to seed volumes if none exist
const syncVolumes = async () => {
    try {
        const products = await Product.find();
        const volumeMap = new Map();
        
        (products || []).forEach(p => {
            let volNum = null;
            if (p.volume && !isNaN(parseInt(p.volume))) {
                volNum = parseInt(p.volume);
            } else {
                const match = (p.title || '').match(/VOL(?:UME)?\s*(\d+)/i);
                if (match) volNum = parseInt(match[1]);
            }
            if (volNum) {
                if (!volumeMap.has(volNum)) {
                    volumeMap.set(volNum, { books: new Set(), countries: new Set() });
                }
                const v = volumeMap.get(volNum);
                v.books.add(p._id ? p._id.toString() : p.id);
                
                if (p.countryPricing && typeof p.countryPricing === 'object') {
                    Object.keys(p.countryPricing).forEach(c => v.countries.add(c));
                }
            }
        });

        if (volumeMap.size === 0) {
            [1, 2].forEach(vNum => volumeMap.set(vNum, { books: new Set(), countries: new Set() }));
        }

        for (const [volNum, data] of volumeMap.entries()) {
            const hasCountries = data.countries.size > 0;
            const status = hasCountries ? 'Completed' : 'Pending';
            
            let existingVol = await Volume.findOne({ volumeNumber: volNum });
            if (existingVol) {
                existingVol.name = `Volume ${volNum}`;
                existingVol.bookCount = data.books.size;
                existingVol.countryCount = data.countries.size;
                existingVol.importStatus = status;
                existingVol.lastUpdated = new Date().toISOString();
                if (typeof existingVol.save === 'function') await existingVol.save();
                else await Volume.findByIdAndUpdate(existingVol._id || existingVol.id, existingVol);
            } else {
                await Volume.create({
                    volumeNumber: volNum,
                    name: `Volume ${volNum}`,
                    bookCount: data.books.size,
                    countryCount: data.countries.size,
                    importStatus: status,
                    lastUpdated: new Date().toISOString()
                });
            }
        }
    } catch (e) {
        console.error('Error syncing volumes:', e);
    }
};

// GET /pricing or /pricing/volumes - List all volumes
const handleGetVolumes = async (req, res) => {
    try {
        await syncVolumes();
        const volumes = await Volume.find();
        if (Array.isArray(volumes)) {
            volumes.sort((a, b) => (a.volumeNumber || 0) - (b.volumeNumber || 0));
        }
        res.json(volumes || []);
    } catch (error) {
        console.error('Error fetching volumes:', error);
        res.status(500).json({ error: 'Failed to fetch volumes' });
    }
};

router.get('/', adminAuth, handleGetVolumes);
router.get('/volumes', adminAuth, handleGetVolumes);

// GET /pricing/volume/:id - Get volume details & books
router.get('/volume/:id', adminAuth, async (req, res) => {
    try {
        let volume = null;
        if (process.env.USE_JSON_DB === 'true' || mongoose.Types.ObjectId.isValid(req.params.id)) {
            volume = await Volume.findById(req.params.id);
        }
        if (!volume) {
            const volNumMatch = String(req.params.id).match(/\d+/);
            if (volNumMatch) {
                volume = await Volume.findOne({ volumeNumber: parseInt(volNumMatch[0]) });
            }
        }
        if (!volume) return res.status(404).json({ error: 'Volume not found' });

        const volumeRegex = new RegExp(`VOL(?:UME)?\\s*${volume.volumeNumber}`, 'i');
        const books = await Product.find({ title: volumeRegex }).select('_id title type language sku isbn countryPricing lastUpdated');
        
        res.json({ volume, books });
    } catch (error) {
        console.error('Error fetching volume details:', error);
        res.status(500).json({ error: 'Failed to fetch volume details' });
    }
});

// GET /pricing/template/:volume - Download pricing import Excel template
router.get('/template/:volume', adminAuth, async (req, res) => {
    try {
        const volumeParam = req.params.volume || '';
        let volNum = 1;
        const match = String(volumeParam).match(/(\d+)/);
        if (match) volNum = parseInt(match[1]);

        const wb = xlsx.utils.book_new();
        const data = [
            ['Country / Book Title', 'Currency / Price', 'Language'],
            ['India', 'INR', 'Hindi'],
            [`Volume ${volNum} Hardcover Hindi`, '₹1299', 'Hindi'],
            [`Volume ${volNum} Paperback Hindi`, '₹799', 'Hindi'],
            [`Volume ${volNum} E-Book Hindi`, '₹299', 'Hindi'],
            [`Volume ${volNum} Audiobook Hindi`, '₹499', 'Hindi'],
            ['United States', 'USD', 'English'],
            [`Volume ${volNum} Hardcover English`, '$29.99', 'English'],
            [`Volume ${volNum} Paperback English`, '$19.99', 'English'],
            [`Volume ${volNum} E-Book English`, '$6.99', 'English'],
            [`Volume ${volNum} Audiobook English`, '$9.99', 'English'],
            ['United Kingdom', 'GBP', 'English'],
            [`Volume ${volNum} Hardcover English`, '£24.99', 'English'],
            [`Volume ${volNum} Paperback English`, '£15.99', 'English'],
            [`Volume ${volNum} E-Book English`, '£5.99', 'English'],
            [`Volume ${volNum} Audiobook English`, '£8.99', 'English']
        ];

        const ws = xlsx.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }];
        xlsx.utils.book_append_sheet(wb, ws, `Volume ${volNum} Pricing`);

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename="EFV_Volume_${volNum}_Pricing_Template.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
    } catch (err) {
        console.error('Pricing template error:', err);
        return res.status(500).json({ error: 'Failed to generate template' });
    }
});

// GET /pricing/book/:id - Get book pricing details
router.get('/book/:id', adminAuth, async (req, res) => {
    try {
        const id = req.params.id;
        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        let book = null;

        if (isObjectId) book = await Product.findById(new mongoose.Types.ObjectId(id));
        if (!book) book = await Product.findOne({ _id: id });
        if (!book) book = await Product.findOne({ legacyId: id });

        if (!book) return res.status(404).json({ error: 'Book not found' });

        const pricing = [];
        if (book.countryPricing) {
            Object.keys(book.countryPricing).forEach(key => {
                const p = book.countryPricing[key];
                pricing.push({
                    country: p.name || key,
                    countryKey: key,
                    currency: p.currency || 'INR',
                    price: p.price,
                    mrp: p.mrp || p.price
                });
            });
        }

        res.json({ book, pricing });
    } catch (error) {
        console.error('Error fetching book pricing:', error);
        res.status(500).json({ error: 'Failed to fetch book pricing' });
    }
});

// Handler for Excel upload preview
const handlePricingPreview = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const { volumeId, volumeName } = req.body;
        let volume = null;
        let volNum = null;

        if (volumeId && (process.env.USE_JSON_DB === 'true' || mongoose.Types.ObjectId.isValid(volumeId))) {
            volume = await Volume.findById(volumeId);
            if (volume) volNum = volume.volumeNumber;
        }

        if (!volNum) {
            const searchStr = volumeName || volumeId || '';
            const volMatch = String(searchStr).match(/(\d+)/);
            if (volMatch) {
                volNum = parseInt(volMatch[1]);
                volume = await Volume.findOne({ volumeNumber: volNum });
            }
        }

        let products = [];
        if (volNum !== null && volNum !== undefined) {
            const volumeRegex = new RegExp(`VOL(?:UME)?\\s*${volNum}`, 'i');
            products = await Product.find({ title: volumeRegex });
        }
        if (!products || products.length === 0) {
            products = await Product.find({});
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheetRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        if (!sheetRows || sheetRows.length <= 1) {
            return res.status(400).json({ error: 'Excel file is empty or has no data rows.' });
        }

        let currentCountry = null;
        let currentCurrency = null;
        let currentLanguage = null;

        const preview = [];
        let validRows = 0;
        let errorsFound = 0;
        let skippedRows = 0;

        sheetRows.forEach((rowCells, idx) => {
            if (idx === 0) return;
            if (!rowCells || rowCells.length === 0) return;

            const colA = String(rowCells[0] || '').trim();
            const colB = String(rowCells[1] || '').trim();
            const colC = String(rowCells[2] || '').trim();

            if (!colA) return;

            const isBookRow = colA.toLowerCase().startsWith('volume');

            if (!isBookRow) {
                currentCountry = colA;
                currentCurrency = colB;
                currentLanguage = colC;
                return;
            }

            if (!currentCountry) return;

            const titleLower = colA.toLowerCase();
            const rowVolMatch = titleLower.match(/volume\s*(\d+)/i);
            const rowVolNum = rowVolMatch ? parseInt(rowVolMatch[1]) : null;

            // Reject row if it belongs to another volume (if volume was explicitly matched)
            if (rowVolNum !== null && volNum !== null && rowVolNum !== volNum) {
                skippedRows++;
                return; 
            }

            const matchedProduct = products.find(p => {
                const pType = (p.type || '').toLowerCase();
                const pLang = (p.language || 'hindi').toLowerCase();

                let matchesType = false;
                if (pType === 'hardcover' && (titleLower.includes('hardcover') || titleLower.includes('hard cover'))) matchesType = true;
                else if (pType === 'paperback' && (titleLower.includes('paperback') || titleLower.includes('paper back'))) matchesType = true;
                else if (pType === 'ebook' && (titleLower.includes('e-book') || titleLower.includes('ebook'))) matchesType = true;
                else if (pType === 'audiobook' && (titleLower.includes('audiobook') || titleLower.includes('audio book'))) matchesType = true;

                const matchesLang = titleLower.includes(pLang);
                return matchesType && matchesLang;
            });

            if (!matchedProduct) {
                skippedRows++;
                return;
            }

            const errors = [];
            const priceClean = colB.replace(/[^\d.-]/g, '');
            const rawPriceNum = parseFloat(priceClean);

            let currencySymbolOrCode = colB.replace(/[\d.,-\s]/g, '').trim();
            if (!currencySymbolOrCode) currencySymbolOrCode = currentCurrency;

            if (isNaN(rawPriceNum)) errors.push(`Invalid price: "${colB}"`);
            else if (rawPriceNum < 0) errors.push('Price cannot be negative');

            const countryKey = currentCountry.replace(/[^a-zA-Z]/g, '');

            let currentPrice = null;
            let currentGst = 0;
            const existingPricing = matchedProduct.countryPricing || {};
            if (existingPricing[countryKey] && existingPricing[countryKey].price !== undefined) {
                currentPrice = existingPricing[countryKey].price;
                currentGst = existingPricing[countryKey].gstPercent || 0;
            }

            let gstPercent = 0;
            rowCells.forEach((cellVal, cIdx) => {
                if (cIdx === 0) return;
                const str = String(cellVal || '').trim();
                if (!str) return;
                const pctMatch = str.match(/(\d+(?:\.\d+)?)\s*%/);
                if (pctMatch) {
                    gstPercent = parseFloat(pctMatch[1]);
                }
            });

            if (gstPercent === 0) {
                const colD = String(rowCells[3] || '').trim();
                const colC = String(rowCells[2] || '').trim();
                const textVal = colD || colC;
                if (textVal && !isNaN(parseFloat(textVal))) {
                    const parsedNum = parseFloat(textVal);
                    if (parsedNum >= 0 && parsedNum <= 100) gstPercent = parsedNum;
                }
            }

            let difference = null;
            let status = 'New';
            if (errors.length === 0) {
                if (currentPrice !== null) {
                    difference = rawPriceNum - currentPrice;
                    status = difference === 0 ? 'No Change' : 'Updated';
                }
                validRows++;
            } else {
                errorsFound++;
                status = 'Error';
            }

            preview.push({
                rowIndex: idx + 1,
                title: matchedProduct.title,
                productId: String(matchedProduct._id),
                format: matchedProduct.type,
                language: matchedProduct.language || 'Hindi',
                countryName: currentCountry,
                countryKey,
                currency: currencySymbolOrCode || currentCurrency || 'INR',
                currentPrice,
                importedPrice: isNaN(rawPriceNum) ? null : rawPriceNum,
                gstPercent,
                difference,
                errors,
                status,
                isValid: errors.length === 0
            });
        });

        res.json({
            preview,
            summary: {
                totalRows: sheetRows.length - 1,
                booksFound: products.length,
                validRows,
                skippedRows,
                errorsFound,
                processingTime: '0.1s'
            }
        });

    } catch (e) {
        console.error('Pricing Import Error:', e);
        res.status(500).json({ error: 'Failed to process Excel file: ' + e.message });
    }
};

// Handler for confirming pricing import
const handlePricingConfirm = async (req, res) => {
    let session = null;
    try {
        const { volumeId, volumeName, previewData } = req.body;
        
        if (!previewData || !Array.isArray(previewData)) {
            return res.status(400).json({ error: 'Invalid data: previewData array required' });
        }

        let volume = null;
        let volNum = null;

        if (volumeId && (process.env.USE_JSON_DB === 'true' || mongoose.Types.ObjectId.isValid(volumeId))) {
            volume = await Volume.findById(volumeId);
            if (volume) volNum = volume.volumeNumber;
        }

        if (!volNum) {
            const searchStr = volumeName || volumeId || '';
            const volMatch = String(searchStr).match(/(\d+)/);
            if (volMatch) {
                volNum = parseInt(volMatch[1]);
                volume = await Volume.findOne({ volumeNumber: volNum });
            }
        }

        let products = [];
        if (volNum !== null && volNum !== undefined) {
            const volumeRegex = new RegExp(`VOL(?:UME)?\\s*${volNum}`, 'i');
            products = await Product.find({ title: volumeRegex });
        }
        if (!products || products.length === 0) {
            products = await Product.find({});
        }

        const updatesByProduct = {};

        for (const row of previewData) {
            if (!row.isValid || !row.countryKey || !row.productId) continue;
            if (row.status === 'No Change') continue;

            if (!updatesByProduct[row.productId]) {
                const prod = products.find(p => String(p._id) === row.productId);
                if (!prod) continue;
                let currentPricing = prod.countryPricing || {};
                currentPricing = (typeof currentPricing.toObject === 'function') ? currentPricing.toObject() : JSON.parse(JSON.stringify(currentPricing));
                updatesByProduct[row.productId] = currentPricing;
            }

            const currentPricing = updatesByProduct[row.productId];
            const { countryKey, importedPrice } = row;
            
            if (!currentPricing[countryKey]) {
                currentPricing[countryKey] = { enabled: true };
            }
            currentPricing[countryKey].price = importedPrice;
            currentPricing[countryKey].name = row.countryName;
            currentPricing[countryKey].currency = row.currency;
            currentPricing[countryKey].gstPercent = row.gstPercent !== undefined ? row.gstPercent : 0;
            currentPricing[countryKey].taxRate = currentPricing[countryKey].gstPercent;
            if (!currentPricing[countryKey].mrp || currentPricing[countryKey].mrp < importedPrice) {
                currentPricing[countryKey].mrp = importedPrice;
            }
        }

        let updatedCount = 0;
        let productsUpdated = 0;

        const bulkOps = [];
        for (const [productId, updatedPricing] of Object.entries(updatesByProduct)) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: productId },
                    update: { $set: { countryPricing: updatedPricing } }
                }
            });
            updatedCount += Object.keys(updatedPricing).length;
            productsUpdated++;
        }

        if (bulkOps.length > 0) {
            if (typeof Product.bulkWrite === 'function') {
                await Product.bulkWrite(bulkOps);
            } else {
                for (const op of bulkOps) {
                    const prodId = op.updateOne.filter._id;
                    const updates = op.updateOne.update.$set;
                    await Product.findByIdAndUpdate(prodId, updates);
                }
            }
            if (volume) {
                volume.lastUpdated = new Date();
                volume.importStatus = 'Completed';
                await volume.save();
            }
        }

        res.json({
            success: true,
            updatedCount,
            productsUpdated
        });
    } catch (e) {
        console.error('Import confirm error:', e);
        res.status(500).json({ error: 'Failed to confirm import: ' + e.message });
    }
};

// Register Preview routes (all aliases)
router.post('/import-volume', adminAuth, upload.single('file'), handlePricingPreview);
router.post('/upload-preview', adminAuth, upload.single('file'), handlePricingPreview);
router.post('/import-preview', adminAuth, upload.single('file'), handlePricingPreview);

// Register Confirm routes (all aliases)
router.post('/confirm', adminAuth, handlePricingConfirm);
router.post('/confirm-import', adminAuth, handlePricingConfirm);
router.post('/import-confirm', adminAuth, handlePricingConfirm);

module.exports = router;
