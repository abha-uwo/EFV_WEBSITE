'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Book, Headset, Lock, Play, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import SecureReader from '../SecureReader/SecureReader';
import SecureAudioPlayer from '../SecureAudioPlayer/SecureAudioPlayer';
import { useI18n } from '@/providers/I18nProvider';
import UWOLoginModal from '../Common/UWOLoginModal';

interface Product {
    _id: string;
    title: string;
    type: 'EBOOK' | 'AUDIOBOOK';
    thumbnail?: string;
}

interface Chapter {
    chapterNumber: number;
    title: string;
    filePath: string;
    duration?: number;
}

interface FullProduct extends Product {
    chapters?: Chapter[];
}

const LibraryDashboard = () => {
    const { user } = useAuth();
    const { t } = useI18n();
    const [items, setItems] = useState<Product[]>([]);
    const [progressData, setProgressData] = useState<Record<string, { progress: number, total: number }>>({});
    const [activeItem, setActiveItem] = useState<Product | null>(null);
    const [fullProduct, setFullProduct] = useState<FullProduct | null>(null);
    const [fetchingFull, setFetchingFull] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showUwoModal, setShowUwoModal] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://efv-b-246449377479.asia-south1.run.app';

    const openContent = async (product: Product) => {
        setActiveItem(product);
        if (product.type === 'AUDIOBOOK') {
            setFetchingFull(true);
            try {
                const { data } = await axios.get(`${API_URL}/api/products/${product._id}`);
                setFullProduct(data);
            } catch (err) {
                console.error("Error fetching chapters", err);
            } finally {
                setFetchingFull(false);
            }
        }
    };

    useEffect(() => {
        if (!user) return;

        const fetchLibraryData = async () => {
            try {
                const { data: libraryItems } = await axios.get(`${API_URL}/api/library/my-library`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setItems(libraryItems);

                // Fetch progress for each item
                const progressMap: Record<string, { progress: number, total: number }> = {};
                await Promise.all(libraryItems.map(async (item: Product) => {
                    try {
                        const { data } = await axios.get(`${API_URL}/api/library/progress/${item._id}`, {
                            headers: { Authorization: `Bearer ${user?.token}` }
                        });
                        if (data && data.progress > 0) {
                            progressMap[item._id] = data;
                        }
                    } catch { /* ignore */ }
                }));
                setProgressData(progressMap);
            } catch (err) {
                console.error('Library fetch error', err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchLibraryData();
        }, 0);
        return () => clearTimeout(timer);
    }, [user, user?.token, user?.email, API_URL]);

    if (!user) return (
        <div className="flex flex-col items-center justify-center p-20 text-center">
            <Lock className="w-16 h-16 text-gold-energy mb-4 opacity-50" />
            <h2 className="text-2xl font-bold uppercase tracking-widest">{t('dashboard_page.restricted', 'Access Restricted')}</h2>
            <p className="text-gray-400 mt-2 font-medium mb-6">{t('dashboard_page.restricted_desc', 'Please login to view your secure digital assets.')}</p>
            
            <button
                type="button"
                onClick={() => setShowUwoModal(true)}
                className="px-8 py-3.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8860b] hover:opacity-95 text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_25px_-5px_rgba(212,175,55,0.3)] transition-all duration-200 active:scale-[0.98] flex items-center gap-2.5 cursor-pointer"
            >
                <Zap className="w-4 h-4 fill-black" />
                <span>Sign In with Unified Web Options (UWO)</span>
            </button>

            <UWOLoginModal
                isOpen={showUwoModal}
                onClose={() => setShowUwoModal(false)}
                appCode="efv"
            />
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-20 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                    <h1 className="text-6xl font-black mb-2 tracking-tighter" dangerouslySetInnerHTML={{ __html: t('dashboard_page.title', 'THE <span class="text-gold-energy">LIBRARY</span>') }} />
                    <p className="text-gray-500 font-bold tracking-[0.3em] uppercase text-xs">{t('dashboard_page.subtitle', 'EFV SECURE CONTENT DISPENSARY')}</p>
                </div>
                <div className="hidden md:block text-right">
                    <p className="text-gray-600 text-[10px] font-black tracking-widest uppercase">{t('dashboard_page.connection_est', 'ENCRYPTED CONNECTION ESTABLISHED')}</p>
                    <p className="text-gold-energy text-[10px] font-black tracking-widest uppercase">{user.email}</p>
                </div>
            </div>

            {activeItem ? (
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => { setActiveItem(null); setFullProduct(null); }}
                        className="group mb-8 text-gray-500 hover:text-white flex items-center gap-3 transition-colors font-black text-xs tracking-widest uppercase"
                    >
                        <motion.span animate={{ x: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>←</motion.span>
                        {t('dashboard_page.quit_dashboard', 'QUIT TO DASHBOARD')}
                    </button>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {activeItem.type === 'EBOOK' ? (
                            <div className="bg-black rounded-[3rem] overflow-hidden border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                                <SecureReader
                                    fileUrl={`${API_URL}/api/content/ebook/${activeItem._id}`}
                                    userEmail={user.email}
                                    productId={activeItem._id}
                                />
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                {fetchingFull ? (
                                    <div className="py-20 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-energy mx-auto mb-4"></div>
                                        <p className="text-gold-energy text-[9px] font-black tracking-widest uppercase">{t('dashboard_page.initializing', 'Initializing Discs...')}</p>
                                    </div>
                                ) : (
                                    <SecureAudioPlayer
                                        productId={activeItem._id}
                                        title={t('products.' + activeItem._id + '.title', activeItem.title)}
                                        chapters={fullProduct?.chapters || []}
                                    />
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {loading ? (
                        <div className="col-span-full py-40 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-energy mx-auto mb-4"></div>
                            <p className="text-gray-500 font-black tracking-widest uppercase text-[10px]">{t('dashboard_page.syncing', 'Synchronizing Library...')}</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="col-span-full py-40 text-center text-gray-700 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center">
                            <Lock className="w-12 h-12 mb-4 opacity-10" />
                            <p className="font-bold tracking-widest uppercase mb-4">{t('dashboard_page.no_assets', 'No Digital Assets Found')}</p>
                            <button
                                onClick={() => window.location.href = '/marketplace.html'}
                                className="text-gold-energy hover:underline font-black text-xs tracking-widest uppercase"
                            >
                                {t('dashboard_page.visit_marketplace', 'Visit Marketplace')}
                            </button>
                        </div>
                    ) : (
                        items.map(product => {
                            const progress = progressData[product._id];
                            const percent = progress ? Math.round((progress.progress / progress.total) * 100) : 0;

                            return (
                                <motion.div
                                    key={product._id}
                                    whileHover={{ y: -10 }}
                                    onClick={() => openContent(product)}
                                    className="group cursor-pointer bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] hover:bg-white/[0.05] hover:border-gold-energy/30 transition-all shadow-xl relative overflow-hidden"
                                >
                                    {/* Icon Glow */}
                                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-gold-energy/5 blur-3xl rounded-full" />

                                    <div className="aspect-[4/5] bg-black/40 rounded-[2rem] mb-8 flex items-center justify-center relative overflow-hidden border border-white/5 shadow-inner">
                                        {product.type === 'EBOOK' ?
                                            <Book className="w-16 h-16 text-gold-energy/20 group-hover:text-gold-energy/40 transition-colors" /> :
                                            <Headset className="w-16 h-16 text-gold-energy/20 group-hover:text-gold-energy/40 transition-colors" />
                                        }
                                        <div className="absolute top-6 right-6 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] uppercase border border-white/10 text-gold-energy shadow-lg">
                                            {product.type}
                                        </div>

                                        {percent > 0 && (
                                            <div className="absolute inset-x-6 bottom-6 flex flex-col gap-2">
                                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gold-energy" style={{ width: `${percent}%` }} />
                                                </div>
                                                <span className="text-[9px] font-black text-gold-energy tracking-widest">{percent}{t('dashboard_page.read_percent', '% READ')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative">
                                        <h3 className="text-xl font-black group-hover:text-gold-energy transition-colors leading-tight mb-2 tracking-tight">
                                            {t('products.' + product._id + '.title', product.title)}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('dashboard_page.secure_access', 'Secure Lifetime Access')}</p>
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold-energy group-hover:text-black transition-all">
                                                <Play size={14} fill="currentColor" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default LibraryDashboard;
