/**
 * EFV Main JS - Global UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // Global Coupon Capture
    const urlParams = new URLSearchParams(window.location.search);
    const urlCoupon = urlParams.get('coupon');
    if (urlCoupon) {
        localStorage.setItem('efv_applied_coupon', urlCoupon.toUpperCase());
        console.log(`🎟️ Coupon ${urlCoupon} captured from URL`);
    }

    const nav = document.querySelector('nav');

    // Optimized Scroll Reveal using IntersectionObserver
    const revealOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Stop observing once revealed
            }
        });
    }, revealOptions);

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Optimized Navbar Scroll Effect
    let lastScrollY = window.scrollY;
    let ticking = false;

    if (nav) {
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 50) {
                        nav.classList.add('scrolled');
                    } else {
                        nav.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // Mobile Menu Toggle Logic
    const initMobileMenu = () => {
        const navLinks = document.querySelector('.nav-links');
        const container = document.querySelector('nav .container');
        let hamburger = document.querySelector('.hamburger');

        if (!hamburger && container) {
            hamburger = document.createElement('button');
            hamburger.className = 'hamburger';
            hamburger.setAttribute('aria-label', 'Toggle Menu');
            hamburger.innerHTML = '<span></span><span></span><span></span>';
            container.appendChild(hamburger);
        }

        if (hamburger && navLinks) {
            hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
                document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
            });

            // Auto-close when clicking outside
            document.addEventListener('click', (e) => {
                const isClickInside = navLinks.contains(e.target) || hamburger.contains(e.target);
                if (!isClickInside && navLinks.classList.contains('active')) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });

            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });

            // Close menu if window is resized to desktop width
            window.addEventListener('resize', () => {
                if (window.innerWidth > 992 && navLinks.classList.contains('active')) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    };

    initMobileMenu();

    // Custom Cursor Trail (Disabled on mobile for performance)
    if (!window.matchMedia("(max-width: 768px)").matches) {
        const cursor = document.createElement('div');
        cursor.className = 'cursor-trail';
        document.body.appendChild(cursor);

        Object.assign(cursor.style, {
            position: 'fixed',
            width: '20px',
            height: '20px',
            background: 'radial-gradient(circle, rgba(255, 211, 105, 0.4) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: '9999',
            transform: 'translate(-50%, -50%)',
            transition: 'transform 0.05s linear'
        });

        window.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
    }

    // Smooth Scroll for Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Book Carousel Functionality (Dynamic Loader)
    const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
        ? CONFIG.API_BASE_URL
        : 'http://localhost:8080';

    const loadHomepageSliderBooks = async () => {
        const track = document.getElementById('books-track');
        if (!track) return;
        try {
            const res = await fetch(`${API_BASE}/api/homepage-books`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            const rawItems = Array.isArray(data) ? data : (data && Array.isArray(data.books) ? data.books : (data && Array.isArray(data.data) ? data.data : []));

            // Extract section header & topics config if present
            const headerConfig = rawItems.find(item => item.isHeader || item._id === 'homepage-books-header-config');
            if (headerConfig) {
                const titleEl = document.getElementById('books-section-title') || document.querySelector('#books h2');
                if (titleEl && headerConfig.title) {
                    titleEl.innerHTML = headerConfig.title;
                }

                const subEl = document.getElementById('books-section-subtitle') || document.querySelector('#books p');
                const subText = headerConfig.subtitle || headerConfig.description;
                if (subEl && subText) {
                    subEl.innerHTML = subText.replace(/\n/g, '<br>');
                }

                const topicsEl = document.getElementById('books-topics');
                const topics = headerConfig.topics || (headerConfig.status ? headerConfig.status.split(',').map(s => s.trim()).filter(Boolean) : null);
                if (topicsEl && Array.isArray(topics) && topics.length > 0) {
                    topicsEl.innerHTML = topics.map(t => `<span class="glass-panel" style="padding: 10px 20px; border-radius: 50px; font-size: 0.8rem;">${t}</span>`).join('\n');
                }
            }

            // Actual books to display in carousel
            const books = rawItems.filter(item => !item.isHeader && item._id !== 'homepage-books-header-config');
            if (!books.length) {
                track.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.5; color: white;">No books available in this series yet.</div>';
                return;
            }

            track.innerHTML = '';
            
            books.forEach(b => {
                const card = document.createElement('div');
                card.className = 'glass-panel shine-box magnetic';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';

                let coverUrl = 'assets/images/placeholder.png';
                if (b.thumbnail) {
                    if (b.thumbnail.startsWith('http')) {
                        coverUrl = b.thumbnail;
                    } else if (b.thumbnail.startsWith('uploads/') || b.thumbnail.startsWith('/uploads/')) {
                        const cleanPath = b.thumbnail.startsWith('/') ? b.thumbnail.substring(1) : b.thumbnail;
                        coverUrl = `${API_BASE}/${cleanPath}`;
                    } else {
                        coverUrl = b.thumbnail;
                    }
                }

                // Determine button
                let buttonHtml = '';
                const isPurchase = (b.status || '').toLowerCase().trim() === 'purchase_now' || (b.status || '').toLowerCase().trim() === 'purchase';
                if (isPurchase) {
                    buttonHtml = `<a href="pages/marketplace.html" class="btn btn-gold" style="padding: 10px 15px; width: 100%; font-size: 0.8rem; margin-top: auto;">PURCHASE NOW</a>`;
                } else {
                    buttonHtml = `<button class="btn btn-notify notify-trigger" data-book="${b.title}" style="padding: 10px 15px; width: 100%; font-size: 0.8rem; margin-top: auto;">Notify Me</button>`;
                }

                card.innerHTML = `
                    <div class="book-cover" style="height: 240px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center;">
                        <img src="${coverUrl}" alt="${b.title} Cover" loading="lazy" style="height: 100%; width: auto; object-fit: contain; border-radius: 12px; border: 1px solid var(--gold-energy); box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
                    </div>
                    <h3>${b.title}</h3>
                    <p style="margin: 10px 0; opacity: 0.8; font-size: 0.82rem;">${b.description || ''}</p>
                    ${buttonHtml}
                `;
                track.appendChild(card);
            });

            // Initialize carousel after items are added
            initCarousel();
        } catch (e) {
            console.error("Error loading slider books:", e);
            track.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.5; color: white;">Failed to load slider books.</div>';
        }
    };

    const initCarousel = () => {
        const track = document.getElementById('books-track');
        const prevBtn = document.querySelector('.carousel-nav.prev');
        const nextBtn = document.querySelector('.carousel-nav.next');

        if (track && prevBtn && nextBtn) {
            let currentIndex = 0;

            const updateCarousel = () => {
                const cards = track.querySelectorAll('.glass-panel');
                if (cards.length === 0) return;
                const cardWidth = cards[0].offsetWidth;
                const gap = 30; // Matches CSS gap
                const scrollAmount = (cardWidth + gap) * currentIndex;

                track.style.transform = `translateX(-${scrollAmount}px)`;

                // Update button states
                prevBtn.classList.toggle('disabled', currentIndex === 0);

                // Estimate max index (total cards - visible cards)
                const visibleCards = window.innerWidth > 1024 ? 3 : (window.innerWidth > 768 ? 2 : 1);
                const totalCards = cards.length;
                nextBtn.classList.toggle('disabled', currentIndex >= totalCards - visibleCards);
            };

            nextBtn.addEventListener('click', () => {
                const visibleCards = window.innerWidth > 1024 ? 3 : (window.innerWidth > 768 ? 2 : 1);
                const totalCards = track.querySelectorAll('.glass-panel').length;
                if (currentIndex < totalCards - visibleCards) {
                    currentIndex++;
                    updateCarousel();
                }
            });

            prevBtn.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateCarousel();
                }
            });

            // Handle resize
            window.addEventListener('resize', updateCarousel);
            // Initial call to set button states correctly
            updateCarousel();
        }
    };

    // Load slider books dynamically
    loadHomepageSliderBooks();

    // Global Modal System (Removed inline privacy and terms modals in favor of routing)

    // Admin Navbar Visibility Logic - REMOVED as admin is now integrated in profile
    window.updateAdminNavbar = () => {
        document.querySelectorAll('a[href*="admin-dashboard.html"]').forEach(link => {
            link.parentElement.style.display = 'none';
        });
    };

    // Initial check on load
    window.updateAdminNavbar();

    // Home Page Volume Buttons Active State
    const bookButtons = document.querySelectorAll('.btn-outline');
    bookButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all others in the track if desired, 
            // but usually we just want feedback on the clicked one.
            bookButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // If it's a link, we don't preventDefault so it still navigates, 
            // but the user sees the golden flash/transition.
        });
    });

    // Sync Store Config to Footer & Modals (Dynamically from Database)
    const applyFooterConfig = (config) => {
        if (!config) return;
        let supportEmail = config.email;
        if (!supportEmail || supportEmail === 'support@efv.com') {
            supportEmail = 'efv@uwo24.com';
        }
        const hotline = config.hotline;
        const globalName = config.globalName;

        if (supportEmail) {
            document.querySelectorAll('a[aria-label="Gmail"], a[href^="mailto:"]').forEach(link => {
                link.href = `mailto:${supportEmail}`;
            });
            document.querySelectorAll('.modal-body, .tc-content, .contact-support-email').forEach(body => {
                if (body.innerHTML.includes('admin@uwo24.com') || body.innerHTML.includes('support@efv.com')) {
                    body.innerHTML = body.innerHTML.replace(/admin@uwo24\.com/g, supportEmail).replace(/support@efv\.com/g, supportEmail);
                }
            });
        }

        if (hotline) {
            document.querySelectorAll('a[href^="tel:"], .contact-support-hotline').forEach(link => {
                link.href = `tel:${hotline.replace(/\s+/g, '')}`;
                if (link.tagName === 'A' && (link.textContent.includes('+91') || link.classList.contains('hotline-text'))) {
                    link.textContent = hotline;
                }
            });
        }

        if (globalName) {
            document.querySelectorAll('.store-global-name').forEach(el => {
                el.textContent = globalName;
            });
        }
    };

    const syncFooterConfig = () => {
        try {
            const savedConfig = JSON.parse(localStorage.getItem('efv_store_config'));
            if (savedConfig) applyFooterConfig(savedConfig);

            const apiBase = window.API_BASE || window.API_BASE_URL || (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') ? 'http://localhost:8080' : window.location.origin);
            fetch(`${apiBase}/api/settings/store`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.config) {
                        localStorage.setItem('efv_store_config', JSON.stringify(data.config));
                        applyFooterConfig(data.config);
                    }
                })
                .catch(() => {});
        } catch (e) {
            console.warn('Sync footer config failed:', e);
        }
    };

    // Initial sync
    syncFooterConfig();

    // --- NOTIFY ME FUNCTIONALITY (NEW) ---
    const notifyModal = document.getElementById('notify-modal');
    if (notifyModal) {
        const bookNameElem = document.getElementById('notify-book-name');
        const closeNotifyBtn = document.getElementById('close-notify-modal');
        const notifyForm = document.getElementById('notify-form');
        const notifyEmailInput = document.getElementById('notify-email');
        const notifyConfirmMsg = document.getElementById('notify-confirm-msg');
        const notifySubmitBtn = document.getElementById('notify-submit-btn');

        // Use event delegation for notify triggers to support dynamically added elements
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.notify-trigger');
            if (btn) {
                const bookTitle = btn.getAttribute('data-book');
                if (bookNameElem) bookNameElem.textContent = bookTitle;
                
                notifyModal.style.display = 'flex';
                setTimeout(() => notifyModal.classList.add('active'), 10);
                document.body.classList.add('modal-open');
                
                // Pre-fill email if user is logged in
                const user = JSON.parse(localStorage.getItem('efv_user'));
                if (user && user.email && notifyEmailInput) {
                    notifyEmailInput.value = user.email;
                }
            }
        });

        const closeNotify = () => {
            notifyModal.classList.remove('active');
            document.body.classList.remove('modal-open');
            setTimeout(() => {
                notifyModal.style.display = 'none';
                notifyConfirmMsg.style.display = 'none';
                notifyForm.style.display = 'block';
                notifySubmitBtn.disabled = false;
                notifySubmitBtn.innerText = 'NOTIFY ME';
            }, 400);
        };

        if (closeNotifyBtn) closeNotifyBtn.addEventListener('click', closeNotify);
        notifyModal.addEventListener('click', (e) => {
            if (e.target === notifyModal) closeNotify();
        });

        if (notifyForm) {
            notifyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = notifyEmailInput ? notifyEmailInput.value.trim() : '';
                const bookTitle = bookNameElem ? bookNameElem.textContent.trim() : '';

                if (!email || !bookTitle) {
                    alert('Please provide both email and book title.');
                    return;
                }

                notifySubmitBtn.disabled = true;
                notifySubmitBtn.innerText = 'WAITING...';

                try {
                    const response = await fetch(`${CONFIG.API_BASE_URL}/api/notifications/notify-me`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, bookTitle, productTitle: bookTitle })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        notifyForm.style.display = 'none';
                        notifyConfirmMsg.style.display = 'block';
                        // Keep modal open for a few seconds then close
                        setTimeout(closeNotify, 5000);
                    } else {
                        alert(data.message || 'Error occurred. Please try again.');
                        notifySubmitBtn.disabled = false;
                        notifySubmitBtn.innerText = 'NOTIFY ME';
                    }
                } catch (err) {
                    console.error('Notify submission error:', err);
                    alert('Server error. Please try again later.');
                    notifySubmitBtn.disabled = false;
                    notifySubmitBtn.innerText = 'NOTIFY ME';
                }
            });
        }
    }

    // Export for admin dashboard to trigger immediate updates
    window.syncFooterConfig = syncFooterConfig;
});
