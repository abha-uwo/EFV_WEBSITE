const express = require('express');
const router = express.Router();
const { Order, Product, User, DigitalLibrary, Coupon, Cart, Category, Offer, OfferProduct, OfferPriority, OfferRule, OfferAnalytics } = require('../models');
const sendEmail = require('../utils/emailService');
const adminAuth = require('../middleware/adminAuth');
const { protect } = require('../middleware/auth');
const { createCashfreeOrder, verifyCashfreePayment } = require('../utils/cashfree');
const { createRazorpayOrder, verifyRazorpaySignature, fetchRazorpayPayment } = require('../utils/razorpay');
const { createPrintJob, formatLuluLineItems, resolveLuluCountryCode, formatLuluAddress } = require('../utils/lulu');
const { validatePostalCode } = require('../utils/postalValidator');
const { processPartnerSale } = require('../utils/partnerUtils');
const path = require('path');
const fs = require('fs');

// Helper to get all digital slugs from dynamic categories
async function getDigitalSlugs() {
    try {
        const categories = await Category.find();
        const slugs = new Set(categories.filter(c => c.isDigital).map(c => c.slug.toUpperCase()));
        slugs.add('EBOOK');
        slugs.add('AUDIOBOOK');
        return slugs;
    } catch (e) {
        return new Set(['EBOOK', 'AUDIOBOOK']);
    }
}
const whatsappService = require('../services/whatsappService');
const jobService = require('../services/jobService');

// Helper to identify if delivery is in Jabalpur (city match or Jabalpur pincode 482xxx)
function isJabalpurOrder(addressObj) {
    if (!addressObj || typeof addressObj !== 'object') return false;
    const city = String(addressObj.city || '').trim().toLowerCase();
    const state = String(addressObj.state || '').trim().toLowerCase();
    const street = String(addressObj.address || addressObj.street || addressObj.addressLine1 || addressObj.house || addressObj.addressLine2 || '').trim().toLowerCase();
    const fullText = `${city} ${state} ${street}`;
    const pin = String(addressObj.pincode || addressObj.zip || addressObj.postalCode || '').trim();

    if (city.includes('jabalpur') || fullText.includes('jabalpur') || city === 'jbp') return true;
    if (/^482\d{3}$/.test(pin)) return true;
    return false;
}

// Helper to safely get product by ID or legacyId without throwing CastError
async function getProductById(id) {
    if (!id) return null;
    const idStr = id.toString();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idStr);
    
    let product = null;
    if (isObjectId) {
        try {
            const mongoose = require('mongoose');
            product = await Product.findById(new mongoose.Types.ObjectId(idStr));
        } catch (e) {}
    }
    
    if (!product) {
        // 1. Try legacyId field
        product = await Product.findOne({ legacyId: idStr });
    }

    if (!product) {
        // 2. Try direct string _id match
        try {
            product = await Product.findOne({ _id: idStr });
        } catch (err) {
            // Ignore CastError
        }
    }

    // 3. Final fallback: parse efv_v{vol}_{type}[_en] pattern → search by type+language+volume
        if (!product && idStr.startsWith('efv_')) {
            try {
                const parts = idStr.split('_'); // e.g. ['efv', 'v1', 'hardcover'] or ['efv', 'v1', 'hardcover', 'en']
                const volume = parts[1] ? parts[1].replace('v', '') : null; // '1' or '2'
                const typePart = parts[2] ? parts[2].toUpperCase() : null;  // 'HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK'
                const isEnglish = parts[3] === 'en';
                const language = isEnglish ? 'English' : 'Hindi';

                if (typePart && volume) {
                    product = await Product.findOne({
                        type: typePart,
                        volume: volume,
                        language: language
                    });
                    if (product) {
                        console.log(`🔍 getProductById: Resolved "${idStr}" via type+volume+language fallback → ${product._id}`);
                    }
                }
            } catch (err) {
                console.error('getProductById fallback parse error:', err.message);
            }
        }

        return product;
}

// Helper to calculate dynamic category/volume/BOGO discounts on the backend (in INR)
async function calculateBackendDynamicDiscounts(items) {
    let totalDiscountAmount = 0;
    try {
        const categories = await Category.find();
        const activeRules = categories.filter(c => c.isActive !== false);
        if (!activeRules || activeRules.length === 0) {
            return 0;
        }

        const resolvedItems = [];
        for (const item of items) {
            const productId = item.productId || item.id;
            const product = await getProductById(productId);
            if (!product) continue;
            
            const sellingPrice = product.price * (1 - (product.discount || 0) / 100);
            resolvedItems.push({
                productId: product._id.toString(),
                title: product.title,
                type: product.type,
                price: sellingPrice,
                quantity: Number(item.quantity || 0),
                volume: product.volume,
                language: product.language,
                categories: product.categories || []
            });
        }

        activeRules.forEach(rule => {
            // 1. Simple Category/Product Filter Discount
            if (rule.discountType === 'simple') {
                const discountPct = Number(rule.discountValue || 0);
                if (discountPct > 0) {
                    resolvedItems.forEach(item => {
                        const isMatch = (item.type || '').toUpperCase() === rule.slug.toUpperCase() || 
                                        (item.categories || []).some(c => c.toUpperCase() === rule.slug.toUpperCase());
                        if (isMatch && item.quantity > 0) {
                            totalDiscountAmount += (item.price * item.quantity) * (discountPct / 100);
                        }
                    });
                }
            }

            // 2. Volume/Quantity Bundle Discount
            if (rule.discountType === 'bundle') {
                const minQty = Number(rule.minQuantity || 2);
                const discountPct = Number(rule.discountValue || 0);
                
                let eligibleItems = [];
                let totalEligibleQty = 0;

                resolvedItems.forEach(item => {
                    const isMatch = rule.slug.toUpperCase() === 'ALL' ||
                                    rule.slug.toUpperCase() === 'BUNDLE' ||
                                    rule.slug.toUpperCase() === 'VOLUME_DISCOUNT' ||
                                    (item.type || '').toUpperCase() === rule.slug.toUpperCase() ||
                                    (item.categories || []).some(c => c.toUpperCase() === rule.slug.toUpperCase());
                    
                    if (isMatch && item.quantity > 0) {
                        eligibleItems.push(item);
                        totalEligibleQty += item.quantity;
                    }
                });

                if (totalEligibleQty >= minQty && discountPct > 0) {
                    eligibleItems.forEach(item => {
                        totalDiscountAmount += (item.price * item.quantity) * (discountPct / 100);
                    });
                }
            }

            // 3. Cross-Language BOGO Discount
            if (rule.discountType === 'bogo') {
                const buyTarget = (rule.bogoBuySlug || 'Hindi').toLowerCase();
                const getTarget = (rule.bogoGetSlug || 'English').toLowerCase();

                const buyItems = resolvedItems.filter(it => 
                    (it.language || '').toLowerCase().includes(buyTarget) || 
                    (it.title || '').toLowerCase().includes(buyTarget)
                );

                const getItems = resolvedItems.filter(it => 
                    (it.language || '').toLowerCase().includes(getTarget) || 
                    (it.title || '').toLowerCase().includes(getTarget)
                );

                buyItems.forEach(buyIt => {
                    const buyVolume = buyIt.volume || '';

                    const match = getItems.find(getIt => {
                        if (getIt.quantity <= 0 || buyIt.quantity <= 0) return false;
                        const getVolume = getIt.volume || '';

                        const cleanBuyName = buyIt.title.replace(/english/i, '').replace(/hindi/i, '').replace(/\(.*\)/, '').replace(/[™®]/g, '').trim().toLowerCase();
                        const cleanGetName = getIt.title.replace(/english/i, '').replace(/hindi/i, '').replace(/\(.*\)/, '').replace(/[™®]/g, '').trim().toLowerCase();

                        return (getVolume && buyVolume && getVolume === buyVolume) || (cleanBuyName && cleanBuyName === cleanGetName);
                    });

                    if (match) {
                        const bogoQty = Math.min(buyIt.quantity, match.quantity);
                        const matchPrice = match.price;
                        totalDiscountAmount += matchPrice * bogoQty;
                        
                        match.quantity -= bogoQty;
                        buyIt.quantity -= bogoQty;
                    }
                });
            }
        });
    } catch (err) {
        console.error("Backend Dynamic Discount Calculation Error:", err);
    }
    return Math.round(totalDiscountAmount);
}

// Helper to calculate active offer discounts on the backend (in INR)
async function calculateBackendOfferDiscounts(items, requestedOfferId = null) {
    let totalDiscountAmount = 0;
    let appliedOffer = null;
    try {
        const now = new Date();
        let offers = [];
        if (requestedOfferId) {
            const requested = await Offer.findById(requestedOfferId);
            if (requested && requested.isActive) {
                offers = [requested];
            }
        }
        if (offers.length === 0) {
            offers = await Offer.find({ isActive: true });
        }
        
        const activeOffers = [];
        for (let offer of offers) {
            if (!requestedOfferId) {
                if (offer.startDate && new Date(offer.startDate) > now) continue;
                if (offer.endDate && new Date(offer.endDate) < now) continue;
            }
            
            const offerId = offer._id || offer.id;
            const priority = await OfferPriority.findOne({ offerId });
            const products = await OfferProduct.find({ offerId });
            const rule = await OfferRule.findOne({ offerId });

            activeOffers.push({
                ...offer.toObject(),
                products: products || [],
                priority: priority ? priority.level : (offer.priority || 0),
                rule: rule || null
            });
        }

        // Sort by priority (highest level first)
        activeOffers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        const resolvedItems = [];
        for (const item of items) {
            const productId = item.productId || item.id;
            const product = await getProductById(productId);
            if (!product) continue;
            
            resolvedItems.push({
                productId: product._id.toString(),
                title: product.title,
                type: product.type,
                price: Number(product.originalPrice) || Number(product.price),
                quantity: Number(item.quantity || 0),
                volume: product.volume,
                language: product.language,
                categories: product.categories || []
            });
        }

        let discountPerOffer = {};
        let offerDetails = {};

        for (const item of resolvedItems) {
            const productIdStr = String(item.productId);
            const productCategories = Array.isArray(item.categories) 
                ? item.categories.map(c => String(c).toUpperCase()) 
                : (item.type ? [String(item.type).toUpperCase()] : []);

            const matchingOffersForProduct = activeOffers.filter(offer => {
                const oType = offer.offerType || offer.type || 'Percentage';
                if (oType === 'FirstOrder' || oType === 'Coupon') return true;

                // If offer has no associated products/categories, it's global
                if (!offer.products || offer.products.length === 0) return true;

                return offer.products.some(op => {
                    if (op.productId && String(op.productId) === productIdStr) return true;
                    if (op.categorySlug && productCategories.includes(String(op.categorySlug).toUpperCase())) return true;
                    return false;
                });
            });

            if (matchingOffersForProduct.length > 0) {
                const bestOffer = matchingOffersForProduct[0];
                const bestOfferId = String(bestOffer._id || bestOffer.id);
                
                if (!discountPerOffer[bestOfferId]) {
                    discountPerOffer[bestOfferId] = 0;
                    offerDetails[bestOfferId] = bestOffer;
                }

                const itemOriginalSubtotal = item.price * item.quantity;
                let itemDiscount = 0;
                const oType = bestOffer.offerType || bestOffer.type || 'Percentage';

                if (oType === 'Percentage' || oType === 'FlashSale' || oType === 'Festival') {
                    itemDiscount = itemOriginalSubtotal * (Number(bestOffer.discountValue || bestOffer.discountRules?.percentage || 0) / 100);
                } else if (oType === 'Flat') {
                    itemDiscount = Math.min(itemOriginalSubtotal, Number(bestOffer.discountValue || bestOffer.discountRules?.flatAmount || 0) * item.quantity);
                } else if (oType === 'Coupon') {
                    const couponVal = Number(bestOffer.couponRules?.discountValue || bestOffer.discountValue || 0);
                    if (bestOffer.couponRules?.discountType === 'Percentage') {
                        itemDiscount = itemOriginalSubtotal * (couponVal / 100);
                    } else {
                        itemDiscount = Math.min(itemOriginalSubtotal, couponVal);
                    }
                } else if (oType === 'BOGO' && bestOffer.buyXGetYRules) {
                    const bRules = bestOffer.buyXGetYRules;
                    if (productIdStr === String(bRules.buyProductId)) {
                        const freeItem = resolvedItems.find(it => String(it.productId) === String(bRules.freeProductId));
                        if (freeItem) {
                            const timesApplied = Math.floor(item.quantity / (bRules.requiredQty || 1));
                            const freeQty = timesApplied * (bRules.freeQty || 1);
                            const actualFree = Math.min(freeItem.quantity, freeQty);
                            itemDiscount = actualFree * freeItem.price;
                        }
                    }
                } else if (oType === 'Combo' && bestOffer.comboRules) {
                    const cRules = bestOffer.comboRules;
                    if (Array.isArray(cRules.products) && cRules.products.length > 0) {
                        const matchingItems = cRules.products.map(pId => resolvedItems.find(it => String(it.productId) === String(pId) && it.quantity > 0)).filter(Boolean);
                        if (matchingItems.length === cRules.products.length) {
                            const maxSets = Math.min(...matchingItems.map(it => it.quantity));
                            const regularSum = matchingItems.reduce((sum, it) => sum + it.price, 0);
                            const comboPrice = Number(cRules.comboPrice || 0);
                            if (regularSum > comboPrice && maxSets > 0) {
                                itemDiscount = ((regularSum - comboPrice) * maxSets) / matchingItems.length;
                            }
                        }
                    }
                } else if (oType === 'FirstOrder' && bestOffer.firstOrderRules) {
                    const fRules = bestOffer.firstOrderRules;
                    const val = Number(fRules.discountValue || bestOffer.discountValue || 0);
                    if (fRules.discountType === 'Percentage') {
                        itemDiscount = itemOriginalSubtotal * (val / 100);
                    } else {
                        itemDiscount = Math.min(itemOriginalSubtotal, val);
                    }
                } else if (oType === 'CategoryPublisherAuthor') {
                    itemDiscount = itemOriginalSubtotal * (Number(bestOffer.discountValue || bestOffer.discountRules?.percentage || 0) / 100);
                }

                discountPerOffer[bestOfferId] += itemDiscount;
            }
        }

        let highestDiscountOfferId = null;
        let maxDiscount = 0;

        for (const [offerId, discount] of Object.entries(discountPerOffer)) {
            totalDiscountAmount += discount;
            if (discount > maxDiscount) {
                maxDiscount = discount;
                highestDiscountOfferId = offerId;
            }
        }

        if (highestDiscountOfferId) {
            appliedOffer = offerDetails[highestDiscountOfferId];
        }

    } catch (err) {
        console.error("Backend Offer Discount Calculation Error:", err);
    }

    return {
        totalDiscountAmount: Math.round(totalDiscountAmount),
        appliedOffer: appliedOffer ? {
            id: String(appliedOffer._id || appliedOffer.id),
            name: appliedOffer.name,
            type: appliedOffer.offerType || appliedOffer.type,
            discountValue: appliedOffer.discountValue
        } : null
    };
}

// Get Order Notification Emails
router.get('/settings/notification-email', adminAuth, async (req, res) => {
    try {
        const { SystemSettings } = require('../models');
        let setting = await SystemSettings.findOne({ key: 'order_notification_emails' });
        if (!setting) {
            setting = await SystemSettings.create({
                key: 'order_notification_emails',
                value: '',
                description: 'Order notification email addresses (comma separated)'
            });
        }
        res.json({ email: setting.value || '' });
    } catch (error) {
        console.error('Error fetching notification email setting:', error);
        res.status(500).json({ message: 'Error fetching notification email setting' });
    }
});

// Update Order Notification Emails
router.post('/settings/notification-email', adminAuth, async (req, res) => {
    try {
        const { email } = req.body;
        const { SystemSettings } = require('../models');
        let setting = await SystemSettings.findOne({ key: 'order_notification_emails' });
        if (!setting) {
            setting = await SystemSettings.create({
                key: 'order_notification_emails',
                value: email || '',
                description: 'Order notification email addresses (comma separated)'
            });
        } else {
            setting.value = email || '';
            await setting.save();
        }
        res.json({ success: true, email: setting.value });
    } catch (error) {
        console.error('Error updating notification email setting:', error);
        res.status(500).json({ message: 'Error updating notification email setting' });
    }
});

const COUNTRY_TO_CURRENCY = {
    'IN': 'INR', 'INDIA': 'INR', 'BHARAT': 'INR',
    'US': 'USD', 'UNITED STATES': 'USD', 'USA': 'USD',
    'GB': 'GBP', 'UNITED KINGDOM': 'GBP', 'UK': 'GBP',
    'CA': 'CAD', 'CANADA': 'CAD',
    'AU': 'AUD', 'AUSTRALIA': 'AUD',
    'NZ': 'NZD', 'NEW ZEALAND': 'NZD',
    'FR': 'EUR', 'FRANCE': 'EUR',
    'DE': 'EUR', 'GERMANY': 'EUR',
    'ES': 'EUR', 'SPAIN': 'EUR',
    'IT': 'EUR', 'ITALY': 'EUR',
    'PT': 'EUR', 'PORTUGAL': 'EUR',
    'NL': 'EUR', 'NETHERLANDS': 'EUR',
    'BE': 'EUR', 'BELGIUM': 'EUR',
    'AT': 'EUR', 'AUSTRIA': 'EUR',
    'IE': 'EUR', 'IRELAND': 'EUR',
    'FI': 'EUR', 'FINLAND': 'EUR',
    'CH': 'CHF', 'SWITZERLAND': 'CHF',
    'SE': 'SEK', 'SWEDEN': 'SEK',
    'NO': 'NOK', 'NORWAY': 'NOK',
    'DK': 'DKK', 'DENMARK': 'DKK',
    'PL': 'PLN', 'POLAND': 'PLN',
    'AE': 'AED', 'UNITED ARAB EMIRATES': 'AED', 'UAE': 'AED', 'DUBAI': 'AED',
    'SA': 'SAR', 'SAUDI ARABIA': 'SAR', 'KSA': 'SAR',
    'OM': 'OMR', 'OMAN': 'OMR',
    'KW': 'KWD', 'KUWAIT': 'KWD',
    'BH': 'BHD', 'BAHRAIN': 'BHD',
    'QA': 'QAR', 'QATAR': 'QAR',
    'SG': 'SGD', 'SINGAPORE': 'SGD',
    'MY': 'MYR', 'MALAYSIA': 'MYR',
    'CN': 'CNY', 'CHINA': 'CNY',
    'JP': 'JPY', 'JAPAN': 'JPY',
    'RU': 'RUB', 'RUSSIA': 'RUB',
    'KR': 'KRW', 'SOUTH KOREA': 'KRW',
    'BR': 'BRL', 'BRAZIL': 'BRL',
    'MX': 'MXN', 'MEXICO': 'MXN',
    'ZA': 'ZAR', 'SOUTH AFRICA': 'ZAR',
    'HK': 'HKD', 'HONG KONG': 'HKD',
    'TH': 'THB', 'THAILAND': 'THB',
    'ID': 'IDR', 'INDONESIA': 'IDR',
    'PH': 'PHP', 'PHILIPPINES': 'PHP',
    'VN': 'VND', 'VIETNAM': 'VND'
};

function resolveCurrency(country) {
    if (!country) return 'INR';
    const clean = String(country).trim().toUpperCase();
    return COUNTRY_TO_CURRENCY[clean] || 'USD';
}

