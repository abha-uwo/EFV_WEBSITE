'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book, Globe, Clock, ArrowRight, Loader2, Upload, TrendingUp,
    BarChart3, RefreshCw, AlertCircle, X, CheckCircle2, FileSpreadsheet,
    ChevronDown, ChevronUp, AlertTriangle, Check, Search, TrendingDown,
    Minus, Filter, Info, Download
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

const API_URL =
    typeof window !== 'undefined' && (window as any).CONFIG
        ? (window as any).CONFIG.API_BASE_URL
        : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string }> = {
        New:         { bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
        Updated:     { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
        'No Change': { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' },
        Error:       { bg: 'rgba(239,68,68,0.15)',  text: '#f87171' },
        Existing:    { bg: 'rgba(156,163,175,0.10)', text: '#6b7280' },
    };
    const s = map[status] || map.Existing;
    return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{ background: s.bg, color: s.text }}>
            {status}
        </span>
    );
}

function DiffCell({ diff }: { diff: number | null }) {
    if (diff === null || diff === undefined) return <span className="text-gray-700">—</span>;
    if (diff === 0) return <span className="flex items-center gap-1 text-gray-500"><Minus className="w-3 h-3" />0</span>;
    if (diff > 0) return <span className="flex items-center gap-1 text-green-400"><TrendingUp className="w-3 h-3" />+{diff.toFixed(2)}</span>;
    return <span className="flex items-center gap-1 text-red-400"><TrendingDown className="w-3 h-3" />{diff.toFixed(2)}</span>;
}

