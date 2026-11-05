const mongoose = require('mongoose');
const os = require('os');
const tls = require('tls');

// Auto-detect physical Wi-Fi / Ethernet interface (e.g. en0) to ensure MongoDB Atlas
// connections route cleanly and never get blocked or dropped if a VPN (like ProtonVPN) is active.
function getPhysicalLocalAddress() {
    try {
        const interfaces = os.networkInterfaces();
        for (const name of ['en0', 'en1', 'eth0', 'wlan0']) {
            const list = interfaces[name];
            if (list) {
                const ipv4 = list.find(item => item.family === 'IPv4' && !item.internal);
                if (ipv4 && ipv4.address) return ipv4.address;
            }
        }
        for (const [name, list] of Object.entries(interfaces)) {
            if (!name.startsWith('utun') && !name.startsWith('tun') && !name.startsWith('ppp')) {
                const ipv4 = list.find(item => item.family === 'IPv4' && !item.internal);
                if (ipv4 && ipv4.address) return ipv4.address;
            }
        }
    } catch (e) {}
    return null;
}

const physicalIp = getPhysicalLocalAddress();
if (physicalIp) {
    const origTlsConnect = tls.connect;
    tls.connect = function(options, cb) {
        if (typeof options === 'object' && options) {
            const isMongo = (options.port === 27017) ||
                            (options.host && String(options.host).includes('mongodb.net')) ||
                            (options.servername && String(options.servername).includes('mongodb.net'));
            if (isMongo && !options.localAddress) {
                options.localAddress = physicalIp;
            }
        }
        return origTlsConnect.apply(this, arguments);
    };
}

const connectDB = async (retryCount = 0, maxRetries = 10) => {
    if (process.env.USE_JSON_DB === 'true') {
        console.log('ℹ️ Running in Local JSON Database Mode (No MongoDB required)');
        return;
    }
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            family: 4,
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        global.mongoConnectionError = null;
    } catch (error) {
        console.error(`❌ MongoDB connection attempt ${retryCount + 1}/${maxRetries} failed:`, error.message);
        global.mongoConnectionError = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            code: error.code,
            syscall: error.syscall,
            hostname: error.hostname
        };

        if (retryCount < maxRetries - 1) {
            const delay = Math.min(5000 * (retryCount + 1), 30000); // 5s, 10s, 15s... max 30s
            console.log(`🔄 Retrying MongoDB connection in ${delay / 1000}s...`);
            setTimeout(() => connectDB(retryCount + 1, maxRetries), delay);
        } else {
            console.error('❌ All MongoDB connection attempts failed. Server running without DB.');
        }
        // Do NOT exit — keep the server alive so Cloud Run doesn't kill it
    }
};

module.exports = connectDB;