// Helper to generate Invoice PDF Buffer
async function generateInvoiceBuffer(order) {
    return new Promise((resolve, reject) => {
        try {
            const PDFDocument = require('pdfkit');
            const path = require('path');
const fs = require('fs');
            const doc = new PDFDocument({ margin: 50, autoFirstPage: true });
            
            // Register Unicode fonts
            doc.registerFont('Roboto', path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf'));
            doc.registerFont('Roboto-Bold', path.join(__dirname, '../../assets/fonts/Roboto-Bold.ttf'));
            doc.registerFont('Roboto-Italic', path.join(__dirname, '../../assets/fonts/Roboto-Italic.ttf'));

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // --- PDF DESIGN ---
            const EFV_GOLD = '#D4AF37';
            const DARK = '#141414';

            // Header Background
            doc.rect(0, 0, doc.page.width, 100).fill(DARK);
            
            // Brand Logo
            doc.fillColor(EFV_GOLD).font('Roboto-Bold').fontSize(32).text('EFV', 50, 30);
            // --- Translations ---
            const invoiceTranslations = {
                en: { TAX_INVOICE: 'OFFICIAL TAX INVOICE', INVOICE_NO: 'Invoice No:', ORDER_ID: 'Order ID:', DATE: 'Date:', SOLD_BY: 'SOLD BY:', BILL_TO: 'BILL TO:', CONTACT: 'Contact:', ITEM: 'ITEM', QTY: 'QTY', PRICE: 'PRICE', TAX: 'TAX', TOTAL: 'TOTAL', BOOK_PRICE: 'Book Price:', SHIPPING: 'Shipping:', COD_CHARGES: 'COD Charges:', DISCOUNT: 'Discount:', DISCOUNT_CODE: 'Discount', TERMS: 'Terms: This is a system-generated tax invoice. Digital products are non-refundable.', THANK_YOU: 'THANK YOU FOR SHOPPING AT EFV' },
                de: { TAX_INVOICE: 'OFFIZIELLE STEUERRECHNUNG', INVOICE_NO: 'Rechnungs-Nr:', ORDER_ID: 'Bestell-ID:', DATE: 'Datum:', SOLD_BY: 'VERKÄUFER:', BILL_TO: 'RECHNUNG AN:', CONTACT: 'Kontakt:', ITEM: 'ARTIKEL', QTY: 'MENGE', PRICE: 'PREIS', TAX: 'STEUER', TOTAL: 'GESAMT', BOOK_PRICE: 'Buchpreis:', SHIPPING: 'Versand:', COD_CHARGES: 'Nachnahmegebühr:', DISCOUNT: 'Rabatt:', DISCOUNT_CODE: 'Rabatt', TERMS: 'Bedingungen: Dies ist eine vom System erstellte Steuerrechnung. Digitale Produkte sind nicht erstattungsfähig.', THANK_YOU: 'VIELEN DANK FÜR IHREN EINKAUF BEI EFV' },
                hi: { TAX_INVOICE: 'आधिकारिक कर चालान', INVOICE_NO: 'चालान संख्या:', ORDER_ID: 'ऑर्डर आईडी:', DATE: 'दिनांक:', SOLD_BY: 'विक्रेता:', BILL_TO: 'बिल प्राप्तकर्ता:', CONTACT: 'संपर्क:', ITEM: 'वस्तु', QTY: 'मात्रा', PRICE: 'मूल्य', TAX: 'कर', TOTAL: 'कुल', BOOK_PRICE: 'पुस्तक मूल्य:', SHIPPING: 'शिपिंग:', COD_CHARGES: 'सीओडी शुल्क:', DISCOUNT: 'छूट:', DISCOUNT_CODE: 'छूट', TERMS: 'शर्तें: यह एक सिस्टम-जनरेटेड टैक्स चालान है। डिजिटल उत्पाद वापस नहीं किए जा सकते।', THANK_YOU: 'EFV से खरीदारी के लिए धन्यवाद' }
            };

            const lang = (order.language && invoiceTranslations[order.language]) ? order.language : 'en';
            const t = invoiceTranslations[lang];
            
            // --- DYNAMIC CURRENCY & LOCALE ---
            const customerCountry = order.customer?.address?.country || order.customer?.country || '';
            const paymentCurrency = order.paymentCurrency || order.currency || resolveCurrency(customerCountry) || 'INR';

            const currencySymbols = {
                'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'CA$', 'AUD': 'AU$', 'NZD': 'NZ$',
                'AED': 'AED', 'SAR': 'SAR', 'OMR': 'OMR', 'KWD': 'KWD', 'BHD': 'BHD', 'QAR': 'QAR',
                'SGD': 'S$', 'MYR': 'RM', 'JPY': '¥', 'CNY': '¥', 'KRW': '₩', 'RUB': 'RUB', 'BRL': 'R$',
                'MXN': 'MX$', 'ZAR': 'R', 'CHF': 'CHF', 'SEK': 'SEK', 'NOK': 'NOK', 'DKK': 'DKK',
                'PLN': 'PLN', 'HKD': 'HK$', 'THB': 'THB', 'IDR': 'Rp', 'PHP': 'PHP', 'VND': 'VND'
            };
            const curSym = currencySymbols[paymentCurrency] || paymentCurrency;
            const formatAmount = (val) => `${curSym} ${Number(val || 0).toFixed(2)}`;

            const taxLabel = paymentCurrency === 'INR' ? 'GST (18%):' : (paymentCurrency === 'EUR' ? 'VAT (18%):' : 'Sales Tax (18%):');

            doc.fontSize(12).font('Roboto').text(t.TAX_INVOICE, 50, 65);
            
            // Order Info (Right Aligned)
            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
            doc.fillColor('#FFFFFF').fontSize(9);
            doc.text(`${t.INVOICE_NO} INV-${(order.orderId || '').split('-').pop()}`, 400, 30, { align: 'right' });
            doc.text(`${t.ORDER_ID} #${order.orderId || 'N/A'}`, 400, 45, { align: 'right' });
            doc.text(`${t.DATE} ${dateStr}`, 400, 60, { align: 'right' });
            doc.text(`Invoice Currency: ${paymentCurrency}`, 400, 75, { align: 'right' });
            
            const customer = order.customer || {};
            const items = order.items || [];

            // --- MERCHANT & CUSTOMER DETAILS ---
            doc.fillColor('#000000').fontSize(10).font('Roboto-Bold').text(t.SOLD_BY, 50, 120);
            doc.font('Roboto').fontSize(9)
                .text('EFV - Energy, Frequency and Vibration', 50, 135)
               .text('Madhya Pradesh, India', 50, 150)
               .text('GSTIN: 23EFVPA0000Z1Z1', 50, 165)
               .text('Support: efv@uwo24.com', 50, 180);

            doc.font('Roboto-Bold').text(t.BILL_TO, 350, 120);
            doc.font('Roboto').fontSize(9)
               .text(String(customer.name || 'Valued Customer'), 350, 135)
               .text(String(customer.city || 'N/A'), 350, 150)
               .text(String(customer.zip || ''), 350, 165)
               .text(`${t.CONTACT} ${customer.phone || 'N/A'}`, 350, 180);

            // --- ITEMS TABLE ---
            const tableTop = 230;
            doc.rect(50, tableTop, 500, 20).fill('#F5F5F5');
            doc.fillColor('#000000').font('Roboto-Bold').fontSize(8)
               .text(t.ITEM, 60, tableTop + 6)
               .text(t.QTY, 280, tableTop + 6)
               .text(t.PRICE, 350, tableTop + 6)
               .text(t.TAX, 420, tableTop + 6)
               .text(t.TOTAL, 490, tableTop + 6);

            let rowY = tableTop + 30;
            items.forEach(item => {
                const title = String(item.title || 'Product').substring(0, 40);
                const qty = Number(item.quantity || 0);
                const price = Number(item.price || 0);
                const bookTypes = ['HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK'];
                const isBook = bookTypes.includes((item.type || '').toUpperCase());
                const taxDisplay = isBook ? 'NIL' : '18%';
                doc.font('Roboto').fillColor('#333333').fontSize(8)
                   .text(title, 60, rowY, { width: 210 })
                   .text(qty.toString(), 280, rowY)
                   .text(formatAmount(price), 350, rowY)
                   .text(taxDisplay, 420, rowY)
                   .text(formatAmount(price * qty), 490, rowY);
                rowY += 25;
            });

            // --- TOTALS SECTION ---
            rowY += 20;
            doc.moveTo(350, rowY).lineTo(550, rowY).stroke('#EEEEEE');
            rowY += 15;

            const codCharges = Number(order.codCharges || 0);
            const subtotal = Number(order.subtotal || items.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 0)), 0));
            const shipping = Number(order.shippingCharges || 0);
            const discount = Number(order.discountAmount || 0);
            const total    = Number(order.totalAmount || 0);

            // ✅ Books are GST exempt — tax is always 0 on every invoice, every country
            const tax = 0;


            const renderRow = (label, value, isBold = false, isGlow = false) => {
                if (isGlow) {
                    doc.rect(340, rowY - 5, 210, 20).fill(DARK);
                    doc.fillColor(EFV_GOLD);
                } else {
                    doc.fillColor('#666666');
                }
                doc.font(isBold ? 'Roboto-Bold' : 'Roboto').fontSize(isBold ? 11 : 9);
                doc.text(label, 350, rowY);
                doc.text(formatAmount(value), 490, rowY, { align: 'right', width: 60 });
                rowY += 20;
            };

            renderRow(t.BOOK_PRICE, subtotal);
            if (shipping > 0) renderRow(t.SHIPPING, shipping);
            if (codCharges > 0) renderRow(t.COD_CHARGES, codCharges);
            if (discount > 0) renderRow(order.couponCode ? `${t.DISCOUNT_CODE} (${order.couponCode}):` : t.DISCOUNT, -discount);
            if (tax > 0) {
                renderRow(taxLabel, tax);
            } else {
                renderRow('GST (Books Exempt):', 0);
            }
            rowY += 10;
            renderRow(t.GRAND_TOTAL, total, true, true);

            // Footer
            doc.fillColor('#999999').fontSize(8).font('Roboto-Italic')
               .text(t.TERMS, 50, 700, { align: 'center' });
            doc.fillColor(EFV_GOLD).font('Roboto-Bold').fontSize(10)
               .text(t.THANK_YOU, 50, 720, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// Helper to send order notification emails asynchronously to configured addresses
async function sendOrderNotificationEmail(order) {
    try {
        const { SystemSettings } = require('../models');
        const setting = await SystemSettings.findOne({ key: 'order_notification_emails' });
        if (!setting || !setting.value || !setting.value.trim()) {
            console.log('ℹ️ Order Notification Email not configured, skipping.');
            return;
        }

        const emails = setting.value.split(',')
            .map(email => email.trim())
            .filter(email => email && email.includes('@'))
            .join(', ');

        if (!emails) {
            console.log('ℹ️ No valid order notification email addresses found.');
            return;
        }

        const customerName = order.customer?.name || order.customer?.fullName || 'Customer';
        const customerPhone = order.customer?.phone || 'N/A';
        const customerEmail = order.customer?.email || 'N/A';
        const orderId = order.orderId || order._id || 'N/A';
        
        // Date & Time formatting
        const orderDate = order.createdAt 
            ? new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' }) 
            : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });

        const addressObj = order.customer?.address || {};
        let addressStr = '';
        if (typeof order.customer?.address === 'string') {
            addressStr = order.customer.address;
        } else {
            const lines = [];
            if (addressObj.house || addressObj.street) lines.push(addressObj.house || addressObj.street);
            if (addressObj.area) lines.push(addressObj.area);
            if (addressObj.city) lines.push(addressObj.city);
            if (addressObj.state || addressObj.pincode || addressObj.zip) {
                let line = addressObj.state || '';
                const zipStr = addressObj.pincode || addressObj.zip || '';
                if (zipStr) line += (line ? ' - ' : '') + zipStr;
                lines.push(line);
            }
            if (addressObj.country) lines.push(addressObj.country);
            addressStr = lines.join('\n');
        }
        if (!addressStr) {
            if (order.customer?.city) {
                addressStr = order.customer.city;
                if (order.customer?.zip) addressStr += ' ' + order.customer.zip;
            } else {
                addressStr = 'N/A';
            }
        }

        const paymentStatus = order.paymentStatus || 'Pending';
        const totalAmount = order.totalAmount || 0;

        let productsBlock = '';
        if (order.items && order.items.length > 0) {
            productsBlock = order.items.map(item => `Product: ${item.title}<br>Quantity: ${item.quantity}`).join('<br><br>');
        } else {
            productsBlock = `Product: N/A<br>Quantity: 0`;
        }

        const subject = 'New Order Received – EFV™';
        const html = `
            <div style="font-family: Arial, sans-serif; font-size: 15px; color: #000; line-height: 1.6; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <p style="margin: 0 0 20px 0;">A new order has been placed.</p>
                
                <p style="margin: 0 0 20px 0;">
                    Customer Name: ${customerName}<br>
                    Phone Number: ${customerPhone}<br>
                    Email: ${customerEmail}
                </p>
                
                <p style="margin: 0 0 20px 0;">
                    ${productsBlock}<br>
                    Order ID: ${orderId}<br>
                    Order Date: ${orderDate}
                </p>
                
                <p style="margin: 0 0 20px 0;">
                    Shipping Address:<br>
                    ${addressStr.replace(/\n/g, '<br>')}
                </p>
                
                <p style="margin: 0 0 20px 0;">
                    Payment Status: ${paymentStatus}<br>
                    Total Amount: ₹${totalAmount}
                </p>
                
                <p style="margin: 20px 0 0 0; border-top: 1px solid #eee; padding-top: 15px;">
                    Please process the order from the Admin Dashboard.
                </p>
            </div>
        `;

        let attachments = [];
        try {
            const pdfBuffer = await generateInvoiceBuffer(order);
            attachments.push({
                filename: `EFV_Invoice_${order.orderId || 'Order'}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
        } catch (pdfErr) {
            console.error('Failed to generate PDF for email attachment:', pdfErr);
        }

        await sendEmail({
            email: emails,
            subject,
            html,
            attachments
        });
        console.log(`✉️ Order notification email sent to: ${emails} with invoice attached.`);
    } catch (err) {
        console.error('❌ Error sending order notification email:', err);
    }
}





// Get current user's orders
router.get('/my-orders', protect, async (req, res) => {
    try { 
        const userEmail = (req.user.email || '').trim().toLowerCase();
        const escapedEmail = userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const userObjId = req.user._id;
        const userStrId = String(req.user._id);

        const orConditions = [
            { userId: userObjId },
            { userId: userStrId }
        ];

        if (userEmail) {
            orConditions.push({ "customer.email": new RegExp('^' + escapedEmail + '$', 'i') });
            orConditions.push({ "customer.address.email": new RegExp('^' + escapedEmail + '$', 'i') });
            orConditions.push({ "address.email": new RegExp('^' + escapedEmail + '$', 'i') });
            orConditions.push({ "email": new RegExp('^' + escapedEmail + '$', 'i') });
        }

        if (req.user.phone) {
            orConditions.push({ "customer.phone": req.user.phone });
            orConditions.push({ "customer.address.phone": req.user.phone });
        }

        const orders = await Order.find({ $or: orConditions }).sort({ createdAt: -1 });
        const logMsg = `[${new Date().toISOString()}] User ${req.user.email} requested orders. Found: ${orders.length}\n`;
        try {
            require('fs').appendFileSync(path.join(__dirname, '..', 'data', 'orders_debug.log'), logMsg);
        } catch (e) {}

        res.json(orders);
    } catch (error) {
        console.error('Error fetching my-orders:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// Get Lulu or general tracking details for a specific order (customer-safe data)
router.get('/:orderId/tracking', protect, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        let order = await Order.findOne({ orderId: orderId });
        if (!order && orderId.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findById(orderId);
        }

        if (!order) {
            return res.status(404).json({ status: false, message: 'Order not found' });
        }

        // Security: Verify the requesting user owns this order or is admin
        const ownerEmail = (order.customer && order.customer.email ? order.customer.email : '').toLowerCase();
        const reqEmail = (req.user && req.user.email ? req.user.email : '').toLowerCase();
        const ownerUserId = order.userId ? order.userId.toString() : null;
        const reqUserId = req.user && req.user._id ? req.user._id.toString() : null;

        const isOwner = (ownerUserId && reqUserId && ownerUserId === reqUserId) ||
            (ownerEmail && reqEmail && ownerEmail === reqEmail);
        const userEmailLower = (req.user?.email || '').toLowerCase().trim();
        const isAdmin = req.user && (req.user.role === 'admin' || userEmailLower === 'admin@uwo24.com' || userEmailLower === 'efv@uwo24.com');

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ status: false, message: 'You do not have permission to track this order' });
        }

        // Sync and fetch tracking details
        let trackingData = {
            order_id: order.orderId,
            status: order.status,
            carrier: order.courierName || 'Courier',
            tracking_number: order.awbNumber || null,
            tracking_url: order.trackingLink || null,
            estimated_delivery: 'Calculating...'
        };

        if (order.fulfillmentProvider === 'LULU' && order.luluJobId) {
            try {
                const { getPrintJobStatus } = require('../utils/lulu');
                const jobStatus = await getPrintJobStatus(order.luluJobId);
                
                if (jobStatus && jobStatus.status) {
                    const newLuluStatus = jobStatus.status.name || jobStatus.status;
                    let needsSave = false;
                    
                    if (order.luluStatus !== newLuluStatus) {
                        order.luluStatus = newLuluStatus;
                        needsSave = true;
                    }
                    
                    const trackingInfo = jobStatus.tracking || {};
                    if (trackingInfo.tracking_number && order.luluTracking !== trackingInfo.tracking_number) {
                        order.luluTracking = trackingInfo.tracking_number;
                        order.awbNumber = trackingInfo.tracking_number; // Sync for consistency
                        needsSave = true;
                    }

                    let mappedStatus = null;
                    if (newLuluStatus === 'SHIPPED') {
                        mappedStatus = 'Shipped';
                    } else if (newLuluStatus === 'CANCELED' || newLuluStatus === 'REJECTED') {
                        mappedStatus = 'Cancelled';
                    }

                    if (mappedStatus && order.status !== mappedStatus) {
                        order.status = mappedStatus;
                        order.timeline.push({ status: mappedStatus, note: `Status synced with Lulu (Status: ${newLuluStatus})` });
                        needsSave = true;
                    }

                    const tLink = trackingInfo.tracking_urls && trackingInfo.tracking_urls[0];
                    if (tLink && order.trackingLink !== tLink) {
                        order.trackingLink = tLink;
                        needsSave = true;
                    }

                    if (needsSave) {
                        await order.save();
                    }

                    trackingData.status = order.status;
                    trackingData.carrier = trackingInfo.carrier || 'Lulu Carrier';
                    trackingData.tracking_number = trackingInfo.tracking_number || null;
                    trackingData.tracking_url = order.trackingLink || null;
                }
            } catch (luluErr) {
                console.error('Lulu tracking fetch error:', luluErr.message);
            }
        }

        res.json({ success: true, data: trackingData });

    } catch (error) {
        console.error('Order tracking API error:', error.message);
        res.status(500).json({ success: false, message: 'Error fetching tracking details' });
    }
});

// Config for Frontend (Public Keys & Active Gateway)
router.get('/config', (req, res) => {
    const activeGateway = process.env.PAYMENT_GATEWAY || 'cashfree';

    res.json({
        activeGateway,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
        cashfreeMode: process.env.CASHFREE_MODE || 'sandbox'
    });
});

// Get all orders (Admin Only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// ============================================================
// SYNC ALL ORDERS STATUS (NimbusPost)
// ============================================================
router.get('/sync-all', protect, async (req, res) => {
    try {
        const nimbusPostService = require('../services/nimbusPostService');
        const query = {
            $or: [
                { userId: req.user._id },
                { "customer.email": new RegExp('^' + req.user.email + '$', 'i') }
            ]
        };
        const orders = await Order.find(query);
        let updatedCount = 0;

        for (const order of orders) {
            // Only sync active/pending/cancelled shipments (to ensure cancellation sync)
            const activeStatuses = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Pending', 'Cancelled'];
            if (order.awbNumber && activeStatuses.includes(order.status)) {
                try {
                    const tracking = await nimbusPostService.trackShipment(order.awbNumber);
                    if (tracking && tracking.status) {
                        // Nimbus status mapping
                        // Use top-level status_name if available, fallback to status, then history[0]
                        const nStatusRaw = tracking.data?.status_name || tracking.data?.status || tracking.data?.history?.[0]?.status_name || '';
                        const nStatus = nStatusRaw.toLowerCase();
                        
                        let newStatus = null;
                        if (nStatus.includes('cancel')) newStatus = 'Cancelled';
                        else if (nStatus.includes('deliver')) newStatus = 'Delivered';
                        else if (nStatus.includes('return') || nStatus.includes('rtv') || nStatus.includes('rto')) newStatus = 'Returned';
                        else if (nStatus.includes('pick') || nStatus.includes('transit') || nStatus.includes('shipped') || nStatus.includes('dispatch') || nStatus.includes('hub')) newStatus = 'Shipped';
                        else if (nStatus.includes('process') || nStatus.includes('pack')) newStatus = 'Processing';

                        if (newStatus && newStatus !== order.status) {
                            console.log(`🔄 Sync: Order ${order.orderId} status ${order.status} -> ${newStatus}`);
                            order.status = newStatus;
                            order.timeline.push({ 
                                status: newStatus, 
                                note: `Status synced from NimbusPost (${nStatus})`,
                                timestamp: new Date()
                            });
                            await order.save();
                            updatedCount++;

                            // 📱 WhatsApp Notify via Sync All
                            try {
                                if (newStatus === 'Shipped') await whatsappService.sendOrderShipped(order);
                                else if (newStatus === 'Delivered') await whatsappService.sendOrderDelivered(order);
                                else if (newStatus === 'Cancelled') await whatsappService.sendOrderCancelled(order);
                            } catch (e) {}
                        }
                    }
                } catch (err) {
                    console.warn(`⚠️ Sync failed for ${order.orderId}:`, err.message);
                }
            }
        }
        res.json({ success: true, updatedCount });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ message: 'Sync failed' });
    }
});

// Get single order (Admin or Owner)
router.get('/:id', protect, async (req, res) => {
    try {
        const idParam = String(req.params.id || '').trim();
        const isHexId = /^[0-9a-fA-F]{24}$/.test(idParam);
        const order = (isHexId ? await Order.findById(idParam) : null) || await Order.findOne({ orderId: idParam });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Security check: Only admin or owner
        const userEmailLower = (req.user?.email || '').toLowerCase().trim();
        const isAdmin = req.user.role === 'admin' || userEmailLower === 'admin@uwo24.com' || userEmailLower === 'efv@uwo24.com';
        const isOwner = order.userId?.toString() === req.user._id?.toString() || 
                       order.customer?.email?.toLowerCase() === req.user.email?.toLowerCase();
        
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        res.json(order);
    } catch (error) {
        console.error('Fetch Order Error:', error);
        res.status(500).json({ message: 'Error fetching order details' });
    }
});

// Maps country name or ISO2 code → payment currency ISO code
// Mirrors the same countries supported by resolveProductPrice()
function resolveCurrency(countryNameOrCode) {
    const CURRENCY_MAP = {
        // India
        'India': 'INR', 'IN': 'INR',
        // United States
        'United States': 'USD', 'United States of America': 'USD', 'USA': 'USD', 'US': 'USD',
        // United Kingdom
        'United Kingdom': 'GBP', 'UK': 'GBP', 'GB': 'GBP',
        // Europe
        'Germany': 'EUR', 'DE': 'EUR',
        'France': 'EUR',  'FR': 'EUR',
        'Spain': 'EUR',   'ES': 'EUR',
        'Italy': 'EUR',   'IT': 'EUR',
        'Portugal': 'EUR','PT': 'EUR',
        // Middle East
        'United Arab Emirates': 'AED', 'UAE': 'AED', 'AE': 'AED',
        'Saudi Arabia': 'SAR', 'SA': 'SAR',
        // Asia
        'China': 'CNY',      'CN': 'CNY',
        'Japan': 'JPY',      'JP': 'JPY',
        'South Korea': 'KRW','KR': 'KRW',
        // Canada
        'Canada': 'CAD', 'CA': 'CAD',
        // Australia
        'Australia': 'AUD', 'AU': 'AUD',
        // Singapore
        'Singapore': 'SGD', 'SG': 'SGD',
    };
    const key = (countryNameOrCode || '').trim();
    return CURRENCY_MAP[key] || CURRENCY_MAP[key.toUpperCase()] || 'INR'; // default INR
}

function resolveProductPrice(product, countryNameOrCode) {
    const COUNTRY_MAP = {
        'India': 'India', 'IN': 'India',
        'United States': 'UnitedStates', 'US': 'UnitedStates',
        'United Kingdom': 'UnitedKingdom', 'GB': 'UnitedKingdom',
        'Germany': 'Germany', 'DE': 'Germany',
        'France': 'France', 'FR': 'France',
        'Spain': 'Spain', 'ES': 'Spain',
        'Italy': 'Italy', 'IT': 'Italy',
        'Portugal': 'Portugal', 'PT': 'Portugal',
        'United Arab Emirates': 'UnitedArabEmirates', 'UAE': 'UnitedArabEmirates', 'AE': 'UnitedArabEmirates',
        'Saudi Arabia': 'SaudiArabia', 'SA': 'SaudiArabia',
        'China': 'China', 'CN': 'China',
        'Japan': 'Japan', 'JP': 'Japan',
        'Russia': 'Russia', 'RU': 'Russia',
        'South Korea': 'SouthKorea', 'KR': 'SouthKorea'
    };
    
    const countryKey = COUNTRY_MAP[countryNameOrCode] || COUNTRY_MAP[(countryNameOrCode || '').trim()] || 'India';
    
    // Check if countryPricing has a custom configured price
    if (product.countryPricing && product.countryPricing[countryKey]) {
        const cp = product.countryPricing[countryKey];
        if (cp.enabled !== false && cp.price !== undefined && cp.price !== null && cp.price !== '') {
            return Number(cp.price);
        }
    }
    
    // Fallback to regionalPrices (historical compatibility)
    const ISO_MAP = {
        'India': 'IN', 'UnitedStates': 'US', 'UnitedKingdom': 'GB', 'Canada': 'CA', 'Australia': 'AU', 'NewZealand': 'NZ',
        'Germany': 'DE', 'France': 'FR', 'Spain': 'ES', 'Italy': 'IT', 'Portugal': 'PT', 'Netherlands': 'NL', 'Belgium': 'BE',
        'Austria': 'AT', 'Ireland': 'IE', 'Finland': 'FI', 'Switzerland': 'CH', 'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK',
        'Poland': 'PL', 'UnitedArabEmirates': 'AE', 'SaudiArabia': 'SA', 'Oman': 'OM', 'Kuwait': 'KW', 'Bahrain': 'BH',
        'Qatar': 'QA', 'Singapore': 'SG', 'Malaysia': 'MY', 'China': 'CN', 'Japan': 'JP', 'Russia': 'RU', 'SouthKorea': 'KR',
        'Brazil': 'BR', 'Mexico': 'MX', 'SouthAfrica': 'ZA', 'HongKong': 'HK', 'Thailand': 'TH', 'Indonesia': 'ID',
        'Philippines': 'PH', 'Vietnam': 'VN'
    };
    const iso2 = ISO_MAP[countryKey] || (countryKey && countryKey.length === 2 ? countryKey.toUpperCase() : 'IN');
    if (product.regionalPrices) {
        const regional = product.regionalPrices instanceof Map ? Object.fromEntries(product.regionalPrices) : product.regionalPrices;
        if (regional && regional[iso2]) {
            return Number(regional[iso2]);
        }
    }
    
    // Fallback to default pricing table
    if (iso2 !== 'IN') {
        const pricingTable = {
            'US': { 'audiobook': 6.99, 'ebook': 8.99, 'hindi_paperback': 14.99, 'hindi_hardcover': 22.99, 'english_paperback': 17.99, 'english_hardcover': 26.99 },
            'GB': { 'audiobook': 5.99, 'ebook': 6.99, 'hindi_paperback': 11.99, 'hindi_hardcover': 18.99, 'english_paperback': 13.99, 'english_hardcover': 21.99 },
            'CA': { 'audiobook': 8.99, 'ebook': 11.99, 'hindi_paperback': 19.99, 'hindi_hardcover': 29.99, 'english_paperback': 22.99, 'english_hardcover': 34.99 },
            'AU': { 'audiobook': 9.99, 'ebook': 12.99, 'hindi_paperback': 21.99, 'hindi_hardcover': 32.99, 'english_paperback': 25.99, 'english_hardcover': 37.99 },
            'NZ': { 'audiobook': 10.99, 'ebook': 13.99, 'hindi_paperback': 23.99, 'hindi_hardcover': 35.99, 'english_paperback': 27.99, 'english_hardcover': 39.99 },
            'FR': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
            'DE': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
            'ES': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
            'IT': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
            'PT': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
            'NL': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
            'BE': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
            'AT': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
            'IE': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
            'FI': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
            'CH': { 'audiobook': 7.00, 'ebook': 9.00, 'hindi_paperback': 15.00, 'hindi_hardcover': 23.00, 'english_paperback': 18.00, 'english_hardcover': 27.00 },
            'SE': { 'audiobook': 70, 'ebook': 90, 'hindi_paperback': 150, 'hindi_hardcover': 230, 'english_paperback': 180, 'english_hardcover': 270 },
            'NO': { 'audiobook': 70, 'ebook': 90, 'hindi_paperback': 150, 'hindi_hardcover': 230, 'english_paperback': 180, 'english_hardcover': 270 },
            'DK': { 'audiobook': 50, 'ebook': 65, 'hindi_paperback': 105, 'hindi_hardcover': 160, 'english_paperback': 125, 'english_hardcover': 190 },
            'PL': { 'audiobook': 28, 'ebook': 36, 'hindi_paperback': 60, 'hindi_hardcover': 92, 'english_paperback': 72, 'english_hardcover': 108 },
            'AE': { 'audiobook': 25.00, 'ebook': 30.00, 'hindi_paperback': 55.00, 'hindi_hardcover': 85.00, 'english_paperback': 65.00, 'english_hardcover': 95.00 },
            'SA': { 'audiobook': 28.00, 'ebook': 33.00, 'hindi_paperback': 60.00, 'hindi_hardcover': 90.00, 'english_paperback': 70.00, 'english_hardcover': 100.00 },
            'OM': { 'audiobook': 3.0, 'ebook': 4.0, 'hindi_paperback': 6.0, 'hindi_hardcover': 9.0, 'english_paperback': 7.0, 'english_hardcover': 10.5 },
            'KW': { 'audiobook': 2.5, 'ebook': 3.0, 'hindi_paperback': 4.5, 'hindi_hardcover': 7.0, 'english_paperback': 5.5, 'english_hardcover': 8.0 },
            'BH': { 'audiobook': 3.0, 'ebook': 3.5, 'hindi_paperback': 5.5, 'hindi_hardcover': 8.5, 'english_paperback': 6.5, 'english_hardcover': 10.0 },
            'QA': { 'audiobook': 25.0, 'ebook': 30.0, 'hindi_paperback': 55.0, 'hindi_hardcover': 85.0, 'english_paperback': 65.0, 'english_hardcover': 95.0 },
            'SG': { 'audiobook': 9.0, 'ebook': 12.0, 'hindi_paperback': 20.0, 'hindi_hardcover': 30.0, 'english_paperback': 24.0, 'english_hardcover': 36.0 },
            'MY': { 'audiobook': 30.0, 'ebook': 40.0, 'hindi_paperback': 65.0, 'hindi_hardcover': 100.0, 'english_paperback': 80.0, 'english_hardcover': 120.0 },
            'CN': { 'audiobook': 50.00, 'ebook': 65.00, 'hindi_paperback': 110.00, 'hindi_hardcover': 165.00, 'english_paperback': 130.00, 'english_hardcover': 195.00 },
            'JP': { 'audiobook': 1000, 'ebook': 1300, 'hindi_paperback': 2200, 'hindi_hardcover': 3500, 'english_paperback': 2800, 'english_hardcover': 4200 },
            'RU': { 'audiobook': 500, 'ebook': 600, 'hindi_paperback': 1100, 'hindi_hardcover': 1600, 'english_paperback': 1300, 'english_hardcover': 1900 },
            'KR': { 'audiobook': 8000, 'ebook': 9500, 'hindi_paperback': 17000, 'hindi_hardcover': 25000, 'english_paperback': 20000, 'english_hardcover': 30000 },
            'BR': { 'audiobook': 35, 'ebook': 45, 'hindi_paperback': 75, 'hindi_hardcover': 115, 'english_paperback': 90, 'english_hardcover': 135 },
            'MX': { 'audiobook': 120, 'ebook': 150, 'hindi_paperback': 250, 'hindi_hardcover': 380, 'english_paperback': 300, 'english_hardcover': 450 },
            'ZA': { 'audiobook': 120, 'ebook': 150, 'hindi_paperback': 250, 'hindi_hardcover': 380, 'english_paperback': 300, 'english_hardcover': 450 },
            'HK': { 'audiobook': 55, 'ebook': 70, 'hindi_paperback': 115, 'hindi_hardcover': 180, 'english_paperback': 140, 'english_hardcover': 210 },
            'TH': { 'audiobook': 230, 'ebook': 300, 'hindi_paperback': 500, 'hindi_hardcover': 770, 'english_paperback': 600, 'english_hardcover': 900 },
            'ID': { 'audiobook': 105000, 'ebook': 135000, 'hindi_paperback': 230000, 'hindi_hardcover': 350000, 'english_paperback': 275000, 'english_hardcover': 410000 },
            'PH': { 'audiobook': 380, 'ebook': 500, 'hindi_paperback': 840, 'hindi_hardcover': 1300, 'english_paperback': 1000, 'english_hardcover': 1500 },
            'VN': { 'audiobook': 170000, 'ebook': 220000, 'hindi_paperback': 370000, 'hindi_hardcover': 570000, 'english_paperback': 440000, 'english_hardcover': 660000 }
        };
        
        const rates = pricingTable[iso2] || pricingTable['US'];
        const type = (product.type || '').toLowerCase();
        const lang = (product.language || 'Hindi').toLowerCase();
        const lookupKey = (type === 'audiobook' || type === 'ebook') ? type : `${lang}_${type}`;
        
        if (rates[lookupKey]) {
            return rates[lookupKey];
        }
    }
    
    // Default Global Price (INR)
    return product.price * (1 - (product.discount || 0) / 100);
}

// Place new order (Public)
router.post('/', async (req, res) => {
    try {
        const { customer, items, paymentMethod, couponCode, offerId } = req.body;

        if (!customer || !items || items.length === 0) {
            return res.status(400).json({ message: 'Invalid order data' });
        }

        const digitalSlugs = await getDigitalSlugs();
        const physicalOrderItems = items.filter(i => !digitalSlugs.has((i.type || '').toUpperCase()));
        if (physicalOrderItems.length > 0) {
            const postalVal = validatePostalCode(customer.pincode || customer.zip, customer.country, true);
            if (!postalVal.isValid) {
                return res.status(400).json({ message: postalVal.error });
            }
            if (postalVal.normalized) {
                customer.pincode = postalVal.normalized;
                customer.zip = postalVal.normalized;
            }
        }

        let totalAmount = 0;
        let totalGstAmount = 0;
        const orderItems = [];

        // Initialize subtotals for tax calculation
        let booksSubtotal = 0;
        let nonBookSubtotal = 0;
        const bookTypes = new Set(['HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK']);
        for (const item of items) {
            const product = await getProductById(item.productId);
            if (!product) continue;

            // 🚫 BLOCK DIGITAL ITEMS IN COD
            const isDigital = digitalSlugs.has((product.type || '').toUpperCase()) || product.category === 'Digital';
            if ((paymentMethod === 'COD' || !paymentMethod) && isDigital) {
                return res.status(400).json({
                    message: `Digital product '${product.title}' cannot be purchased via COD. Only Online Payment is available.`
                });
            }

            // Check stock for physical items
            if (!isDigital) {
                if (product.stock < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for ${product.title}` });
                }
                // Decrease stock
                await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
            }

            const countryVal = customer ? (customer.country || 'India') : 'India';
            const price = resolveProductPrice(product, countryVal);
            const lineTotal = price * item.quantity;
            totalAmount += lineTotal;

            const COUNTRY_MAP = {
                'India': 'India', 'United States': 'UnitedStates', 'United Kingdom': 'UnitedKingdom',
                'France': 'France', 'Germany': 'Germany', 'Spain': 'Spain', 'Italy': 'Italy',
                'Portugal': 'Portugal', 'United Arab Emirates': 'UnitedArabEmirates',
                'Saudi Arabia': 'SaudiArabia', 'China': 'China', 'Japan': 'Japan',
                'Russia': 'Russia', 'South Korea': 'SouthKorea'
            };
            const cKey = COUNTRY_MAP[countryVal] || COUNTRY_MAP[(countryVal || '').trim()] || countryVal || 'India';
            let itemGstPercent = 0;
            if (product.countryPricing && product.countryPricing[cKey] && product.countryPricing[cKey].gstPercent !== undefined) {
                itemGstPercent = Number(product.countryPricing[cKey].gstPercent) || 0;
            } else if (product.countryPricing && product.countryPricing[cKey] && product.countryPricing[cKey].taxRate !== undefined) {
                itemGstPercent = Number(product.countryPricing[cKey].taxRate) || 0;
            } else if (product.taxRate !== undefined && product.taxRate !== null) {
                itemGstPercent = Number(product.taxRate) || 0;
            }

            const itemGst = itemGstPercent > 0 ? (lineTotal * itemGstPercent) / 100 : 0;
            totalGstAmount = (totalGstAmount || 0) + itemGst;

            // Categorize into book or non‑book for GST exemption
            if (bookTypes.has((product.type || '').toUpperCase())) {
                booksSubtotal += lineTotal;
            } else {
                nonBookSubtotal += lineTotal;
            }

            orderItems.push({
                productId: product._id,
                title: product.title,
                type: product.type,
                price: price,
                gstPercent: itemGstPercent,
                quantity: item.quantity
            });
        }

        // Handle Coupon logic
        let discountAmount = 0;
        let partnerRef = null;
        let appliedCouponCode = '';

        if (couponCode) {
            const cleanedCode = (couponCode || '').trim().toUpperCase();
            console.log(`🔍 [COD] Checking coupon: "${cleanedCode}"`);
            const coupon = await Coupon.findOne({ code: cleanedCode, isActive: true });
            
            if (coupon) {
                console.log(`✅ [COD] Coupon found: ${coupon.code}. isPartner: ${coupon.isPartnerCoupon}`);
                const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                const isUnderMin = totalAmount < (coupon.minOrder || 0);
                const isLimitReached = (coupon.usedCount || 0) >= (coupon.usageLimit || 1000);

                if (!isExpired && !isUnderMin && !isLimitReached) {
                    discountAmount = coupon.type === 'Percentage'
                        ? (totalAmount * (coupon.value || 0)) / 100
                        : (coupon.value || 0);
                    
                    discountAmount = Math.min(discountAmount, totalAmount);
                    appliedCouponCode = coupon.code;

                    // Update usage
                    coupon.usedCount = (coupon.usedCount || 0) + 1;
                    await coupon.save();

                    // If it's a partner coupon, associate with the order
                    if (coupon.isPartnerCoupon && coupon.partnerId) {
                        partnerRef = {
                            partnerId: coupon.partnerId.toString(),
                            partnerName: coupon.partnerName || 'Unknown Partner',
                            couponCode: coupon.code,
                            commissionPercent: (coupon.commissionPercent || 0),
                            commissionAmount: Math.round((totalAmount * (coupon.commissionPercent || 0)) / 100),
                            commissionPaid: false
                        };
                        console.log(`💰 [COD] Partner Ref Attached: ${partnerRef.partnerName}`);
                    }
                } else {
                    console.log(`⚠️ [COD] Coupon checks failed: Expired=${isExpired}, UnderMin=${isUnderMin}`);
                }
            } else {
                console.log(`❌ [COD] Coupon "${cleanedCode}" not found`);
            }
        }

        const dynamicDiscount = await calculateBackendDynamicDiscounts(items);
        const offerResult = await calculateBackendOfferDiscounts(items, offerId);
        const offerDiscount = offerResult.totalDiscountAmount;
        const appliedOffer = offerResult.appliedOffer;
        const finalAmount = Math.max(0, totalAmount - discountAmount - dynamicDiscount - offerDiscount);

        // Link to user if possible (even if guest has account)
        let userId = null;
        try {
            const potentialUser = await User.findOne({ email: customer.email });
            if (potentialUser) {
                userId = potentialUser._id;
            }
        } catch (e) { }

        const address = {
            fullName: customer.fullName || customer.name || 'Customer',
            email: customer.email,
            phone: customer.phone || '0000000000',
            house: customer.street || customer.house || '',
            area: customer.area || '',
            city: customer.city || 'Unknown',
            state: customer.state || '',
            pincode: customer.pincode || customer.zip || '000000',
            country: customer.country || 'India'
        };

        const newOrder = await Order.create({
            orderId: 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000),
            userId: userId,
            customer: {
                ...address,
                name: address.fullName,
                address: address, // Store nested object too for UI parity
                zip: address.pincode,
                city: address.city
            },
            items: orderItems,
            subtotal: Math.round(totalAmount),
            booksSubtotal: Math.round(booksSubtotal),
            taxExempt: (totalGstAmount || 0) === 0 && nonBookSubtotal === 0,
            taxAmount: Math.round((totalGstAmount || 0) + (nonBookSubtotal > 0 ? (nonBookSubtotal - (nonBookSubtotal / 1.18)) : 0)),
            totalAmount: Math.round(finalAmount),
            discountAmount: Math.round(discountAmount + dynamicDiscount + offerDiscount),
            couponCode: appliedCouponCode,
            partnerRef: partnerRef,
            offerId: appliedOffer ? appliedOffer.id : '',
            offerName: appliedOffer ? appliedOffer.name : '',
            offerDiscountApplied: offerDiscount,
            offerOriginalAmount: totalAmount,
            offerFinalAmount: finalAmount,
            offerType: appliedOffer ? appliedOffer.type : '',
            purchasedThroughOffer: appliedOffer ? 'Yes' : 'No',
            offerSavings: offerDiscount,
            paymentMethod: paymentMethod || 'COD',
            timeline: [{ status: 'Pending', note: 'Order placed successfully' }]
        });

        if (appliedOffer) {
            try {
                const offerDoc = await Offer.findById(appliedOffer.id);
                if (offerDoc) {
                    if (!offerDoc.analytics) {
                        offerDoc.analytics = { views: 0, claims: 0, orders: 1, revenue: offerDiscount };
                    } else {
                        offerDoc.analytics.orders = (offerDoc.analytics.orders || 0) + 1;
                        offerDoc.analytics.revenue = (offerDoc.analytics.revenue || 0) + offerDiscount;
                    }
                    await offerDoc.save();
                }

                let analytics = await OfferAnalytics.findOne({ offerId: appliedOffer.id });
                if (!analytics) {
                    await OfferAnalytics.create({
                        offerId: appliedOffer.id,
                        views: 0,
                        claims: 0,
                        orders: 1,
                        revenue: offerDiscount
                    });
                } else {
                    analytics.orders = (analytics.orders || 0) + 1;
                    analytics.revenue = (analytics.revenue || 0) + offerDiscount;
                    await analytics.save();
                }
            } catch (e) {
                console.error("Error updating OfferAnalytics for order placement:", e);
            }
        }

        // 🔔 Add Purchase Notification (Private)
        if (userId) {
            try {
                const user = await User.findById(userId);
                if (user) {
                    if (!user.notifications) user.notifications = [];
                    user.notifications.unshift({
                        _id: 'purchase-cod-' + Date.now(),
                        title: 'Order Placed! 📦',
                        message: `Wait for confirmation! Your order ${newOrder.orderId} (COD) has been placed.`,
                        type: 'Order',
                        link: 'profile.html?tab=orders',
                        isRead: false,
                        createdAt: new Date().toISOString()
                    });
                    user.markModified('notifications');
                    await user.save();
                }
            } catch (noteErr) {
                console.error('COD notification error:', noteErr);
            }
        }

        // 💰 Process Partner Sale (Audit record & Partner Totals)
        if (newOrder.partnerRef) {
            await processPartnerSale(newOrder, newOrder.partnerRef);
        }

        // 🕒 Schedule Delayed WhatsApp Order Confirmation (2 min delay)
        try {
            await jobService.schedule(newOrder.userId || customer.email, 'OrderPlaced', 2, { orderId: newOrder.orderId });
            // Cancel any pending Abandoned Cart jobs for this user
            if (newOrder.userId) {
                await jobService.cancel(newOrder.userId, 'AbandonedCart');
                await Cart.findOneAndUpdate({ userId: newOrder.userId }, { isPurchased: true, remindersSent: 0 });
            }
        } catch (err) {
            console.error('Job Scheduling Error:', err);
        }

        sendOrderNotificationEmail(newOrder).catch(err => console.error("Notification email error:", err));
        res.status(201).json(newOrder);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error placing order' });
    }
});



