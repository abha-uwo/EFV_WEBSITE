// --- KEY-BASED DIRECT I18N SYSTEM ---
(function initI18nSystem() {
    const countryToMetadata = {
        "afghanistan": { code: "AF", lang: "ps", dial: "+93" },
        "albania": { code: "AL", lang: "sq", dial: "+355" },
        "algeria": { code: "DZ", lang: "ar", dial: "+213" },
        "andorra": { code: "AD", lang: "ca", dial: "+376" },
        "angola": { code: "AO", lang: "pt", dial: "+244" },
        "argentina": { code: "AR", lang: "es", dial: "+54" },
        "armenia": { code: "AM", lang: "hy", dial: "+374" },
        "australia": { code: "AU", lang: "en", dial: "+61" },
        "austria": { code: "AT", lang: "de", dial: "+43" },
        "azerbaijan": { code: "AZ", lang: "az", dial: "+994" },
        "bahamas": { code: "BS", lang: "en", dial: "+1-242" },
        "bahrain": { code: "BH", lang: "ar", dial: "+973" },
        "bangladesh": { code: "BD", lang: "bn", dial: "+880" },
        "barbados": { code: "BB", lang: "en", dial: "+1-246" },
        "belarus": { code: "BY", lang: "be", dial: "+375" },
        "belgium": { code: "BE", lang: "nl", dial: "+32" },
        "belize": { code: "BZ", lang: "en", dial: "+501" },
        "benin": { code: "BJ", lang: "fr", dial: "+229" },
        "bhutan": { code: "BT", lang: "dz", dial: "+975" },
        "bolivia": { code: "BO", lang: "es", dial: "+591" },
        "bosnia and herzegovina": { code: "BA", lang: "bs", dial: "+387" },
        "botswana": { code: "BW", lang: "en", dial: "+267" },
        "brazil": { code: "BR", lang: "pt", dial: "+55" },
        "brunei": { code: "BN", lang: "ms", dial: "+673" },
        "bulgaria": { code: "BG", lang: "bg", dial: "+359" },
        "burkina faso": { code: "BF", lang: "fr", dial: "+226" },
        "burundi": { code: "BI", lang: "fr", dial: "+257" },
        "cambodia": { code: "KH", lang: "km", dial: "+855" },
        "cameroon": { code: "CM", lang: "fr", dial: "+237" },
        "canada": { code: "CA", lang: "en", dial: "+1" },
        "cape verde": { code: "CV", lang: "pt", dial: "+238" },
        "central african republic": { code: "CF", lang: "fr", dial: "+236" },
        "chad": { code: "TD", lang: "fr", dial: "+235" },
        "chile": { code: "CL", lang: "es", dial: "+56" },
        "china": { code: "CN", lang: "zh-CN", dial: "+86" },
        "colombia": { code: "CO", lang: "es", dial: "+57" },
        "comoros": { code: "KM", lang: "ar", dial: "+269" },
        "congo": { code: "CG", lang: "fr", dial: "+242" },
        "costa rica": { code: "CR", lang: "es", dial: "+506" },
        "croatia": { code: "HR", lang: "hr", dial: "+385" },
        "cuba": { code: "CU", lang: "es", dial: "+53" },
        "cyprus": { code: "CY", lang: "el", dial: "+357" },
        "czech republic": { code: "CZ", lang: "cs", dial: "+420" },
        "denmark": { code: "DK", lang: "da", dial: "+45" },
        "djibouti": { code: "DJ", lang: "fr", dial: "+253" },
        "dominica": { code: "DM", lang: "en", dial: "+1-767" },
        "dominican republic": { code: "DO", lang: "es", dial: "+1-809" },
        "ecuador": { code: "EC", lang: "es", dial: "+593" },
        "egypt": { code: "EG", lang: "ar", dial: "+20" },
        "el salvador": { code: "SV", lang: "es", dial: "+503" },
        "equatorial guinea": { code: "GQ", lang: "es", dial: "+240" },
        "eritrea": { code: "ER", lang: "ti", dial: "+291" },
        "estonia": { code: "EE", lang: "et", dial: "+372" },
        "eswatini": { code: "SZ", lang: "en", dial: "+268" },
        "ethiopia": { code: "ET", lang: "am", dial: "+251" },
        "fiji": { code: "FJ", lang: "en", dial: "+679" },
        "finland": { code: "FI", lang: "fi", dial: "+358" },
        "france": { code: "FR", lang: "fr", dial: "+33" },
        "gabon": { code: "GA", lang: "fr", dial: "+241" },
        "gambia": { code: "GM", lang: "en", dial: "+220" },
        "georgia": { code: "GE", lang: "ka", dial: "+995" },
        "germany": { code: "DE", lang: "de", dial: "+49" },
        "ghana": { code: "GH", lang: "en", dial: "+233" },
        "greece": { code: "GR", lang: "el", dial: "+30" },
        "grenada": { code: "GD", lang: "en", dial: "+1-473" },
        "guatemala": { code: "GT", lang: "es", dial: "+502" },
        "guinea": { code: "GN", lang: "fr", dial: "+224" },
        "guyana": { code: "GY", lang: "en", dial: "+592" },
        "haiti": { code: "HT", lang: "fr", dial: "+509" },
        "honduras": { code: "HN", lang: "es", dial: "+504" },
        "hungary": { code: "HU", lang: "hu", dial: "+36" },
        "iceland": { code: "IS", lang: "is", dial: "+354" },
        "india": { code: "IN", lang: "hi", dial: "+91" },
        "indonesia": { code: "ID", lang: "id", dial: "+62" },
        "iran": { code: "IR", lang: "fa", dial: "+98" },
        "iraq": { code: "IQ", lang: "ar", dial: "+964" },
        "ireland": { code: "IE", lang: "en", dial: "+353" },
        "israel": { code: "IL", lang: "he", dial: "+972" },
        "italy": { code: "IT", lang: "it", dial: "+39" },
        "jamaica": { code: "JM", lang: "en", dial: "+1-876" },
        "japan": { code: "JP", lang: "ja", dial: "+81" },
        "jordan": { code: "JO", lang: "ar", dial: "+962" },
        "kazakhstan": { code: "KZ", lang: "kk", dial: "+7" },
        "kenya": { code: "KE", lang: "sw", dial: "+254" },
        "kiribati": { code: "KI", lang: "en", dial: "+686" },
        "kosovo": { code: "XK", lang: "sq", dial: "+383" },
        "kuwait": { code: "KW", lang: "ar", dial: "+965" },
        "kyrgyzstan": { code: "KG", lang: "ky", dial: "+996" },
        "laos": { code: "LA", lang: "lo", dial: "+856" },
        "latvia": { code: "LV", lang: "lv", dial: "+371" },
        "lebanon": { code: "LB", lang: "ar", dial: "+961" },
        "lesotho": { code: "LS", lang: "en", dial: "+266" },
        "liberia": { code: "LR", lang: "en", dial: "+231" },
        "libya": { code: "LY", lang: "ar", dial: "+218" },
        "liechtenstein": { code: "LI", lang: "de", dial: "+423" },
        "lithuania": { code: "LT", lang: "lt", dial: "+370" },
        "luxembourg": { code: "LU", lang: "fr", dial: "+352" },
        "madagascar": { code: "MG", lang: "mg", dial: "+261" },
        "malawi": { code: "MW", lang: "en", dial: "+265" },
        "malaysia": { code: "MY", lang: "ms", dial: "+60" },
        "maldives": { code: "MV", lang: "dv", dial: "+960" },
        "mali": { code: "ML", lang: "fr", dial: "+223" },
        "malta": { code: "MT", lang: "mt", dial: "+356" },
        "mauritania": { code: "MR", lang: "ar", dial: "+222" },
        "mauritius": { code: "MU", lang: "en", dial: "+230" },
        "mexico": { code: "MX", lang: "es", dial: "+52" },
        "micronesia": { code: "FM", lang: "en", dial: "+691" },
        "moldova": { code: "MD", lang: "ro", dial: "+373" },
        "monaco": { code: "MC", lang: "fr", dial: "+377" },
        "mongolia": { code: "MN", lang: "mn", dial: "+976" },
        "montenegro": { code: "ME", lang: "sr", dial: "+382" },
        "morocco": { code: "MA", lang: "ar", dial: "+212" },
        "mozambique": { code: "MZ", lang: "pt", dial: "+258" },
        "myanmar": { code: "MM", lang: "my", dial: "+95" },
        "namibia": { code: "NA", lang: "en", dial: "+264" },
        "nauru": { code: "NR", lang: "en", dial: "+674" },
        "nepal": { code: "NP", lang: "ne", dial: "+977" },
        "netherlands": { code: "NL", lang: "nl", dial: "+31" },
        "new zealand": { code: "NZ", lang: "en", dial: "+64" },
        "nicaragua": { code: "NI", lang: "es", dial: "+505" },
        "niger": { code: "NE", lang: "fr", dial: "+227" },
        "nigeria": { code: "NG", lang: "en", dial: "+234" },
        "north korea": { code: "KP", lang: "ko", dial: "+850" },
        "north macedonia": { code: "MK", lang: "mk", dial: "+389" },
        "norway": { code: "NO", lang: "no", dial: "+47" },
        "oman": { code: "OM", lang: "ar", dial: "+968" },
        "pakistan": { code: "PK", lang: "ur", dial: "+92" },
        "palau": { code: "PW", lang: "en", dial: "+680" },
        "palestine": { code: "PS", lang: "ar", dial: "+970" },
        "panama": { code: "PA", lang: "es", dial: "+507" },
        "papua new guinea": { code: "PG", lang: "en", dial: "+675" },
        "paraguay": { code: "PY", lang: "es", dial: "+595" },
        "peru": { code: "PE", lang: "es", dial: "+51" },
        "philippines": { code: "PH", lang: "tl", dial: "+63" },
        "poland": { code: "PL", lang: "pl", dial: "+48" },
        "portugal": { code: "PT", lang: "pt", dial: "+351" },
        "qatar": { code: "QA", lang: "ar", dial: "+974" },
        "romania": { code: "RO", lang: "ro", dial: "+40" },
        "russia": { code: "RU", lang: "ru", dial: "+7" },
        "rwanda": { code: "RW", lang: "rw", dial: "+250" },
        "samoa": { code: "WS", lang: "sm", dial: "+685" },
        "san marino": { code: "SM", lang: "it", dial: "+378" },
        "saudi arabia": { code: "SA", lang: "ar", dial: "+966" },
        "senegal": { code: "SN", lang: "fr", dial: "+221" },
        "serbia": { code: "RS", lang: "sr", dial: "+381" },
        "seychelles": { code: "SC", lang: "en", dial: "+248" },
        "sierra leone": { code: "SL", lang: "en", dial: "+232" },
        "singapore": { code: "SG", lang: "en", dial: "+65" },
        "slovakia": { code: "SK", lang: "sk", dial: "+421" },
        "slovenia": { code: "SI", lang: "sl", dial: "+386" },
        "solomon islands": { code: "SB", lang: "en", dial: "+677" },
        "somalia": { code: "SO", lang: "so", dial: "+252" },
        "south africa": { code: "ZA", lang: "en", dial: "+27" },
        "south korea": { code: "KR", lang: "ko", dial: "+82" },
        "south sudan": { code: "SS", lang: "en", dial: "+211" },
        "spain": { code: "ES", lang: "es", dial: "+34" },
        "sri lanka": { code: "LK", lang: "si", dial: "+94" },
        "sudan": { code: "SD", lang: "ar", dial: "+249" },
        "suriname": { code: "SR", lang: "nl", dial: "+597" },
        "sweden": { code: "SE", lang: "sv", dial: "+46" },
        "switzerland": { code: "CH", lang: "de", dial: "+41" },
        "syria": { code: "SY", lang: "ar", dial: "+963" },
        "taiwan": { code: "TW", lang: "zh-TW", dial: "+886" },
        "tajikistan": { code: "TJ", lang: "tg", dial: "+992" },
        "tanzania": { code: "TZ", lang: "sw", dial: "+255" },
        "thailand": { code: "TH", lang: "th", dial: "+66" },
        "timor-leste": { code: "TL", lang: "pt", dial: "+670" },
        "togo": { code: "TG", lang: "fr", dial: "+228" },
        "tonga": { code: "TO", lang: "en", dial: "+676" },
        "trinidad and tobago": { code: "TT", lang: "en", dial: "+1-868" },
        "tunisia": { code: "TN", lang: "ar", dial: "+216" },
        "turkey": { code: "TR", lang: "tr", dial: "+90" },
        "turkmenistan": { code: "TM", lang: "tk", dial: "+993" },
        "tuvalu": { code: "TV", lang: "en", dial: "+688" },
        "uganda": { code: "UG", lang: "en", dial: "+256" },
        "ukraine": { code: "UA", lang: "uk", dial: "+380" },
        "united arab emirates": { code: "AE", lang: "ar", dial: "+971" },
        "united kingdom": { code: "GB", lang: "en", dial: "+44" },
        "united states": { code: "US", lang: "en", dial: "+1" },
        "uruguay": { code: "UY", lang: "es", dial: "+598" },
        "uzbekistan": { code: "UZ", lang: "uz", dial: "+998" },
        "vanuatu": { code: "VU", lang: "en", dial: "+678" },
        "vatican city": { code: "VA", lang: "it", dial: "+379" },
        "venezuela": { code: "VE", lang: "es", dial: "+58" },
        "vietnam": { code: "VN", lang: "vi", dial: "+84" },
        "yemen": { code: "YE", lang: "ar", dial: "+967" },
        "zambia": { code: "ZM", lang: "en", dial: "+260" },
        "zimbabwe": { code: "ZW", lang: "en", dial: "+263" }
    };
    window.countryToMetadata = countryToMetadata;

    const LOCAL_LANGUAGES = ['en', 'hi', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'ja', 'zh-CN', 'ko', 'ar'];

    let currentLang = 'en';
    const isManual = localStorage.getItem('efv_lang_selected_manually') === 'true';
    if (isManual) {
        currentLang = localStorage.getItem('efv_lang') || 'en';
    } else {
        const country = localStorage.getItem('efv_selected_country');
        if (country) {
            // Find lang by country code in our metadata
            const meta = Object.values(countryToMetadata).find(m => m.code === country);
            currentLang = meta ? meta.lang : 'en';
        } else {
            currentLang = localStorage.getItem('efv_lang') || 'en';
        }
    }

    let translations = {};
    let fallbackTranslations = {};

    // 0. PRE-INITIALIZATION LOCK (CRITICAL FOR NO-FLASH)
    document.documentElement.classList.add('efv-i18n-loading');

    // Dynamic countries list, loaded from API, fallbacks to defaults
    let countries = [];

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'ar', name: 'Arabic' },
        { code: 'zh-CN', name: 'Chinese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'ko', name: 'Korean' }
    ];

    // CSS Styling
    const style = document.createElement('style');
    style.innerHTML = `
        /* Flash Prevention */
        html.efv-i18n-loading body {
            opacity: 0 !important;
            transition: opacity 0.3s ease-in-out;
            pointer-events: none !important;
        }
        /* Custom scrollbar for popup */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(212,175,55,0.2);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(212,175,55,0.4);
        }
    `;
    document.head.appendChild(style);

    // Dynamic Google Translate Integration
    function loadGoogleTranslate() {
        if (document.getElementById('google_translate_script')) return;

        const gtDiv = document.createElement('div');
        gtDiv.id = 'google_translate_element';
        gtDiv.style.display = 'none';
        document.body.appendChild(gtDiv);

        window.googleTranslateElementInit = function() {
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
        };

        const script = document.createElement('script');
        script.id = 'google_translate_script';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.head.appendChild(script);
    }

    function setGoogleTranslateLanguage(langCode) {
        // Clear cookies first to avoid conflict
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;

        // Map languages that google translate expects
        let gLang = langCode;
        if (gLang === 'zh-CN') gLang = 'zh-CN';

        if (gLang && gLang !== 'en') {
            const cookieVal = `/en/${gLang}`;
            document.cookie = `googtrans=${cookieVal}; path=/;`;
            document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname};`;
            
            // Reload page once to let Google Translate trigger if it hasn't translated yet
            if (!sessionStorage.getItem('efv_translated_reload')) {
                sessionStorage.setItem('efv_translated_reload', 'true');
                window.location.reload();
            }
        } else {
            sessionStorage.removeItem('efv_translated_reload');
        }
    }

    // Deep nested key resolver
    function getNestedValue(obj, keyPath) {
        if (!obj) return null;
        const keys = keyPath.split('.');
        let current = obj;
        for (const key of keys) {
            if (current === null || current === undefined) return null;
            current = current[key];
        }
        return current;
    }

    // Expose translation helper globally
    window.t = function(key, defaultVal) {
        let val = getNestedValue(translations, key);
        if (val === null || val === undefined) {
            val = getNestedValue(fallbackTranslations, key);
        }
        return (val !== null && val !== undefined) ? val : (defaultVal !== undefined ? defaultVal : key);
    };

    // Load locales from files
    async function loadTranslations(lang) {
        // If not locally supported, fallback to English local file and use Google Translate
        const useLocal = LOCAL_LANGUAGES.includes(lang);
        const fetchLang = useLocal ? lang : 'en';

        try {
            const res = await fetch(`/locales/${fetchLang}.json?v=${new Date().getTime()}`);
            if (res.ok) {
                translations = await res.json();
            } else {
                console.warn(`🌍 i18n: Failed to load translations for "${fetchLang}"`);
            }
        } catch (err) {
            console.error(`🌍 i18n: Error fetching translations for "${fetchLang}":`, err);
        }

        // Load English fallback if selected language is not English
        if (fetchLang !== 'en') {
            try {
                const res = await fetch('/locales/en.json');
                if (res.ok) {
                    fallbackTranslations = await res.json();
                }
            } catch (err) {
                console.error('🌍 i18n: Error fetching English fallback:', err);
            }
        } else {
            fallbackTranslations = translations;
        }

        // Apply Google Translate for non-local languages or the Dashboard
        const isDashboard = window.location.pathname.includes('dashboard');
        
        if (!useLocal || (isDashboard && lang !== 'en')) {
            loadGoogleTranslate();
            setGoogleTranslateLanguage(lang);
        } else {
            // Clear google translate if returning to a local language on the main site
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
        }
    }

    function translateElement(el) {
        if (el.getAttribute('data-i18n-active-lang') === currentLang) return;

        // Ensure translations are loaded before marking active
        const useLocal = LOCAL_LANGUAGES.includes(currentLang);
        if (useLocal && currentLang !== 'en' && (!translations || Object.keys(translations).length === 0)) {
            return;
        }

        let applied = false;
        const key = el.getAttribute('data-i18n');
        if (key) {
            const val = window.t(key);
            if (val && val !== key) {
                el.innerHTML = val;
                applied = true;
            }
        }

        const phKey = el.getAttribute('data-i18n-placeholder');
        if (phKey) {
            const val = window.t(phKey);
            if (val && val !== phKey) {
                el.setAttribute('placeholder', val);
                applied = true;
            }
        }

        const altKey = el.getAttribute('data-i18n-alt');
        if (altKey) {
            const val = window.t(altKey);
            if (val && val !== altKey) {
                el.setAttribute('alt', val);
                applied = true;
            }
        }

        const titleKey = el.getAttribute('data-i18n-title');
        if (titleKey) {
            const val = window.t(titleKey);
            if (val && val !== titleKey) {
                el.setAttribute('title', val);
                applied = true;
            }
        }

        if (applied || currentLang === 'en') {
            el.setAttribute('data-i18n-active-lang', currentLang);
        }
    }

    function translatePage() {
        const elements = document.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-alt], [data-i18n-title]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                const before = el.innerHTML;
                translateElement(el);
                if (key.startsWith('nav.') || key.startsWith('hero.')) {
                    console.log(`EFV_I18N: Translated [${key}] | from: "${before}" -> to: "${el.innerHTML}"`);
                }
            } else {
                translateElement(el);
            }
        });
        document.documentElement.setAttribute('lang', currentLang);
    }

    function updateLanguageUI(langCode) {
        const langObj = languages.find(l => l.code === langCode);
        const currentLangEl = document.getElementById('i18n-current-lang');
        if (currentLangEl) {
            if (langObj) {
                currentLangEl.textContent = langObj.name;
                currentLangEl.setAttribute('data-i18n', `nav.languages.${langCode}`);
                currentLangEl.removeAttribute('data-i18n-active-lang'); // Allow translation
            } else {
                // Non-local language name mapping
                const meta = Object.values(countryToMetadata).find(m => m.lang === langCode);
                currentLangEl.textContent = meta ? meta.lang.toUpperCase() : langCode.toUpperCase();
                currentLangEl.removeAttribute('data-i18n');
            }
        }
    }

    async function applyLanguage(langCode, isExternalSync = false) {
        currentLang = langCode;
        if (!isExternalSync) {
            localStorage.setItem('efv_lang', langCode);
        }

        // Clear markers to force complete page refresh in DOM
        const elements = document.querySelectorAll('[data-i18n-active-lang]');
        elements.forEach(el => el.removeAttribute('data-i18n-active-lang'));

        await loadTranslations(langCode);
        updateLanguageUI(langCode);
        translatePage();

        // Notify other elements/scripts (e.g. products listing) that language changed
        window.dispatchEvent(new CustomEvent('efv-lang-changed', { detail: { language: langCode } }));
        console.log(`🌍 i18n: Language applied successfully: "${langCode}"`);
    }

    // Tab Synchronization Logic
    window.addEventListener('storage', (e) => {
        if (e.key === 'efv_lang' && e.newValue) {
            console.log('🔄 Syncing language change from another tab:', e.newValue);
            applyLanguage(e.newValue, true);
        }
    });

    // In-tab event listener for React / Next.js language changes
    window.addEventListener('efv-lang-changed', (e) => {
        if (e.detail && e.detail.language && e.detail.language !== currentLang) {
            console.log('🔄 Syncing language change from custom event:', e.detail.language);
            applyLanguage(e.detail.language, true);
        }
    });

    // MutationObserver to translate dynamically added elements automatically (like chatbot, modal)
    const observer = new MutationObserver((mutations) => {
        let hasAddedNodes = false;
        for (const m of mutations) {
            if (m.addedNodes.length > 0) {
                hasAddedNodes = true;
                break;
            }
        }
        if (hasAddedNodes) {
            translatePage();
        }
    });

    async function initDOM() {
        // Use all available countries from our comprehensive list
        countries = Object.keys(countryToMetadata).map(key => {
            const meta = countryToMetadata[key];
            const nameWords = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1));
            const name = nameWords.join(' ');
            return {
                code: meta.code,
                name: name,
                lang: meta.lang,
                dialCode: meta.dial
            };
        });
        
        // Sort alphabetically
        countries.sort((a, b) => a.name.localeCompare(b.name));

        // Modal HTML for Country Selection (Instantly Visible if no selection)
        const popupHtml = `
            <div id="i18n-popup-overlay" class="notranslate" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:999999;display:none;align-items:center;justify-content:center;opacity:0;transition:opacity 0.4s;pointer-events:none;">
                <div id="i18n-popup-content" style="background:#0a0e1a;border:1px solid rgba(212,175,55,0.2);border-radius:24px;width:95%;max-width:600px;box-shadow:0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.05);transform:scale(0.9);transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;">
                    <div style="padding:25px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;align-items:center;text-align:center;">
                        <div style="width:50px;height:50px;background:rgba(212,175,55,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:15px;">
                            <i class="fas fa-globe-americas" style="color:#d4af37;font-size:1.5rem;"></i>
                        </div>
                        <h2 data-i18n="location.title" style="margin:0;font-size:1.4rem;font-weight:700;color:white;letter-spacing:0.5px;">Choose Your Location</h2>
                        <p data-i18n="location.subtitle" style="color:rgba(255,255,255,0.5);font-size:0.9rem;margin-top:8px;">Experience the portal in your preferred language.</p>
                    </div>
                    <div style="padding: 0 25px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 40px; top: 12px; color: rgba(255,255,255,0.4); font-size: 0.9rem;"></i>
                        <input type="text" id="i18n-country-search" placeholder="Search your country..." style="width: 100%; padding: 10px 15px 10px 40px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: white; font-size: 0.85rem; outline: none; transition: all 0.3s; box-sizing: border-box;">
                    </div>
                    <div id="i18n-country-list" style="padding:20px;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;gap:12px;max-height:45vh;" class="custom-scrollbar">
                        ${countries.map(c => `
                            <button class="i18n-country-btn notranslate" data-code="${c.code}" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px;color:white;text-align:left;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                                <img src="https://flagcdn.com/w40/${c.code.toLowerCase()}.png" width="28" style="border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,0.4); flex-shrink:0;" alt="${c.name}">
                                <span style="font-size:0.85rem; font-weight: 500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.name}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div style="padding:20px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;background:rgba(255,255,255,0.02);">
                        <p data-i18n="location.footer" style="color:rgba(255,255,255,0.4);font-size:0.75rem;margin:0;">Setting your region unlocks localized content and pricing.</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHtml);

        // Setup Search Engine for Countries
        const searchInput = document.getElementById('i18n-country-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                const buttons = document.querySelectorAll('.i18n-country-btn');
                buttons.forEach(btn => {
                    const countryName = btn.querySelector('span').textContent.toLowerCase();
                    if (countryName.includes(term)) {
                        btn.style.display = 'flex';
                    } else {
                        btn.style.display = 'none';
                    }
                });
            });
        }

        // Language Switcher Dropdown in Navbar
        const navActions = document.querySelector('.nav-actions');

        // Check if the logged-in user is an admin
        const _authRaw = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
        let _isAdmin = false;
        try {
            if (_authRaw) {
                const _authData = JSON.parse(_authRaw);
                _isAdmin = (_authData.role === 'admin');
            }
        } catch (e) {}

        if (navActions) {
            const changeLocationBtnHtml = _isAdmin ? `
                <div style="border-top:1px solid rgba(255,255,255,0.05);padding:8px 0;">
                    <button id="i18n-change-location-btn" style="background:transparent;border:none;width:100%;text-align:left;padding:12px 18px;color:#d4af37;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:10px;">
                        <i class="fas fa-map-marker-alt"></i>
                        <span data-i18n="nav.change_location">Change Location</span>
                    </button>
                </div>
            ` : '';

            const switcherHtml = `
                <div style="position:relative;margin-right:15px;display:inline-flex;align-items:center;" id="i18n-switcher-container" class="notranslate">
                    <button id="i18n-switcher-btn" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:50px;padding:8px 16px;color:white;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:0.85rem;transition:all 0.3s;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
                        <i class="fas fa-language" style="color:#d4af37;font-size:1rem;"></i>
                        <span id="i18n-current-lang" class="notranslate">English</span>
                        <i class="fas fa-caret-down" style="font-size:0.7rem;opacity:0.6;margin-left:2px;"></i>
                    </button>
                    <div id="i18n-switcher-dropdown" style="position:absolute;top:calc(100% + 12px);right:0;width:190px;background:#0d111d;border:1px solid rgba(212,175,55,0.2);border-radius:15px;box-shadow:0 10px 40px rgba(0,0,0,0.6);display:none;flex-direction:column;overflow:hidden;z-index:999999;">
                        <div style="max-height:350px;overflow-y:auto;padding:8px 0;" class="custom-scrollbar">
                            ${languages.map(l => `
                                <button class="i18n-lang-btn notranslate" data-code="${l.code}" style="background:transparent;border:none;width:100%;text-align:left;padding:12px 18px;color:rgba(255,255,255,0.8);font-size:0.9rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:10px;border-left:3px solid transparent;">
                                    ${l.name}
                                </button>
                            `).join('')}
                        </div>
                        ${changeLocationBtnHtml}
                    </div>
                </div>
            `;
            navActions.insertAdjacentHTML('afterbegin', switcherHtml);

            const switcherBtn = document.getElementById('i18n-switcher-btn');
            const switcherDropdown = document.getElementById('i18n-switcher-dropdown');

            switcherBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = switcherDropdown.style.display === 'flex';
                switcherDropdown.style.display = isVisible ? 'none' : 'flex';
                if (!isVisible) {
                    switcherBtn.style.background = 'rgba(212,175,55,0.1)';
                    switcherBtn.style.borderColor = 'rgba(212,175,55,0.3)';
                }
            });

            document.addEventListener('click', () => {
                switcherDropdown.style.display = 'none';
                switcherBtn.style.background = 'rgba(255,255,255,0.05)';
                switcherBtn.style.borderColor = 'rgba(255,255,255,0.1)';
            });

            document.querySelectorAll('.i18n-lang-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const code = e.currentTarget.getAttribute('data-code');
                    localStorage.setItem('efv_lang_selected_manually', 'true');
                    applyLanguage(code);
                    switcherDropdown.style.display = 'none';
                });
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'rgba(212, 175, 55, 0.08)';
                    btn.style.color = '#fff';
                    btn.style.borderLeftColor = '#d4af37';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'transparent';
                    btn.style.color = 'rgba(255,255,255,0.8)';
                    btn.style.borderLeftColor = 'transparent';
                });
            });

            const changeLocBtn = document.getElementById('i18n-change-location-btn');
            if (changeLocBtn) {
                changeLocBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    switcherDropdown.style.display = 'none';
                    window.openCountryPopup();
                });
                changeLocBtn.addEventListener('mouseenter', () => {
                    changeLocBtn.style.background = 'rgba(212, 175, 55, 0.08)';
                });
                changeLocBtn.addEventListener('mouseleave', () => {
                    changeLocBtn.style.background = 'transparent';
                });
            }
        }

        const overlay = document.getElementById('i18n-popup-overlay');
        const content = document.getElementById('i18n-popup-content');

        // Function to open country popup
        window.openCountryPopup = function () {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            setTimeout(() => {
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'all';
                content.style.transform = 'scale(1)';
            }, 100);
        };

        // Show popup as a mandatory starting point on first visit
        if (!localStorage.getItem('efv_country_selected') && !sessionStorage.getItem('efv_country_selected')) {
            window.openCountryPopup();
        }

        document.querySelectorAll('.i18n-country-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                btn.style.background = 'rgba(212, 175, 55, 0.08)';
                btn.style.transform = 'translateY(-2px)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                btn.style.background = 'rgba(255, 255, 255, 0.03)';
                btn.style.transform = 'translateY(0)';
            });

            btn.addEventListener('click', (e) => {
                const countryCode = e.currentTarget.getAttribute('data-code');
                const selectedCountryData = countries.find(c => c.code === countryCode);
                const lang = selectedCountryData ? selectedCountryData.lang : 'en';

                // Reset manual override since a new country is being selected
                localStorage.removeItem('efv_lang_selected_manually');

                const originalContent = btn.innerHTML;
                btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Initializing...`;
                btn.style.pointerEvents = 'none';
                btn.style.background = 'rgba(212, 175, 55, 0.2)';

                localStorage.setItem('efv_country_selected', 'true');
                sessionStorage.setItem('efv_country_selected', 'true');
                localStorage.setItem('efv_selected_country', countryCode);
                localStorage.setItem('efv_selected_country_data', JSON.stringify({
                    iso2: selectedCountryData.code,
                    dialCode: selectedCountryData.dialCode
                }));

                applyLanguage(lang);

                // Dispatch custom event for same-tab updates
                window.dispatchEvent(new CustomEvent('efv-country-changed', { 
                    detail: { 
                        iso2: selectedCountryData.code, 
                        dialCode: selectedCountryData.dialCode 
                    } 
                }));

                setTimeout(() => {
                    overlay.style.opacity = '0';
                    content.style.transform = 'scale(0.9)';
                    overlay.style.pointerEvents = 'none';
                    document.body.style.overflow = '';

                    setTimeout(() => {
                        overlay.style.display = 'none';
                        if (window.efvChatbot && typeof window.efvChatbot.showIntro === 'function') {
                            setTimeout(() => {
                                window.efvChatbot.showIntro();
                            }, 500);
                        }
                    }, 400);
                }, 800);
            });
        });

        // Update language UI first then translate page
        updateLanguageUI(currentLang);
        translatePage();

        // Remove loading state
        setTimeout(() => {
            document.documentElement.classList.remove('efv-i18n-loading');
        }, 150);

        // Start observing DOM changes for future translation
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Load initial translations before DOM is ready
    loadTranslations(currentLang).then(() => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initDOM();
                translatePage();
            });
        } else {
            initDOM();
            translatePage();
        }
    });
})();
