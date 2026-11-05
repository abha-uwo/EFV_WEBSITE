/**
 * EFV ULTRA-SECURE PROTECTION LAYER v3.0 [TITANIUM EDITION]
 * Hardened for Zero-Latency Blackout & System Capture Prevention
 */

class EFVSecurity {
    constructor() {
        this.isActive = false;
        this.isProtected = false;
        this.isTampered = false;
        this.userId = 'N/A';
        this.userEmail = 'N/A';
        this.userIP = '0.0.0.0';
        this.monitorRunning = false;

        this.init();
    }

    async init() {
        this.loadUserData();
        this.setupUI();
        this.attachGlobalListeners();
        this.startHighFrequencyMonitor();
        this.fetchIP();
        console.log("🛡️ EFV Titanium Security Layer Online.");
    }

    loadUserData() {
        const user = JSON.parse(localStorage.getItem('efv_user') || '{}');
        this.userId = user._id || user.id || 'N/A';
        this.userEmail = user.email || 'N/A';
        this.userName = user.name || 'Anonymous User';
    }

    async fetchIP() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            this.userIP = data.ip || '0.0.0.0';
        } catch (e) { }
    }

    setupUI() {
        // 1. Violation Overlay
        if (!document.getElementById('security-violation-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'security-violation-overlay';
            overlay.className = 'security-violation-screen';
            overlay.innerHTML = `
                <div class="violation-content">
                    <div class="violation-icon"><i class="fas fa-user-shield"></i></div>
                    <h1 style="color: #ff4d4d; font-family: 'Cinzel', serif; letter-spacing: 3px;">SECURITY POLICY VIOLATION DETECTED</h1>
                    <p style="color: rgba(255,255,255,0.8); font-size: 0.9rem;">Unauthorized access, screenshot, or screen recording activity has been detected. <br> System access has been restricted to protect digital assets.</p>
                    
                    <div style="margin: 30px 0;">
                        <span style="background: rgba(255, 77, 77, 0.1); border: 1px solid rgba(255, 77, 77, 0.3); color: #ff4d4d; padding: 10px 20px; border-radius: 8px; font-size: 0.8rem; font-family: monospace;">
                            EVENT ID: EFV-SYS-${Math.random().toString(36).substr(2, 6).toUpperCase()}
                        </span>
                    </div>

                    <button onclick="location.reload()" class="violation-restore-btn" style="border-radius: 4px; padding: 12px 30px; font-size: 0.8rem;">RE-AUTHENTICATE</button>
                    
                    <div style="margin-top: 40px; font-size: 0.65rem; opacity: 0.4; letter-spacing: 1px;">
                        EFV™ SECURE INFRASTRUCTURE • CONTINUOUS MONITORING ACTIVE
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        // 2. Titanium Blackout Shield (GPU Accelerated)
        if (!document.getElementById('security-blackout-shield')) {
            const shield = document.createElement('div');
            shield.id = 'security-blackout-shield';
            shield.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:black; z-index:2147483600; display:none; pointer-events:all; backface-visibility:hidden; transform:translateZ(0);';
            document.body.appendChild(shield);
        }

        // 3. Watermark Container
        if (!document.getElementById('security-watermark-container')) {
            const wmContainer = document.createElement('div');
            wmContainer.id = 'security-watermark-container';
            wmContainer.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:2147483610; overflow:hidden; display:none;';
            document.body.appendChild(wmContainer);
        }
    }

    attachGlobalListeners() {
        // Absolute Blockers
        ['contextmenu', 'dragstart', 'selectstart', 'copy', 'cut', 'paste', 'keydown', 'keyup'].forEach(evt => {
            document.addEventListener(evt, e => {
                if (!this.isProtected) return;

                // Key checks
                if (evt === 'keydown' || evt === 'keyup') {
                    const keys = [
                        'PrintScreen', 'F12', 'c', 'u', 'i', 'j', 'p', 's', 'r', '3', '4', '5'
                    ];

                    const isSystemSS = (e.key === 'PrintScreen') || (e.keyCode === 44);
                    const isWinSS = (e.metaKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'R' || e.key === 'r' || e.key === '3' || e.key === '4' || e.key === '5'));
                    const isMacSS = (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key));
                    const isInspect = (e.key === 'F12') || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()));
                    const isSave = (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U' || e.key === 'p' || e.key === 'P'));
                    const isWinKey = (e.key === 'Meta' || e.keyCode === 91 || e.keyCode === 92);

                    if (isSystemSS || isWinSS || isMacSS || isInspect || isSave || isWinKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        // Immediate blackout for any suspicious key combo
                        this.blackout(true);
                        this.triggerViolation(`Security Policy: ${e.key || 'Shortcut'} Blocked`);
                        return false;
                    }
                } else if (!['keydown', 'keyup'].includes(evt)) {
                    e.preventDefault();
                    return false;
                }
            }, true);
        });

        // Fast Visibility & Focus Loss Protection
        // Snipping tools often steal focus or cause a blur event
        const handleSecurityThreat = (reason) => {
            if (this.isProtected && !this.isTampered) {
                console.warn(`🛡️ Security Threat Detected: ${reason}`);
                this.blackout(true);
                this.triggerViolation(reason);
            }
        };

        document.addEventListener('visibilitychange', () => {
            if (document.hidden || document.visibilityState === 'hidden') {
                handleSecurityThreat("Screen Privacy Protection (Visibility)");
            }
        });

        window.addEventListener('blur', () => {
            // Slight delay to check if it's just a regular click or a real blur (like Alt-Tab or Snip)
            setTimeout(() => {
                if (!document.hasFocus()) {
                    handleSecurityThreat("Capture Tool Detection (Focus Loss)");
                }
            }, 100);
        });

        window.addEventListener('resize', () => {
             // Rapid resizing is often used by screen recorders to snap to windows
             if (this.isProtected) {
                 this.blackout(true);
             }
        });

        // Mouse exit (Snipping Tool trigger / Screen Capture overlay)
        document.addEventListener('mouseleave', (e) => {
            // If the mouse leaves toward the top or side, it might be the Snipping Tool toolbar
            if (this.isProtected) {
                 handleSecurityThreat("Cursor Tracking Violation");
            }
        });
    }

    startHighFrequencyMonitor() {
        if (this.monitorRunning) return;
        this.monitorRunning = true;

        const check = () => {
            if (this.isProtected && !this.isTampered) {
                // Reduced aggression: only blackout if truly hidden or visibility lost
                // focus check removed as it triggers on simple clicks outside the window
                if (document.hidden || document.visibilityState === 'hidden') {
                    this.blackout(true);
                }
            }
            requestAnimationFrame(check);
        };
        requestAnimationFrame(check);

        // Slow ticker for watermark and IP
        setInterval(() => {
            if (this.isActive) this.updateWatermark();
        }, 2500);
    }

    enable() {
        console.log("🛡️ SECURITY ACTIVATED");
        this.isActive = true;
        this.isProtected = true;
        this.isTampered = false;
        document.body.classList.add('security-active');
        document.getElementById('security-watermark-container').style.display = 'block';
        this.blackout(false);
        this.updateWatermark();
    }

    disable() {
        console.log("🛡️ SECURITY DEACTIVATED");
        this.isActive = false;
        this.isProtected = false;
        this.blackout(false);
        document.body.classList.remove('security-active', 'security-violator');
        document.getElementById('security-watermark-container').style.display = 'none';

        const shield = document.getElementById('security-blackout-shield');
        if (shield) shield.style.display = 'none';
    }

    blackout(active) {
        if (!active) return;

        // Instead of just a temporary blackout, we now trigger a permanent violation
        // as per user request to show the red screen instead of just black.
        this.triggerViolation("Immediate Capture Protection");

        const media = document.querySelectorAll('video, audio');
        media.forEach(m => { try { m.pause(); } catch (e) { } });
    }

    triggerViolation(reason) {
        if (!this.isProtected || this.isTampered) return;
        this.isTampered = true;

        console.error("⛔ BREACH DETECTED:", reason);
        this.blackout(true);
        document.body.classList.add('security-violator');

        // Notify application
        window.dispatchEvent(new CustomEvent('efv-security-violation', { detail: { reason } }));
    }

    updateWatermark() {
        this._drawWatermark(document.getElementById('security-watermark-container'));
    }

    applyWatermark(container) {
        if (!container) return;
        this._drawWatermark(container);
    }

    _drawWatermark(target) {
        return; // Watermark disabled as per user request

        // Ensure we have a dedicated watermark layer so we don't wipe the reader
        let wmLayer = target.id === 'security-watermark-container' ? target : target.querySelector('.efv-internal-watermark');
        
        if (!wmLayer && target.id !== 'security-watermark-container') {
            wmLayer = document.createElement('div');
            wmLayer.className = 'efv-internal-watermark security-watermark-container';
            wmLayer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1; overflow:hidden; opacity:0.15;';
            target.appendChild(wmLayer);
        }

        if (!wmLayer) return;

        wmLayer.innerHTML = '';
        const timestamp = new Date().toLocaleString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const text = `${this.userName} (${this.userEmail}) | ID: ${this.userId} | ${timestamp} | IP: ${this.userIP} | EFV PROTECTED`;

        const isMobile = window.innerWidth < 768;
        const rows = isMobile ? 15 : 20;
        const cols = isMobile ? 4 : 8;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const item = document.createElement('div');
                item.className = 'security-watermark-item';
                item.textContent = text;
                item.style.position = 'absolute';
                item.style.top = `${(i * (100 / rows))}%`;
                item.style.left = `${(j * (100 / cols))}%`;
                item.style.transform = 'translate(-50%, -50%) rotate(-30deg)';
                item.style.opacity = '0.08';
                item.style.fontSize = isMobile ? '8px' : '10px';
                item.style.whiteSpace = 'nowrap';
                item.style.color = '#fff';
                item.style.fontWeight = 'bold';
                wmLayer.appendChild(item);
            }
        }
    }
}

window.efvSecurity = new EFVSecurity();