// Create Cashfree Order
router.post('/cashfree', protect, async (req, res) => {
    try {
        const { amount, currency, country, customerName, customerPhone, customerEmail } = req.body;
        if (!amount) return res.status(400).json({ message: 'Amount is required' });

        // Auto-resolve currency from country if not explicitly provided
        const resolvedCurrency = currency || resolveCurrency(country) || 'INR';

        const orderId = `EFV-CF-${Date.now()}`;
        const roundedAmount = Number(amount).toFixed(2);

        // Dynamically detect caller's origin (localhost vs production)
        let frontendBase = process.env.FRONTEND_URL || 'https://efvframework-246449377479.asia-south1.run.app';
        if (req.headers.origin) {
            frontendBase = req.headers.origin;
        } else if (req.headers.referer) {
            try {
                frontendBase = new URL(req.headers.referer).origin;
            } catch (e) {}
        }
        const returnUrl = `${frontendBase}/pages/payment-status.html?order_id={order_id}`;

        const cfOrder = await createCashfreeOrder({
            orderId: orderId,
            amount: Number(roundedAmount),
            currency: resolvedCurrency,
            customerId: req.user._id.toString(),
            customerName: customerName || req.user.name,
            customerPhone: customerPhone || req.user.phone || '0000000000',
            customerEmail: customerEmail || req.user.email,
            returnUrl: returnUrl
        });

        res.json({ ...cfOrder, resolvedCurrency });
    } catch (error) {
        console.error('Cashfree API Error:', error);
        res.status(500).json({
            message: 'Failed to create Cashfree order',
            error: error.response ? error.response.data : error.message
        });
    }
});

