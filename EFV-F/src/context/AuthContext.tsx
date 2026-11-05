'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
    _id: string;
    name: string;
    email: string;
    token: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const syncUserFromStorage = () => {
            const storedUserStr = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
            const token = localStorage.getItem('authToken');
            if (storedUserStr) {
                try {
                    const parsed = JSON.parse(storedUserStr);
                    if (token && !parsed.token) parsed.token = token;
                    setUser(parsed);
                } catch (err) {
                    console.error('Error parsing stored user', err);
                }
            } else if (token) {
                setUser({ _id: '', name: 'User', email: '', token });
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        syncUserFromStorage();

        window.addEventListener('storage', syncUserFromStorage);
        window.addEventListener('efv_user_logged_in', syncUserFromStorage);
        return () => {
            window.removeEventListener('storage', syncUserFromStorage);
            window.removeEventListener('efv_user_logged_in', syncUserFromStorage);
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            setUser(data);
            localStorage.setItem('efv_auth_user', JSON.stringify(data));
            localStorage.setItem('efv_user', JSON.stringify(data));
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            window.dispatchEvent(new Event('efv_user_logged_in'));
        } catch (err) {
            throw new Error('Invalid credentials');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('efv_auth_user');
        localStorage.removeItem('efv_user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('efv_country_selected');
        localStorage.removeItem('efv_selected_country');
        sessionStorage.removeItem('efv_country_selected');
        sessionStorage.removeItem('efv_selected_country');
        window.dispatchEvent(new Event('efv_user_logged_in'));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
