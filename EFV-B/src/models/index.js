const mongoose = require('mongoose');

if (process.env.USE_JSON_DB === 'true') {
    module.exports = require('./jsonAdapter');
    return;
}

// Updated User Schema with professional dashboard features
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    role: { type: String, default: 'user' },
    phone: String,
    savedAddresses: [{
        _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        fullName: String,
        phone: String,
        phoneCode: String,
        country: String,
        countryCode: String,
        countryName: String,
        pincode: String,
        state: String,
        city: String,
        house: String,
        area: String,
        landmark: String,
        type: { type: String, default: 'Home' }, // Home, Work
        fullAddress: String, // Combined string for legacy support
        isDefault: { type: Boolean, default: false }
    }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    notifications: [{
        _id: { type: String }, // Allow custom string IDs to prevent BSONError
        title: String,
        message: String,
        type: { type: String, enum: ['Order', 'Payment', 'Digital', 'Shipment', 'General'], default: 'General' },
        link: String,
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    paymentMethods: [{
        type: { type: String, default: 'card' },
        last4: String,
        brand: String
    }],
    resetPasswordOTP: String,
    resetPasswordExpires: Date,
    resetAttempts: { type: Number, default: 0 },
    twoFactorEnabled: { type: Boolean, default: false },
    changePasswordOTP: String,
    changePasswordExpires: Date,
    pendingNewPassword: String,
    activeSessions: [{
        sessionId: { type: String, required: true },
        ip: { type: String, default: '127.0.0.1' },
        device: { type: String, default: 'Browser / OS' },
        browser: { type: String, default: 'Browser' },
        os: { type: String, default: 'OS' },
        createdAt: { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now }
    }],
    googleId: String,
    avatar: String,
    createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.Mixed }, // Allow custom string IDs and ObjectIds to prevent CastError/BSONError
    title: { type: String, required: true },
    author: { type: String, default: "EFV Authorized Member" },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discountPrice: { type: Number }, // Actual selling price if discounted
    discount: { type: Number, default: 0 }, // Percentage or absolute discount
    stock: { type: Number, default: 0 },
    filePath: { type: String }, // Optional for physical books (PDF/Audio)
    thumbnail: String,
    gallery: [String], // Array of image paths
    type: { type: String, required: true }, // Primary structural type
    categories: [String], // Additional marketing categories
    category: { type: String, default: 'Digital' },
    description: String,
    volume: String, // e.g. "1", "2"
    language: { type: String, default: 'Hindi' }, // Hindi, English
    legacyId: { type: String, sparse: true }, // Removed unique: true to avoid null collisions

    // New PM fields
    subtitle: String,
    edition: String,
    isbn: String,
    dimensions: String,
    availability: { type: String, default: 'Available' }, // Available, Unavailable
    tags: [String],
    rating: { type: Number, default: 5 },
    reviewCount: { type: Number, default: 2450 },
    additionalSpecs: { type: Map, of: String, default: {} },

    // Shipping Details (for Shiprocket)
    weight: { type: Number, default: 0 }, // in grams
    length: { type: Number, default: 0 }, // in cm
    breadth: { type: Number, default: 0 }, // in cm
    height: { type: Number, default: 0 }, // in cm
    duration: String, // e.g. "12:35" for audiobooks
    regionalPrices: { type: Map, of: Number, default: {} },
    countryPricing: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Chapter-Based Audiobook System
    totalChapters: { type: Number, default: 0 },
    chapters: [{
        chapterNumber: { type: Number, required: true },
        title: { type: String, default: '' },
        filePath: { type: String, default: '' }, // e.g. uploads/audios/chapter-1.mp3
        duration: { type: String, default: '' }, // e.g. "12:35"
        uploadedAt: { type: Date }
    }],

    // Lulu Print-On-Demand (POD) Configuration
    podPackageId: { type: String, default: '0600X0900BWSTDPB060UW444MXX' }, // Default POD package SKU
    podHardcoverSku: { type: String, default: '' }, // Hardcover SKU (e.g. 0600X0900BWSTDHC060UW444MXX)
    podPaperbackSku: { type: String, default: '' }, // Paperback SKU (e.g. 0600X0900BWSTDPB060UW444MXX)
    luluCoverUrl: { type: String, default: '' },    // Public URL for Cover PDF
    luluInteriorUrl: { type: String, default: '' }, // Public URL for Interior PDF

    createdAt: { type: Date, default: Date.now }
});

// Enhanced Cart Schema for Recovery
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 },
        addedAt: { type: Date, default: Date.now }
    }],
    lastSyncedAt: { type: Date, default: Date.now },
    remindersSent: { type: Number, default: 0 },
    lastReminderAt: { type: Date },
    isPurchased: { type: Boolean, default: false } // Reset this when cart items are updated
});

