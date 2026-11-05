'use client';

import { useEffect } from 'react';

/**
 * useSecurity Hook
 * Implements frontend barriers to discourage content theft.
 */
export const useSecurity = () => {
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Block Print (Ctrl+P)
            if (e.ctrlKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                return;
            }

            // Block Save (Ctrl+S)
            if (e.ctrlKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                return;
            }

            // Block Inspect / Source (Ctrl+U, F12)
            if ((e.ctrlKey && e.key.toLowerCase() === 'u') || e.key === 'F12') {
                e.preventDefault();
                return;
            }

            // Block Copy (Ctrl+C) - though canvas has no text, this is a safety layer
            if (e.ctrlKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                return;
            }
        };

        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
        };

        // Detect Print Screen
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') {
                navigator.clipboard.writeText(''); // Clear clipboard immediately
                alert('Screen capture is restricted for this content.');
            }
        };

        // Detect Window Blur (Potential Screen Recording or Tab Switching)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // You could trigger a blur overlay here
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('copy', handleCopy);
        window.addEventListener('keyup', handleKeyUp);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('copy', handleCopy);
            window.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);
};
