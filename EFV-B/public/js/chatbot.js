// EFV Intelligence Chatbot
class EFVChatbot {
    constructor() {
        this.isOpen = false;
        this.loadRegistrationStatus();
        this.history = [];
        this.isListening = false;
        this.recognition = null;
        const base = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';
        this.apiUrl = `${base}/api/chat/message`;
        this.registerUrl = `${base}/api/chat/register`;
        this.init();
    }

    init() {
        this.injectHTML();
        this.attachEventListeners();
        this.startPeriodicBlink();
        this.checkFirstTimeIntro();
        this.listenForStorageChanges();
    }

    loadRegistrationStatus() {
        // 1. Check explicit bot registration flag
        const isBotReg = localStorage.getItem('efv_bot_registered') === 'true';
        
        // 2. Check if user is logged in to main platform (Global Sync)
        const mainUserStr = localStorage.getItem('efv_user');
        
        if (isBotReg) {
            this.isRegistered = true;
            this.userEmail = localStorage.getItem('efv_bot_registered_email') || '';
        } else if (mainUserStr) {
            try {
                const user = JSON.parse(mainUserStr);
                if (user && user.email) {
                    this.isRegistered = true;
                    this.userEmail = user.email;
                    // Sync bot storage labels for persistence
                    localStorage.setItem('efv_bot_registered', 'true');
                    localStorage.setItem('efv_bot_registered_email', user.email);
                }
            } catch (e) {
                this.isRegistered = false;
            }
        } else {
            this.isRegistered = false;
            this.userEmail = '';
        }
    }