// Notification Job Schema for Queue System
const notificationJobSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['OrderPlaced', 'AbandonedCart'], required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    scheduledFor: { type: Date, required: true },
    data: { type: mongoose.Schema.Types.Mixed }, // Order ID, cart items, etc.
    attempts: { type: Number, default: 0 },
    error: String,
    processedAt: Date,
    createdAt: { type: Date, default: Date.now }
});

const systemSettingsSchema = new mongoose.Schema({
    key: { type: String, unique: true, required: true },
    value: { type: mongoose.Schema.Types.Mixed },
    description: String,
    updatedAt: { type: Date, default: Date.now }
});

// New Digital Library Schema
const digitalLibrarySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.Mixed, ref: 'Product' },
        title: String,
        type: { type: String }, // EBOOK or AUDIOBOOK
        thumbnail: String,
        filePath: String,
        purchasedAt: { type: Date, default: Date.now },
        progress: { type: Number, default: 0 }, // For reading/listening progress
        lastAccessed: { type: Date, default: Date.now },
        // Audiobook chapter-level resume
        lastChapter: { type: Number, default: 0 },
        lastChapterTime: { type: Number, default: 0 },
        orderId: String,
        accessStatus: { type: String, default: 'active' }
    }],
    removedItems: [{ type: mongoose.Schema.Types.Mixed }] // Track explicitly removed product IDs
});

const purchaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.Mixed, ref: 'Product', required: true },
    transactionId: String,
    purchaseDate: { type: Date, default: Date.now }
});

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.Mixed, ref: 'Product' },
    title: String,
    price: Number,
    quantity: Number,
    type: { type: String }
});

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Linked to User
    customer: {
        name: String,
        email: String,
        phone: String,
        address: Object, // Store the full address object for reliability
        city: String,
        zip: String
    },
    items: [orderItemSchema],
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    shippingCharges: { type: Number, default: 0 },
    codCharges: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    booksSubtotal: { type: Number, default: 0 },
    taxExempt: { type: Boolean, default: false },
    paymentMethod: { type: String, default: 'COD' },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Local Delivery', 'Delivered', 'Cancelled', 'Returned', 'Failed', 'Completed (Digital)'],
        default: 'Pending'
    },
    orderType: { type: String, enum: ['physical', 'digital'], default: 'physical' },
    paymentStatus: { type: String, default: 'Pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    cashfreeOrderId: String,
    cashfreePaymentSessionId: String,
    invoicePath: String, // Path to generated PDF invoice
    shipmentId: String, // Shiprocket/Nimbus Shipment ID
    awbNumber: String,
    courierName: String,
    trackingLink: String,
    labelUrl: String,           // URL for the shipping label
    courierId: String,          // Nimbus courier internal ID
    couponCode: { type: String, default: '' },           // Coupon applied
    discountAmount: { type: Number, default: 0 },         // Discount applied
    partnerRef: {                                          // Partner tracking
        partnerId: String,
        partnerName: String,
        couponCode: String,
        commissionPercent: Number,
        commissionAmount: Number,
        commissionPaid: { type: Boolean, default: false }
    },
    offerId: { type: String, default: '' },
    offerName: { type: String, default: '' },
    offerDiscountApplied: { type: Number, default: 0 },
    offerOriginalAmount: { type: Number, default: 0 },
    offerFinalAmount: { type: Number, default: 0 },
    offerType: { type: String, default: '' },
    purchasedThroughOffer: { type: String, default: 'No' },
    offerSavings: { type: Number, default: 0 },
    timeline: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String
    }],
    fulfillmentProvider: { type: String, enum: ['ADMIN', 'NIMBUS', 'LULU'], default: 'ADMIN' },
    luluJobId: String,
    luluStatus: String,
    luluTracking: String,
    luluShippingMethod: String,
    luluPrintPackage: String,
    luluWebhookData: mongoose.Schema.Types.Mixed,
    luluLastSync: Date,
    language: { type: String, default: 'en' },
    paymentCurrency: { type: String, default: 'INR' },
    currency: { type: String, default: 'INR' },          // Payment transaction currency code
    currencySymbol: { type: String, default: '₹' },       // Display symbol for the currency
    locale: { type: String, default: 'en-IN' },
    createdAt: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    paymentId: String, // Razorpay Payment ID
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },  // Payment currency code
    method: String, // Card, UPI, etc.
    status: { type: String, enum: ['Paid', 'Failed', 'Pending', 'Refunded'], default: 'Pending' },
    razorpayData: Object, // Full response for auditing
    date: { type: Date, default: Date.now }
});

const shipmentSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    shipmentId: String, // Courier/Shiprocket ID
    courierName: { type: String, default: '' },
    awbNumber: { type: String, default: '' },
    shippingStatus: { type: String, default: 'Pending' },
    trackingLink: String,
    labelUrl: String,
    createdAt: { type: Date, default: Date.now }
});

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['Percentage', 'Flat'], default: 'Percentage' },
    value: { type: Number, required: true },
    minOrder: { type: Number, default: 0 },
    expiryDate: Date,
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // Partner Tracking
    isPartnerCoupon: { type: Boolean, default: false },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    partnerName: { type: String, default: '' },
    commissionPercent: { type: Number, default: 0 }, // % of order value as commission
    createdAt: { type: Date, default: Date.now }
});

const userProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.Mixed, ref: 'Product', required: true },
    type: { type: String, enum: ['EBOOK', 'AUDIOBOOK'], required: true },
    progress: { type: Number, default: 0 }, // 0-100 percentage

    // Audio Specific
    currentTime: { type: Number, default: 0 }, // Seconds
    totalDuration: { type: Number, default: 0 },

    // E-book Specific
    lastPage: { type: Number, default: 1 },
    totalPages: { type: Number, default: 0 },
    scrollPosition: { type: Number, default: 0 },

    lastUpdated: { type: Date, default: Date.now }
});

// Chapter-level audiobook progress
const audiobookProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.Mixed, ref: 'Product', required: true },
    // Per-chapter tracking
    chapters: [{
        chapterIndex: { type: Number, required: true }, // 0-based index
        currentTime: { type: Number, default: 0 },   // seconds
        duration: { type: Number, default: 0 },       // total seconds
        completed: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now }
    }],
    // Current position
    currentChapterIndex: { type: Number, default: 0 },
    currentChapterTime: { type: Number, default: 0 },
    totalCompletedChapters: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

audiobookProgressSchema.index({ userId: 1, productId: 1 }, { unique: true });

const supportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    subject: String,
    message: String,
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
    reply: String,
    repliedAt: Date,
    createdAt: { type: Date, default: Date.now }
});

userProgressSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Partner Schema — tracks marketing partner companies/individuals
const partnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: '' },
    company: { type: String, default: '' },
    password: { type: String, default: '' }, // Set during activation
    token: { type: String, default: '' }, // Invitation token/Unique ID
    partner_token: { type: String, default: '' }, // Generated marketing token
    status: { type: String, default: 'Active' }, // Active, Verified
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isActivated: { type: Boolean, default: false }, // Email verified & password set
    otp: { type: String, default: '' },
    otpExpires: { type: Date },
    totalCommissionEarned: { type: Number, default: 0 },
    totalCommissionPaid: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const partnerSaleSchema = new mongoose.Schema({
    partnerId: { type: String, required: true },
    orderId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    productName: { type: String, default: '' },
    totalPrice: { type: Number, required: true },
    couponCode: { type: String, required: true },
    commissionPercent: { type: Number, default: 0 },
    commissionAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
    payoutDate: { type: Date },
    adminNotes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const returnRequestSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        title: String,
        price: Number,
        quantity: Number
    }],
    reason: { type: String, required: true },
    imageProof: String, // Path to uploaded image
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Picked Up', 'Returned'], default: 'Pending' },
    adminNotes: String,
    reverseShipmentId: String,
    createdAt: { type: Date, default: Date.now }
});

