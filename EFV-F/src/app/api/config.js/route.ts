import { NextResponse } from 'next/server';

export async function GET() {
    // Determine the API URL from the environment variable or fallback to production
    // Determine the API URL from the environment variable (check both naming conventions)
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.efv_backend_api;
    const apiUrl = envApiUrl ? envApiUrl.replace(/\/+$/, '') : ''; // Sanitize trailing slash
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const unifiedApiUrl = process.env.NEXT_PUBLIC_UNIFIED_API_URL || 'https://uwo24.com/api';
    const uwoApiKey = process.env.NEXT_PUBLIC_UWO_API_KEY || process.env.UWO_MASTER_API_KEY || '';
    
    if (!envApiUrl) {
        console.warn('⚠️ Both NEXT_PUBLIC_API_URL and efv_backend_api are missing in .env!');
    } else {
        console.log('✅ API Config dynamic URL detected:', envApiUrl);
    }
    
    // Create the plain JavaScript content that matches the old api-config.js
    const jsContent = `
/**
 * EFV API Configuration (Dynamically Generated)
 */
const CONFIG = {
    API_BASE_URL: '${apiUrl}',
    GOOGLE_CLIENT_ID: '${googleClientId}',
    UNIFIED_API_URL: '${unifiedApiUrl}',
    UWO_API_KEY: '${uwoApiKey}',
    BASE_PATH: window.location.pathname.includes('/pages/') ? '../' : ''
};

console.log('🔗 EFV API connected to: ' + CONFIG.API_BASE_URL);
if (CONFIG.API_BASE_URL.includes('localhost')) {
    console.warn('⚠️ WARNING: Frontend is connecting to LOCALHOST API. If this is a live site, login will fail.');
}
    `;

    // Return the response as an application/javascript file, preventing cache so updates apply instantly
    return new NextResponse(jsContent, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}