    listenForStorageChanges() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'efv_bot_registered' || e.key === 'efv_user') {
                const oldStatus = this.isRegistered;
                this.loadRegistrationStatus();
                
                // If they just registered in another tab, update the UI
                if (!oldStatus && this.isRegistered) {
                    const regBox = document.querySelector('.efv-registration-box-container');
                    if (regBox) regBox.remove();
                    this.enableChatInput();
                    this.addMessage("✅ Welcome back! Your synchronization is complete.", 'ai');
                }
            }
        });
    }

    startPeriodicBlink() {
        const tooltip = document.querySelector('.efv-chat-tooltip');
        if (!tooltip) return;

        const triggerBlink = () => {
            tooltip.classList.add('efv-blink-active');
            setTimeout(() => {
                tooltip.classList.remove('efv-blink-active');
            }, 5000); // Wait for the 5s CSS animation to complete
        };

        // Repeat every 3 minutes (180,000ms)
        setInterval(triggerBlink, 180000);
    }

    injectHTML() {
        const chatHTML = `
            <div id="efv-chatbot">
                <!-- Background Blur Overlay -->
                <div id="efv-chat-overlay" class="efv-chat-overlay"></div>

                <!-- Floating Chat Button -->
                <button id="efv-chat-toggle" class="efv-chat-button" aria-label="Open EFV Intelligence">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <path d="M12 1C12 1 12.5 9.5 23 12C12.5 14.5 12 23 12 23C12 23 11.5 14.5 1 12C11.5 9.5 12 1 12 1Z" fill="#D6A85F"/>
                        <path d="M5 4C5 4 5.2 6 7.5 6.5C5.2 7 5 9 5 9C5 9 4.8 7 2.5 6.5C4.8 6 5 4 5 4Z" fill="#D6A85F" opacity="0.6"/>
                    </svg>
                </button>
                
                <!-- Tooltip with curved arrow -->
                <div class="efv-chat-tooltip">
                    <span class="efv-tooltip-text">EFV<sup>™</sup> BOT</span>
                    <svg class="efv-curved-arrow" xmlns="http://www.w3.org/2000/svg" width="60" height="40" viewBox="0 0 60 40">
                        <path d="M 10 5 Q 15 35, 50 35" stroke="#D6A85F" stroke-width="2" fill="none" marker-end="url(#arrowhead)"/>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                <polygon points="0 0, 10 3, 0 6" fill="#D6A85F" />
                            </marker>
                        </defs>
                    </svg>
                </div>

                <!-- Chat Window -->
                <div id="efv-chat-window" class="efv-chat-window">
                    <div class="efv-chat-header">
                        <div class="efv-chat-title">
                            <div class="efv-ai-avatar" style="background:transparent;padding:0;overflow:hidden;"><img src="../assets/images/AISA.svg" alt="EFV Logo" style="width:100%;height:100%;object-fit:contain;" onerror="this.parentElement.textContent='⚡'"></div>
                            <div>
                                <h3>EFV<sup>™</sup> Intelligence</h3>
                                <p>Alignment Intelligence System</p>
                            </div>
                        </div>
                        <button id="efv-chat-close" class="efv-close-btn">×</button>
                    </div>

                    <div id="efv-chat-messages" class="efv-chat-messages">
                        <!-- Initial Welcome Message (Dynamic) -->
                    </div>

                    <div class="efv-chat-input-container">
                        <input 
                            type="text" 
                            id="efv-chat-input" 
                            placeholder="Ask about alignment, books, or EFV™..." 
                            autocomplete="off"
                        />
                        <button id="efv-chat-mic" class="efv-mic-btn" aria-label="Use Microphone">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        </button>
                        <button id="efv-chat-send" class="efv-send-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Premium Intro Popup -->
            <div id="efv-intro-overlay">
                <div class="efv-intro-popup">
                    <div class="efv-intro-header">
                        <div class="efv-intro-icon-glow" style="background:transparent;padding:0;overflow:hidden;width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;">
                             <img src="../assets/images/AISA.svg" alt="EFV Logo" style="width:100%;height:100%;object-fit:contain;">
                        </div>
                        <h2 data-i18n="chatbot_intro.title">MEET EFV<sup>™</sup> ASSISTANT</h2>
                        <span class="efv-intro-subtitle" data-i18n="chatbot_intro.subtitle">Your intelligent guide across the EFV<sup>™</sup> platform.</span>
                    </div>
                    
                    <div class="efv-intro-body">
                        <p data-i18n="chatbot_intro.p1">Welcome to EFV<sup>™</sup>.</p>
                        <p data-i18n="chatbot_intro.p2">If you ever need help exploring the platform, finding books, understanding features, or asking questions, our EFV<sup>™</sup> Assistant is always here for you.</p>
                        <p class="efv-highlight-text" data-i18n="chatbot_intro.p3">Simply click the glowing star icon in the bottom-right corner to start chatting.</p>
                    </div>

                    <div class="efv-intro-actions">
                        <button id="efv-intro-got-it" class="efv-btn-intro-outline" data-i18n="chatbot_intro.got_it">Got It</button>
                        <button id="efv-intro-ask" class="efv-btn-intro-glow" data-i18n="chatbot_intro.ask_bot">Ask EFV Bot</button>
                    </div>

                    <!-- Short Elegant Pointer -->
                    <div class="efv-card-pointer">
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <path d="M5 5 L35 35 M35 15 L35 35 L15 35" stroke="#D6A85F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Enhanced Bot Highlight System -->
            <div id="efv-guide-system" class="efv-hidden">
                <div class="efv-bot-ring"></div>
                <div class="efv-bot-ring" style="animation-delay: 0.8s"></div>
                <div class="efv-bot-ring" style="animation-delay: 1.6s"></div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    checkFirstTimeIntro() {
        const hasSeenIntro = sessionStorage.getItem('efv_bot_intro_seen');
        const hasSelectedCountry = localStorage.getItem('efv_country_selected');

        // Only auto-show if not seen before in this session AND country is already selected
        if (!hasSeenIntro && hasSelectedCountry) {
            setTimeout(() => {
                this.showIntro();
            }, 3000);
        }
    }

    showIntro() {
        const hasSeenIntro = sessionStorage.getItem('efv_bot_intro_seen');
        if (hasSeenIntro) return;
        const introOverlay = document.getElementById('efv-intro-overlay');
        const chatToggle = document.getElementById('efv-chat-toggle');

        if (introOverlay) {
            introOverlay.style.display = 'flex';
            setTimeout(() => {
                introOverlay.classList.add('active');
            }, 10);
            chatToggle.classList.add('efv-highlight');
            document.getElementById('efv-guide-system').classList.remove('efv-hidden');
        }

        // Event listeners for intro buttons
        const gotItBtn = document.getElementById('efv-intro-got-it');
        const askBtn = document.getElementById('efv-intro-ask');

        if (gotItBtn) {
            gotItBtn.onclick = () => this.closeIntro();
        }

        if (askBtn) {
            askBtn.onclick = () => {
                this.closeIntro();
                this.toggleChat();
            };
        }
    }

    closeIntro() {
        const introOverlay = document.getElementById('efv-intro-overlay');
        const chatToggle = document.getElementById('efv-chat-toggle');

        if (introOverlay) {
            introOverlay.classList.remove('active');
            document.getElementById('efv-guide-system').classList.add('efv-hidden');
            setTimeout(() => {
                introOverlay.style.display = 'none';
            }, 500);
        }

        if (chatToggle) {
            chatToggle.classList.remove('efv-highlight');
        }

        sessionStorage.setItem('efv_bot_intro_seen', 'true');
    }

    attachEventListeners() {
        const toggleBtn = document.getElementById('efv-chat-toggle');
        const closeBtn = document.getElementById('efv-chat-close');
        const sendBtn = document.getElementById('efv-chat-send');
        const input = document.getElementById('efv-chat-input');
        const micBtn = document.getElementById('efv-chat-mic');

        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleChat());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeChat());
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
        if (input) input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        if (micBtn) micBtn.addEventListener('click', () => this.startVoiceRecognition());

        // Click overlay to close
        const overlay = document.getElementById('efv-chat-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeChat());
        }
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('efv-chat-window');
        const toggleBtn = document.getElementById('efv-chat-toggle');
        const overlay = document.getElementById('efv-chat-overlay');
        const messagesContainer = document.getElementById('efv-chat-messages');

        if (this.isOpen) {
            chatWindow.classList.add('active');
            if (overlay) overlay.classList.add('active');
            toggleBtn.style.display = 'none';
            document.body.style.overflow = 'hidden';

            if (!this.isRegistered) {
                this.disableChatInput();
            } else {
                this.enableChatInput();
            }

            // If empty, show welcome (use children.length to ignore HTML comments)
            if (messagesContainer.children.length === 0) {
                this.showInitialGreeting();
            }
        } else {
            chatWindow.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            toggleBtn.style.display = 'flex';
            document.body.style.overflow = '';
        }
    }

    disableChatInput() {
        const input = document.getElementById('efv-chat-input');
        const sendBtn = document.getElementById('efv-chat-send');
        const micBtn = document.getElementById('efv-chat-mic');
        if (input) {
            input.disabled = true;
            input.placeholder = 'Register above to chat...';
            input.style.opacity = '0.5';
            input.style.cursor = 'not-allowed';
        }
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';
            sendBtn.style.cursor = 'not-allowed';
        }
        if (micBtn) {
            micBtn.disabled = true;
            micBtn.style.opacity = '0.5';
            micBtn.style.cursor = 'not-allowed';
        }
    }

    enableChatInput() {
        const input = document.getElementById('efv-chat-input');
        const sendBtn = document.getElementById('efv-chat-send');
        const micBtn = document.getElementById('efv-chat-mic');
        if (input) {
            input.disabled = false;
            input.placeholder = 'Ask about alignment, books, or EFV™...';
            input.style.opacity = '1';
            input.style.cursor = 'text';
        }
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
            sendBtn.style.cursor = 'pointer';
        }
        if (micBtn) {
            micBtn.disabled = false;
            micBtn.style.opacity = '1';
            micBtn.style.cursor = 'pointer';
        }
    }

    showInitialGreeting() {
        if (!this.isRegistered) {
            this.addMessage("Welcome to EFV<sup>™</sup> Intelligence – Alignment Intelligence System.<br>We’re here to guide you on your journey.<br><br><b>👉 Join EFV<sup>™</sup> Intelligence to continue</b>", 'ai');
            this.showRegistrationBox();
        } else {
            this.addMessage("Welcome back to EFV<sup>™</sup>. Let's measure your alignment.", 'ai');
        }
    }

    showRegistrationBox() {
        const messagesContainer = document.getElementById('efv-chat-messages');
        const regDiv = document.createElement('div');
        regDiv.className = 'efv-registration-box-container';
        regDiv.innerHTML = `
            <div class="efv-registration-box">
                <div class="efv-reg-header">
                    <h4>Join EFV<sup>™</sup> Intelligence</h4>
                </div>
                <div class="efv-reg-body">
                    <input type="text" id="efv-reg-name" placeholder="Full Name *" required />
                    <input type="email" id="efv-reg-email" placeholder="Email Address *" required />
                    <input type="tel" id="efv-reg-phone" placeholder="Phone Number (Optional)" />
                    <button id="efv-reg-submit" class="efv-reg-btn">👉 Join EFV<sup>™</sup></button>
                    <div id="efv-reg-error" class="efv-reg-error"></div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(regDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Attach listener
        const submitBtn = regDiv.querySelector('#efv-reg-submit');
        submitBtn.onclick = () => this.handleRegistration();
    }

    async handleRegistration() {
        const nameInput = document.getElementById('efv-reg-name');
        const emailInput = document.getElementById('efv-reg-email');
        const phoneInput = document.getElementById('efv-reg-phone');
        const errorDiv = document.getElementById('efv-reg-error');
        const submitBtn = document.getElementById('efv-reg-submit');

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name) {
            errorDiv.textContent = 'Please enter your full name.';
            return;
        }

        if (!email || !email.includes('@')) {
            errorDiv.textContent = 'Please enter a valid email address.';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Registering... <span style="display:inline-block; margin-left:5px;">⏳</span>';

        try {
            const response = await fetch(this.registerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone })
            });

            const data = await response.json();

            if (data.success) {
                // Remove registration box
                document.querySelector('.efv-registration-box-container').remove();

                // Set as registered
                this.isRegistered = true;
                this.userEmail = email;
                localStorage.setItem('efv_bot_registered', 'true');
                localStorage.setItem('efv_bot_registered_email', email);

                // Add success message
                this.addMessage("✅ Thank you for joining EFV<sup>™</sup> Intelligence.<br>You can now continue your journey.", 'ai');
                this.showContinueButton();
            } else {
                errorDiv.textContent = data.error || 'Registration failed. Please try again.';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '👉 Join EFV';
            }
        } catch (error) {
            console.error('Registration error:', error);
            errorDiv.textContent = 'Connection error. Please try again later.';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '👉 Join EFV';
        }
    }

    showContinueButton() {
        const messagesContainer = document.getElementById('efv-chat-messages');
        const contDiv = document.createElement('div');
        contDiv.className = 'efv-continue-box-container';
        contDiv.innerHTML = `
            <div style="text-align: center; margin-top: 25px; margin-bottom: 30px;">
                <button id="efv-continue-btn" class="efv-reg-btn" style="width: auto; padding: 18px 45px !important;">👉 Continue to EFV<sup>™</sup></button>
            </div>
        `;
        messagesContainer.appendChild(contDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        contDiv.querySelector('#efv-continue-btn').onclick = () => {
            contDiv.remove();
            this.enableChatInput();
        };
    }

    closeChat() {
        this.isOpen = false;
        const chatWindow = document.getElementById('efv-chat-window');
        const toggleBtn = document.getElementById('efv-chat-toggle');
        const overlay = document.getElementById('efv-chat-overlay');

        if (chatWindow) chatWindow.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (toggleBtn) toggleBtn.style.display = 'flex';
        document.body.style.overflow = '';
        
        // Stop currently playing audio when chat is closed
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }

    async sendMessage() {
        const input = document.getElementById('efv-chat-input');
        const message = input.value.trim();

        if (!message) return;

        // If not registered, return early (button shouldn't be accessible, but safety check)
        if (!this.isRegistered) {
            return;
        }

        // Add user message to UI
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history: this.history, email: this.userEmail })
            });

            const data = await response.json();

            // Remove typing indicator
            this.hideTyping();

            if (data.response) {
                this.addMessage(data.response, 'ai');
                this.history.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.response }
                );
            } else {
                this.addMessage('I apologize, but I encountered an error. Please try again.', 'ai');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTyping();
            this.addMessage('Connection error. Please check if the server is running.', 'ai');
        }
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('efv-chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `efv-message efv-${sender}-message`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'efv-message-content';

        if (sender === 'ai') {
            // Professional Formatting for AI
            let formattedText = text
                .replace(/\n/g, '<br>') // Support newlines
                .replace(/\*\*(.*?)\*\*/g, '<span style="color: #D6A85F; font-weight: bold;">$1</span>') // Highlight **words** as Gold Bold
                .replace(/• (.*?)(?=<br>|$)/g, '<div style="margin-left: 15px; margin-bottom: 5px;">• $1</div>'); // Indent bullet points

            contentDiv.innerHTML = formattedText;
        } else {
            contentDiv.textContent = text;
        }

        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
        const messagesContainer = document.getElementById('efv-chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'efv-typing';
        typingDiv.className = 'efv-message efv-ai-message';
        typingDiv.innerHTML = `
            <div class="efv-message-content">
                <div class="efv-typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
        const typingDiv = document.getElementById('efv-typing');
        if (typingDiv) typingDiv.remove();
    }

    startVoiceRecognition() {
        const input = document.getElementById('efv-chat-input');
        const micBtn = document.getElementById('efv-chat-mic');

        if (this.isListening && this.recognition) {
            this.recognition.stop();
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice input is not supported in your browser.");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        // Don't fix language to en-US. Provide fallback or let it detect from browser.
        this.recognition.lang = document.documentElement.lang || navigator.language || 'en-US';

        let finalTranscript = input.value ? input.value + (input.value.endsWith(' ') ? '' : ' ') : '';

        this.recognition.onstart = () => {
            this.isListening = true;
            micBtn.classList.add('efv-mic-active');
            input.placeholder = 'Listening...';
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let currentFinal = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    currentFinal += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            finalTranscript += currentFinal;
            input.value = finalTranscript + interimTranscript;
        };

        this.recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            micBtn.classList.remove('efv-mic-active');
            input.placeholder = 'Ask about alignment, books, or EFV™...';
        };

        this.recognition.start();
    }

}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.efvChatbot = new EFVChatbot();
    });
} else {
    window.efvChatbot = new EFVChatbot();
}
