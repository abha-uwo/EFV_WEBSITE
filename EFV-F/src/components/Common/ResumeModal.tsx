'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, BookOpen, RotateCcw, ArrowRightCircle } from 'lucide-react';

interface ResumeModalProps {
    isOpen: boolean;
    type: 'EBOOK' | 'AUDIOBOOK';
    position: number;
    onContinue: () => void;
    onStartOver: () => void;
}

const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, type, position, onContinue, onStartOver }) => {
    if (!isOpen) return null;

    const isAudio = type === 'AUDIOBOOK';

    // Format position
    const formattedPosition = isAudio
        ? `${Math.floor(position / 60)}:${String(Math.floor(position % 60)).padStart(2, '0')} minutes`
        : `Page ${position}`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-[0_0_50px_rgba(212,175,55,0.1)] relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-gold-energy/10 blur-[80px] rounded-full" />

                    <div className="relative text-center">
                        <div className="w-20 h-20 bg-gold-energy/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-energy/20">
                            {isAudio ? (
                                <PlayCircle className="w-10 h-10 text-gold-energy" />
                            ) : (
                                <BookOpen className="w-10 h-10 text-gold-energy" />
                            )}
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">WELCOME BACK</h2>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            You last {isAudio ? 'listened to' : 'read'} up to <span className="text-gold-energy font-bold">{formattedPosition}</span>.
                            Would you like to continue?
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onContinue}
                                className="group flex items-center justify-center gap-3 w-full bg-gold-energy text-black py-4 rounded-2xl font-black hover:bg-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                            >
                                CONTINUE {isAudio ? 'LISTENING' : 'READING'}
                                <ArrowRightCircle className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={onStartOver}
                                className="group flex items-center justify-center gap-3 w-full bg-white/5 text-gray-400 py-4 rounded-2xl font-bold hover:bg-white/10 hover:text-white transition-all"
                            >
                                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
                                START FROM BEGINNING
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ResumeModal;
