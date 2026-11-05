'use client';

import React, { useEffect, useState, useCallback } from 'react';

const SecurityLayer: React.FC = () => {
    const [isTampered, setIsTampered] = useState(false);
    const [isActive, setIsActive] = useState(false); // Default OFF
    const [userData, setUserData] = useState({ name: 'User', email: 'N/A', id: 'N/A', ip: '0.0.0.0' });
    const [watermarkTime, setWatermarkTime] = useState('');
    const [lastFocusTime, setLastFocusTime] = useState(0);

    // Set initial time on mount to avoid hydration mismatch and lint errors
    useEffect(() => {
        const timer = setTimeout(() => {
            setWatermarkTime(new Date().toLocaleTimeString());
            setLastFocusTime(Date.now());
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const triggerViolation = useCallback((reason: string) => {
        if (!isActive) return; // Ignore if not active
        console.error(`🚨 SECURITY VIOLATION: ${reason}`);
        setIsTampered(true);
        document.body.classList.add('security-locked', 'security-locked-blank');

        // Pause all media
        document.querySelectorAll('video, audio').forEach(m => {
            try { (m as HTMLMediaElement).pause(); } catch { }
        });
    }, [isActive]);

    const fetchIP = async () => {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            setUserData(prev => ({ ...prev, ip: data.ip }));
        } catch { }
    };

    useEffect(() => {
        // Init User Data
        const timer = setTimeout(() => {
            const userStr = localStorage.getItem('efv_user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setUserData(prev => ({
                        ...prev,
                        name: user.name || 'Anonymous',
                        email: user.email || 'N/A',
                        id: user._id || user.id || 'N/A'
                    }));
                } catch (e) {
                    console.error("Error parsing user data", e);
                }
            }
            fetchIP();
        }, 0);
        return () => clearTimeout(timer);

        // Listen for activation events
        const handleEnable = () => {
            console.log("🛡️ REACT SECURITY: ENABLED");
            setIsActive(true);
        };
        const handleDisable = () => {
            console.log("🔓 REACT SECURITY: DISABLED");
            setIsActive(false);
            setIsTampered(false);
            document.body.classList.remove('security-locked', 'security-blur');
        };

        window.addEventListener('efv-enable-security', handleEnable);
        window.addEventListener('efv-disable-security', handleDisable);

        // Watermark interval
        const wmTimer = setInterval(() => {
            setWatermarkTime(new Date().toLocaleTimeString());
        }, 2000);

        // Visibility handling
        const handleVisibility = () => {
            if (!isActive) return;
            if (document.visibilityState === 'hidden') {
                document.body.classList.add('security-blur');
            } else if (!isTampered) {
                document.body.classList.remove('security-blur');
            }
        };

        const handleBlur = () => {
            if (!isActive) return;
            setLastFocusTime(Date.now());
            document.body.classList.add('security-blur');
        };
        const handleFocus = () => {
            if (!isActive) return;
            const now = Date.now();
            const gap = now - lastFocusTime;

            if (gap < 800 && gap > 100) { // Slight buffer increase
                triggerViolation("Rapid Focus Loss/Return (Possible Snipping Tool)");
            }

            if (!isTampered) document.body.classList.remove('security-blur');
        };

        // Interaction blocking
        const handleContextMenu = (e: MouseEvent) => {
            if (!isActive) return;
            e.preventDefault();
            triggerViolation("Right Click Attempted");
        };
        const handleCopy = (e: ClipboardEvent) => {
            if (!isActive) return;
            e.preventDefault();
            triggerViolation("Copy attempt");
        };

        // Shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isActive) return;

            const isInspect = (e.key === 'F12') ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'u');

            const isPrint = (e.ctrlKey && e.key === 'p');

            const isPrintScreen = (e.key === 'PrintScreen');
            const isAltPrintScreen = (e.altKey && e.key === 'PrintScreen');
            const isWinSnippet = (e.metaKey && e.shiftKey && (e.key === 'S' || e.key === 'R' || e.key === 's' || e.key === 'r'));

            if (isInspect) {
                e.preventDefault();
                triggerViolation("Inspection Tools Detected");
            }

            if (isPrint) {
                e.preventDefault();
                triggerViolation("Print Shortcut Detected");
            }

            if (isPrintScreen || isAltPrintScreen || isWinSnippet) {
                e.preventDefault();
                document.body.classList.add('security-blur'); // Instant blanking
                triggerViolation(`Screen Capture Shortcut Detected (${e.key})`);
            }
        };

        // Screen Capture API Monitoring
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
            navigator.mediaDevices.getDisplayMedia = (constraints) => {
                if (isActive) {
                    triggerViolation("Unauthorized screen capture request");
                    return Promise.reject(new Error("Security Policy Violation"));
                }
                return originalGetDisplayMedia(constraints);
            };
        }

        // Mouse detection
        const handleMouseLeave = () => {
            if (!isActive) return;
            triggerViolation("Cursor Left Window Boundary");
        };

        // Resize detection
        let lastSize = { w: window.innerWidth, h: window.innerHeight };
        const handleResize = () => {
            if (!isActive) return;
            const dw = Math.abs(window.innerWidth - lastSize.w);
            const dh = Math.abs(window.innerHeight - lastSize.h);
            if (dw > 5 || dh > 5) {
                triggerViolation("Window Size Tampered");
                lastSize = { w: window.innerWidth, h: window.innerHeight };
            }
        };

        // Aggressive Polling
        const pollingTimer = setInterval(() => {
            if (isActive && !document.hasFocus() && !isTampered) {
                triggerViolation("Focus Polling (Lost)");
            }
        }, 50);

        // Event listeners
        window.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('resize', handleResize);
        window.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            clearInterval(wmTimer);
            clearInterval(pollingTimer);
            window.removeEventListener('efv-enable-security', handleEnable);
            window.removeEventListener('efv-disable-security', handleDisable);
            window.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isTampered, triggerViolation, isActive, lastFocusTime, userData.email, userData.id, watermarkTime]);

    // Watermark grid
    const renderWatermarks = () => {
        const watermarks = [];
        const partialIP = userData.ip.split('.').slice(0, 3).join('.') + '.*';
        const text = `${userData.name} | ${userData.email} | ${watermarkTime} | IP: ${partialIP}`;

        for (let i = 0; i < 40; i++) {
            watermarks.push(
                <div key={i} className="watermark-item" style={{
                    top: `${Math.floor(i / 5) * 15}%`,
                    left: `${(i % 5) * 20}%`
                }}>
                    {text}
                </div>
            );
        }
        return watermarks;
    };

    return (
        <>
            {isActive && (
                <div id="security-watermark-container">
                    {renderWatermarks()}
                </div>
            )}

            <div id="security-shield" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'black',
                zIndex: 999997,
                display: 'none',
                opacity: 0,
                pointerEvents: 'none'
            }}></div>

            <div id="security-overlay">
                <div className="security-lock-icon" style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>
                    ⚠️
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Security Policy Violation</h1>
                <p style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
                    Unauthorized screen capture, recording, or inspection is strictly prohibited.
                    Your activity has been logged.
                </p>
                <div className="security-meta" suppressHydrationWarning style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '1.5rem',
                    borderRadius: '10px',
                    fontFamily: 'monospace'
                }}>
                    User ID: {userData.id}<br />
                    Timestamp: {new Date().toLocaleString()}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        marginTop: '2rem',
                        padding: '12px 30px',
                        background: 'transparent',
                        border: '2px solid #ff4d4d',
                        color: '#ff4d4d',
                        borderRadius: '30px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    RESTORE SESSION
                </button>
            </div>
        </>
    );
};

export default SecurityLayer;
