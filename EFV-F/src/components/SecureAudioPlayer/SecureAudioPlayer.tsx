'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import ResumeModal from '../Common/ResumeModal';
import { Play, Pause, SkipBack, SkipForward, Headphones, List, FastForward, Rewind, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Chapter {
    chapterNumber: number;
    title: string;
    filePath: string;
    duration?: number;
}

interface SecureAudioPlayerProps {
    productId: string;
    title: string;
    chapters: Chapter[];
    initialChapterIndex?: number;
    initialTime?: number;
}

const SecureAudioPlayer: React.FC<SecureAudioPlayerProps> = ({ productId, title, chapters, initialChapterIndex = 0 }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(initialChapterIndex);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showChapterList, setShowChapterList] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [lastSavedProgress, setLastSavedProgress] = useState<{ chapterIndex: number, time: number } | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://efv-b-246449377479.asia-south1.run.app';

    // Security: Toggle Global Security Layer
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('efv-enable-security'));
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        window.addEventListener('contextmenu', handleContextMenu);
        return () => {
            window.dispatchEvent(new CustomEvent('efv-disable-security'));
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    // Fetch initial progress if not provided
    useEffect(() => {
        const fetchRemoteProgress = async () => {
            try {
                const authStr = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
                const token = authStr ? (JSON.parse(authStr).token || localStorage.getItem('authToken')) : localStorage.getItem('authToken');
                if (!token) return;

                const { data } = await axios.get(`${API_URL}/api/audiobook-progress/${productId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (data && (data.currentChapterIndex > 0 || data.currentChapterTime > 10)) {
                    setLastSavedProgress({
                        chapterIndex: data.currentChapterIndex,
                        time: data.currentChapterTime
                    });
                    setShowResumeModal(true);
                }
                setIsReady(true);
            } catch (err) {
                console.error('Error fetching audio progress', err);
                setIsReady(true);
            }
        };
        fetchRemoteProgress();
    }, [productId, API_URL]);

    const saveProgress = useCallback(async (chapterIdx: number, time: number, completed = false) => {
        if (time < 5 && !completed) return;
        try {
            const authStr = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
            const token = authStr ? (JSON.parse(authStr).token || localStorage.getItem('authToken')) : localStorage.getItem('authToken');
            if (!token) return;

            await axios.post(`${API_URL}/api/audiobook-progress/${productId}`, {
                chapterIndex: chapterIdx,
                currentTime: time,
                duration: audioRef.current?.duration || 0,
                completed
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Error saving audio progress', err);
        }
    }, [productId, API_URL]);

    // Throttled progress saving
    useEffect(() => {
        if (!isReady || isPlaying === false) return;

        const interval = setInterval(() => {
            if (audioRef.current) {
                saveProgress(currentChapterIndex, audioRef.current.currentTime);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [isPlaying, currentChapterIndex, isReady, saveProgress]);

    const handleChapterChange = (index: number, startTime = 0) => {
        if (index < 0 || index >= chapters.length) return;

        // Save current before switching
        if (audioRef.current && audioRef.current.currentTime > 5) {
            saveProgress(currentChapterIndex, audioRef.current.currentTime);
        }

        setCurrentChapterIndex(index);
        setCurrentTime(startTime);
        setIsPlaying(true);
        if (audioRef.current) {
            audioRef.current.currentTime = startTime;
            // Next tick to ensure src is updated
            setTimeout(() => {
                audioRef.current?.play();
            }, 0);
        }
        setShowChapterList(false);
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            saveProgress(currentChapterIndex, audioRef.current.currentTime);
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        setCurrentTime(current);
        setDuration(total);
        if (total > 0) {
            setProgress((current / total) * 100);
        }

        // Auto-next chapter
        if (total > 0 && current >= total - 0.5) {
            if (currentChapterIndex < chapters.length - 1) {
                saveProgress(currentChapterIndex, current, true); // Mark completed
                handleChapterChange(currentChapterIndex + 1);
            } else {
                setIsPlaying(false);
                saveProgress(currentChapterIndex, current, true);
            }
        }
    };

    const formatTime = (time: number) => {
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    const changePlaybackRate = () => {
        const rates = [1, 1.25, 1.5, 2, 0.75];
        const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(nextRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextRate;
        }
    };

    // Construct Chapter Stream URL (Authenticated)
    const getStreamUrl = (chapterIdx: number) => {
        const authStr = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
        const token = authStr ? (JSON.parse(authStr).token || localStorage.getItem('authToken')) : (localStorage.getItem('authToken') || '');
        return `${API_URL}/api/content/chapter/${productId}/${chapterIdx}?token=${token}&lib=true`;
    };

    return (
        <div className="relative w-full max-w-6xl mx-auto h-[600px] md:h-[700px] bg-black rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row">

            <ResumeModal
                isOpen={showResumeModal}
                type="AUDIOBOOK"
                position={lastSavedProgress?.time || 0}
                onContinue={() => {
                    if (lastSavedProgress) {
                        setCurrentChapterIndex(lastSavedProgress.chapterIndex);
                        setTimeout(() => {
                            if (audioRef.current) {
                                audioRef.current.currentTime = lastSavedProgress.time;
                                audioRef.current.play();
                                setIsPlaying(true);
                            }
                        }, 500);
                    }
                    setShowResumeModal(false);
                }}
                onStartOver={() => {
                    setShowResumeModal(false);
                    if (audioRef.current) audioRef.current.play();
                    setIsPlaying(true);
                }}
            />

            {/* Side Panel: Chapter List */}
            <div className={`absolute md:relative z-30 w-full md:w-80 h-full bg-gray-900/90 md:bg-gray-900/50 backdrop-blur-3xl border-r border-white/5 transition-transform duration-500 ease-out ${showChapterList ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-8 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-gold-energy font-black text-xs tracking-[0.3em] uppercase">Chapters</h4>
                        <button onClick={() => setShowChapterList(false)} className="md:hidden text-gray-500"><ChevronRight className="rotate-180" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {chapters.map((ch, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleChapterChange(idx)}
                                className={`w-full text-left p-4 rounded-2xl mb-3 flex items-start gap-4 transition-all ${currentChapterIndex === idx ? 'bg-gold-energy/10 border border-gold-energy/20' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <span className={`text-[10px] font-black mt-1 ${currentChapterIndex === idx ? 'text-gold-energy' : 'text-gray-600'}`}>{String(idx + 1).padStart(2, '0')}</span>
                                <div className="flex-1">
                                    <h5 className={`text-sm font-bold leading-tight mb-1 ${currentChapterIndex === idx ? 'text-gold-energy' : 'text-gray-300'}`}>{ch.title}</h5>
                                    {ch.duration && <p className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">{formatTime(ch.duration)}</p>}
                                </div>
                                {currentChapterIndex === idx && <CheckCircle className="w-4 h-4 text-gold-energy" />}
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase mb-2">Overall Progress</p>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentChapterIndex + 1) / chapters.length) * 100}%` }}
                                className="h-full bg-gold-energy shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                            />
                        </div>
                        <p className="text-right mt-2 text-[10px] font-black text-gold-energy uppercase tracking-widest">{currentChapterIndex + 1} / {chapters.length} Chapters</p>
                    </div>
                </div>
            </div>

            {/* Main Player Area */}
            <div className="flex-1 h-full relative flex flex-col p-8 md:p-12">
                <div className="absolute top-0 right-0 p-8 md:hidden">
                    <button onClick={() => setShowChapterList(true)} className="p-4 bg-white/5 rounded-2xl text-gold-energy border border-white/10">
                        <List size={20} />
                    </button>
                </div>

                {/* Hero Section */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative w-48 h-48 md:w-80 md:h-80 mb-8 md:mb-12"
                    >
                        <div className="absolute inset-0 bg-gold-energy/20 blur-[120px] rounded-full animate-pulse" />
                        <div className="relative h-full w-full bg-gray-900 rounded-[3rem] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                            <Headphones size={160} className="text-gold-energy opacity-10 absolute" />
                            <motion.div
                                animate={isPlaying ? {
                                    scale: [1, 1.02, 1],
                                    rotate: [0, 2, -2, 0]
                                } : {}}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="z-10 p-8 md:p-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl"
                            >
                                <Play size={64} className="text-gold-energy" />
                            </motion.div>
                        </div>
                    </motion.div>

                    <h2 className="text-2xl md:text-4xl font-black text-white mb-2 md:mb-4 tracking-tighter uppercase leading-tight">{title}</h2>
                    <h4 className="text-gold-energy text-[10px] md:text-xs font-black tracking-[0.4em] uppercase opacity-70 mb-2">Chapter {currentChapterIndex + 1}</h4>
                    <p className="text-gray-400 font-bold max-w-sm md:max-w-md line-clamp-1 text-sm">{chapters[currentChapterIndex]?.title}</p>
                </div>

                <audio
                    ref={audioRef}
                    src={getStreamUrl(currentChapterIndex)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => {
                        if (audioRef.current) {
                            setDuration(audioRef.current.duration);
                            audioRef.current.playbackRate = playbackRate;
                        }
                    }}
                    className="hidden"
                    crossOrigin="anonymous"
                />

                {/* Player Controls Container */}
                <div className="w-full max-w-2xl mx-auto space-y-8 md:space-y-10">
                    {/* Progress */}
                    <div className="space-y-3">
                        <div className="relative w-full h-2 bg-white/5 rounded-full cursor-pointer group/seek overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-gold-energy shadow-[0_0_15px_rgba(212,175,55,0.6)] rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress || 0}
                                onChange={(e) => {
                                    if (audioRef.current) {
                                        const newTime = (parseFloat(e.target.value) / 100) * duration;
                                        audioRef.current.currentTime = newTime;
                                        setProgress(parseFloat(e.target.value));
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Main Actions */}
                    <div className="flex items-center justify-between gap-4 md:gap-6">
                        <button
                            onClick={changePlaybackRate}
                            className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/5 hover:bg-white/10 transition-colors"
                        >
                            <Clock size={16} className="text-gold-energy mb-0.5 md:mb-1" />
                            <span className="text-[9px] md:text-[10px] font-black text-white">{playbackRate}x</span>
                        </button>

                        <div className="flex items-center gap-6 md:gap-10">
                            <button
                                onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 15 }}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <Rewind className="w-5 h-5 md:w-6 md:h-6" />
                            </button>

                            <button
                                onClick={togglePlay}
                                className="w-20 h-20 md:w-24 md:h-24 bg-gold-energy rounded-full flex items-center justify-center text-black shadow-[0_20px_60px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all outline-none"
                            >
                                {isPlaying ? <Pause className="w-9 h-9 md:w-10 md:h-10" fill="currentColor" /> : <Play className="w-9 h-9 md:w-10 md:h-10 ml-1.5 md:ml-2" fill="currentColor" />}
                            </button>

                            <button
                                onClick={() => { if (audioRef.current) audioRef.current.currentTime += 15 }}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <FastForward className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            <button
                                onClick={() => handleChapterChange(currentChapterIndex - 1)}
                                disabled={currentChapterIndex === 0}
                                className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 disabled:opacity-20 hover:bg-white/10 transition-colors"
                            >
                                <SkipBack className="w-[18px] h-[18px] md:w-5 md:h-5 text-gray-400" />
                            </button>
                            <button
                                onClick={() => handleChapterChange(currentChapterIndex + 1)}
                                disabled={currentChapterIndex === chapters.length - 1}
                                className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 disabled:opacity-20 hover:bg-white/10 transition-colors"
                            >
                                <SkipForward className="w-[18px] h-[18px] md:w-5 md:h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer system text */}
                <div className="mt-auto pt-8 md:pt-10 text-center">
                    <p className="text-[8px] md:text-[9px] text-gray-800 font-black tracking-[0.6em] uppercase">SECURE ENCRYPTED AUDIO DISPENSARY • V2.0 PRO</p>
                </div>
            </div>
        </div>
    );
};

export default SecureAudioPlayer;