const partnerMessageSchema = new mongoose.Schema({
    partnerId: { type: String, required: true },
    partnerName: String,
    partnerEmail: String,
    subject: String,
    message_text: { type: String, required: true },
    sender_type: { type: String, enum: ['admin', 'partner'], required: true },
    status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
    isReadByAdmin: { type: Boolean, default: false },
    isReadByPartner: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const orderCancellationSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    cancelledAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

const botLeadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const chatConversationSchema = new mongoose.Schema({
    email: { type: String, required: true },
    messages: [{
        role: { type: String, enum: ['user', 'ai'] },
        content: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

const notifyRequestSchema = new mongoose.Schema({
    email: { type: String, required: true },
    bookTitle: { type: String, required: true },
    bookId: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Pending', 'Notified'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    isDigital: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const offerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: String,
    type: { type: String, default: 'Percentage' },
    discountValue: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    badgeText: String,
    ctaText: String,
    bannerUrl: String,
    
    // Premium Offers V2 Fields
    offerType: { type: String, default: 'Percentage' },
    products: [String],
    categories: [String],
    authors: [String],
    publishers: [String],
    schedule: { type: mongoose.Schema.Types.Mixed, default: {} },
    discountRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    couponRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    shippingRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    buyXGetYRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    firstOrderRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    comboRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    analytics: {
        views: { type: Number, default: 0 },
        claims: { type: Number, default: 0 },
        orders: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 }
    },
    
    createdAt: { type: Date, default: Date.now }
});

const offerProductSchema = new mongoose.Schema({
    offerId: { type: String, required: true },
    productId: String,
    categorySlug: String,
    createdAt: { type: Date, default: Date.now }
});

const offerBannerSchema = new mongoose.Schema({
    offerId: { type: String, required: true },
    title: String,
    subtitle: String,
    imageUrl: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const offerRuleSchema = new mongoose.Schema({
    offerId: { type: String, required: true },
    ruleType: String,
    minQuantity: { type: Number, default: 0 },
    minAmount: { type: Number, default: 0 },
    customData: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

const offerScheduleSchema = new mongoose.Schema({
    offerId: { type: String, required: true },
    timezone: { type: String, default: 'UTC' },
    recurring: String,
    createdAt: { type: Date, default: Date.now }
});

const offerPrioritySchema = new mongoose.Schema({
    offerId: { type: String, required: true },
    level: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const offerAnalyticsSchema = new mongoose.Schema({
    offerId: { type: String, required: true, unique: true },
    views: { type: Number, default: 0 },
    claims: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const homepageBookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['purchase_now', 'notify_me'], default: 'purchase_now' },
    thumbnail: String,
    createdAt: { type: Date, default: Date.now }
});

// Webhook Leads Schema — receives leads from external websites/landing pages
const leadSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    message: { type: String },
    source: { type: String, default: 'website', trim: true },
    status: { type: String, enum: ['New', 'Contacted', 'Converted', 'Rejected'], default: 'New' },
    notes: { type: String, default: '' },
    rawPayload: { type: Object },
    createdAt: { type: Date, default: Date.now }
});

const volumeSchema = new mongoose.Schema({
    volumeNumber: { type: Number, required: true, unique: true }, // e.g. 1
    name: { type: String, required: true }, // e.g. "Volume 1"
    bookCount: { type: Number, default: 0 },
    countryCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    importStatus: { type: String, default: 'Pending' }
});

module.exports = {
    User: mongoose.model('User', userSchema),
    Product: mongoose.model('Product', productSchema),
    Purchase: mongoose.model('Purchase', purchaseSchema),
    Order: mongoose.model('Order', orderSchema),
    Cart: mongoose.model('Cart', cartSchema),
    DigitalLibrary: mongoose.model('DigitalLibrary', digitalLibrarySchema),
    UserProgress: mongoose.model('UserProgress', userProgressSchema),
    AudiobookProgress: mongoose.model('AudiobookProgress', audiobookProgressSchema),
    Payment: mongoose.model('Payment', paymentSchema),
    Shipment: mongoose.model('Shipment', shipmentSchema),
    Coupon: mongoose.model('Coupon', couponSchema),
    Support: mongoose.model('Support', supportSchema),
    Partner: mongoose.model('Partner', partnerSchema),
    PartnerSale: mongoose.model('PartnerSale', partnerSaleSchema),
    PartnerMessage: mongoose.model('PartnerMessage', partnerMessageSchema),
    ReturnRequest: mongoose.model('ReturnRequest', returnRequestSchema),
    OrderCancellation: mongoose.model('OrderCancellation', orderCancellationSchema),
    BotLead: mongoose.model('BotLead', botLeadSchema),
    ChatConversation: mongoose.model('ChatConversation', chatConversationSchema),
    NotificationJob: mongoose.model('NotificationJob', notificationJobSchema),
    SystemSettings: mongoose.model('SystemSettings', systemSettingsSchema),
    NotifyRequest: mongoose.model('NotifyRequest', notifyRequestSchema),
    NotificationLog: require('./NotificationLog'),
    Category: mongoose.model('Category', categorySchema),
    Offer: mongoose.model('Offer', offerSchema),
    OfferProduct: mongoose.model('OfferProduct', offerProductSchema),
    OfferBanner: mongoose.model('OfferBanner', offerBannerSchema),
    OfferRule: mongoose.model('OfferRule', offerRuleSchema),
    OfferSchedule: mongoose.model('OfferSchedule', offerScheduleSchema),
    OfferPriority: mongoose.model('OfferPriority', offerPrioritySchema),
    OfferAnalytics: mongoose.model('OfferAnalytics', offerAnalyticsSchema),
    HomepageBook: mongoose.model('HomepageBook', homepageBookSchema),
    Lead: mongoose.model('Lead', leadSchema),
    Volume: mongoose.model('Volume', volumeSchema)
};
