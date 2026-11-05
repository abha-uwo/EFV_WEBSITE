'use client';

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Get auth token from localStorage
const getAuthHeader = () => {
    if (typeof window === 'undefined') return {};
    const userStr = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
    const directToken = localStorage.getItem('authToken');
    if (userStr) {
        try {
            const parsed = JSON.parse(userStr);
            const token = parsed.token || directToken;
            if (token) return { Authorization: `Bearer ${token}` };
        } catch (e) {
            console.error("Error parsing user token", e);
        }
    }
    if (directToken) {
        return { Authorization: `Bearer ${directToken}` };
    }
    return {};
};

// Update routes to include /api prefix to match consistency
export const api = {
    // Auth
    login: (email: string, password: string) =>
        axios.post(`${API_URL}/api/auth/login`, { email, password }),

    signup: (name: string, email: string, password: string) =>
        axios.post(`${API_URL}/api/auth/signup`, { name, email, password }),

    // Products
    getProducts: () =>
        axios.get(`${API_URL}/api/products`),

    getProduct: (id: string) =>
        axios.get(`${API_URL}/api/products/${id}`),

    // Demo Mode
    addToLibrary: (productId: string) =>
        axios.post(`${API_URL}/api/demo/add-to-library`, { productId }, {
            headers: getAuthHeader()
        }),

    // Library
    getMyLibrary: () =>
        axios.get(`${API_URL}/api/library/my-library`, {
            headers: getAuthHeader()
        }),

    getLibraryCount: () =>
        axios.get(`${API_URL}/api/demo/library-count`, {
            headers: getAuthHeader()
        }),

    // Progress
    getProgress: (productId: string) =>
        axios.get(`${API_URL}/api/library/progress/${productId}`, {
            headers: getAuthHeader()
        }),

    saveProgress: (productId: string, progress: number, total: number) =>
        axios.post(`${API_URL}/api/library/progress`, { productId, progress, total }, {
            headers: getAuthHeader()
        }),

    // Content Streaming
    getEbookUrl: (productId: string) =>
        `${API_URL}/api/content/ebook/${productId}`,

    getAudioUrl: (productId: string) =>
        `${API_URL}/api/content/audio/${productId}`,
};
