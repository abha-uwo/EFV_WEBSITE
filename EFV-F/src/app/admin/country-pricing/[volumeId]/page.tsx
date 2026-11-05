'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, Download, Check, X, ChevronLeft, Book, Search, Loader2,
    AlertCircle, Globe, FileSpreadsheet, RefreshCw, CheckCircle2,
    TrendingUp, TrendingDown, Minus, Info, Filter
} from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useParams } from 'next/navigation';

const API_URL = typeof window !== 'undefined' && (window as any).CONFIG
    ? (window as any).CONFIG.API_BASE_URL
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; text: string }> = {
        New:       { bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
        Updated:   { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
        'No Change': { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' },
        Error:     { bg: 'rgba(239,68,68,0.15)',  text: '#f87171' },
        Existing:  { bg: 'rgba(156,163,175,0.10)', text: '#6b7280' },
    };
    const style = map[status] || map.Existing;
    return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: style.bg, color: style.text }}>
            {status}
        </span>
    );
}

function DiffCell({ diff }: { diff: number | null }) {
    if (diff === null || diff === undefined) return <span className="text-gray-600">—</span>;
    if (diff === 0) return <span className="flex items-center gap-1 text-gray-500"><Minus className="w-3 h-3" />0</span>;
    if (diff > 0) return <span className="flex items-center gap-1 text-green-400"><TrendingUp className="w-3 h-3" />+{diff.toFixed(2)}</span>;
    return <span className="flex items-center gap-1 text-red-400"><TrendingDown className="w-3 h-3" />{diff.toFixed(2)}</span>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VolumePricingPage() {
    const params = useParams();
    const volumeId = params.volumeId as string;

    const [volume, setVolume] = useState<any>(null);
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importSummary, setImportSummary] = useState<any>(null);
    const [confirming, setConfirming] = useState(false);
    const [confirmSuccess, setConfirmSuccess] = useState(false);

    // Book list / filter
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formatFilter, setFormatFilter] = useState('All');
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    useEffect(() => { fetchVolumeDetails(); }, [volumeId]);

    const fetchVolumeDetails = async () => {
        setLoading(true); setError('');
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/pricing/volume/${volumeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVolume(res.data.volume);
            setBooks(res.data.books || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load volume details.');
        } finally {
            setLoading(false);
        }
    };

    // Drag & Drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            setFile(droppedFile);
            setPreviewData([]); setImportSummary(null); setSelectedBook(null);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setPreviewData([]); setImportSummary(null); setSelectedBook(null);
        }
    };

    const handleUploadPreview = async () => {
        if (!file) return;
        setUploading(true); setUploadProgress(5); setConfirmSuccess(false);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('volumeId', volumeId);

        const progressInterval = setInterval(() => {
            setUploadProgress(p => Math.min(p + 12, 85));
        }, 400);

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/pricing/import-volume`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            clearInterval(progressInterval);
            setUploadProgress(100);
            setPreviewData(res.data.preview || []);
            setImportSummary(res.data.summary);
        } catch (err: any) {
            clearInterval(progressInterval);
            setUploadProgress(0);
            alert(err.response?.data?.error || 'Failed to process Excel file.');
        } finally {
            setTimeout(() => setUploading(false), 600);
        }
    };

    const handleConfirmImport = async () => {
        if (!previewData.length) return;
        setConfirming(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/pricing/confirm`, {
                volumeId, previewData
            }, { headers: { Authorization: `Bearer ${token}` } });
            setConfirmSuccess(true);
            setTimeout(() => {
                setPreviewData([]); setImportSummary(null);
                setFile(null); if (fileInputRef.current) fileInputRef.current.value = '';
                setConfirmSuccess(false);
                fetchVolumeDetails();
            }, 1800);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to confirm import.');
        } finally {
            setConfirming(false);
        }
    };

    const resetImport = () => {
        setPreviewData([]); setImportSummary(null);
        setFile(null); if (fileInputRef.current) fileInputRef.current.value = '';
        setUploadProgress(0);
    };

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

    const formats = ['All', ...Array.from(new Set(books.map(b => b.type || 'Unknown')))];
    const filteredBooks = books.filter(b => {
        const matchSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchFormat = formatFilter === 'All' || b.type === formatFilter;
        return matchSearch && matchFormat;
    });

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center gap-4"
                style={{ background: 'linear-gradient(135deg, #0a0a0f, #0d1117, #0a0e1a)' }}>
                <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
                <p className="text-gray-500 text-sm">Loading volume details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center gap-4"
                style={{ background: 'linear-gradient(135deg, #0a0a0f, #0d1117, #0a0e1a)' }}>
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-red-400">{error}</p>
                <button onClick={fetchVolumeDetails} className="px-4 py-2 rounded-lg text-sm text-white"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Retry
                </button>
            </div>
        );
    }

    if (!volume) {
        return (
            <div className="min-h-screen flex justify-center items-center"
                style={{ background: 'linear-gradient(135deg, #0a0a0f, #0d1117)' }}>
                <p className="text-gray-500">Volume not found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white font-sans" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 40%, #0a0e1a 100%)',
        }}>
            {/* Ambient glow */}
            <div style={{ position:'fixed', top:'5%', right:'10%', width:500, height:500, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />
            <div style={{ position:'fixed', bottom:'10%', left:'5%', width:400, height:400, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Page Header ── */}
                <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
                    className="flex items-center gap-4 mb-8 pb-6"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                >
                    <Link href="/admin/country-pricing">
                        <motion.div whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>
                            <ChevronLeft className="w-5 h-5" />
                        </motion.div>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold" style={{
                            background: 'linear-gradient(90deg, #ffffff, #9ca3af)',
                            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
                        }}>
                            {volume.name}
                            <span className="ml-3 text-lg font-medium" style={{
                                background:'linear-gradient(90deg, #fbbf24, #f59e0b)',
                                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
                            }}>Country Pricing</span>
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Import and manage international pricing for all books in this volume.</p>
                    </div>
                    <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={fetchVolumeDetails}
                        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </motion.button>
                </motion.div>

                {/* ── Summary Cards ── */}
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
                >
                    {[
                        { label:'Total Books',     value: volume.bookCount ?? books.length, color:'#60a5fa' },
                        { label:'Countries',       value: volume.countryCount ?? 0,         color:'#34d399' },
                        { label:'Import Status',   value: volume.importStatus || 'Pending', color: volume.importStatus === 'Completed' ? '#34d399' : '#fbbf24' },
                        { label:'Last Updated',    value: volume.lastUpdated ? new Date(volume.lastUpdated).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : 'Never', color:'#a78bfa' },
                    ].map((s, i) => (
                        <div key={i} className="rounded-2xl p-4" style={{
                            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(10px)'
                        }}>
                            <div className="text-xs text-gray-500 mb-2">{s.label}</div>
                            <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                        </div>
                    ))}
                </motion.div>

                {/* ── Main 3-Column Layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ── LEFT: Upload Panel ── */}
                    <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15 }}
                        className="lg:col-span-3 space-y-4"
                    >
                        {/* Upload card */}
                        <div className="rounded-2xl overflow-hidden" style={{
                            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(12px)'
                        }}>
                            <div className="p-4 flex items-center justify-between" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4 text-yellow-400" />
                                    <h2 className="font-semibold text-sm">Import Excel</h2>
                                </div>
                                <a
                                    href={`${API_URL}/api/pricing/template/${encodeURIComponent(volume.name)}`}
                                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                                    style={{ background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.2)', color:'#60a5fa' }}
                                >
                                    <Download className="w-3 h-3" /> Template
                                </a>
                            </div>

                            <div className="p-4 space-y-3">
                                {/* Drop zone */}
                                <div
                                    ref={dropZoneRef}
                                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all"
                                    style={{
                                        border: `2px dashed ${isDragging ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                        background: isDragging ? 'rgba(251,191,36,0.04)' : 'rgba(0,0,0,0.2)',
                                        minHeight: 100
                                    }}
                                >
                                    <Upload className="w-6 h-6 text-gray-500 mb-2" />
                                    {file ? (
                                        <div className="text-center">
                                            <p className="text-yellow-400 text-xs font-medium truncate max-w-[160px]">{file.name}</p>
                                            <p className="text-gray-600 text-xs mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-gray-400 text-xs">Drop Excel file here</p>
                                            <p className="text-gray-600 text-xs mt-0.5">or click to browse</p>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>

                                {/* Progress bar */}
                                <AnimatePresence>
                                    {uploading && (
                                        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Parsing & validating...</span>
                                                <span className="text-yellow-400">{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full rounded-full h-1.5" style={{ background:'rgba(255,255,255,0.08)' }}>
                                                <motion.div
                                                    className="h-1.5 rounded-full"
                                                    style={{ background:'linear-gradient(90deg, #fbbf24, #f59e0b)', width:`${uploadProgress}%` }}
                                                    initial={{ width:0 }}
                                                    animate={{ width:`${uploadProgress}%` }}
                                                    transition={{ duration:0.4 }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Preview button */}
                                {file && !uploading && previewData.length === 0 && (
                                    <motion.button
                                        whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                                        onClick={handleUploadPreview}
                                        className="w-full py-2.5 rounded-xl font-bold text-sm text-black transition-all"
                                        style={{ background:'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
                                    >
                                        Generate Preview
                                    </motion.button>
                                )}
                            </div>

                            {/* Import Summary */}
                            <AnimatePresence>
                                {importSummary && (
                                    <motion.div
                                        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                                        className="mx-4 mb-4 p-4 rounded-xl space-y-3"
                                        style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)' }}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                            <Check className="w-4 h-4 text-green-400" /> Preview Ready
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                            {[
                                                { label:'Total Rows',  value: importSummary.totalRows,   color:'text-white'   },
                                                { label:'Valid',       value: importSummary.validRows,    color:'text-green-400' },
                                                { label:'Skipped',     value: importSummary.skippedRows || 0, color:'text-gray-500' },
                                                { label:'Errors',      value: importSummary.errorsFound,  color:'text-red-400' },
                                                { label:'Time',        value: importSummary.processingTime, color:'text-gray-400' },
                                            ].map((row, i) => (
                                                <div key={i} className="flex justify-between">
                                                    <span className="text-gray-500">{row.label}</span>
                                                    <span className={`font-semibold ${row.color}`}>{row.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {importSummary.validRows > 0 && (
                                            confirmSuccess ? (
                                                <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }}
                                                    className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                                    style={{ background:'rgba(52,211,153,0.15)', color:'#34d399', border:'1px solid rgba(52,211,153,0.3)' }}>
                                                    <CheckCircle2 className="w-4 h-4" /> Import Successful!
                                                </motion.div>
                                            ) : (
                                                <motion.button
                                                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                                                    onClick={handleConfirmImport}
                                                    disabled={confirming}
                                                    className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                                    style={{ background:'linear-gradient(135deg, #10b981, #059669)', color:'white' }}
                                                >
                                                    {confirming ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</> : '✓ Confirm Import'}
                                                </motion.button>
                                            )
                                        )}
                                        <button
                                            onClick={resetImport}
                                            className="w-full py-2 rounded-xl text-xs text-gray-500 hover:text-white transition-colors"
                                            style={{ border:'1px solid rgba(255,255,255,0.07)' }}
                                        >
                                            Cancel
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Tip */}
                        <div className="rounded-xl p-3 flex gap-2" style={{ background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.15)' }}>
                            <Info className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Upload <strong className="text-yellow-400">Volume {volume.name.match(/\d+/)?.[0]}</strong> Excel only.
                                Rows from other volumes are automatically skipped.
                            </p>
                        </div>
                    </motion.div>

                    {/* ── MIDDLE: Books List ── */}
                    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
                        className="lg:col-span-3"
                    >
                        <div className="rounded-2xl flex flex-col" style={{
                            background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                            backdropFilter:'blur(12px)', height: 720
                        }}>
                            <div className="p-4 space-y-3" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-sm flex items-center gap-2">
                                        <Book className="w-4 h-4 text-blue-400" /> Books
                                        <span className="text-xs text-gray-600 font-normal">({filteredBooks.length})</span>
                                    </h2>
                                </div>
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                    <input
                                        type="text" placeholder="Search title or SKU..."
                                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg focus:outline-none transition-all"
                                        style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', color:'white' }}
                                        onFocus={e => (e.target as HTMLElement).style.borderColor = 'rgba(251,191,36,0.4)'}
                                        onBlur={e => (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'}
                                    />
                                </div>
                                {formats.length > 1 && (
                                    <div className="flex gap-1.5 flex-wrap">
                                        {formats.map(f => (
                                            <button key={f} onClick={() => setFormatFilter(f)}
                                                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                                                style={{
                                                    background: formatFilter === f ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                                                    border: `1px solid ${formatFilter === f ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.07)'}`,
                                                    color: formatFilter === f ? '#fbbf24' : '#6b7280'
                                                }}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.1) transparent' }}>
                                {filteredBooks.length === 0 && (
                                    <div className="flex items-center justify-center h-full text-gray-600 text-sm">No books found.</div>
                                )}
                                {filteredBooks.map(book => {
                                    const previewRows = getBookPreview(book._id);
                                    const hasPreview = previewRows.length > 0;
                                    const hasErrors = previewRows.some(r => r.status === 'Error');
                                    const isSelected = selectedBook?._id === book._id;
                                    return (
                                        <motion.button
                                            key={book._id}
                                            whileHover={{ x: 3 }}
                                            onClick={() => setSelectedBook(book)}
                                            className="w-full text-left p-3 rounded-xl transition-all"
                                            style={{
                                                background: isSelected ? 'rgba(251,191,36,0.08)' : 'transparent',
                                                border: `1px solid ${isSelected ? 'rgba(251,191,36,0.25)' : 'transparent'}`,
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-medium text-xs leading-snug line-clamp-2 text-gray-200">{book.title}</span>
                                                {hasPreview && (
                                                    <span className="shrink-0 text-xs px-1.5 py-0.5 rounded"
                                                        style={{ background: hasErrors ? 'rgba(239,68,68,0.15)' : 'rgba(96,165,250,0.15)', color: hasErrors ? '#f87171' : '#60a5fa' }}>
                                                        {hasErrors ? 'Err' : 'Preview'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-gray-600 text-xs">{book.type}</span>
                                                <span className="text-gray-700 text-xs">•</span>
                                                <span className="text-gray-600 text-xs">{book.language || 'Hindi'}</span>
                                                {book.countryPricing && Object.keys(book.countryPricing).length > 0 && (
                                                    <>
                                                        <span className="text-gray-700 text-xs">•</span>
                                                        <span className="text-green-600 text-xs">{Object.keys(book.countryPricing).length} countries</span>
                                                    </>
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* ── RIGHT: Pricing Details ── */}
                    <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.25 }}
                        className="lg:col-span-6"
                    >
                        <AnimatePresence mode="wait">
                            {selectedBook ? (
                                <motion.div key={selectedBook._id}
                                    initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
                                    className="rounded-2xl flex flex-col overflow-hidden"
                                    style={{
                                        background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
                                        backdropFilter:'blur(12px)', height: 720
                                    }}
                                >
                                    {/* Book header */}
                                    <div className="p-5" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                                        <h2 className="text-base font-bold text-white mb-2 line-clamp-2">{selectedBook.title}</h2>
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                            <span><span className="text-gray-600">Format: </span>{selectedBook.type}</span>
                                            <span><span className="text-gray-600">Lang: </span>{selectedBook.language || 'Hindi'}</span>
                                            {selectedBook.sku && <span><span className="text-gray-600">SKU: </span>{selectedBook.sku}</span>}
                                            {selectedBook.isbn && <span><span className="text-gray-600">ISBN: </span>{selectedBook.isbn}</span>}
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="flex-1 overflow-auto" style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.1) transparent' }}>
                                        {(() => {
                                            const previewPricing = getBookPreview(selectedBook._id);
                                            const dbPricing = getBookDBPricing(selectedBook);
                                            const displayData = previewPricing.length > 0 ? previewPricing : dbPricing;

                                            if (displayData.length === 0) {
                                                return (
                                                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
                                                        <Globe className="w-12 h-12 opacity-20" />
                                                        <p className="text-sm">No pricing data available.<br /><span className="text-xs">Upload an Excel file to add country pricing.</span></p>
                                                    </div>
                                                );
                                            }

                                            const isPreviewMode = previewPricing.length > 0;

                                            return (
                                                <>
                                                    {isPreviewMode && (
                                                        <div className="flex items-center gap-2 px-5 py-2.5 text-xs"
                                                            style={{ background:'rgba(251,191,36,0.05)', borderBottom:'1px solid rgba(251,191,36,0.1)' }}>
                                                            <Info className="w-3.5 h-3.5 text-yellow-500" />
                                                            <span className="text-yellow-500/80">Showing import preview — confirm to apply changes.</span>
                                                        </div>
                                                    )}
                                                    <table className="w-full text-xs">
                                                        <thead style={{ background:'rgba(0,0,0,0.3)', position:'sticky', top:0 }}>
                                                            <tr>
                                                                {['Country', 'Currency', 'Current', 'Imported', 'Diff', 'Status'].map(h => (
                                                                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {displayData.map((row: any, i: number) => (
                                                                <motion.tr
                                                                    key={i}
                                                                    initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * 0.02 }}
                                                                    className="transition-colors"
                                                                    style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                                                >
                                                                    <td className="px-4 py-3 font-medium text-gray-200 whitespace-nowrap">{row.countryName}</td>
                                                                    <td className="px-4 py-3 text-gray-500">{row.currency}</td>
                                                                    <td className="px-4 py-3 text-gray-400">
                                                                        {row.currentPrice !== null && row.currentPrice !== undefined ? row.currentPrice : <span className="text-gray-700">—</span>}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-white font-semibold">
                                                                        {row.importedPrice !== null && row.importedPrice !== undefined ? row.importedPrice : <span className="text-gray-700">—</span>}
                                                                    </td>
                                                                    <td className="px-4 py-3"><DiffCell diff={row.difference} /></td>
                                                                    <td className="px-4 py-3">
                                                                        <StatusBadge status={row.status} />
                                                                        {row.errors?.length > 0 && (
                                                                            <div className="mt-1 text-red-500 text-xs leading-relaxed">
                                                                                {row.errors.map((e: string, idx: number) => <div key={idx}>{e}</div>)}
                                                                            </div>
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
                                <motion.div key="empty"
                                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                                    className="rounded-2xl flex flex-col items-center justify-center gap-4 text-center"
                                    style={{
                                        background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)',
                                        backdropFilter:'blur(12px)', height: 720
                                    }}
                                >
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                                        <Globe className="w-8 h-8 text-gray-700" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 font-medium">Select a Book</p>
                                        <p className="text-gray-700 text-sm mt-1">Choose a book from the list to view its country pricing details.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
