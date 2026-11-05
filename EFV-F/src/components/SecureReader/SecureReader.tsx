'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import axios from 'axios';

// Set worker path inside component or check for window to avoid SSR errors
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}
import ResumeModal from '../Common/ResumeModal';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface SecureReaderProps {
    fileUrl: string;
    userEmail: string;
    productId: string;
}

const SecureReader: React.FC<SecureReaderProps> = ({ fileUrl, userEmail, productId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastReadPage, setLastReadPage] = useState<number | null>(null);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [scale, setScale] = useState(1.5);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isReady, setIsReady] = useState(false); // Blocks saving until initial check

    // Security: Toggle Global Security Layer & Disable local Right-click/Shortcuts
    useEffect(() => {
        // Enable Security
        window.dispatchEvent(new CustomEvent('efv-enable-security'));

        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            // Disable Ctrl+P, Ctrl+S, Ctrl+C, Ctrl+U, F12
            if (
                (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'c' || e.key === 'u')) ||
                e.key === 'F12'
            ) {
                e.preventDefault();
            }
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            // Disable Security
            window.dispatchEvent(new CustomEvent('efv-disable-security'));
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Fetch saved progress on mount
    useEffect(() => {
        const fetchProgress = async () => {
            if (!productId || !userEmail) return;

            try {
                const authStr = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
                const token = authStr ? (JSON.parse(authStr).token || localStorage.getItem('authToken')) : localStorage.getItem('authToken');
                if (!token) return;

                // Use simple relative path or environment variable in production
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://efv-b-246449377479.asia-south1.run.app';

                const { data } = await axios.get(`${API_URL}/api/library/progress/${productId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (data && data.progress > 1) {
                    console.log(`[SECURE READER] Found saved progress: Page ${data.progress}`);
                    setLastReadPage(data.progress);
                    setShowResumeModal(true);
                }
                setIsReady(true);
            } catch (err) {
                console.error('[SECURE READER] Error fetching progress:', err);
                setIsReady(true);
            }
        };
        fetchProgress();
    }, [productId, userEmail]);

    // Helper to save progress
    const saveProgress = useCallback(async (page: number) => {
        if (page <= 1 || numPages <= 0) return;

        try {
            const authStr = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
            const token = authStr ? (JSON.parse(authStr).token || localStorage.getItem('authToken')) : localStorage.getItem('authToken');
            if (!token) return;

            const API_URL = process.env.NEXT_PUBLIC_API_URL;

            console.log(`[SECURE READER] Auto-saving progress: Page ${page}/${numPages}`);
            await axios.post(`${API_URL}/api/library/progress`, {
                productId,
                progress: page,
                total: numPages
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error('[SECURE READER] Error saving progress:', err);
        }
    }, [productId, numPages]);

    // Save progress when page changes (Debounced)
    useEffect(() => {
        // Don't save if we're not ready, showing the resume modal, or if pages haven't loaded
        if (!isReady || showResumeModal || numPages === 0) return;

        const timer = setTimeout(() => {
            saveProgress(currentPage);
        }, 1000); // reduced debounce from 2s to 1s for better responsiveness

        return () => {
            clearTimeout(timer);
            // On unmount/change, save immediately if significant progress
            if (isReady && !showResumeModal && currentPage > 1) {
                saveProgress(currentPage);
            }
        };
    }, [currentPage, productId, numPages, showResumeModal, isReady, saveProgress]);

    useEffect(() => {
        const loadPage = async () => {
            setLoading(true);
            try {
                const loadingTask = pdfjs.getDocument({
                    url: fileUrl,
                    withCredentials: true,
                });
                const pdf = await loadingTask.promise;
                setNumPages(pdf.numPages);

                const safePage = Math.min(Math.max(currentPage, 1), pdf.numPages);
                const page = await pdf.getPage(safePage);
                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const renderContext: any = {
                    canvasContext: context,
                    viewport: viewport,
                };
                await page.render(renderContext).promise;
            } catch (error) {
                console.error('Error loading PDF:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [fileUrl, currentPage, scale]);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative flex flex-col items-center bg-black transition-all duration-700 ${isFullscreen ? 'p-0 w-screen h-screen' : 'p-6 rounded-[2rem] border border-white/5 shadow-2xl'}`}
        >
            <ResumeModal
                isOpen={showResumeModal}
                type="EBOOK"
                position={lastReadPage || 1}
                onContinue={() => {
                    setCurrentPage(lastReadPage || 1);
                    setShowResumeModal(false);
                }}
                onStartOver={() => {
                    setCurrentPage(1);
                    setShowResumeModal(false);
                }}
            />

            {/* Header Controls (Distraction Free) */}
            <div className="w-full flex justify-between items-center mb-6 px-4 py-2 bg-white/5 rounded-2xl backdrop-blur-md border border-white/5">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-black tracking-widest text-gold-energy uppercase">READER MODE</span>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-tighter">EFV DIGITAL SYSTEM</span>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400"><ZoomOut size={16} /></button>
                    <span className="text-[10px] font-bold text-white w-12 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400"><ZoomIn size={16} /></button>
                    <div className="h-4 w-[1px] bg-white/10 mx-2" />
                    <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gold-energy">
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[60] backdrop-blur-sm">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gold-energy mx-auto mb-4"></div>
                        <p className="text-gold-energy text-xs font-black tracking-[0.2em] animate-pulse">DECRYPTING CONTENT</p>
                    </div>
                </div>
            )}

            {/* Secure Canvas Wrapper */}
            <div className={`relative flex-1 flex items-center justify-center overflow-auto w-full scrollbar-hide select-none`}>
                <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10">
                    <canvas ref={canvasRef} className="max-w-full h-auto cursor-default pointer-events-none" />

                    {/* Security Overlay (Blocks inspection of canvas data) */}
                    <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden">
                        <div className="rotate-[-45deg] whitespace-nowrap text-[8vw] font-black text-white pointer-events-none">
                            {userEmail} {userEmail} {userEmail}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-8 w-full flex flex-col items-center gap-4">
                {/* Progress Bar */}
                <div className="w-full max-w-2xl h-1.5 bg-white/5 rounded-full overflow-hidden relative group">
                    <div
                        className="h-full bg-gradient-to-r from-gold-energy to-white transition-all duration-500 ease-out"
                        style={{ width: `${(currentPage / numPages) * 100}%` }}
                    />
                </div>

                <div className="flex items-center gap-8">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-gold-energy hover:text-black disabled:opacity-20 transition-all group"
                    >
                        <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white">{currentPage} <span className="text-gray-600 text-lg">/ {numPages}</span></span>
                        <span className="text-[10px] text-gold-energy font-bold tracking-[0.2em]">{Math.round((currentPage / numPages) * 100)}% COMPLETE</span>
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                        disabled={currentPage === numPages}
                        className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-gold-energy hover:text-black disabled:opacity-20 transition-all group"
                    >
                        <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SecureReader;