// ── Full Import Modal ─────────────────────────────────────────────────────────
function ImportModal({
    volumes,
    onClose,
    onImported,
}: {
    volumes: any[];
    onClose: () => void;
    onImported: () => void;
}) {
    // Step: 'select' | 'import'
    const [step, setStep] = useState<'select' | 'import'>('select');
    const [selectedVolume, setSelectedVolume] = useState<any>(null);

    // Select-step state
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [expandedVolumes, setExpandedVolumes] = useState<Record<string, boolean>>({});
    const [volumeBooks, setVolumeBooks] = useState<Record<string, any[]>>({});
    const [loadingBooks, setLoadingBooks] = useState<Record<string, boolean>>({});

    // Import-step state
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importSummary, setImportSummary] = useState<any>(null);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [bookSearch, setBookSearch] = useState('');
    const [formatFilter, setFormatFilter] = useState('All');
    const [confirming, setConfirming] = useState(false);
    const [confirmSuccess, setConfirmSuccess] = useState(false);
    const [importError, setImportError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Select Step helpers ────────────────────────────────────────────────
    const filteredVolumes = volumes.filter(v => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;
        return v.name?.toLowerCase().includes(q) || String(v.volumeNumber).includes(q);
    });

    const toggleVolume = async (vol: any) => {
        const id = vol._id;
        setExpandedVolumes(prev => ({ ...prev, [id]: !prev[id] }));
        if (!volumeBooks[id] && !loadingBooks[id]) {
            setLoadingBooks(prev => ({ ...prev, [id]: true }));
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/api/pricing/volume/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setVolumeBooks(prev => ({ ...prev, [id]: res.data.books || [] }));
            } catch {
                setVolumeBooks(prev => ({ ...prev, [id]: [] }));
            } finally {
                setLoadingBooks(prev => ({ ...prev, [id]: false }));
            }
        }
    };

    const openImport = (vol: any) => {
        setSelectedVolume(vol);
        setStep('import');
        // reset import state
        setFile(null);
        setPreviewData([]);
        setImportSummary(null);
        setSelectedBook(null);
        setUploadProgress(0);
        setImportError('');
        setConfirmSuccess(false);
    };

    // ── Import Step helpers ────────────────────────────────────────────────
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
            setFile(f);
            setPreviewData([]); setImportSummary(null); setImportError('');
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setPreviewData([]); setImportSummary(null); setImportError('');
        }
    };

    const handlePreview = async () => {
        if (!file || !selectedVolume) return;
        setUploading(true); setUploadProgress(5); setImportError('');
        const interval = setInterval(() => setUploadProgress(p => Math.min(p + 12, 85)), 400);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const fd = new FormData();
            fd.append('file', file);
            fd.append('volumeId', selectedVolume._id);
            const res = await axios.post(`${API_URL}/api/pricing/import-volume`, fd, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            clearInterval(interval);
            setUploadProgress(100);
            setPreviewData(res.data.preview || []);
            setImportSummary(res.data.summary);
            // auto-select first book that has preview
            const firstBook = res.data.preview?.[0];
            if (firstBook) {
                const books = volumeBooks[selectedVolume._id] || [];
                const b = books.find((bk: any) => String(bk._id) === firstBook.productId);
                if (b) setSelectedBook(b);
            }
        } catch (err: any) {
            clearInterval(interval);
            setUploadProgress(0);
            setImportError(err.response?.data?.error || 'Failed to process the file.');
        } finally {
            setTimeout(() => setUploading(false), 600);
        }
    };

    const handleConfirm = async () => {
        if (!previewData.length || !selectedVolume) return;
        setConfirming(true); setImportError('');
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            await axios.post(`${API_URL}/api/pricing/confirm`, {
                volumeId: selectedVolume._id,
                previewData
            }, { headers: { Authorization: `Bearer ${token}` } });
            setConfirmSuccess(true);
            onImported();
            setTimeout(() => {
                setPreviewData([]); setImportSummary(null);
                setFile(null); if (fileInputRef.current) fileInputRef.current.value = '';
                setConfirmSuccess(false);
                setStep('select');
                setSelectedVolume(null);
            }, 1800);
        } catch (err: any) {
            setImportError(err.response?.data?.error || 'Failed to confirm import.');
        } finally {
            setConfirming(false);
        }
    };

    const resetImport = () => {
        setFile(null); if (fileInputRef.current) fileInputRef.current.value = '';
        setPreviewData([]); setImportSummary(null); setUploadProgress(0); setImportError('');
    };

    const books: any[] = volumeBooks[selectedVolume?._id] || [];
    const formats = ['All', ...Array.from(new Set(books.map((b: any) => b.type || 'Unknown')))];
    const filteredBooks = books.filter((b: any) => {
        const matchSearch = b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
            (b.sku || '').toLowerCase().includes(bookSearch.toLowerCase());
        const matchFormat = formatFilter === 'All' || b.type === formatFilter;
        return matchSearch && matchFormat;
    });

    const getBookPreview = (bookId: string) => previewData.filter(p => p.productId === bookId);
    const getBookDBPricing = (book: any) => {
        const pricing: any[] = [];
        if (book?.countryPricing) {
            for (const key of Object.keys(book.countryPricing)) {
                const cp = book.countryPricing[key];
                pricing.push({ countryName: cp.name || key, currency: cp.currency || 'INR', currentPrice: cp.price, status: 'Existing' });
            }
        }
        return pricing;
    };

    const panelStyle = {
        background: 'linear-gradient(145deg, #111218, #0d1117)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 30px 70px rgba(0,0,0,0.7)'
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-3"
                style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                    className="relative w-full flex flex-col rounded-2xl overflow-hidden"
                    style={{
                        ...panelStyle,
                        maxWidth: step === 'import' ? 1100 : 860,
                        maxHeight: '92vh',
                    }}
                >
                    {/* ── Modal Header ── */}
                    <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-3">
                            {step === 'import' && (
                                <button onClick={() => setStep('select')}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 text-gray-400 mr-1">
                                    <ArrowRight className="w-4 h-4 rotate-180" />
                                </button>
                            )}
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
                                <FileSpreadsheet className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">
                                    {step === 'select' ? 'Select Volume for Pricing Import' : `Import Pricing — ${selectedVolume?.name}`}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    {step === 'select'
                                        ? 'Choose a volume to upload its country pricing sheet'
                                        : 'Upload Excel → Preview → Confirm'
                                    }
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 text-gray-500">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* ── STEP 1: Volume Selection ── */}
                    {step === 'select' && (
                        <div className="flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
                            {/* Filters */}
                            <div className="px-6 py-4 flex gap-3 flex-wrap items-center flex-shrink-0"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="relative flex-1 min-w-[220px]">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                    <input
                                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search volumes..."
                                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
                                    />
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {['all', 'paperback', 'hardcover', 'ebook', 'audiobook'].map(f => (
                                        <button key={f} onClick={() => setActiveFilter(f)}
                                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                                            style={{
                                                background: activeFilter === f ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${activeFilter === f ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.07)'}`,
                                                color: activeFilter === f ? '#fbbf24' : '#6b7280'
                                            }}>
                                            {f === 'all' ? 'All Products' : f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Accordion List */}
                            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">
                                {filteredVolumes.length === 0 && (
                                    <div className="text-center py-16 text-gray-600 text-sm">No volumes found.</div>
                                )}
                                {filteredVolumes.map(vol => {
                                    const isExpanded = expandedVolumes[vol._id];
                                    const booksForVol: any[] = volumeBooks[vol._id] || [];
                                    const isLoadingVol = loadingBooks[vol._id];
                                    const isCompleted = vol.importStatus === 'Completed';
                                    const statusColor = isCompleted ? '#34d399' : '#fbbf24';

                                    // filter books by type if filter is set
                                    const displayBooks = activeFilter === 'all'
                                        ? booksForVol
                                        : booksForVol.filter((b: any) => (b.type || '').toLowerCase() === activeFilter);

                                    return (
                                        <div key={vol._id} className="rounded-xl overflow-hidden transition-all"
                                            style={{ border: `1px solid ${isExpanded ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                                            {/* Volume row */}
                                            <div className="flex items-center gap-4 p-4 cursor-pointer"
                                                style={{ background: isExpanded ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.02)' }}>
                                                {/* Top accent stripe */}
                                                <div className="w-1 h-10 rounded-full flex-shrink-0"
                                                    style={{ background: `linear-gradient(180deg, ${statusColor}, ${statusColor}60)` }} />
                                                <div className="flex-1 min-w-0" onClick={() => toggleVolume(vol)}>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-semibold text-white text-sm">{vol.name}</span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                                            style={{ background: `${statusColor}15`, color: statusColor }}>
                                                            {vol.importStatus || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span><Book className="inline w-3 h-3 mr-1" />{vol.bookCount || 0} books</span>
                                                        <span><Globe className="inline w-3 h-3 mr-1" />{vol.countryCount || 0} countries</span>
                                                        {vol.lastUpdated && <span><Clock className="inline w-3 h-3 mr-1" />{new Date(vol.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <motion.button
                                                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                                        onClick={() => openImport(vol)}
                                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                                                        style={{
                                                            background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
                                                            border: '1px solid rgba(251,191,36,0.3)',
                                                            color: '#fbbf24'
                                                        }}>
                                                        <Upload className="w-3.5 h-3.5" />
                                                        Upload Sheet
                                                    </motion.button>
                                                    <button onClick={() => toggleVolume(vol)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all text-gray-500">
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expanded book list */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                                                    >
                                                        <div className="p-3">
                                                            {isLoadingVol ? (
                                                                <div className="flex items-center gap-2 justify-center py-6 text-gray-600 text-xs">
                                                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading books...
                                                                </div>
                                                            ) : displayBooks.length === 0 ? (
                                                                <p className="text-center py-6 text-gray-700 text-xs">No books found.</p>
                                                            ) : (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {displayBooks.map((book: any) => {
                                                                        const countries = book.countryPricing ? Object.keys(book.countryPricing).length : 0;
                                                                        return (
                                                                            <div key={book._id}
                                                                                className="flex items-start gap-3 p-3 rounded-lg"
                                                                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                                                    style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.15)' }}>
                                                                                    <Book className="w-3.5 h-3.5 text-blue-400" />
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <p className="text-xs font-medium text-gray-200 leading-snug line-clamp-2">{book.title}</p>
                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                        <span className="text-xs text-gray-600">{book.type}</span>
                                                                                        <span className="text-gray-700">·</span>
                                                                                        <span className="text-xs text-gray-600">{book.language || 'Hindi'}</span>
                                                                                        {countries > 0 && <>
                                                                                            <span className="text-gray-700">·</span>
                                                                                            <span className="text-xs text-green-600">{countries} countries</span>
                                                                                        </>}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Import Sheet for Selected Volume ── */}
                    {step === 'import' && selectedVolume && (
                        <div className="flex overflow-hidden flex-1" style={{ minHeight: 0, maxHeight: 'calc(92vh - 73px)' }}>

                            {/* LEFT: Upload + Book List */}
                            <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
                                style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>

                                {/* Upload Card */}
                                <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="w-4 h-4 text-green-400" />
                                            <span className="text-sm font-semibold">Upload Excel</span>
                                        </div>
                                    </div>

                                    {/* Drop zone */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        className="flex flex-col items-center justify-center py-6 rounded-xl cursor-pointer transition-all"
                                        style={{
                                            border: `2px dashed ${isDragging ? 'rgba(251,191,36,0.6)' : file ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                            background: isDragging ? 'rgba(251,191,36,0.04)' : 'rgba(0,0,0,0.2)',
                                            minHeight: 90
                                        }}>
                                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
                                        {file ? (
                                            <>
                                                <Check className="w-5 h-5 text-green-400 mb-1.5" />
                                                <p className="text-green-400 text-xs font-medium text-center px-2 line-clamp-2">{file.name}</p>
                                                <p className="text-gray-600 text-xs mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-5 h-5 text-gray-600 mb-1.5" />
                                                <p className="text-gray-400 text-xs">Drop .xlsx file here</p>
                                                <p className="text-gray-600 text-xs mt-0.5">or click to browse</p>
                                            </>
                                        )}
                                    </div>

                                    {/* Progress bar */}
                                    <AnimatePresence>
                                        {uploading && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }} className="mt-3">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Processing…</span>
                                                    <span className="text-yellow-400">{uploadProgress}%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                                    <motion.div className="h-1.5 rounded-full"
                                                        style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', width: `${uploadProgress}%` }}
                                                        animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.4 }} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Preview button */}
                                    {file && !uploading && previewData.length === 0 && (
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={handlePreview}
                                            className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm text-black"
                                            style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                                            Generate Preview
                                        </motion.button>
                                    )}

                                    {/* Error */}
                                    {importError && (
                                        <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs text-red-400"
                                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                            {importError}
                                        </div>
                                    )}
                                </div>

                                {/* Import Summary */}
                                <AnimatePresence>
                                    {importSummary && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="mx-3 mt-3 p-3 rounded-xl flex-shrink-0"
                                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2">
                                                <Check className="w-3.5 h-3.5 text-green-400" /> Preview Ready
                                            </div>
                                            <div className="space-y-1.5 text-xs">
                                                {[
                                                    { label: 'Total Rows', value: importSummary.totalRows, color: 'text-white' },
                                                    { label: 'Valid', value: importSummary.validRows, color: 'text-green-400' },
                                                    { label: 'Skipped', value: importSummary.skippedRows || 0, color: 'text-gray-500' },
                                                    { label: 'Errors', value: importSummary.errorsFound, color: 'text-red-400' },
                                                ].map((r, i) => (
                                                    <div key={i} className="flex justify-between">
                                                        <span className="text-gray-500">{r.label}</span>
                                                        <span className={`font-semibold ${r.color}`}>{r.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                {importSummary.validRows > 0 && (
                                                    confirmSuccess ? (
                                                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                                                            className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                                                            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Import Successful!
                                                        </motion.div>
                                                    ) : (
                                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                            onClick={handleConfirm} disabled={confirming}
                                                            className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                                                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
                                                            {confirming ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Confirming…</> : '✓ Confirm Import'}
                                                        </motion.button>
                                                    )
                                                )}
                                                <button onClick={resetImport}
                                                    className="w-full py-2 rounded-xl text-xs text-gray-600 hover:text-gray-400 transition-colors"
                                                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                                                    Cancel / Re-upload
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Tip */}
                                <div className="mx-3 mt-3 mb-3 rounded-xl p-3 flex gap-2 flex-shrink-0"
                                    style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.12)' }}>
                                    <Info className="w-3.5 h-3.5 text-yellow-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        Upload <strong className="text-yellow-500">{selectedVolume.name}</strong> Excel only. Other volume rows are auto-skipped.
                                    </p>
                                </div>

                                {/* Book List */}
                                {books.length > 0 && (
                                    <div className="flex flex-col flex-1 overflow-hidden mx-3 mb-3 rounded-xl"
                                        style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', minHeight: 0 }}>
                                        <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Book className="w-3.5 h-3.5 text-blue-400" />
                                                <span className="text-xs font-semibold">Volume Books</span>
                                            </div>
                                            <div className="relative">
                                                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                                                <input value={bookSearch} onChange={e => setBookSearch(e.target.value)}
                                                    placeholder="Search books..."
                                                    className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg focus:outline-none"
                                                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', color: 'white' }} />
                                            </div>
                                            {formats.length > 1 && (
                                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                                    {formats.map(f => (
                                                        <button key={f} onClick={() => setFormatFilter(f)}
                                                            className="px-2 py-0.5 rounded-full text-xs transition-all"
                                                            style={{
                                                                background: formatFilter === f ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                                                                border: `1px solid ${formatFilter === f ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                                                color: formatFilter === f ? '#fbbf24' : '#6b7280'
                                                            }}>
                                                            {f}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                            {filteredBooks.map((book: any) => {
                                                const previewRows = getBookPreview(book._id);
                                                const hasPreview = previewRows.length > 0;
                                                const hasErrors = previewRows.some((r: any) => r.status === 'Error');
                                                const isSelected = selectedBook?._id === book._id;
                                                return (
                                                    <button key={book._id} onClick={() => setSelectedBook(book)}
                                                        className="w-full text-left p-2.5 rounded-lg transition-all"
                                                        style={{
                                                            background: isSelected ? 'rgba(251,191,36,0.08)' : 'transparent',
                                                            border: `1px solid ${isSelected ? 'rgba(251,191,36,0.2)' : 'transparent'}`,
                                                        }}>
                                                        <div className="flex items-start justify-between gap-1.5">
                                                            <span className="text-xs font-medium text-gray-200 leading-snug line-clamp-2">{book.title}</span>
                                                            {hasPreview && (
                                                                <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                                                                    style={{ background: hasErrors ? 'rgba(239,68,68,0.12)' : 'rgba(96,165,250,0.12)', color: hasErrors ? '#f87171' : '#60a5fa' }}>
                                                                    {hasErrors ? 'Err' : '✓'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1.5 mt-1 text-xs text-gray-600">
                                                            <span>{book.type}</span>
                                                            <span>·</span>
                                                            <span>{book.language || 'Hindi'}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: Pricing Preview Table */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {selectedBook ? (
                                    <motion.div key={selectedBook._id}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col h-full overflow-hidden">
                                        {/* Book header */}
                                        <div className="px-6 py-4 flex-shrink-0"
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <h3 className="text-base font-bold text-white mb-1.5 line-clamp-2">{selectedBook.title}</h3>
                                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                <span><span className="text-gray-600">Format: </span>{selectedBook.type}</span>
                                                <span><span className="text-gray-600">Lang: </span>{selectedBook.language || 'Hindi'}</span>
                                                {selectedBook.sku && <span><span className="text-gray-600">SKU: </span>{selectedBook.sku}</span>}
                                                {selectedBook.isbn && <span><span className="text-gray-600">ISBN: </span>{selectedBook.isbn}</span>}
                                            </div>
                                        </div>

                                        {/* Table */}
                                        <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                                            {(() => {
                                                const previewPricing = getBookPreview(selectedBook._id);
                                                const dbPricing = getBookDBPricing(selectedBook);
                                                const displayData = previewPricing.length > 0 ? previewPricing : dbPricing;

                                                if (displayData.length === 0) return (
                                                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
                                                        <Globe className="w-12 h-12 opacity-20" />
                                                        <p className="text-sm text-center">No pricing data.<br /><span className="text-xs">Upload an Excel to add pricing.</span></p>
                                                    </div>
                                                );

                                                const isPreviewMode = previewPricing.length > 0;
                                                return (
                                                    <>
                                                        {isPreviewMode && (
                                                            <div className="flex items-center gap-2 px-6 py-2.5 text-xs"
                                                                style={{ background: 'rgba(251,191,36,0.05)', borderBottom: '1px solid rgba(251,191,36,0.1)' }}>
                                                                <Info className="w-3.5 h-3.5 text-yellow-500" />
                                                                <span className="text-yellow-500/80">Import preview — confirm on the left to apply changes.</span>
                                                            </div>
                                                        )}
                                                        <table className="w-full text-xs">
                                                            <thead style={{ background: 'rgba(0,0,0,0.35)', position: 'sticky', top: 0, zIndex: 5 }}>
                                                                <tr>
                                                                    {['Country', 'Currency', 'Current', 'Imported', 'Diff', 'Status'].map(h => (
                                                                        <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider whitespace-nowrap"
                                                                            style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem' }}>
                                                                            {h}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {displayData.map((row: any, i: number) => (
                                                                    <motion.tr key={i}
                                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                                                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                                                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                                                        <td className="px-4 py-3 font-medium text-gray-200 whitespace-nowrap">{row.countryName}</td>
                                                                        <td className="px-4 py-3 text-gray-500">{row.currency}</td>
                                                                        <td className="px-4 py-3 text-gray-400">{row.currentPrice !== null && row.currentPrice !== undefined ? row.currentPrice : <span className="text-gray-700">—</span>}</td>
                                                                        <td className="px-4 py-3 text-white font-semibold">{row.importedPrice !== null && row.importedPrice !== undefined ? row.importedPrice : <span className="text-gray-700">—</span>}</td>
                                                                        <td className="px-4 py-3"><DiffCell diff={row.difference} /></td>
                                                                        <td className="px-4 py-3">
                                                                            <StatusBadge status={row.status} />
                                                                            {row.errors?.length > 0 && (
                                                                                <div className="mt-1 text-red-500 text-xs">{row.errors.join(', ')}</div>
                                                                            )}
                                                                        </td>
                                                                    </motion.tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <Globe className="w-8 h-8 text-gray-700" />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 font-medium">Select a Book</p>
                                            <p className="text-gray-700 text-sm mt-1">
                                                {previewData.length > 0
                                                    ? 'Choose a book from the list to view its imported pricing preview.'
                                                    : 'Upload an Excel file first, then select a book to see pricing.'}
                                            </p>
                                        </div>
                                        {!file && (
                                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
                                                    border: '1px solid rgba(251,191,36,0.3)',
                                                    color: '#fbbf24'
                                                }}>
                                                <Upload className="w-4 h-4" /> Upload Sheet
                                            </motion.button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function CountryPricingDashboard() {
    const [volumes, setVolumes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => { fetchVolumes(); }, []);

    const fetchVolumes = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setError('No admin authentication token found. Please log into the Admin Dashboard first.');
                return;
            }
            const res = await axios.get(`${API_URL}/api/pricing/volumes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVolumes(res.data || []);
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError('Session expired or unauthorized (401). Please log into the Admin Dashboard.');
            } else {
                setError(err.response?.data?.error || err.response?.data?.message || 'Failed to load volumes. Is the backend running?');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const totalBooks = volumes.reduce((a, v) => a + (v.bookCount || 0), 0);
    const totalCountries = volumes.reduce((a, v) => a + (v.countryCount || 0), 0);
    const completed = volumes.filter(v => v.importStatus === 'Completed').length;

    return (
        <div className="min-h-screen text-white font-sans" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 40%, #0a0e1a 100%)',
        }}>
            {/* Ambient glow */}
            <div style={{ position: 'fixed', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

                {/* ── Header ── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))', border: '1px solid rgba(251,191,36,0.3)' }}>
                                <Globe className="w-5 h-5 text-yellow-400" />
                            </div>
                            <h1 className="text-3xl font-bold" style={{
                                background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fde68a)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                            }}>
                                Country Pricing Management
                            </h1>
                        </div>
                        <p className="text-gray-400 text-sm ml-13">Manage international book pricing across all volumes and regions.</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* ── Upload Sheet Button ── */}
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setShowUpload(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,191,36,0.06))',
                                border: '1px solid rgba(251,191,36,0.4)',
                                color: '#fbbf24',
                                boxShadow: '0 0 20px rgba(251,191,36,0.1)'
                            }}>
                            <FileSpreadsheet className="w-4 h-4" />
                            Upload Sheet
                        </motion.button>

                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => fetchVolumes(true)} disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </motion.button>
                        <Link href="/pages/admin-dashboard.html">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 rounded-xl text-sm font-medium"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                ← Admin Dashboard
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* ── Stats Row ── */}
                {!loading && !error && (
                    <motion.div initial="hidden" animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        {[
                            { label: 'Total Volumes', value: volumes.length, icon: Book, color: '#fbbf24' },
                            { label: 'Total Books', value: totalBooks, icon: BarChart3, color: '#60a5fa' },
                            { label: 'Countries Covered', value: totalCountries, icon: Globe, color: '#34d399' },
                            { label: 'Imported', value: completed, icon: TrendingUp, color: '#a78bfa' },
                        ].map((stat, i) => (
                            <motion.div key={i} variants={cardVariants}
                                className="rounded-2xl p-4"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                                        <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                                    </div>
                                    <span className="text-gray-400 text-xs">{stat.label}</span>
                                </div>
                                <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* ── States ── */}
                {loading && (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
                        <p className="text-gray-500 text-sm">Loading volumes...</p>
                    </div>
                )}

                {error && !loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertCircle className="w-7 h-7 text-red-400" />
                        </div>
                        <p className="text-red-400 font-medium max-w-md">{error}</p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => fetchVolumes()} className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                Try Again
                            </button>
                            <Link href="/pages/admin-dashboard.html">
                                <span className="inline-block px-4 py-2 rounded-lg text-sm bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition-colors cursor-pointer">
                                    Admin Dashboard Login →
                                </span>
                            </Link>
                        </div>
                    </motion.div>
                )}

                {!loading && !error && volumes.length === 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-64 gap-4"
                        style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.07)' }}>
                        <Globe className="w-14 h-14 text-gray-700" />
                        <p className="text-gray-500">No volumes found. Add products to get started.</p>
                    </motion.div>
                )}

                {/* ── Volume Grid ── */}
                {!loading && !error && volumes.length > 0 && (
                    <motion.div
                        initial="hidden" animate="visible"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {volumes.map((vol, i) => {
                            const isCompleted = vol.importStatus === 'Completed';
                            return (
                                <motion.div key={vol._id || vol.volumeNumber || i}
                                    variants={cardVariants}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className="rounded-2xl flex flex-col group cursor-pointer overflow-hidden"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(12px)',
                                        transition: 'border-color 0.3s, box-shadow 0.3s'
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(251,191,36,0.25)';
                                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(251,191,36,0.07)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                                    }}>
                                    {/* Top accent */}
                                    <div className="h-1 w-full" style={{
                                        background: isCompleted
                                            ? 'linear-gradient(90deg, #10b981, #34d399)'
                                            : 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                    }} />

                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                                    style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)' }}>
                                                    <Book className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h2 className="font-bold text-lg text-white leading-tight">{vol.name}</h2>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCompleted ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>
                                                        {vol.importStatus || 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-5">
                                            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5"><Book className="w-3 h-3" /> Books</div>
                                                <div className="text-xl font-bold text-white">{vol.bookCount ?? 0}</div>
                                            </div>
                                            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1.5"><Globe className="w-3 h-3" /> Countries</div>
                                                <div className="text-xl font-bold text-white">{vol.countryCount ?? 0}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-gray-600 text-xs mb-5">
                                            <Clock className="w-3 h-3" />
                                            {vol.lastUpdated
                                                ? `Updated ${new Date(vol.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                : 'Never imported'}
                                        </div>

                                        <div className="mt-auto flex gap-2">
                                            {/* Quick upload for this volume */}
                                            <motion.button
                                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                                onClick={e => { e.stopPropagation(); setShowUpload(true); }}
                                                className="flex-shrink-0 px-3 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all"
                                                style={{
                                                    background: 'rgba(251,191,36,0.07)',
                                                    border: '1px solid rgba(251,191,36,0.18)',
                                                    color: '#fbbf24'
                                                }}>
                                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                                Upload
                                            </motion.button>

                                            <Link href={`/admin/country-pricing/${vol._id}`} className="flex-1">
                                                <motion.div whileHover={{ x: 4 }}
                                                    className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
                                                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                                                    <Upload className="w-4 h-4" />
                                                    Manage Pricing
                                                    <ArrowRight className="w-4 h-4 ml-auto" />
                                                </motion.div>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {/* ── Full Import Modal ── */}
            {showUpload && (
                <ImportModal
                    volumes={volumes}
                    onClose={() => setShowUpload(false)}
                    onImported={() => fetchVolumes(true)}
                />
            )}
        </div>
    );
}