// Verify Cashfree Payment
router.post('/verify-cashfree', async (req, res) => {
    try {
        const { order_id, currency, checkoutData, customer: directCustomer, items: directItems, couponCode, shippingCharge, codCharge, offerId, language, paymentCurrency, locale } = req.body;
        const digitalSlugs = await getDigitalSlugs();

        if (!order_id) return res.status(400).json({ message: 'Order ID is required' });

        // 🟢 PREVENT DUPLICATE ORDERS: Check if this Cashfree Order ID was already processed
        const existingOrder = await Order.findOne({ cashfreeOrderId: order_id });
        if (existingOrder) {
            console.log(`ℹ️ Cashfree verification called for already fulfilled order: ${order_id}`);
            return res.status(200).json({
                success: true,
                order: existingOrder,
                message: 'Order was already processed successfully'
            });
        }

        // 1. Verify Payment with Cashfree
        const payments = await verifyCashfreePayment(order_id);
        if (!payments || !Array.isArray(payments)) {
            console.warn(`⚠️ Cashfree Verification returned invalid/empty data for Order: ${order_id}`);
            return res.status(400).json({ message: 'Invalid response from payment gateway' });
        }
        const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS');

        if (!successfulPayment) {
            console.warn(`⚠️ Cashfree Payment Verification Failed for Order: ${order_id}`);
            return res.status(400).json({ message: 'Payment not successful or not found' });
        }

        console.log(`✅ Cashfree Payment Verified for Order: ${order_id}. Initializing fulfillment...`);

        // 2. Resilient User Resolution (Token OR Email Fallback)
        let user = null;
        let token = req.headers.authorization?.split(' ')[1] || req.query.token;
        if (token && token !== 'null' && token !== 'undefined') {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const mongoose = require('mongoose');
                const query = [];
                if (/^[a-f\d]{24}$/i.test(decoded.id)) query.push({ _id: new mongoose.Types.ObjectId(decoded.id) });
                if (decoded.id) query.push({ _id: decoded.id }, { email: decoded.id });
                if (decoded.email) query.push({ email: decoded.email });
                user = await User.findOne({ $or: query }).select('-password');
            } catch (e) {
                console.warn('verify-cashfree: token verification error, falling back to customer email');
            }
        }

        if (!user) {
            const customerEmail = (directCustomer && directCustomer.email) || (checkoutData && checkoutData.customer && checkoutData.customer.email) || (checkoutData && checkoutData.address && checkoutData.address.email);
            if (customerEmail) {
                user = await User.findOne({ email: customerEmail.toLowerCase().trim() }).select('-password');
            }
        }

        // If user still not found, create a fallback customer record
        if (!user) {
            const customerEmail = (directCustomer && directCustomer.email) || `guest_${Date.now()}@efv.com`;
            user = await User.create({
                name: (directCustomer && directCustomer.name) || 'Customer',
                email: customerEmail,
                password: `guest_${Date.now()}`,
                role: 'user',
                purchasedProducts: []
            });
            console.log(`👤 Created guest user for Cashfree order fulfillment: ${user.email}`);
        }

        let finalItems = [];
        let address = null;

        if (checkoutData) {
            finalItems = checkoutData.items || [];
            if (checkoutData.selectedAddressId) {
                address = user.savedAddresses.find(a => (a._id || a.id || '').toString() === checkoutData.selectedAddressId.toString());
            } else if (checkoutData.address) {
                address = checkoutData.address;
            }
        } else {
            finalItems = directItems || [];
            if (directCustomer) {
                address = {
                    fullName: directCustomer.name,
                    email: directCustomer.email,
                    phone: directCustomer.phone || user.phone || '0000000000',
                    house: directCustomer.street || directCustomer.address || '',
                    area: directCustomer.area || '',
                    city: directCustomer.city || 'Unknown',
                    state: directCustomer.state || '',
                    pincode: directCustomer.pincode || directCustomer.zip || '000000',
                    country: directCustomer.country || 'India'
                };
            }
        }

        if (!finalItems || finalItems.length === 0) return res.status(400).json({ message: 'No items in order' });

        // 🟢 For digital-only orders (EBOOK/AUDIOBOOK), shipping address is not mandatory.
        // If missing, create a placeholder using user account info so the order can be created.
        if (!address) {
            address = {
                fullName: user.name || 'Digital Customer',
                email: user.email,
                phone: user.phone || '0000000000',
                house: 'Digital Delivery',
                area: '',
                city: 'Online',
                state: '',
                pincode: '000000',
                country: 'India'
            };
            console.log(`ℹ️ No shipping address provided — using digital placeholder for order: ${order_id}`);
        }


        let totalAmount = 0;
        const orderItems = [];

        for (const item of finalItems) {
            const product = await getProductById(item.id || item.productId);
            if (!product) continue;

            const countryVal = address ? (address.country || 'India') : 'India';
            const sellingPrice = resolveProductPrice(product, countryVal);
            totalAmount += sellingPrice * item.quantity;
            orderItems.push({
                productId: product._id,
                title: product.title,
                type: product.type,
                price: sellingPrice,
                quantity: item.quantity
            });
        }

        if (orderItems.length === 0) return res.status(400).json({ message: 'No valid products found in order' });

        const physicalCheckItems = orderItems.filter(i => !digitalSlugs.has((i.type || '').toUpperCase()));
        if (physicalCheckItems.length > 0) {
            const postalVal = validatePostalCode(address.pincode, address.country, true);
            if (!postalVal.isValid) {
                console.warn(`⚠️ Invalid postal code for Cashfree order verification:`, postalVal.error);
                return res.status(400).json({ message: postalVal.error });
            }
            if (postalVal.normalized) {
                address.pincode = postalVal.normalized;
            }
        }

        let discountAmount = 0;
        let partnerRef = null;
        let appliedCouponCode = '';

        if (couponCode) {
            const cleanedCode = (couponCode || '').trim().toUpperCase();
            const coupon = await Coupon.findOne({ code: cleanedCode, isActive: true });
            if (coupon) {
                const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                const isUnderMin = totalAmount < (coupon.minOrder || 0);
                const isLimitReached = coupon.usedCount >= coupon.usageLimit;

                if (!isExpired && !isUnderMin && !isLimitReached) {
                    discountAmount = coupon.type === 'Percentage'
                        ? (totalAmount * (coupon.value || 0)) / 100
                        : (coupon.value || 0);
                    discountAmount = Math.min(discountAmount, totalAmount);
                    appliedCouponCode = coupon.code;

                    // Increment used count for Cashfree orders
                    coupon.usedCount = (coupon.usedCount || 0) + 1;
                    await coupon.save();

                    if (coupon.isPartnerCoupon && coupon.partnerId) {
                        partnerRef = {
                            partnerId: coupon.partnerId.toString(),
                            partnerName: coupon.partnerName || 'Unknown Partner',
                            couponCode: coupon.code,
                            commissionPercent: (coupon.commissionPercent || 0),
                            commissionAmount: Math.round((totalAmount * (coupon.commissionPercent || 0)) / 100),
                            commissionPaid: false
                        };
                    }
                }
            }
        }

        const dynamicDiscount = await calculateBackendDynamicDiscounts(finalItems);
        const offerResult = await calculateBackendOfferDiscounts(finalItems, offerId);
        const offerDiscount = offerResult.totalDiscountAmount;
        const appliedOffer = offerResult.appliedOffer;
        const finalPayable = Math.round(totalAmount - discountAmount - dynamicDiscount - offerDiscount + (Number(shippingCharge) || 0) + (Number(codCharge) || 0));
        const isPurelyDigital = orderItems.every(i => digitalSlugs.has((i.type || '').toUpperCase()));

        const newOrder = await Order.create({
            orderId: 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000),
            userId: user._id,
            customer: {
                name: address.fullName || user.name,
                email: address.email || user.email,
                phone: address.phone || user.phone || '0000000000',
                address: address,
                city: address.city || '',
                zip: address.pincode || address.zip || ''
            },
            items: orderItems,
            totalAmount: finalPayable,
            shippingCharges: Number(shippingCharge) || 0,
            codCharges: Number(codCharge) || 0,
            discountAmount: Math.round(discountAmount + dynamicDiscount + offerDiscount),
            couponCode: appliedCouponCode,
            partnerRef: partnerRef,
            offerId: appliedOffer ? appliedOffer.id : '',
            offerName: appliedOffer ? appliedOffer.name : '',
            offerDiscountApplied: offerDiscount,
            offerOriginalAmount: totalAmount,
            offerFinalAmount: finalPayable,
            offerType: appliedOffer ? appliedOffer.type : '',
            purchasedThroughOffer: appliedOffer ? 'Yes' : 'No',
            offerSavings: offerDiscount,
            paymentMethod: 'Cashfree',
            paymentStatus: 'Paid',
            status: isPurelyDigital ? 'Completed (Digital)' : 'Processing',
            language: language || 'en',
            paymentCurrency: currency || paymentCurrency || resolveCurrency(address ? address.country : '') || 'INR',
            locale: locale || 'en-IN',
            cashfreeOrderId: order_id,
            currency: currency || paymentCurrency || resolveCurrency(address ? address.country : '') || 'INR',
            timeline: [{
                status: isPurelyDigital ? 'Completed (Digital)' : 'Paid',
                note: isPurelyDigital ? 'Digital Product Purchased & Unlocked' : `Payment verified via Cashfree (${currency || paymentCurrency || resolveCurrency(address ? address.country : '') || 'INR'})`
            }]
        });

        if (appliedOffer) {
            try {
                const offerDoc = await Offer.findById(appliedOffer.id);
                if (offerDoc) {
                    if (!offerDoc.analytics) {
                        offerDoc.analytics = { views: 0, claims: 0, orders: 1, revenue: offerDiscount };
                    } else {
                        offerDoc.analytics.orders = (offerDoc.analytics.orders || 0) + 1;
                        offerDoc.analytics.revenue = (offerDoc.analytics.revenue || 0) + offerDiscount;
                    }
                    await offerDoc.save();
                }

                let analytics = await OfferAnalytics.findOne({ offerId: appliedOffer.id });
                if (!analytics) {
                    await OfferAnalytics.create({
                        offerId: appliedOffer.id,
                        views: 0,
                        claims: 0,
                        orders: 1,
                        revenue: offerDiscount
                    });
                } else {
                    analytics.orders = (analytics.orders || 0) + 1;
                    analytics.revenue = (analytics.revenue || 0) + offerDiscount;
                    await analytics.save();
                }
            } catch (e) {
                console.error("Error updating OfferAnalytics for order placement (Cashfree):", e);
            }
        }

        const digitalItems = [];
        for (const item of orderItems) {
            const itemType = (item.type || '').toUpperCase();
            if (digitalSlugs.has(itemType)) {
                const product = await getProductById(item.productId);
                if (product) {
                    digitalItems.push({
                        productId: product._id,
                        title: product.title,
                        type: itemType,
                        thumbnail: product.thumbnail,
                        filePath: product.filePath,
                        purchasedAt: new Date(),
                        orderId: newOrder.orderId,
                        accessStatus: 'active'
                    });
                }
            }
        }

        if (digitalItems.length > 0) {
            const resolvedUserId = user._id || user.id;
            const searchIdStr = (resolvedUserId || '').toString();
            let library = await DigitalLibrary.findOne({ 
                $or: [{ userId: resolvedUserId }, { userId: searchIdStr }]
            });
            if (!library) {
                library = new DigitalLibrary({ userId: resolvedUserId, items: [] });
            }
            if (!library.items) library.items = [];

            digitalItems.forEach(di => {
                if (!library.items.some(li => (li.productId || '').toString() === di.productId.toString())) {
                    library.items.push(di);
                }
            });
            library.updatedAt = new Date().toISOString();
            await library.save();
        }

        try {
            if (!user.notifications) user.notifications = [];
            user.notifications.unshift({
                _id: 'purchase-cf-' + Date.now(),
                title: isPurelyDigital ? 'Content Unlocked! 📖' : 'Purchase Successful! 🎉',
                message: isPurelyDigital ? `Your digital products from order #${newOrder.orderId} are now available in My Library.` : `Thank you for your order ${newOrder.orderId}. Your items are being processed.`,
                type: 'Order',
                link: isPurelyDigital ? 'profile.html?tab=library' : 'profile.html?tab=orders',
                isRead: false,
                createdAt: new Date().toISOString()
            });
            user.updatedAt = new Date().toISOString();
            await user.save();
        } catch (noteErr) {}

        const physicalItems = orderItems.filter(i => {
            const t = (i.type || '').toUpperCase();
            return ['HARDCOVER', 'PAPERBACK', 'PHYSICAL'].includes(t);
        });
        if (physicalItems.length > 0) {
            try {
                const nimbusPostService = require('../services/nimbusPostService');
                const { Shipment } = require('../models');
                
                const deliveryCountry = (address.country || '').trim().toLowerCase();
                const isIndia = deliveryCountry === 'india' || deliveryCountry === 'in' || !deliveryCountry;

                if (isIndia) {
                    if (isJabalpurOrder(address)) {
                        newOrder.fulfillmentProvider = 'ADMIN';
                        newOrder.status = 'Local Delivery';
                        newOrder.timeline.push({ status: 'Local Delivery', note: 'Order assigned for local delivery in Jabalpur. Nimbus bypassed.' });
                        await newOrder.save();
                    } else {
                        newOrder.fulfillmentProvider = 'NIMBUS';
                        const shipResult = await nimbusPostService.automateShipping(newOrder, address, physicalItems, 'prepaid');

                        if (shipResult.status) {
                            newOrder.shipmentId = shipResult.shipmentId;
                            newOrder.awbNumber = shipResult.awbNumber;
                            newOrder.courierName = shipResult.courierName;
                            newOrder.trackingLink = shipResult.trackingLink;
                            newOrder.labelUrl = shipResult.labelUrl;
                            newOrder.timeline.push({ status: 'Shipped', note: `Shipment automated via ${shipResult.courierName}. AWB: ${shipResult.awbNumber}` });
                            await newOrder.save();
                            await Shipment.create({
                                orderId: newOrder._id.toString(),
                                shipmentId: shipResult.shipmentId,
                                awbNumber: shipResult.awbNumber,
                                courierName: shipResult.courierName,
                                labelUrl: shipResult.labelUrl,
                                trackingLink: shipResult.trackingLink,
                                shippingStatus: 'Processing'
                            });
                        } else {
                            console.warn(`⚠️ Nimbus Prepaid Automation Failed for ${newOrder.orderId}:`, shipResult.message);
                            newOrder.timeline.push({ status: 'Processing', note: 'Auto-shipping failed: ' + shipResult.message });
                            await newOrder.save();
                        }
                    }
                } else {
                    newOrder.fulfillmentProvider = 'LULU';
                    // Lulu international shipping via Django service
                    console.log(`🌐 Routing Order #${newOrder.orderId} to Lulu POD...`);
                    // Format line items dynamically from product database records
                    const luluLineItems = await formatLuluLineItems(physicalItems);
                    const countryCode = resolveLuluCountryCode(address.country);

                    // Check if country is supported by Lulu
                    const luluUnsupportedCountries = ['RU'];
                    if (luluUnsupportedCountries.includes(countryCode)) {
                        console.warn(`⚠️ Country ${countryCode} is not supported by Lulu. Falling back to ADMIN fulfillment.`);
                        newOrder.fulfillmentProvider = 'ADMIN';
                        newOrder.timeline.push({ status: 'Processing', note: `International order (${countryCode}) - Lulu does not support this country. Manual fulfillment required.`, timestamp: new Date() });
                        await newOrder.save();
                    } else {

                    const luluAddress = formatLuluAddress(address);
                    
                    try {
                        let attempts = 0;
                        const maxAttempts = 3;
                        let luluRes = null;
                        let lastError = null;

                        while (attempts < maxAttempts) {
                            try {
                                attempts++;
                                console.log(`Sending print job request to Lulu (Attempt ${attempts}/${maxAttempts})...`);
                                const luluData = await createPrintJob({
                                    contactEmail: address.email || newOrder.customer?.email || "customer@example.com",
                                    externalId: newOrder.orderId || newOrder._id.toString(),
                                    lineItems: luluLineItems,
                                    shippingAddress: luluAddress,
                                    shippingLevel: "MAIL"
                                });
                                if (luluData && luluData.id) {
                                    // Map Lulu response to match our local DB expected structure
                                    luluRes = {
                                        data: {
                                            success: true,
                                            job_id: luluData.id,
                                            status: luluData.status?.name || luluData.status,
                                            lulu_response: luluData
                                        }
                                    };
                                    break;
                                } else {
                                    throw new Error('Invalid response from Lulu integration');
                                }
                            } catch (err) {
                                lastError = err;
                                let errorMsg = err.message || '';
                                if (err.response && err.response.data && err.response.data.error) {
                                    errorMsg = typeof err.response.data.error === 'string' ? err.response.data.error : JSON.stringify(err.response.data.error);
                                }
                                console.warn(`⚠️ Lulu API Attempt ${attempts} failed: ${errorMsg}`);
                                // Dynamic state resolution: parse valid choices from Lulu error and retry
                                if (attempts < maxAttempts && (errorMsg.includes('state you entered is invalid') || errorMsg.includes('Valid choices are'))) {
                                    const validChoicesMatch = errorMsg.match(/Valid choices are \[(.*?)\]/);
                                    if (validChoicesMatch) {
                                        const choices = validChoicesMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                                        if (choices.length > 0) {
                                            const currentState = luluAddress.state_code || '';
                                            let bestMatch = choices[0];
                                            for (const choice of choices) {
                                                if (choice && currentState && (choice.toLowerCase().includes(currentState.toLowerCase().substring(0, 4)) || currentState.toLowerCase().includes(choice.toLowerCase().substring(0, 4)))) {
                                                    bestMatch = choice;
                                                    break;
                                                }
                                            }
                                            console.log(`💡 Auto-resolving invalid state "${luluAddress.state_code}" → "${bestMatch}"`);
                                            luluAddress.state_code = bestMatch;
                                            luluAddress.state = bestMatch;
                                            continue; // Retry immediately with corrected state
                                        }
                                    }
                                }
                                // Dynamic postcode resolution: parse valid format sample from Lulu error and retry
                                if (attempts < maxAttempts && (errorMsg.includes('Postal Code') || errorMsg.includes('postcode') || errorMsg.includes('It should look like'))) {
                                    const sampleCodeMatch = errorMsg.match(/It should look like ([^".\\]+)/i);
                                    if (sampleCodeMatch) {
                                        const sampleCode = sampleCodeMatch[1].split(',')[0].trim();
                                        if (sampleCode) {
                                            console.log(`💡 Auto-resolving invalid postcode "${luluAddress.postcode}" → "${sampleCode}"`);
                                            luluAddress.postcode = sampleCode;
                                            continue; // Retry immediately with corrected postcode
                                        }
                                    }
                                }
                                // Dynamic max-length truncation resolution:
                                if (attempts < maxAttempts && (errorMsg.includes('MAX_LENGTH_EXCEEDED') || errorMsg.includes('limit of 30 characters'))) {
                                    console.log(`💡 Auto-truncating long address fields for Lulu API retry...`);
                                    if (luluAddress.street1 && luluAddress.street1.length > 30) luluAddress.street1 = luluAddress.street1.substring(0, 30);
                                    if (luluAddress.name && luluAddress.name.length > 30) luluAddress.name = luluAddress.name.substring(0, 30);
                                    if (luluAddress.city && luluAddress.city.length > 30) luluAddress.city = luluAddress.city.substring(0, 30);
                                    continue;
                                }
                                if (attempts < maxAttempts) {
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                }
                            }
                        }

                        if (luluRes && luluRes.data && luluRes.data.success) {
                            const jobData = luluRes.data;
                            const luluResponse = jobData.lulu_response || {};
                            newOrder.shipmentId   = jobData.job_id;
                            newOrder.awbNumber    = jobData.job_id; // Using Job ID for tracking in local dashboard
                            newOrder.courierName  = 'Lulu';
                            
                            newOrder.luluJobId = jobData.job_id;
                            newOrder.luluStatus = jobData.status || (luluResponse.status && luluResponse.status.name) || 'CREATED';
                            
                            const trackingInfo = luluResponse.tracking || {};
                            newOrder.luluTracking = trackingInfo.tracking_number || '';
                            newOrder.luluShippingMethod = luluResponse.shipping_option || luluResponse.shipping_level || 'MAIL';
                            
                            const firstItem = luluResponse.line_items && luluResponse.line_items[0];
                            newOrder.luluPrintPackage = firstItem ? (firstItem.pod_package_id || firstItem.printable_normalization?.pod_package_id) : '';
                            
                            newOrder.luluWebhookData = luluResponse;
                            newOrder.luluLastSync = new Date();
                            
                            newOrder.timeline.push({ status: 'Processing', note: `Print job created via Lulu. Job ID: ${jobData.job_id}` });
                            await newOrder.save();
                            
                            await Shipment.create({
                                orderId       : newOrder._id.toString(),
                                shipmentId    : jobData.job_id,
                                awbNumber     : jobData.job_id,
                                courierName   : 'Lulu',
                                shippingStatus: jobData.status || 'Created'
                            });
                            console.log(`✅ Lulu Print Job Created Successfully for Order #${newOrder.orderId}. Job ID: ${jobData.job_id}`);
                        } else {
                            throw new Error(lastError?.message || 'Invalid response from Lulu integration');
                        }
                    } catch (luluErr) {
                        console.error('❌ Lulu POD integration failed after all retries:', luluErr.message);
                        newOrder.timeline.push({ status: 'Fulfillment Issue', note: 'Lulu POD failed: ' + luluErr.message });
                        await newOrder.save();
                    }
                    } // end unsupported country else
                }
            } catch (shipErr) { 
                console.error('❌ Nimbus Automation Exception:', shipErr); 
                newOrder.timeline.push({ status: 'Fulfillment Issue', note: 'Auto-shipment system error: ' + shipErr.message });
                await newOrder.save();
            }
        }

        if (newOrder.partnerRef) {
            await processPartnerSale(newOrder, newOrder.partnerRef);
        }

        // 🕒 Schedule Delayed WhatsApp Order Confirmation (2 min delay)
        try {
            await jobService.schedule(user._id, 'OrderPlaced', 2, { orderId: newOrder.orderId });
            await jobService.cancel(user._id, 'AbandonedCart');
            await Cart.findOneAndUpdate({ userId: user._id }, { isPurchased: true, remindersSent: 0 });
        } catch (err) {
            console.error('Job Scheduling Error (Cashfree):', err);
        }

        sendOrderNotificationEmail(newOrder).catch(err => console.error("Notification email error:", err));
        res.status(201).json({ success: true, order: newOrder, message: 'Payment verified and order placed' });

    } catch (error) {
        console.error('Cashfree Verification Error:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
});

// Cashfree Webhook Handler (notify_url)
router.post('/cashfree-notify', async (req, res) => {
    try {
        const { order_id, order_status } = req.body;
        console.log(`📡 Cashfree Webhook Received for Order: ${order_id}, Status: ${order_status}`);

        if (order_status === 'PAID' || order_status === 'SUCCESS') {
            const existingOrder = await Order.findOne({ cashfreeOrderId: order_id });
            if (!existingOrder) {
                console.log(`🔄 Webhook triggering background fulfillment for ${order_id}...`);
                // Note: Background fulfillment logic should ideally be abstracted to a service
                // For now, this acknowledges the payment to Cashfree
            }
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Error');
    }
});

// Create// Confirm COD Order
router.post('/cod', protect, async (req, res) => {
    try {
        const { orderId, customer, items, couponCode, offerId, language, paymentCurrency, locale } = req.body;
        const digitalSlugs = await getDigitalSlugs();
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!customer) return res.status(400).json({ message: 'Customer address details are required for COD' });

        // Validate postal code for COD orders (COD is always physical)
        const postalVal = validatePostalCode(customer.pincode || customer.zip, customer.country || 'India', true);
        if (!postalVal.isValid) {
            console.warn(`⚠️ Invalid postal code for COD order:`, postalVal.error);
            return res.status(400).json({ message: postalVal.error });
        }
        if (postalVal.normalized) {
            customer.pincode = postalVal.normalized;
            customer.zip = postalVal.normalized;
        }

        // 1. Calculate Totals (Safeguard)
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await getProductById(item.productId);
            if (!product) continue;

            const countryVal = customer ? (customer.country || 'India') : 'India';
            const price = resolveProductPrice(product, countryVal);
            subtotal += price * item.quantity;

            // 🚫 BLOCK DIGITAL ITEMS IN COD
            const isDigital = digitalSlugs.has((product.type || '').toUpperCase()) || product.category === 'Digital';
            if (isDigital) {
                return res.status(400).json({
                    message: `Digital product '${product.title}' cannot be purchased via COD. Only Online Payment is available.`
                });
            }

            processedItems.push({
                productId: product._id,
                title: product.title,
                type: product.type,
                price: price,
                quantity: item.quantity
            });

            // Decrease stock for physical items
            if (!isDigital) {
                if (product.stock >= item.quantity) {
                    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
                }
            }
        }

        // Coupon Handling
        let discount = 0;
        let pRef = null;
        if (couponCode) {
            try {
                const cleanedCode = (couponCode || '').trim().toUpperCase();
                const coupon = await Coupon.findOne({ code: cleanedCode, isActive: true });
                if (coupon) {
                    const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                    const isUnderMin = subtotal < (coupon.minOrder || 0); // Corrected to subtotal
                    const isLimitReached = (coupon.usedCount || 0) >= (coupon.usageLimit || 1000);

                    if (!isExpired && !isLimitReached) {
                        if (coupon.type === 'Percentage') discount = (subtotal * (coupon.value || 0)) / 100;
                        else discount = (coupon.value || 0);
                        
                        discount = Math.min(discount, subtotal);
                        
                        // Increment used count for COD
                        coupon.usedCount = (coupon.usedCount || 0) + 1;
                        await coupon.save();

                        if (coupon.isPartnerCoupon && coupon.partnerId) {
                            pRef = {
                                partnerId: coupon.partnerId.toString(),
                                partnerName: coupon.partnerName || 'Unknown Partner',
                                couponCode: coupon.code,
                                commissionPercent: (coupon.commissionPercent || 0),
                                commissionAmount: Math.round((subtotal * (coupon.commissionPercent || 0)) / 100),
                                commissionPaid: false
                            };
                        }
                    }
                }
            } catch (err) { console.error('COD Coupon Error:', err); }
        }

        // SHIPPING & COD CHARGES Logic (Prioritizing Frontend Calculation for Parity)
        const shippingCharge = req.body.shippingCharge || 42.48; 
        const codCharge = req.body.codCharge || (36.58 + (subtotal * 0.0224));

        const dynamicDiscount = await calculateBackendDynamicDiscounts(items);
        const offerResult = await calculateBackendOfferDiscounts(items, offerId);
        const offerDiscount = offerResult.totalDiscountAmount;
        const appliedOffer = offerResult.appliedOffer;
        const finalAmount = Math.round(subtotal - discount - dynamicDiscount - offerDiscount + shippingCharge + codCharge);

        // 2. Create Order Record
        const { Order, Shipment, DigitalLibrary } = require('../models');
        const newOrder = await Order.create({
            orderId: orderId || ('COD-' + Date.now()),
            userId: user._id,
            customer: {
                name: customer.fullName || customer.name || 'Customer',
                email: customer.email,
                phone: customer.phone,
                address: {
                    house: customer.street || customer.house || '',
                    area: customer.area || '',
                    city: customer.city || 'Unknown',
                    state: customer.state || '',
                    pincode: customer.pincode || customer.zip || '000000',
                    country: customer.country || 'India'
                },
                city: customer.city || 'Unknown',
                zip: customer.pincode || customer.zip || '000000'
            },
            items: processedItems.map(item => ({
                productId: item.productId,
                title: item.title,
                price: Number(item.price),
                quantity: Number(item.quantity),
                type: item.type
            })),
            totalAmount: finalAmount,
            shippingCharges: Number(shippingCharge) || 0,
            codCharges: Number(codCharge) || 0,
            discountAmount: Math.round(discount + dynamicDiscount + offerDiscount),
            paymentMethod: 'COD',
            paymentStatus: 'Pending',
            language: language || 'en',
            paymentCurrency: paymentCurrency || resolveCurrency(customer?.country || customer?.address?.country) || 'INR',
            currency: paymentCurrency || resolveCurrency(customer?.country || customer?.address?.country) || 'INR',
            locale: locale || 'en-IN',
            couponCode: couponCode || '',
            partnerRef: pRef,
            offerId: appliedOffer ? appliedOffer.id : '',
            offerName: appliedOffer ? appliedOffer.name : '',
            offerDiscountApplied: offerDiscount,
            offerOriginalAmount: subtotal,
            offerFinalAmount: finalAmount,
            offerType: appliedOffer ? appliedOffer.type : '',
            purchasedThroughOffer: appliedOffer ? 'Yes' : 'No',
            offerSavings: offerDiscount,
            timeline: [{
                status: 'Order Placed',
                note: 'Order placed via Cash on Delivery'
            }]
        });

        if (appliedOffer) {
            try {
                const offerDoc = await Offer.findById(appliedOffer.id);
                if (offerDoc) {
                    if (!offerDoc.analytics) {
                        offerDoc.analytics = { views: 0, claims: 0, orders: 1, revenue: offerDiscount };
                    } else {
                        offerDoc.analytics.orders = (offerDoc.analytics.orders || 0) + 1;
                        offerDoc.analytics.revenue = (offerDoc.analytics.revenue || 0) + offerDiscount;
                    }
                    await offerDoc.save();
                }

                let analytics = await OfferAnalytics.findOne({ offerId: appliedOffer.id });
                if (!analytics) {
                    await OfferAnalytics.create({
                        offerId: appliedOffer.id,
                        views: 0,
                        claims: 0,
                        orders: 1,
                        revenue: offerDiscount
                    });
                } else {
                    analytics.orders = (analytics.orders || 0) + 1;
                    analytics.revenue = (analytics.revenue || 0) + offerDiscount;
                    await analytics.save();
                }
            } catch (e) {
                console.error("Error updating OfferAnalytics for order placement (COD):", e);
            }
        }

        // 🚛 Phase 1: Digital Items for COD orders are fulfilled only after payment is verified (Paid/Delivered status)

        // 🚛 Phase 2: Create Nimbus Shipment for Physical Items
        const physicalItems = processedItems.filter(i => !digitalSlugs.has((i.type || '').toUpperCase()));
        if (physicalItems.length > 0) {
            try {
                const nimbusPostService = require('../services/nimbusPostService');
                const { Shipment } = require('../models');

                const cleanPhone = (customer.phone || '0000000000').toString().replace(/\D/g, '').slice(-10);

                const addressForShipping = {
                    fullName: customer.fullName || customer.name,
                    email: customer.email,
                    phone: cleanPhone,
                    house: customer.street || customer.house,
                    area: customer.area || '',
                    city: customer.city,
                    state: customer.state,
                    pincode: customer.pincode
                };

                console.log(`📦 Triggering Auto-Shipping for COD Order: ${newOrder.orderId}`);
                
                const deliveryCountry = (customer.country || '').trim().toLowerCase();
                const isIndia = deliveryCountry === 'india' || deliveryCountry === 'in' || !deliveryCountry;

                if (isIndia) {
                    if (isJabalpurOrder(addressForShipping)) {
                        newOrder.fulfillmentProvider = 'ADMIN';
                        newOrder.status = 'Local Delivery';
                        newOrder.timeline.push({ status: 'Local Delivery', note: 'COD Order assigned for local delivery in Jabalpur. Nimbus bypassed.' });
                        await newOrder.save();
                    } else {
                        newOrder.fulfillmentProvider = 'NIMBUS';
                        const shipResult = await nimbusPostService.automateShipping(newOrder, addressForShipping, physicalItems, 'cod');

                        if (shipResult.status) {
                            newOrder.shipmentId = shipResult.shipmentId;
                            newOrder.awbNumber = shipResult.awbNumber;
                            newOrder.courierName = shipResult.courierName;
                            newOrder.trackingLink = shipResult.trackingLink;
                            newOrder.labelUrl = shipResult.labelUrl;
                            newOrder.timeline.push({
                                status: 'Shipped',
                                note: `COD Shipment automated via ${shipResult.courierName}. AWB: ${shipResult.awbNumber}`
                            });
                            await newOrder.save();

                            await Shipment.create({
                                orderId: newOrder._id.toString(),
                                shipmentId: shipResult.shipmentId,
                                awbNumber: shipResult.awbNumber,
                                courierName: shipResult.courierName,
                                labelUrl: shipResult.labelUrl,
                                trackingLink: shipResult.trackingLink,
                                shippingStatus: 'Processing'
                            });
                        } else {
                            console.warn(`⚠️ Nimbus COD Automation Failed for ${newOrder.orderId}:`, shipResult.message);
                            newOrder.timeline.push({ status: 'Processing', note: 'Auto-shipping failed: ' + shipResult.message });
                            await newOrder.save();
                        }
                    }
                } else {
                    newOrder.fulfillmentProvider = 'LULU';
                    // Lulu international shipping via Django service
                    console.log(`🌐 Routing Order #${newOrder.orderId} to Lulu POD...`);
                    // Format line items dynamically from product database records
                    const luluLineItems = await formatLuluLineItems(physicalItems);
                    const countryCode = resolveLuluCountryCode(customer.country);

                    // Check if country is supported by Lulu
                    const luluUnsupportedCountries = ['RU'];
                    if (luluUnsupportedCountries.includes(countryCode)) {
                        console.warn(`⚠️ Country ${countryCode} is not supported by Lulu. Falling back to ADMIN fulfillment.`);
                        newOrder.fulfillmentProvider = 'ADMIN';
                        newOrder.timeline.push({ status: 'Processing', note: `International order (${countryCode}) - Lulu does not support this country. Manual fulfillment required.`, timestamp: new Date() });
                        await newOrder.save();
                    } else {

                    const luluAddress = formatLuluAddress(customer);
                    
                    try {
                        let attempts = 0;
                        const maxAttempts = 3;
                        let luluRes = null;
                        let lastError = null;

                        while (attempts < maxAttempts) {
                            try {
                                attempts++;
                                console.log(`Sending print job request to Lulu (Attempt ${attempts}/${maxAttempts})...`);
                                const luluRaw = await createPrintJob({
                                    contactEmail: customer.email || newOrder.customer?.email || "customer@example.com",
                                    externalId: newOrder.orderId || newOrder._id.toString(),
                                    lineItems: luluLineItems,
                                    shippingAddress: luluAddress,
                                    shippingLevel: "MAIL"
                                });
                                luluRes = { 
                                    data: { 
                                        success: true, 
                                        job_id: luluRaw.id, 
                                        status: luluRaw.status?.name || 'CREATED', 
                                        production_time: "3-5 Business Days", 
                                        lulu_response: luluRaw 
                                    } 
                                };
                                if (luluRes.data && luluRes.data.success) {
                                    break;
                                } else {
                                    throw new Error(luluRes.data?.error || 'Invalid response from Lulu integration');
                                }
                            } catch (err) {
                                lastError = err;
                                let errorMsg = err.message || '';
                                if (err.response && err.response.data && err.response.data.error) {
                                    errorMsg = typeof err.response.data.error === 'string' ? err.response.data.error : JSON.stringify(err.response.data.error);
                                }
                                console.warn(`⚠️ Lulu API Attempt ${attempts} failed: ${errorMsg}`);
                                // Dynamic state resolution: parse valid choices from Lulu error and retry
                                if (attempts < maxAttempts && (errorMsg.includes('state you entered is invalid') || errorMsg.includes('Valid choices are'))) {
                                    const validChoicesMatch = errorMsg.match(/Valid choices are \[(.*?)\]/);
                                    if (validChoicesMatch) {
                                        const choices = validChoicesMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                                        if (choices.length > 0) {
                                            const currentState = luluAddress.state_code || '';
                                            let bestMatch = choices[0];
                                            for (const choice of choices) {
                                                if (choice && currentState && (choice.toLowerCase().includes(currentState.toLowerCase().substring(0, 4)) || currentState.toLowerCase().includes(choice.toLowerCase().substring(0, 4)))) {
                                                    bestMatch = choice;
                                                    break;
                                                }
                                            }
                                            console.log(`💡 Auto-resolving invalid state "${luluAddress.state_code}" → "${bestMatch}"`);
                                            luluAddress.state_code = bestMatch;
                                            luluAddress.state = bestMatch;
                                            continue; // Retry immediately with corrected state
                                        }
                                    }
                                }
                                // Dynamic postcode resolution: parse valid format sample from Lulu error and retry
                                if (attempts < maxAttempts && (errorMsg.includes('Postal Code') || errorMsg.includes('postcode') || errorMsg.includes('It should look like'))) {
                                    const sampleCodeMatch = errorMsg.match(/It should look like ([^".\\]+)/i);
                                    if (sampleCodeMatch) {
                                        const sampleCode = sampleCodeMatch[1].split(',')[0].trim();
                                        if (sampleCode) {
                                            console.log(`💡 Auto-resolving invalid postcode "${luluAddress.postcode}" → "${sampleCode}"`);
                                            luluAddress.postcode = sampleCode;
                                            continue; // Retry immediately with corrected postcode
                                        }
                                    }
                                }
                                // Dynamic max-length truncation resolution:
                                if (attempts < maxAttempts && (errorMsg.includes('MAX_LENGTH_EXCEEDED') || errorMsg.includes('limit of 30 characters'))) {
                                    console.log(`💡 Auto-truncating long address fields for Lulu API retry...`);
                                    if (luluAddress.street1 && luluAddress.street1.length > 30) luluAddress.street1 = luluAddress.street1.substring(0, 30);
                                    if (luluAddress.name && luluAddress.name.length > 30) luluAddress.name = luluAddress.name.substring(0, 30);
                                    if (luluAddress.city && luluAddress.city.length > 30) luluAddress.city = luluAddress.city.substring(0, 30);
                                    continue;
                                }
                                if (attempts < maxAttempts) {
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                }
                            }
                        }

                        if (luluRes && luluRes.data && luluRes.data.success) {
                            const jobData = luluRes.data;
                            const luluResponse = jobData.lulu_response || {};
                            newOrder.shipmentId   = jobData.job_id;
                            newOrder.awbNumber    = jobData.job_id; // Using Job ID for tracking in local dashboard
                            newOrder.courierName  = 'Lulu';
                            
                            newOrder.luluJobId = jobData.job_id;
                            newOrder.luluStatus = jobData.status || (luluResponse.status && luluResponse.status.name) || 'CREATED';
                            
                            const trackingInfo = luluResponse.tracking || {};
                            newOrder.luluTracking = trackingInfo.tracking_number || '';
                            newOrder.luluShippingMethod = luluResponse.shipping_option || luluResponse.shipping_level || 'MAIL';
                            
                            const firstItem = luluResponse.line_items && luluResponse.line_items[0];
                            newOrder.luluPrintPackage = firstItem ? (firstItem.pod_package_id || firstItem.printable_normalization?.pod_package_id) : '';
                            
                            newOrder.luluWebhookData = luluResponse;
                            newOrder.luluLastSync = new Date();
                            
                            newOrder.timeline.push({ status: 'Processing', note: `Print job created via Lulu. Job ID: ${jobData.job_id}` });
                            await newOrder.save();
                            
                            await Shipment.create({
                                orderId       : newOrder._id.toString(),
                                shipmentId    : jobData.job_id,
                                awbNumber     : jobData.job_id,
                                courierName   : 'Lulu',
                                shippingStatus: jobData.status || 'Created'
                            });
                            console.log(`✅ Lulu Print Job Created Successfully for Order #${newOrder.orderId}. Job ID: ${jobData.job_id}`);
                        } else {
                            throw new Error(lastError?.message || 'Invalid response from Lulu integration');
                        }
                    } catch (luluErr) {
                        console.error('❌ Lulu POD integration failed after all retries:', luluErr.message);
                        newOrder.timeline.push({ status: 'Fulfillment Issue', note: 'Lulu POD failed: ' + luluErr.message });
                        await newOrder.save();
                    }
                    } // end unsupported country else
                }
            } catch (err) {
                console.error('❌ COD Nimbus Automation Exception:', err);
                newOrder.timeline.push({ status: 'Fulfillment Issue', note: 'Auto-shipment system error: ' + err.message });
                await newOrder.save();
            }
        }

        // Notification
        if (!user.notifications) user.notifications = [];
        user.notifications.unshift({
            _id: 'purchase-cod-' + Date.now(),
            title: 'COD Order Confirmed! 📦',
            message: `Order ${newOrder.orderId} has been placed via COD. Total: ₹${newOrder.totalAmount}.`,
            type: 'Order',
            link: 'profile.html?tab=orders',
            createdAt: new Date().toISOString()
        });
        await user.save();

        // 🕒 Schedule Delayed WhatsApp Order Confirmation (2 min delay)
        try {
            await jobService.schedule(newOrder.userId || newOrder.customer.email, 'OrderPlaced', 2, { orderId: newOrder.orderId });
            if (newOrder.userId) {
                await jobService.cancel(newOrder.userId, 'AbandonedCart');
                await Cart.findOneAndUpdate({ userId: newOrder.userId }, { isPurchased: true, remindersSent: 0 });
            }
        } catch (err) {
            console.error('Job Scheduling Error (COD):', err);
        }

        sendOrderNotificationEmail(newOrder).catch(err => console.error("Notification email error:", err));
        res.status(201).json({ success: true, order: newOrder });

    } catch (error) {
        console.error('COD Place Error:', error);
        res.status(500).json({ message: 'Error placing COD order: ' + error.message, stack: error.stack });
    }
});



// Update Order Status (Admin Only)
router.put('/:id/status', adminAuth, async (req, res) => {
    try {
        const { status, note } = req.body;
        const digitalSlugs = await getDigitalSlugs();
        const idParam = String(req.params.id || '').trim();
        const isHexId = /^[0-9a-fA-F]{24}$/.test(idParam);
        const order = (isHexId ? await Order.findById(idParam) : null) || await Order.findOne({ orderId: idParam });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const oldStatus = order.status;
        order.status = status;
        order.timeline.push({ status, note: note || `Status updated to ${status}` });

        // --- NEW: Fulfill Digital Items on Payment/Delivery ---
        // If status becomes Paid/Delivered, unlock digital products for the user (only if not already paid)
        if (['Paid', 'Delivered'].includes(status) && !['Paid', 'Delivered'].includes(oldStatus)) {
            const userId = order.userId || (await User.findOne({ email: order.customer.email }))?._id;

            if (userId) {
                const digitalItems = [];
                for (const item of order.items) {
                    const itemType = (item.type || '').toUpperCase();
                    if (digitalSlugs.has(itemType)) {
                        const product = await getProductById(item.productId);
                        if (product) {
                            digitalItems.push({
                                productId: product._id.toString(),
                                title: product.title,
                                type: itemType,
                                thumbnail: product.thumbnail || 'img/vol1-cover.png',
                                filePath: product.filePath || '',
                                purchasedAt: new Date().toISOString()
                            });
                        }
                    }
                }

                if (digitalItems.length > 0) {
                    const searchId = (userId || '').toString();
                    console.log(`📦 [FULFILLMENT] Unlocking ${digitalItems.length} items for ${order.customer.email} (Status change)`);

                    let library = await DigitalLibrary.findOne({ 
                        $or: [{ userId: userId }, { userId: searchId }]
                    });

                    if (!library) {
                        console.log(`✨ [FULFILLMENT] Creating NEW library record...`);
                        library = new DigitalLibrary({ userId: userId, items: [] });
                    }
                    if (!library.items) library.items = [];

                    digitalItems.forEach(di => {
                        const pidStr = di.productId.toString();
                        const alreadyOwned = library.items.some(li => (li.productId || '').toString() === pidStr);
                        
                        if (!alreadyOwned) {
                            library.items.push(di);
                            console.log(`✅ [FULFILLMENT] Added to Library: ${di.title}`);
                        }
                    });

                    library.updatedAt = new Date().toISOString();
                    await library.save();
                    console.log(`💾 [FULFILLMENT] Library updated for user ID: ${searchId}`);
                }
            }
        }

        // 🔔 Notification for Status Change
        if (status !== oldStatus) {
            try {
                let targetCustomer = null;
                if (order.userId) {
                    try {
                        targetCustomer = await User.findById(order.userId);
                    } catch (e) {
                        targetCustomer = null;
                    }
                    if (!targetCustomer) {
                        try {
                            targetCustomer = await User.findOne({ _id: order.userId.toString() }).catch(() => null);
                        } catch (e) {
                            targetCustomer = null;
                        }
                    }
                }
                const customerEmail = order.customer?.email || order.customerEmail || order.email;
                if (!targetCustomer && customerEmail) {
                    try {
                        targetCustomer = await User.findOne({ email: { $regex: new RegExp(`^${customerEmail.trim()}$`, 'i') } });
                    } catch (e) {
                        targetCustomer = null;
                    }
                }

                if (targetCustomer) {
                    if (!targetCustomer.notifications) targetCustomer.notifications = [];

                    let notification = null;
                    const orderIdDisplay = order.orderId || order._id;

                    switch (status) {
                        case 'Cancelled':
                            notification = {
                                _id: 'status-cancel-' + Date.now(),
                                title: 'Order Cancelled by Admin ⚠️',
                                message: `Your order #${orderIdDisplay} has been cancelled by store administration.${note ? ' Note: ' + note : ''}`,
                                type: 'Order',
                                link: 'profile.html?tab=orders',
                                isRead: false,
                                createdAt: new Date().toISOString()
                            };
                            break;
                        case 'Shipped':
                            notification = {
                                _id: 'status-shipped-' + Date.now(),
                                title: 'Order Shipped! 🚚',
                                message: `Your order #${orderIdDisplay} is out for delivery.`,
                                type: 'Order',
                                link: 'profile.html?tab=orders',
                                isRead: false,
                                createdAt: new Date().toISOString()
                            };
                            break;
                        case 'Delivered':
                            notification = {
                                _id: 'status-delivered-' + Date.now(),
                                title: 'Order Delivered! 🎉',
                                message: `Your order #${orderIdDisplay} has been delivered successfully.`,
                                type: 'Order',
                                link: 'profile.html?tab=orders',
                                isRead: false,
                                createdAt: new Date().toISOString()
                            };
                            break;
                    }

                    if (notification) {
                        targetCustomer.notifications.unshift(notification);
                        targetCustomer.markModified('notifications');
                        await targetCustomer.save();
                        console.log(`🔔 Status notification (${status}) sent to customer ${targetCustomer.email}`);
                    }
                }

                // If status is Cancelled, also dispatch customer email
                if (status === 'Cancelled') {
                    const recipientEmail = (targetCustomer && targetCustomer.email) || customerEmail;
                    if (recipientEmail) {
                        const customerName = (targetCustomer && targetCustomer.name) || order.customer?.name || order.customerName || 'Valued Customer';
                        const orderIdDisplay = order.orderId || order._id;
                        const orderAmount = order.totalAmount ? `₹${order.totalAmount}` : '';
                        sendEmail({
                            email: recipientEmail,
                            subject: `Order #${orderIdDisplay} Cancelled by Admin - EFV™`,
                            html: `
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 26px; background: #0c1017; color: #ffffff; border: 1px solid rgba(255, 211, 105, 0.35); border-radius: 14px;">
                                    <div style="text-align: center; margin-bottom: 22px;">
                                        <h2 style="color: #FFD369; margin: 0; font-family: serif; letter-spacing: 2px;">EFV™ ORDER UPDATE</h2>
                                        <p style="color: rgba(255, 255, 255, 0.45); font-size: 0.8rem; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Energy • Frequency • Vibration</p>
                                    </div>
                                    <p style="font-size: 1rem; color: #fff;">Hello <strong>${customerName}</strong>,</p>
                                    <div style="background: rgba(239, 68, 68, 0.12); border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
                                        <div style="font-weight: 700; color: #fca5a5; font-size: 0.95rem; margin-bottom: 4px;">
                                            ⚠️ Order Cancelled by Store Admin
                                        </div>
                                        <div style="color: rgba(255, 255, 255, 0.85); font-size: 0.88rem; line-height: 1.5;">
                                            Your order <strong>#${orderIdDisplay}</strong>${orderAmount ? ` (Total: ${orderAmount})` : ''} has been marked as <strong>Cancelled</strong> by store administration.${note ? `<br><strong>Note:</strong> ${note}` : ''}
                                        </div>
                                    </div>
                                    <p style="line-height: 1.6; color: rgba(255, 255, 255, 0.78); font-size: 0.9rem;">
                                        If eligible, any refund will be processed back to your original payment method in accordance with standard billing timelines.
                                    </p>
                                    <div style="margin: 22px 0; text-align: center;">
                                        <a href="https://efvwebsite-246449377479.asia-south1.run.app/pages/contact.html" style="background: linear-gradient(135deg, #FFD369 0%, #e8b84b 100%); color: #0a0d14; padding: 12px 24px; border-radius: 999px; font-weight: 700; font-size: 0.88rem; text-decoration: none; display: inline-block;">
                                            Contact Support
                                        </a>
                                    </div>
                                    <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); text-align: center;">
                                        EFV™ Store Administration &bull; Automated System Notice
                                    </div>
                                </div>
                            `
                        }).catch(e => console.error("Email send on status cancel failed:", e.message));
                    }
                }

                // 📱 WhatsApp Status Notifications
                try {
                    if (status === 'Shipped') {
                        await whatsappService.sendOrderShipped(order);
                    } else if (status === 'Delivered') {
                        await whatsappService.sendOrderDelivered(order);
                    } else if (status === 'Cancelled') {
                        await whatsappService.sendOrderCancelled(order);
                    }
                } catch (wErr) {
                    console.error('WhatsApp notify error:', wErr);
                }
            } catch (notifyErr) {
                console.error('Error sending status notification:', notifyErr);
            }
        }

        await order.save();
        res.json(order);
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ message: 'Error updating status' });
    }
});

// Track Order (Public/User)
router.get('/track/:id', async (req, res) => {
    try {
        const idParam = String(req.params.id || '').trim();
        const isHexId = /^[0-9a-fA-F]{24}$/.test(idParam);
        const order = await Order.findOne({ orderId: idParam }) || (isHexId ? await Order.findById(idParam) : null);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Convert to POJO to merge data safely
        const orderObj = order.toObject ? order.toObject() : JSON.parse(JSON.stringify(order));

        // If shipment fields are missing, try to find in Shipment collection
        if (!orderObj.awbNumber) {
            try {
                const { Shipment } = require('../models');
                const shipment = await Shipment.findOne({ orderId: order._id.toString() });
                if (shipment) {
                    orderObj.awbNumber = shipment.awbNumber;
                    orderObj.courierName = shipment.courierName;
                    orderObj.trackingLink = shipment.trackingLink;
                    orderObj.shipmentId = shipment.shipmentId;
                }
            } catch (shipErr) {
                console.warn('Shipment lookup fail during track:', shipErr.message);
            }
        }

        // Attempt to sync status from NimbusPost if AWB exists and order is not finalized
        const activeStatuses = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Pending', 'Cancelled'];
        if (orderObj.awbNumber && activeStatuses.includes(orderObj.status)) {
            try {
                const nimbusPostService = require('../services/nimbusPostService');
                const tracking = await nimbusPostService.trackShipment(orderObj.awbNumber);
                if (tracking && tracking.status) {
                    const nStatusRaw = tracking.data?.status_name || tracking.data?.status || tracking.data?.history?.[0]?.status_name || '';
                    const nStatus = nStatusRaw.toLowerCase();
                    
                    let newStatus = null;
                    if (nStatus.includes('cancel')) newStatus = 'Cancelled';
                    else if (nStatus.includes('deliver')) newStatus = 'Delivered';
                    else if (nStatus.includes('return') || nStatus.includes('rtv') || nStatus.includes('rto')) newStatus = 'Returned';
                    else if (nStatus.includes('pick') || nStatus.includes('transit') || nStatus.includes('shipped') || nStatus.includes('dispatch') || nStatus.includes('hub')) newStatus = 'Shipped';
                    else if (nStatus.includes('process') || nStatus.includes('pack')) newStatus = 'Processing';

                    if (newStatus && newStatus !== orderObj.status) {
                        console.log(`🔄 Track Sync: Order ${orderObj.orderId} status ${orderObj.status} -> ${newStatus}`);
                        orderObj.status = newStatus; // Update POJO for response
                        // Also update the actual order in DB
                        order.status = newStatus;
                        order.timeline.push({ 
                            status: newStatus, 
                            note: `Status synced from NimbusPost during track (${nStatus})`,
                            timestamp: new Date()
                        });
                        await order.save();
                    }
                }
            } catch (syncErr) {
                console.warn(`⚠️ Track sync failed for ${orderObj.orderId}:`, syncErr.message);
            }
        }

        res.json(orderObj);
    } catch (error) {
        console.error('Track Error:', error);
        res.status(500).json({ message: 'Error tracking order' });
    }
});

// Track by Order ID alias (supports profile.js and direct tracking)
router.get('/track-by-order/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findOne({ orderId: orderId }) || (orderId.match(/^[0-9a-fA-F]{24}$/) ? await Order.findById(orderId) : null);
        if (!order) {
            return res.status(404).json({ success: false, status: false, message: 'Order not found' });
        }

        let awbNumber = order.awbNumber;
        let courierName = order.courierName;
        let shipmentId = order.shipmentId;
        let shippingStatus = order.status;

        if (!awbNumber) {
            try {
                const { Shipment } = require('../models');
                const shipment = await Shipment.findOne({ orderId: order._id.toString() });
                if (shipment) {
                    awbNumber = shipment.awbNumber;
                    courierName = shipment.courierName;
                    shipmentId = shipment.shipmentId;
                    shippingStatus = shipment.shippingStatus;
                }
            } catch (e) {}
        }

        // Live status sync from Nimbus if AWB exists
        if (awbNumber && ['Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(order.status)) {
            try {
                const nimbusPostService = require('../services/nimbusPostService');
                const tracking = await nimbusPostService.trackShipment(awbNumber);
                if (tracking && tracking.status && tracking.data?.status_name) {
                    const nStatus = tracking.data.status_name.toLowerCase();
                    let newStatus = null;
                    if (nStatus.includes('cancel')) newStatus = 'Cancelled';
                    else if (nStatus.includes('deliver')) newStatus = 'Delivered';
                    else if (nStatus.includes('return') || nStatus.includes('rtv') || nStatus.includes('rto')) newStatus = 'Returned';
                    else if (nStatus.includes('pick') || nStatus.includes('transit') || nStatus.includes('shipped') || nStatus.includes('dispatch') || nStatus.includes('hub')) newStatus = 'Shipped';
                    if (newStatus && newStatus !== order.status) {
                        order.status = newStatus;
                        shippingStatus = newStatus;
                        order.timeline.push({ status: newStatus, note: `Status synced with NimbusPost: ${tracking.data.status_name}`, timestamp: new Date() });
                        await order.save();
                    }
                }
            } catch (syncErr) {}
        }

        const data = {
            orderId: order.orderId,
            status: order.status,
            shippingStatus: shippingStatus || order.status,
            awbNumber: awbNumber || null,
            courierName: courierName || null,
            shipmentId: shipmentId || null,
            trackingLink: order.trackingLink || null,
            items: order.items,
            totalAmount: order.totalAmount,
            timeline: order.timeline || []
        };

        return res.json({
            success: true,
            status: order.status,
            data
        });
    } catch (error) {
        console.error('Track-by-order route error:', error);
        return res.status(500).json({ success: false, status: false, message: 'Error tracking order' });
    }
});

// --- NEW: TEST MODE DIGITAL PURCHASE ---
// Directly creates an order as PAID and Adds to Library
router.post('/test-digital', protect, async (req, res) => {
    try {
        const { productId, price, name, type } = req.body; // type should be 'EBOOK' or 'AUDIOBOOK'
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // 1. Find Product
        // IMPORTANT: In JSON DB mode, IDs are strings like 'efv_v1_ebook'.
        // mongoose.Types.ObjectId.isValid() returns FALSE for these, so we CANNOT
        // use that check as a gate. Try findById for ALL productIds first.
        let product = null;

        // Step 1a: Try direct ID lookup (works for both string and ObjectId formats)
        product = await getProductById(productId.toString());

        // Step 1b: If not found, try demoMap with simple string matching (JSON-safe)
        if (!product) {
            // Simple mapping: productId -> { type, titleFragment }
            const demoMap = {
                'efv_v1_ebook': { type: 'EBOOK', titleFragment: 'ORIGIN CODE' },
                'efv_v1_audiobook': { type: 'AUDIOBOOK', titleFragment: 'ORIGIN CODE' },
                'efv_v1_ebook_en': { type: 'EBOOK', titleFragment: 'THE ORIGIN CODE' },
                'efv_v1_audiobook_en': { type: 'AUDIOBOOK', titleFragment: 'THE ORIGIN CODE' },
                'efv_v2_ebook': { type: 'EBOOK', titleFragment: 'MINDOS' },
                'efv_v2_audiobook': { type: 'AUDIOBOOK', titleFragment: 'MINDOS' }
            };

            const spec = demoMap[productId];
            if (spec) {
                // JSON adapter supports regex in find(), use it
                product = await Product.findOne({
                    title: new RegExp(spec.titleFragment, 'i'),
                    type: spec.type
                });
            }
        }

        // Step 1c: Last resort - search by name sent from frontend
        if (!product && name) {
            product = await Product.findOne({ title: new RegExp(name.replace(/[™®]/g, '').trim(), 'i'), type: type });
        }

        if (!product) {
            console.error(`❌ Product not found for ID: ${productId}, name: ${name}, type: ${type}`);
            return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
        }

        console.log(`✅ Product found: ${product.title} (${product.type}) ID: ${product._id}`);


        // 2. Create Order (Simulate Paid)
        const orderId = 'ORD-TEST-' + Date.now().toString().slice(-6);
        const newOrder = await Order.create({
            orderId: orderId,
            customer: {
                name: user.name,
                email: user.email,
                phone: user.phone || '0000000000',
                address: { street: 'Digital Purchase', city: 'Internet', zip: '000000' }
            },
            items: [{
                productId: product._id,
                title: product.title,
                type: product.type, // Ensure DB type is used (EBOOK/AUDIOBOOK)
                price: price || product.price,
                quantity: 1
            }],
            totalAmount: price || product.price,
            paymentMethod: 'DIGITAL_TEST',
            paymentStatus: 'Paid',
            status: 'Delivered', // Immediate delivery for digital
            paymentId: 'DIG-' + orderId,
            timeline: [{ status: 'Delivered', note: 'Digital Item Unlocked (Test Mode)' }]
        });

        // 3. Update User Profile (Add to purchasedProducts)
        const prodIdStr = product._id.toString();
        const mongoUser = await User.findById(user._id);
        if (mongoUser) {
            if (!mongoUser.purchasedProducts) mongoUser.purchasedProducts = [];
            const isAlreadyPurchased = mongoUser.purchasedProducts.some(id => id.toString() === prodIdStr);
            if (!isAlreadyPurchased) {
                mongoUser.purchasedProducts.push(prodIdStr);
            }
            mongoUser.markModified('purchasedProducts');
            await mongoUser.save();
        }

        // 4. Update Digital Library
        const resolvedUserId = user._id || user.id;
        const searchIdStr = (resolvedUserId || '').toString();
        let library = await DigitalLibrary.findOne({ 
            $or: [{ userId: resolvedUserId }, { userId: searchIdStr }]
        });
        if (!library) {
            library = new DigitalLibrary({
                userId: resolvedUserId,
                items: [{
                    productId: product._id.toString(),
                    title: product.title,
                    type: product.type === 'AUDIOBOOK' ? 'Audiobook' : 'E-Book',
                    thumbnail: product.thumbnail || 'img/vol1-cover.png',
                    filePath: product.filePath || '',
                    purchasedAt: new Date().toISOString()
                }]
            });
        } else {
            if (!library.items) library.items = [];
            const alreadyInLib = library.items.some(i => (i.productId || '').toString() === product._id.toString());
            if (!alreadyInLib) {
                library.items.push({
                    productId: product._id.toString(),
                    title: product.title,
                    type: product.type === 'AUDIOBOOK' ? 'Audiobook' : 'E-Book',
                    thumbnail: product.thumbnail || 'img/vol1-cover.png',
                    filePath: product.filePath || '',
                    purchasedAt: new Date().toISOString()
                });
            }
        }
        await library.save();

        // 🔔 Add Purchase Notification (Test Mode)
        try {
            const mongoUser2 = await User.findById(user._id);
            if (mongoUser2) {
                if (!mongoUser2.notifications) mongoUser2.notifications = [];
                mongoUser2.notifications.unshift({
                    _id: 'purchase-test-' + Date.now(),
                    title: 'Item Unlocked! 🔓',
                    message: `"${product.title}" has been successfully added to your library.`,
                    type: 'Order',
                    link: 'profile.html?tab=library',
                    isRead: false,
                    createdAt: new Date().toISOString()
                });
                mongoUser2.markModified('notifications');
                await mongoUser2.save();
            }
        } catch (noteErr) {
            console.error('Test purchase notification error:', noteErr);
        }

        sendOrderNotificationEmail(newOrder).catch(err => console.error("Notification email error:", err));
        res.status(200).json({
            success: true,
            message: 'Test Purchase Successful',
            orderId: newOrder.orderId,
            libraryUpdated: true
        });

    } catch (error) {
        console.error("Test Digital Purchase Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// ============================================================
// NIMBUSPOST WEBHOOK (Automatic Status Updates)
// ============================================================
router.post('/nimbus-webhook', async (req, res) => {
    try {
        const { awb, status_name } = req.body;
        console.log(`📡 NimbusPost Webhook: AWB ${awb}, Status ${status_name}`);
        
        if (awb) {
            const order = await Order.findOne({ awbNumber: awb });
            if (order) {
                const lowerStatus = (status_name || '').toLowerCase();
                let newStatus = null;
                if (lowerStatus.includes('cancel')) newStatus = 'Cancelled';
                else if (lowerStatus.includes('deliver')) newStatus = 'Delivered';
                else if (lowerStatus.includes('return')) newStatus = 'Returned';
                else if (lowerStatus.includes('pick') || lowerStatus.includes('transit') || lowerStatus.includes('shipped')) newStatus = 'Shipped';

                if (newStatus && newStatus !== order.status) {
                    console.log(`✅ Webhook Sync: Order ${order.orderId} -> ${newStatus}`);
                    order.status = newStatus;
                    order.timeline.push({ 
                        status: newStatus, 
                        note: `Status updated automatically via NimbusPost Webhook (${status_name})`,
                        timestamp: new Date()
                    });
                    await order.save();

                    // 📱 WhatsApp Notify via Webhook Sync
                    try {
                        if (newStatus === 'Shipped') await whatsappService.sendOrderShipped(order);
                        else if (newStatus === 'Delivered') await whatsappService.sendOrderDelivered(order);
                        else if (newStatus === 'Cancelled') await whatsappService.sendOrderCancelled(order);
                    } catch (e) {}
                }
            }
        }
        res.status(200).send('OK');
    } catch (err) {
        console.error('❌ Webhook Error:', err);
        res.status(500).send('Error');
    }
});


// ============================================================
// CANCEL ORDER ROUTE (User + Admin)
// ============================================================
router.post('/cancel/:orderId', protect, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const nimbusPostService = require('../services/nimbusPostService');
        const { OrderCancellation } = require('../models');

        // Fetch order
        const order = await Order.findOne({ orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Security: Only owner or admin can cancel
        const userEmailLower = (req.user?.email || '').toLowerCase().trim();
        const isAdmin = req.user.role === 'admin' || userEmailLower === 'admin@uwo24.com' || userEmailLower === 'efv@uwo24.com';
        const isOwner = order.userId?.toString() === req.user._id?.toString() ||
            order.customer?.email?.toLowerCase() === req.user.email?.toLowerCase();
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Unauthorized to cancel this order' });
        }

        // Shipment Status Check — cannot cancel if already picked up
        const blockedStatuses = ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
        if (blockedStatuses.includes(order.status)) {
            return res.status(400).json({
                message: 'Order already picked up. Cancellation is no longer available.'
            });
        }

        // Already cancelled? (Only block if totally finalized, but allow retry for Nimbus sync)
        if (order.status === 'Cancelled' && !order.awbNumber) {
            return res.status(400).json({ message: 'Order is already cancelled.' });
        }

        // Step 1: Cancel on NimbusPost if AWB exists
        let nimbusResult = null;
        if (order.awbNumber) {
            nimbusResult = await nimbusPostService.cancelShipment(order.awbNumber);
            if (!nimbusResult.status) {
                console.warn(`⚠️ NimbusPost cancel failed for ${order.awbNumber}: ${nimbusResult.message}`);
                // We proceed with DB cancellation anyway to avoid blocking user
            }
        }

        // Step 2: Update order status to Cancelled
        order.status = 'Cancelled';
        order.timeline.push({
            status: 'Cancelled',
            note: reason || (isAdmin ? 'Cancelled by admin' : 'Cancelled by user'),
            timestamp: new Date()
        });
        await order.save();

        // Step 3: Save cancellation record
        await OrderCancellation.create({
            orderId: order.orderId,
            userId: req.user._id,
            reason: reason || (isAdmin ? 'Admin cancelled order' : 'User requested cancellation'),
            cancelledAt: new Date()
        });

        // Step 4: Send notification to the CUSTOMER who owns the order
        let targetCustomer = null;
        if (order.userId) {
            try {
                targetCustomer = await User.findById(order.userId);
            } catch (e) {
                targetCustomer = null;
            }
            if (!targetCustomer) {
                try {
                    targetCustomer = await User.findOne({ _id: order.userId.toString() }).catch(() => null);
                } catch (e) {
                    targetCustomer = null;
                }
            }
        }
        const customerEmail = order.customer?.email || order.customerEmail || order.email;
        if (!targetCustomer && customerEmail) {
            try {
                targetCustomer = await User.findOne({ email: { $regex: new RegExp(`^${customerEmail.trim()}$`, 'i') } });
            } catch (e) {
                targetCustomer = null;
            }
        }

        // 🔒 Revoke any digital access associated with this cancelled order
        if (order && order.orderId) {
            try {
                await DigitalLibrary.updateMany(
                    { 'items.orderId': order.orderId },
                    { $pull: { items: { orderId: order.orderId } } }
                );
            } catch (e) {
                console.warn('Could not revoke digital library items on cancel:', e.message);
            }
        }

        const cancelledByAdmin = isAdmin && (!isOwner || req.user.role === 'admin');
        const notifTitle = cancelledByAdmin ? 'Order Cancelled by Admin ⚠️' : 'Order Cancelled';
        const notifMsg = cancelledByAdmin
            ? `Your order #${order.orderId} was cancelled by store administration.${reason ? ' Reason: ' + reason : ''}. If eligible, refund will be processed within 5–7 business days.`
            : `Your order #${order.orderId} has been cancelled. Refund (if applicable) will be processed within 5–7 business days.`;

        if (targetCustomer) {
            if (!targetCustomer.notifications) targetCustomer.notifications = [];
            targetCustomer.notifications.unshift({
                _id: 'cancel-' + Date.now(),
                title: notifTitle,
                message: notifMsg,
                type: 'Order',
                link: 'profile.html?tab=orders',
                isRead: false,
                createdAt: new Date().toISOString()
            });
            targetCustomer.markModified('notifications');
            await targetCustomer.save();
            console.log(`🔔 Cancellation notification sent to customer ${targetCustomer.email}`);
        }

        // Also send transactional email to customer
        const recipientEmail = (targetCustomer && targetCustomer.email) || customerEmail;
        if (recipientEmail) {
            const customerName = (targetCustomer && targetCustomer.name) || order.customer?.name || order.customerName || 'Valued Customer';
            const orderAmount = order.totalAmount ? `₹${order.totalAmount}` : '';
            sendEmail({
                email: recipientEmail,
                subject: `Order #${order.orderId} Cancelled${cancelledByAdmin ? ' by Admin' : ''} - EFV™`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 26px; background: #0c1017; color: #ffffff; border: 1px solid rgba(255, 211, 105, 0.35); border-radius: 14px;">
                        <div style="text-align: center; margin-bottom: 22px;">
                            <h2 style="color: #FFD369; margin: 0; font-family: serif; letter-spacing: 2px;">EFV™ ORDER UPDATE</h2>
                            <p style="color: rgba(255, 255, 255, 0.45); font-size: 0.8rem; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Energy • Frequency • Vibration</p>
                        </div>
                        <p style="font-size: 1rem; color: #fff;">Hello <strong>${customerName}</strong>,</p>
                        <div style="background: rgba(239, 68, 68, 0.12); border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
                            <div style="font-weight: 700; color: #fca5a5; font-size: 0.95rem; margin-bottom: 4px;">
                                ⚠️ Order Cancelled${cancelledByAdmin ? ' by Store Admin' : ''}
                            </div>
                            <div style="color: rgba(255, 255, 255, 0.85); font-size: 0.88rem; line-height: 1.5;">
                                Your order <strong>#${order.orderId}</strong>${orderAmount ? ` (Total: ${orderAmount})` : ''} has been cancelled${cancelledByAdmin ? ' by store administration' : ''}.${reason ? `<br><strong>Reason:</strong> ${reason}` : ''}
                            </div>
                        </div>
                        <p style="line-height: 1.6; color: rgba(255, 255, 255, 0.78); font-size: 0.9rem;">
                            If your order was paid online, any eligible refund will be credited back to your original payment method in accordance with standard billing timelines (5–7 business days).
                        </p>
                        <div style="margin: 22px 0; text-align: center;">
                            <a href="https://efvwebsite-246449377479.asia-south1.run.app/pages/contact.html" style="background: linear-gradient(135deg, #FFD369 0%, #e8b84b 100%); color: #0a0d14; padding: 12px 24px; border-radius: 999px; font-weight: 700; font-size: 0.88rem; text-decoration: none; display: inline-block;">
                                Contact Support
                            </a>
                        </div>
                        <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); text-align: center;">
                            EFV™ Store Administration &bull; Automated System Notice
                        </div>
                    </div>
                `
            }).catch(e => console.error("Email send on cancellation failed:", e.message));
        }

        // 📱 WhatsApp Cancellation Notify
        try {
            await whatsappService.sendOrderCancelled(order, reason);
        } catch (wErr) {
            console.error('WhatsApp cancel error:', wErr);
        }

        res.json({
            success: true,
            message: 'Your order has been cancelled successfully.',
            nimbusStatus: nimbusResult?.status ? 'Shipment cancelled on NimbusPost' : 'Manual DB cancel (NimbusPost may need manual update)'
        });

    } catch (error) {
        console.error('Cancel Order Error:', error);
        res.status(500).json({ message: 'Server error while cancelling order' });
    }
});

// DELETE AN ORDER (Admin or Owner for cancelled orders)
router.delete('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Security check: Only admin or owner
        const userEmailLower = (req.user?.email || '').toLowerCase().trim();
        const isAdmin = req.user.role === 'admin' || userEmailLower === 'admin@uwo24.com' || userEmailLower === 'efv@uwo24.com';
        if (order.userId !== req.user._id && !isAdmin) {
            return res.status(403).json({ message: 'Unauthorized action' });
        }

        // Restriction: Only delete cancelled/failed/pending orders unless admin
        const deletableStatuses = ['Cancelled', 'Failed', 'Pending', 'Payment Failed'];
        if (!deletableStatuses.includes(order.status) && !isAdmin) {
             return res.status(400).json({ message: 'Active orders cannot be deleted. Cancel them first.' });
        }

        const orderIdDisplay = order.orderId || order._id;
        const customerEmail = order.customer?.email || order.customerEmail || order.email;
        const customerName = order.customer?.name || order.customerName || order.name || 'Valued Customer';
        const orderAmount = order.totalAmount ? `₹${order.totalAmount}` : '';

        // 🔔 If deleted by Admin, send Notification to the user (In-App Inbox + Email)
        if (isAdmin) {
            try {
                let targetUser = null;
                if (order.userId) {
                    try {
                        targetUser = await User.findById(order.userId);
                    } catch (e) {
                        targetUser = null;
                    }
                    if (!targetUser) {
                        try {
                            targetUser = await User.findOne({ _id: order.userId.toString() }).catch(() => null);
                        } catch (e) {
                            targetUser = null;
                        }
                    }
                }
                if (!targetUser && customerEmail) {
                    try {
                        targetUser = await User.findOne({ email: { $regex: new RegExp(`^${customerEmail.trim()}$`, 'i') } });
                    } catch (e) {
                        targetUser = null;
                    }
                }

                // 1. In-App Notification in user's profile
                if (targetUser) {
                    if (!targetUser.notifications) targetUser.notifications = [];
                    targetUser.notifications.unshift({
                        _id: 'order-del-' + Date.now(),
                        title: 'Order Deleted by Admin ⚠️',
                        message: `Your order #${orderIdDisplay}${orderAmount ? ' (' + orderAmount + ')' : ''} has been cancelled and removed by store administration. Contact support if you need assistance.`,
                        type: 'Order',
                        link: 'profile.html?tab=orders',
                        isRead: false,
                        createdAt: new Date().toISOString()
                    });
                    targetUser.markModified('notifications');
                    await targetUser.save();
                    console.log(`🔔 In-App notification sent to user ${targetUser.email} for deleted order #${orderIdDisplay}`);
                }

                // 2. Email Notification to Customer
                const recipientEmail = (targetUser && targetUser.email) || customerEmail;
                if (recipientEmail) {
                    sendEmail({
                        email: recipientEmail,
                        subject: `Important Update: Order #${orderIdDisplay} Removed - EFV™`,
                        html: `
                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 26px; background: #0c1017; color: #ffffff; border: 1px solid rgba(255, 211, 105, 0.35); border-radius: 14px;">
                                <div style="text-align: center; margin-bottom: 22px;">
                                    <h2 style="color: #FFD369; margin: 0; font-family: serif; letter-spacing: 2px;">EFV™ ORDER UPDATE</h2>
                                    <p style="color: rgba(255, 255, 255, 0.45); font-size: 0.8rem; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Energy • Frequency • Vibration</p>
                                </div>
                                <p style="font-size: 1rem; color: #fff;">Hello <strong>${customerName}</strong>,</p>
                                <div style="background: rgba(239, 68, 68, 0.12); border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
                                    <div style="font-weight: 700; color: #fca5a5; font-size: 0.95rem; margin-bottom: 4px;">
                                        ⚠️ Order Cancelled & Removed
                                    </div>
                                    <div style="color: rgba(255, 255, 255, 0.85); font-size: 0.88rem; line-height: 1.5;">
                                        Your order <strong>#${orderIdDisplay}</strong>${orderAmount ? ` (Total: ${orderAmount})` : ''} has been cancelled and deleted from our records by store administration.
                                    </div>
                                </div>
                                <p style="line-height: 1.6; color: rgba(255, 255, 255, 0.78); font-size: 0.9rem;">
                                    If this order was paid online, any eligible refund will be credited in accordance with standard billing timelines. If you have questions or believe this was done in error, please reach out to our support team.
                                </p>
                                <div style="margin: 22px 0; text-align: center;">
                                    <a href="https://efvwebsite-246449377479.asia-south1.run.app/pages/contact.html" style="background: linear-gradient(135deg, #FFD369 0%, #e8b84b 100%); color: #0a0d14; padding: 12px 24px; border-radius: 999px; font-weight: 700; font-size: 0.88rem; text-decoration: none; display: inline-block;">
                                        Contact Support
                                    </a>
                                </div>
                                <div style="margin-top: 28px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); text-align: center;">
                                    © 2026 EFV™ System • Unified Web Options
                                </div>
                            </div>
                        `
                    }).catch(emailErr => console.error('Failed to send order deletion email:', emailErr.message));
                }
            } catch (notifyErr) {
                console.error('Order deletion notification error:', notifyErr);
            }
        }

        // 🔒 Revoke any digital access associated with this deleted order
        if (order && order.orderId) {
            try {
                await DigitalLibrary.updateMany(
                    { 'items.orderId': order.orderId },
                    { $pull: { items: { orderId: order.orderId } } }
                );
            } catch (e) {
                console.warn('Could not revoke digital library items on delete:', e.message);
            }
        }

        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Order record deleted successfully' });
    } catch (error) {
        console.error('Delete Order Error:', error);
        res.status(500).json({ message: 'Error deleting order record' });
    }
});

// ── RAZORPAY ────────────────────────────────────────────────────────────────

// Create Razorpay Order
router.post('/razorpay', protect, async (req, res) => {
    try {
        const { amount, currency, customerName, customerEmail, customerPhone } = req.body;
        if (!amount) return res.status(400).json({ message: 'Amount is required' });

        const receipt = `EFV-RZP-${Date.now()}`;
        const rzpOrder = await createRazorpayOrder({
            amount : Number(amount),   // amount in major units (₹ or $) – util converts to smallest unit
            currency: currency || 'INR', // pass USD/GBP/EUR etc. for international orders
            receipt: receipt,
            notes  : {
                customerName : customerName  || req.user.name,
                customerEmail: customerEmail || req.user.email,
                customerPhone: customerPhone || req.user.phone || ''
            }
        });

        res.json({
            rzpOrderId: rzpOrder.id,
            amount    : rzpOrder.amount,   // smallest unit (paise/cents)
            currency  : rzpOrder.currency,
            receipt   : rzpOrder.receipt
        });
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({
            message: 'Failed to create Razorpay order',
            error  : error.error ? error.error : error.message
        });
    }
});

// Verify Razorpay Payment & Fulfill Order
router.post('/verify-razorpay', protect, async (req, res) => {
    try {
        const digitalSlugs = await getDigitalSlugs();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            customer: directCustomer,
            items   : directItems,
            couponCode,
            shippingCharge,
            codCharge,
            offerId,
            language,
            paymentCurrency,
            locale
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing Razorpay payment fields' });
        }

        // 1. Verify signature
        const isValid = verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            console.warn(`⚠️ Razorpay Signature Mismatch for order: ${razorpay_order_id}`);
            return res.status(400).json({ message: 'Payment signature verification failed' });
        }

        // 2. Prevent duplicate fulfillment
        const existingOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        if (existingOrder) {
            return res.status(200).json({
                success: true,
                order  : existingOrder,
                message: 'Order was already processed successfully'
            });
        }

        // 3. Extra server-side check: fetch payment status from Razorpay
        const payment = await fetchRazorpayPayment(razorpay_payment_id);
        if (payment.status !== 'captured') {
            return res.status(400).json({ message: `Payment not captured. Status: ${payment.status}` });
        }

        console.log(`✅ Razorpay Payment Verified: ${razorpay_payment_id} for order ${razorpay_order_id}`);

        // 4. Build address & items
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const address = directCustomer ? {
            fullName: directCustomer.name,
            email   : directCustomer.email,
            phone   : directCustomer.phone    || user.phone || '0000000000',
            house   : directCustomer.street   || directCustomer.address || '',
            area    : directCustomer.area     || '',
            city    : directCustomer.city     || 'Unknown',
            state   : directCustomer.state    || '',
            pincode : directCustomer.pincode  || '000000',
            country : directCustomer.country  || 'India'
        } : null;

        if (!address) return res.status(400).json({ message: 'Shipping address missing' });

        const finalItems = directItems || [];
        if (finalItems.length === 0) return res.status(400).json({ message: 'No items in order' });

        let totalAmount = 0;
        const orderItems = [];

        for (const item of finalItems) {
            const product = await getProductById(item.id || item.productId);
            if (!product) continue;
            const sellingPrice = product.price * (1 - (product.discount || 0) / 100);
            totalAmount += sellingPrice * item.quantity;
            orderItems.push({
                productId: product._id,
                title    : product.title,
                type     : product.type,
                price    : sellingPrice,
                quantity : item.quantity
            });
        }

        if (orderItems.length === 0) return res.status(400).json({ message: 'No valid products found' });

        const physicalCheckItems = orderItems.filter(i => !digitalSlugs.has((i.type || '').toUpperCase()));
        if (physicalCheckItems.length > 0) {
            const postalVal = validatePostalCode(address.pincode, address.country, true);
            if (!postalVal.isValid) {
                console.warn(`⚠️ Invalid postal code for Razorpay verification:`, postalVal.error);
                return res.status(400).json({ message: postalVal.error });
            }
            if (postalVal.normalized) {
                address.pincode = postalVal.normalized;
            }
        }

        // 5. Coupon logic (mirrors Cashfree flow)
        let discountAmount = 0;
        let partnerRef = null;
        let appliedCouponCode = '';

        if (couponCode) {
            const cleanedCode = (couponCode || '').trim().toUpperCase();
            console.log(`🔍 [VERIFY-RZP] Checking coupon: "${cleanedCode}"`);
            const coupon = await Coupon.findOne({ code: cleanedCode, isActive: true });
            if (coupon) {
                console.log(`✅ [VERIFY-RZP] Coupon found: ${coupon.code}. isPartner: ${coupon.isPartnerCoupon}`);
                const isExpired       = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                const isUnderMin      = totalAmount < (coupon.minOrder || 0);
                const isLimitReached  = (coupon.usedCount || 0) >= (coupon.usageLimit || 1000);

                if (!isExpired && !isUnderMin && !isLimitReached) {
                    discountAmount = coupon.type === 'Percentage'
                        ? (totalAmount * (coupon.value || 0)) / 100
                        : (coupon.value || 0);
                    discountAmount    = Math.min(discountAmount, totalAmount);
                    appliedCouponCode = coupon.code;
                    
                    // Safe increment
                    coupon.usedCount = (coupon.usedCount || 0) + 1;
                    await coupon.save();

                    if (coupon.isPartnerCoupon && coupon.partnerId) {
                        partnerRef = {
                            partnerId       : coupon.partnerId.toString(),
                            partnerName     : coupon.partnerName || 'Unknown Partner',
                            couponCode      : coupon.code,
                            commissionPercent: (coupon.commissionPercent || 0),
                            commissionAmount : Math.round((totalAmount * (coupon.commissionPercent || 0)) / 100),
                            commissionPaid  : false
                        };
                        console.log(`💰 [VERIFY-RZP] Partner Ref Attached: ${partnerRef.partnerName} (${partnerRef.partnerId})`);
                    }
                } else {
                    console.log(`⚠️ [VERIFY-RZP] Coupon ${coupon.code} failed checks: Expired=${isExpired}, UnderMin=${isUnderMin}, LimitReached=${isLimitReached}`);
                }
            } else {
                console.log(`❌ [VERIFY-RZP] Coupon "${cleanedCode}" not found or inactive`);
            }
        }

        const sCharge = Number(shippingCharge) || 0;
        const cCharge = Number(codCharge)      || 0;
        
        // Items Subtotal Calculation
        const itemsSubtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // TRUST THE PAYMENT GATEWAY: The amount the user actually paid
        const actualPaidAmount = Math.round(payment.amount / 100); 
        
        // Calculate Tax (18% GST implied by UI)
        const taxableVal = actualPaidAmount / 1.18;
        const calcTax = actualPaidAmount - taxableVal;

        const dynamicDiscount = await calculateBackendDynamicDiscounts(finalItems);
        const offerResult = await calculateBackendOfferDiscounts(finalItems, offerId);
        const offerDiscount = offerResult.totalDiscountAmount;
        const appliedOffer = offerResult.appliedOffer;
        // Finalize Discount: Difference between theoretical total and actual paid
        // theories = itemsSubtotal + sCharge + cCharge (we assume sCharge/cCharge were already part of the RZP order)
        let totalDiscount = 0;
        if (appliedCouponCode || dynamicDiscount > 0 || offerDiscount > 0) {
            totalDiscount = (itemsSubtotal + sCharge) - actualPaidAmount;
            if (totalDiscount < 0) totalDiscount = 0;
        }

        const isPurelyDigital = orderItems.every(i => digitalSlugs.has((i.type || '').toUpperCase()));

        // 6. Create Order record
        const newOrder = await Order.create({
            orderId         : 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000),
            userId          : user._id,
            customer: {
                name   : address.fullName || user.name,
                email  : address.email    || user.email,
                phone  : address.phone    || user.phone || '0000000000',
                address: address,
                city   : address.city     || '',
                zip    : address.pincode  || ''
            },
            items           : orderItems,
            subtotal        : Math.round(itemsSubtotal),
            taxAmount       : Math.round(calcTax),
            totalAmount     : actualPaidAmount,
            shippingCharges : sCharge,
            codCharges      : cCharge,
            discountAmount  : Math.round(totalDiscount),
            couponCode      : appliedCouponCode,
            partnerRef      : partnerRef,
            offerId: appliedOffer ? appliedOffer.id : '',
            offerName: appliedOffer ? appliedOffer.name : '',
            offerDiscountApplied: offerDiscount,
            offerOriginalAmount: itemsSubtotal,
            offerFinalAmount: actualPaidAmount,
            offerType: appliedOffer ? appliedOffer.type : '',
            purchasedThroughOffer: appliedOffer ? 'Yes' : 'No',
            offerSavings: offerDiscount,
            paymentMethod   : 'Razorpay',
            paymentStatus   : 'Paid',
            status          : isPurelyDigital ? 'Completed (Digital)' : 'Processing',
            orderType       : isPurelyDigital ? 'digital' : 'physical',
            language        : language || 'en',
            paymentCurrency : paymentCurrency || (payment ? payment.currency : 'INR'),
            locale          : locale || 'en-IN',
            razorpayOrderId : razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            timeline        : [{
                status: isPurelyDigital ? 'Completed (Digital)' : 'Paid',
                note  : isPurelyDigital
                    ? 'Digital Product Purchased & Unlocked'
                    : `Payment verified via Razorpay (${razorpay_payment_id})`
            }]
        });

        if (appliedOffer) {
            try {
                const offerDoc = await Offer.findById(appliedOffer.id);
                if (offerDoc) {
                    if (!offerDoc.analytics) {
                        offerDoc.analytics = { views: 0, claims: 0, orders: 1, revenue: offerDiscount };
                    } else {
                        offerDoc.analytics.orders = (offerDoc.analytics.orders || 0) + 1;
                        offerDoc.analytics.revenue = (offerDoc.analytics.revenue || 0) + offerDiscount;
                    }
                    await offerDoc.save();
                }

                let analytics = await OfferAnalytics.findOne({ offerId: appliedOffer.id });
                if (!analytics) {
                    await OfferAnalytics.create({
                        offerId: appliedOffer.id,
                        views: 0,
                        claims: 0,
                        orders: 1,
                        revenue: offerDiscount
                    });
                } else {
                    analytics.orders = (analytics.orders || 0) + 1;
                    analytics.revenue = (analytics.revenue || 0) + offerDiscount;
                    await analytics.save();
                }
            } catch (e) {
                console.error("Error updating OfferAnalytics for order placement (Razorpay):", e);
            }
        }

        // 7. Unlock Digital Items (ROBUST FULFILLMENT)
        const digitalItems = [];
        for (const item of orderItems) {
            const iType = (item.type || '').toUpperCase();
            if (digitalSlugs.has(iType)) {
                console.log(`🔑 [UNLOCK] Processing Digital Item: ${item.title} (${item.productId})`);
                
                let product = await getProductById(item.productId);
                if (!product) {
                    // Fallback to title matching if ID is different (common in seed data)
                    const cleanTitle = (item.title || '').replace(/\(.*\)/, '').replace(/[™®]/g, '').trim();
                    product = await Product.findOne({ title: new RegExp(cleanTitle, 'i') });
                }

                if (product) {
                    digitalItems.push({
                        productId   : product._id,
                        title       : product.title,
                        type        : iType,
                        thumbnail   : product.thumbnail,
                        filePath    : product.filePath,
                        purchasedAt : new Date(),
                        orderId     : newOrder.orderId,
                        accessStatus: 'active'
                    });
                } else {
                    console.warn(`⚠️ [UNLOCK] Product not found in marketplace for: ${item.title}`);
                }
            }
        }

        if (digitalItems.length > 0) {
            // Standardize UserID lookup (support both ObjectId and String)
            const resolvedUserId = user._id || user.id;
            const searchId = (resolvedUserId || '').toString();
            
            console.log(`📦 [UNLOCK] Unlocking ${digitalItems.length} items for ${user.email} (UserID: ${searchId})`);

            let library = await DigitalLibrary.findOne({ 
                $or: [{ userId: resolvedUserId }, { userId: searchId }]
            });

            if (!library) {
                console.log(`✨ [UNLOCK] Creating NEW library record for ${user.email}...`);
                library = new DigitalLibrary({ userId: resolvedUserId, items: [] });
            }
            if (!library.items) library.items = [];

            digitalItems.forEach(di => {
                const pidStr = di.productId.toString();
                const alreadyOwned = library.items.some(li => (li.productId || '').toString() === pidStr);
                
                if (!alreadyOwned) {
                    library.items.push(di);
                    console.log(`✅ [UNLOCK] Added to Library: ${di.title}`);
                }
            });

            library.updatedAt = new Date().toISOString();
            await library.save();
            console.log(`💾 [UNLOCK] Successfully saved library for ${user.email}`);
        }

        // 8. Notification
        try {
            if (!user.notifications) user.notifications = [];
            user.notifications.unshift({
                _id    : 'purchase-rzp-' + Date.now(),
                title  : isPurelyDigital ? 'Content Unlocked! 📖' : 'Purchase Successful! 🎉',
                message: isPurelyDigital
                    ? `Your digital products from order #${newOrder.orderId} are now available in My Library.`
                    : `Thank you for your order ${newOrder.orderId}. Your items are being processed.`,
                type   : 'Order',
                link   : isPurelyDigital ? 'profile.html?tab=library' : 'profile.html?tab=orders',
                isRead : false,
                createdAt: new Date().toISOString()
            });
            user.updatedAt = new Date().toISOString();
            await user.save();
        } catch (noteErr) {}

        // 9. Auto-Shipping for Physical Items
        const physicalItems = orderItems.filter(i => {
            const t = (i.type || '').toUpperCase();
            return ['HARDCOVER', 'PAPERBACK', 'PHYSICAL'].includes(t);
        });
        if (physicalItems.length > 0) {
            try {
                const { Shipment } = require('../models');
                const deliveryCountry = (address.country || '').trim().toLowerCase();
                const isIndia = deliveryCountry === 'india' || deliveryCountry === 'in' || !deliveryCountry;
                
                if (isIndia) {
                    const nimbusPostService = require('../services/nimbusPostService');
                    if (isJabalpurOrder(address)) {
                        newOrder.fulfillmentProvider = 'ADMIN';
                        newOrder.status = 'Local Delivery';
                        newOrder.timeline.push({ status: 'Local Delivery', note: 'Order assigned for local delivery in Jabalpur. Nimbus bypassed.' });
                        await newOrder.save();
                    } else {
                        newOrder.fulfillmentProvider = 'NIMBUS';
                        const shipResult = await nimbusPostService.automateShipping(newOrder, address, physicalItems, 'prepaid');

                        if (shipResult.status) {
                            newOrder.shipmentId   = shipResult.shipmentId;
                            newOrder.awbNumber    = shipResult.awbNumber;
                            newOrder.courierName  = shipResult.courierName;
                            newOrder.trackingLink = shipResult.trackingLink;
                            newOrder.labelUrl     = shipResult.labelUrl;
                            newOrder.timeline.push({ status: 'Shipped', note: `Shipment automated via ${shipResult.courierName}. AWB: ${shipResult.awbNumber}` });
                            await newOrder.save();
                            await Shipment.create({
                                orderId       : newOrder._id.toString(),
                                shipmentId    : shipResult.shipmentId,
                                awbNumber     : shipResult.awbNumber,
                                courierName   : shipResult.courierName,
                                labelUrl      : shipResult.labelUrl,
                                trackingLink  : shipResult.trackingLink,
                                shippingStatus: 'Processing'
                            });
                        } else {
                            console.warn(`⚠️ Nimbus Razorpay Automation Failed for ${newOrder.orderId}:`, shipResult.message);
                            newOrder.timeline.push({ status: 'Processing', note: 'Auto-shipping failed: ' + shipResult.message });
                            await newOrder.save();
                        }
                    }
                } else {
                    newOrder.fulfillmentProvider = 'LULU';
                    // Lulu international shipping via Django service
                    console.log(`🌐 Routing Order #${newOrder.orderId} to Lulu POD...`);
                    // Format line items dynamically from product database records
                    const luluLineItems = await formatLuluLineItems(physicalItems);
                    const countryCode = resolveLuluCountryCode(address.country);

                    // Check if country is supported by Lulu
                    const luluUnsupportedCountries = ['RU'];
                    if (luluUnsupportedCountries.includes(countryCode)) {
                        console.warn(`⚠️ Country ${countryCode} is not supported by Lulu. Falling back to ADMIN fulfillment.`);
                        newOrder.fulfillmentProvider = 'ADMIN';
                        newOrder.timeline.push({ status: 'Processing', note: `International order (${countryCode}) - Lulu does not support this country. Manual fulfillment required.`, timestamp: new Date() });
                        await newOrder.save();
                    } else {

                    const luluAddress = formatLuluAddress(address);
                    
                    try {
                        let attempts = 0;
                        const maxAttempts = 3;
                        let luluRes = null;
                        let lastError = null;

                        while (attempts < maxAttempts) {
                            try {
                                attempts++;
                                console.log(`Sending print job request to Lulu (Attempt ${attempts}/${maxAttempts})...`);
                                const luluRaw = await createPrintJob({
                                    contactEmail: address.email || newOrder.customer?.email || "customer@example.com",
                                    externalId: newOrder.orderId || newOrder._id.toString(),
                                    lineItems: luluLineItems,
                                    shippingAddress: luluAddress,
                                    shippingLevel: "MAIL"
                                });
                                luluRes = { 
                                    data: { 
                                        success: true, 
                                        job_id: luluRaw.id, 
                                        status: luluRaw.status?.name || 'CREATED', 
                                        production_time: "3-5 Business Days", 
                                        lulu_response: luluRaw 
                                    } 
                                };
                                if (luluRes.data && luluRes.data.success) {
                                    break;
                                } else {
                                    throw new Error(luluRes.data?.error || 'Invalid response from Lulu integration');
                                }
                            } catch (err) {
                                lastError = err;
                                let errorMsg = err.message || '';
                                if (err.response && err.response.data && err.response.data.error) {
                                    errorMsg = typeof err.response.data.error === 'string' ? err.response.data.error : JSON.stringify(err.response.data.error);
                                }
                                console.warn(`⚠️ Lulu API Attempt ${attempts} failed: ${errorMsg}`);
                                // Dynamic state resolution: parse valid choices from Lulu error and retry
                                if (attempts < maxAttempts && (errorMsg.includes('state you entered is invalid') || errorMsg.includes('Valid choices are'))) {
                                    const validChoicesMatch = errorMsg.match(/Valid choices are \[(.*?)\]/);
                                    if (validChoicesMatch) {
                                        const choices = validChoicesMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                                        if (choices.length > 0) {
                                            const currentState = luluAddress.state_code || '';
                                            let bestMatch = choices[0];
                                            for (const choice of choices) {
                                                if (choice && currentState && (choice.toLowerCase().includes(currentState.toLowerCase().substring(0, 4)) || currentState.toLowerCase().includes(choice.toLowerCase().substring(0, 4)))) {
                                                    bestMatch = choice;
                                                    break;
                                                }
                                            }
                                            console.log(`💡 Auto-resolving invalid state "${luluAddress.state_code}" → "${bestMatch}"`);
                                            luluAddress.state_code = bestMatch;
                                            luluAddress.state = bestMatch;
                                            continue; // Retry immediately with corrected state
                                        }
                                    }
                                }
                                // Dynamic postcode resolution: parse valid format sample from Lulu error and retry
                                if (attempts < maxAttempts && (errorMsg.includes('Postal Code') || errorMsg.includes('postcode') || errorMsg.includes('It should look like'))) {
                                    const sampleCodeMatch = errorMsg.match(/It should look like ([^".\\]+)/i);
                                    if (sampleCodeMatch) {
                                        const sampleCode = sampleCodeMatch[1].split(',')[0].trim();
                                        if (sampleCode) {
                                            console.log(`💡 Auto-resolving invalid postcode "${luluAddress.postcode}" → "${sampleCode}"`);
                                            luluAddress.postcode = sampleCode;
                                            continue; // Retry immediately with corrected postcode
                                        }
                                    }
                                }
                                // Dynamic max-length truncation resolution:
                                if (attempts < maxAttempts && (errorMsg.includes('MAX_LENGTH_EXCEEDED') || errorMsg.includes('limit of 30 characters'))) {
                                    console.log(`💡 Auto-truncating long address fields for Lulu API retry...`);
                                    if (luluAddress.street1 && luluAddress.street1.length > 30) luluAddress.street1 = luluAddress.street1.substring(0, 30);
                                    if (luluAddress.name && luluAddress.name.length > 30) luluAddress.name = luluAddress.name.substring(0, 30);
                                    if (luluAddress.city && luluAddress.city.length > 30) luluAddress.city = luluAddress.city.substring(0, 30);
                                    continue;
                                }
                                if (attempts < maxAttempts) {
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                }
                            }
                        }

                        if (luluRes && luluRes.data && luluRes.data.success) {
                            const jobData = luluRes.data;
                            const luluResponse = jobData.lulu_response || {};
                            newOrder.shipmentId   = jobData.job_id;
                            newOrder.awbNumber    = jobData.job_id; // Using Job ID for tracking in local dashboard
                            newOrder.courierName  = 'Lulu';
                            
                            newOrder.luluJobId = jobData.job_id;
                            newOrder.luluStatus = jobData.status || (luluResponse.status && luluResponse.status.name) || 'CREATED';
                            
                            const trackingInfo = luluResponse.tracking || {};
                            newOrder.luluTracking = trackingInfo.tracking_number || '';
                            newOrder.luluShippingMethod = luluResponse.shipping_option || luluResponse.shipping_level || 'MAIL';
                            
                            const firstItem = luluResponse.line_items && luluResponse.line_items[0];
                            newOrder.luluPrintPackage = firstItem ? (firstItem.pod_package_id || firstItem.printable_normalization?.pod_package_id) : '';
                            
                            newOrder.luluWebhookData = luluResponse;
                            newOrder.luluLastSync = new Date();
                            
                            newOrder.timeline.push({ status: 'Processing', note: `Print job created via Lulu. Job ID: ${jobData.job_id}` });
                            await newOrder.save();
                            
                            await Shipment.create({
                                orderId       : newOrder._id.toString(),
                                shipmentId    : jobData.job_id,
                                awbNumber     : jobData.job_id,
                                courierName   : 'Lulu',
                                shippingStatus: jobData.status || 'Created'
                            });
                            console.log(`✅ Lulu Print Job Created Successfully for Order #${newOrder.orderId}. Job ID: ${jobData.job_id}`);
                        } else {
                            throw new Error(lastError?.message || 'Invalid response from Lulu integration');
                        }
                    } catch (luluErr) {
                        console.error('❌ Lulu POD integration failed after all retries:', luluErr.message);
                        newOrder.timeline.push({ status: 'Fulfillment Issue', note: 'Lulu POD failed: ' + luluErr.message });
                        await newOrder.save();
                    }
                    } // end unsupported country else
                }
            } catch (shipErr) { 
                console.error('❌ Fulfillment Automation Failed:', shipErr); 
                newOrder.timeline.push({ status: 'Fulfillment Issue', note: 'Fulfillment error: ' + shipErr.message });
                await newOrder.save();
            }
        }

        if (newOrder.partnerRef) {
            await processPartnerSale(newOrder, newOrder.partnerRef);
        }

        // 🕒 Schedule Delayed WhatsApp Order Confirmation (2 min delay)
        try {
            await jobService.schedule(newOrder.userId, 'OrderPlaced', 2, { orderId: newOrder.orderId });
            await jobService.cancel(newOrder.userId, 'AbandonedCart');
            await Cart.findOneAndUpdate({ userId: newOrder.userId }, { isPurchased: true, remindersSent: 0 });
        } catch (err) {
            console.error('Job Scheduling Error (Razorpay):', err);
        }

        sendOrderNotificationEmail(newOrder).catch(err => console.error("Notification email error:", err));
        res.status(201).json({ success: true, order: newOrder, message: 'Payment verified and order placed' });

    } catch (error) {
        console.error('Razorpay Verify Error:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
});

/**
 * @route   GET /api/orders/:id/invoice
 * @desc    Generate PDF Invoice for an order
 * @access  Private
 */
router.get('/:id/invoice', protect, async (req, res) => {
    try {
        const idParam = String(req.params.id || '').trim();
        const isHexId = /^[0-9a-fA-F]{24}$/.test(idParam);
        const order = (isHexId ? await Order.findById(idParam) : null) || await Order.findOne({ orderId: idParam });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Security check: Only admin or owner
        const userEmailLower = (req.user?.email || '').toLowerCase().trim();
        const isAdmin = req.user.role === 'admin' || userEmailLower === 'admin@uwo24.com' || userEmailLower === 'efv@uwo24.com';
        const isOwner = order.userId?.toString() === req.user._id?.toString() || 
                       order.customer?.email?.toLowerCase() === req.user.email?.toLowerCase();
        
        if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Unauthorized' });

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50, autoFirstPage: true });

        // Register custom TrueType fonts with full Unicode currency (₹) support
        const fontRegular = path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf');
        const fontBold = path.join(__dirname, '../../assets/fonts/Roboto-Bold.ttf');
        const fontItalic = path.join(__dirname, '../../assets/fonts/Roboto-Italic.ttf');

        const hasCustomFonts = fs.existsSync(fontRegular) && fs.existsSync(fontBold);
        if (hasCustomFonts) {
            doc.registerFont('AppRegular', fontRegular);
            doc.registerFont('AppBold', fontBold);
            if (fs.existsSync(fontItalic)) {
                doc.registerFont('AppItalic', fontItalic);
            }
        }

        const FONT_REGULAR = hasCustomFonts ? 'AppRegular' : 'Helvetica';
        const FONT_BOLD = hasCustomFonts ? 'AppBold' : 'Helvetica-Bold';
        const FONT_ITALIC = hasCustomFonts ? (fs.existsSync(fontItalic) ? 'AppItalic' : 'AppRegular') : 'Helvetica-Oblique';

        // Stream PDF to Response
        const filename = `EFV_Invoice_${order.orderId}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        // --- PDF DESIGN ---
        const EFV_GOLD = '#D4AF37';
        const DARK = '#141414';

        // Header Background
        doc.rect(0, 0, doc.page.width, 100).fill(DARK);
        
        // Brand Logo
        doc.fillColor(EFV_GOLD).font(FONT_BOLD).fontSize(32).text('EFV', 50, 28);
        doc.fontSize(11).font(FONT_BOLD).text('OFFICIAL TAX INVOICE', 50, 65);
        
        // Order Info (Right Aligned)
        // --- DYNAMIC CURRENCY & LOCALE ---
        const invoiceCurrency = (order.paymentCurrency || order.currency || 'INR').toUpperCase();
        const invoiceLocale = order.locale || (invoiceCurrency === 'INR' ? 'en-IN' : 'en-US');
        const invoiceFormatter = new Intl.NumberFormat(invoiceLocale, { style: 'currency', currency: invoiceCurrency });
        const fmtAmt = (val) => {
            const num = Number(val || 0);
            try {
                const formatted = invoiceFormatter.format(num);
                // Fallback for standard PDF fonts if TrueType font is unavailable
                if (!hasCustomFonts && invoiceCurrency === 'INR') {
                    return formatted.replace(/₹/g, 'Rs. ');
                }
                return formatted;
            } catch (err) {
                return `${invoiceCurrency} ${num.toFixed(2)}`;
            }
        };
        const invoiceTaxLabel = invoiceCurrency === 'INR' ? 'GST (0%) - Books Exempt:' : (invoiceCurrency === 'EUR' ? 'VAT (0%) - Books Exempt:' : 'Sales Tax (0%) - Books Exempt:');

        const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
        doc.fillColor('#FFFFFF').font(FONT_REGULAR).fontSize(9);
        doc.text(`Invoice No: INV-${(order.orderId || '').split('-').pop()}`, 350, 30, { align: 'right', width: 200 });
        doc.text(`Order ID: #${order.orderId || 'N/A'}`, 350, 45, { align: 'right', width: 200 });
        doc.text(`Date: ${dateStr}`, 350, 60, { align: 'right', width: 200 });
        doc.text(`Invoice Currency: ${invoiceCurrency}`, 350, 75, { align: 'right', width: 200 });
        
        // Customers Safety
        const customer = order.customer || {};
        const items = order.items || [];

        // --- MERCHANT & CUSTOMER DETAILS ---
        doc.fillColor('#000000').fontSize(10).font(FONT_BOLD).text('SOLD BY:', 50, 120);
        doc.font(FONT_REGULAR).fontSize(9)
           .text('EFV - Energy, Frequency and Vibration', 50, 135)
           .text('Madhya Pradesh, India', 50, 150)
           .text('GSTIN: 23EFVPA0000Z1Z1', 50, 165)
           .text('Support: efv@uwo24.com', 50, 180);

        doc.font(FONT_BOLD).text('BILL TO:', 350, 120);
        doc.font(FONT_REGULAR).fontSize(9)
           .text(String(customer.name || 'Valued Customer'), 350, 135)
           .text(String(customer.city || 'N/A'), 350, 150)
           .text(String(customer.zip || ''), 350, 165)
           .text(`Contact: ${customer.phone || 'N/A'}`, 350, 180);

        // --- ITEMS TABLE ---
        const tableTop = 225;
        doc.rect(50, tableTop, 500, 22).fill('#F5F5F5');
        doc.fillColor('#000000').font(FONT_BOLD).fontSize(8)
           .text('ITEM', 60, tableTop + 7)
           .text('QTY', 270, tableTop + 7, { width: 30, align: 'center' })
           .text('PRICE', 325, tableTop + 7, { width: 65, align: 'right' })
           .text('TAX', 410, tableTop + 7, { width: 35, align: 'center' })
           .text('TOTAL', 465, tableTop + 7, { width: 75, align: 'right' });

        let rowY = tableTop + 32;
        items.forEach(item => {
            const title = String(item.title || 'Product').substring(0, 40);
            const qty = Number(item.quantity || 0);
            const price = Number(item.price || 0);
            doc.font(FONT_REGULAR).fillColor('#333333').fontSize(8)
               .text(title, 60, rowY, { width: 200 })
               .text(qty.toString(), 270, rowY, { width: 30, align: 'center' })
               .text(fmtAmt(price), 325, rowY, { width: 65, align: 'right' })
               .text('0%', 410, rowY, { width: 35, align: 'center' })
               .text(fmtAmt(price * qty), 465, rowY, { width: 75, align: 'right' });
            rowY += 26;
        });

        // --- TOTALS SECTION ---
        rowY += 15;
        doc.moveTo(330, rowY).lineTo(550, rowY).stroke('#EEEEEE');
        rowY += 15;

        const codCharges = Number(order.codCharges || 0);
        const subtotal = Number(order.subtotal || items.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 0)), 0));
        const shipping = Number(order.shippingCharges || 0);
        const discount = Number(order.discountAmount || 0);
        const total    = Number(order.totalAmount || 0);
        // ✅ Books are GST exempt — tax is always 0 on every invoice, every country
        const tax = 0;

        const renderRow = (label, value, isBold = false, isGlow = false) => {
            if (isGlow) {
                doc.rect(330, rowY - 5, 220, 24).fill(DARK);
                doc.fillColor(EFV_GOLD);
            } else {
                doc.fillColor('#666666');
            }
            doc.font(isBold ? FONT_BOLD : FONT_REGULAR).fontSize(isBold ? 11 : 9);
            doc.text(label, 340, rowY);
            doc.text(`${fmtAmt(Number(value || 0))}`, 440, rowY, { align: 'right', width: 100 });
            rowY += isGlow ? 28 : 20;
        };

        renderRow('Book Price:', subtotal);
        if (shipping > 0) renderRow('Shipping:', shipping);
        if (codCharges > 0) renderRow('COD Charges:', codCharges);
        
        if (discount > 0) {
            const discLabel = order.couponCode ? `Discount (Coupon: ${order.couponCode}):` : 'Discount:';
            renderRow(discLabel, -discount);
        }
        
        renderRow(invoiceTaxLabel, tax);
        rowY += 6;
        renderRow('GRAND TOTAL:', total, true, true);

        // Footer
        doc.fillColor('#999999').fontSize(8).font(FONT_ITALIC)
           .text('Terms: This is a system-generated tax invoice. Digital products are non-refundable.', 50, 700, { align: 'center' });
        doc.fillColor(EFV_GOLD).font(FONT_BOLD).fontSize(10)
           .text('THANK YOU FOR SHOPPING AT EFV', 50, 720, { align: 'center' });

        doc.end();

    } catch (e) {
        console.error('Invoice Route Error:', e);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to generate invoice' });
        }
    }
});

module.exports = router;

