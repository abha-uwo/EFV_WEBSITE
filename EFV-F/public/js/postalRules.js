/**
 * postalRules.js — Centralized Country Postal / ZIP Code Configuration & Validation Engine
 * Supports dynamic frontend & backend validation across all EFV countries.
 */

(function(global) {
    'use strict';

    // ── Standard ISO Country Postal Code Rules ────────────────────────────────
    const POSTAL_RULES = {
        // --- Asia & Middle East ---
        'IN': {
            countryCode: 'IN',
            countryName: 'India',
            label: 'PIN Code',
            required: true,
            minLength: 6,
            maxLength: 6,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^[1-9][0-9]{5}$|^[0-9]{6}$',
            placeholder: '482001',
            helperText: 'Enter 6-digit PIN code',
            example: '482001',
            normalize: (val) => (val || '').trim()
        },
        'OM': {
            countryCode: 'OM',
            countryName: 'Oman',
            label: 'Postal Code',
            required: true,
            minLength: 3,
            maxLength: 3,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^[0-9]{3}$',
            placeholder: '123',
            helperText: 'Enter 3-digit postal code',
            example: '123',
            normalize: (val) => (val || '').trim()
        },
        'AE': {
            countryCode: 'AE',
            countryName: 'United Arab Emirates',
            label: 'Postal Code (Optional)',
            required: false,
            minLength: 0,
            maxLength: 20,
            allowedChars: /^[A-Za-z0-9 -]$/,
            allowedRegex: /[^A-Za-z0-9 -]/g,
            pattern: '^.*$',
            placeholder: 'Optional (Not required in UAE)',
            helperText: 'Postal code is not required for this destination.',
            example: '',
            normalize: (val) => (val || '').trim()
        },
        'SA': {
            countryCode: 'SA',
            countryName: 'Saudi Arabia',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 10,
            allowedChars: /^[0-9-]$/,
            allowedRegex: /[^0-9-]/g,
            pattern: '^\\d{5}(-\\d{4})?$|^\\d{5}$',
            placeholder: '11564',
            helperText: 'Enter 5-digit postal code (e.g. 11564 or 12345-6789)',
            example: '11564',
            normalize: (val) => (val || '').trim()
        },
        'QA': {
            countryCode: 'QA',
            countryName: 'Qatar',
            label: 'Postal Code (Optional)',
            required: false,
            minLength: 0,
            maxLength: 20,
            allowedChars: /^[A-Za-z0-9 -]$/,
            allowedRegex: /[^A-Za-z0-9 -]/g,
            pattern: '^.*$',
            placeholder: 'Optional (Not required in Qatar)',
            helperText: 'Postal code is not required for this destination.',
            example: '',
            normalize: (val) => (val || '').trim()
        },
        'KW': {
            countryCode: 'KW',
            countryName: 'Kuwait',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '13001',
            helperText: 'Enter 5-digit postal code',
            example: '13001',
            normalize: (val) => (val || '').trim()
        },
        'BH': {
            countryCode: 'BH',
            countryName: 'Bahrain',
            label: 'Postal Code',
            required: true,
            minLength: 3,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{3,4}$',
            placeholder: '317',
            helperText: 'Enter 3 or 4-digit block/postal code',
            example: '317',
            normalize: (val) => (val || '').trim()
        },
        'CN': {
            countryCode: 'CN',
            countryName: 'China',
            label: 'Postal Code',
            required: true,
            minLength: 6,
            maxLength: 6,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{6}$',
            placeholder: '100000',
            helperText: 'Enter 6-digit postal code',
            example: '100000',
            normalize: (val) => (val || '').trim()
        },
        'JP': {
            countryCode: 'JP',
            countryName: 'Japan',
            label: 'Postal Code',
            required: true,
            minLength: 7,
            maxLength: 8,
            allowedChars: /^[0-9-]$/,
            allowedRegex: /[^0-9-]/g,
            pattern: '^\\d{3}-?\\d{4}$',
            placeholder: '123-4567',
            helperText: 'Enter 7-digit postal code (e.g. 123-4567)',
            example: '123-4567',
            normalize: (val) => {
                const clean = (val || '').trim();
                if (/^\d{7}$/.test(clean)) {
                    return clean.slice(0, 3) + '-' + clean.slice(3);
                }
                return clean;
            }
        },
        'KR': {
            countryCode: 'KR',
            countryName: 'South Korea',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '03072',
            helperText: 'Enter 5-digit postal code',
            example: '03072',
            normalize: (val) => (val || '').trim()
        },
        'SG': {
            countryCode: 'SG',
            countryName: 'Singapore',
            label: 'Postal Code',
            required: true,
            minLength: 6,
            maxLength: 6,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{6}$',
            placeholder: '018956',
            helperText: 'Enter 6-digit postal code',
            example: '018956',
            normalize: (val) => (val || '').trim()
        },
        'MY': {
            countryCode: 'MY',
            countryName: 'Malaysia',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '50000',
            helperText: 'Enter 5-digit postal code',
            example: '50000',
            normalize: (val) => (val || '').trim()
        },
        'TH': {
            countryCode: 'TH',
            countryName: 'Thailand',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '10110',
            helperText: 'Enter 5-digit postal code',
            example: '10110',
            normalize: (val) => (val || '').trim()
        },
        'ID': {
            countryCode: 'ID',
            countryName: 'Indonesia',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '10110',
            helperText: 'Enter 5-digit postal code',
            example: '10110',
            normalize: (val) => (val || '').trim()
        },
        'PH': {
            countryCode: 'PH',
            countryName: 'Philippines',
            label: 'Postal Code',
            required: true,
            minLength: 4,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{4}$',
            placeholder: '1000',
            helperText: 'Enter 4-digit postal code',
            example: '1000',
            normalize: (val) => (val || '').trim()
        },
        'VN': {
            countryCode: 'VN',
            countryName: 'Vietnam',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 6,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5,6}$',
            placeholder: '700000',
            helperText: 'Enter 5 or 6-digit postal code',
            example: '700000',
            normalize: (val) => (val || '').trim()
        },
        'PK': {
            countryCode: 'PK',
            countryName: 'Pakistan',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '44000',
            helperText: 'Enter 5-digit postal code',
            example: '44000',
            normalize: (val) => (val || '').trim()
        },
        'BD': {
            countryCode: 'BD',
            countryName: 'Bangladesh',
            label: 'Postal Code',
            required: true,
            minLength: 4,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{4}$',
            placeholder: '1000',
            helperText: 'Enter 4-digit postal code',
            example: '1000',
            normalize: (val) => (val || '').trim()
        },
        'LK': {
            countryCode: 'LK',
            countryName: 'Sri Lanka',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '00100',
            helperText: 'Enter 5-digit postal code',
            example: '00100',
            normalize: (val) => (val || '').trim()
        },
        'NP': {
            countryCode: 'NP',
            countryName: 'Nepal',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '44600',
            helperText: 'Enter 5-digit postal code',
            example: '44600',
            normalize: (val) => (val || '').trim()
        },
        'IL': {
            countryCode: 'IL',
            countryName: 'Israel',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 7,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5,7}$',
            placeholder: '6100000',
            helperText: 'Enter 7-digit postal code',
            example: '6100000',
            normalize: (val) => (val || '').trim()
        },
        'TR': {
            countryCode: 'TR',
            countryName: 'Turkey',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '34000',
            helperText: 'Enter 5-digit postal code',
            example: '34000',
            normalize: (val) => (val || '').trim()
        },

        // --- Americas ---
        'US': {
            countryCode: 'US',
            countryName: 'United States',
            label: 'ZIP Code',
            required: true,
            minLength: 5,
            maxLength: 10,
            allowedChars: /^[0-9-]$/,
            allowedRegex: /[^0-9-]/g,
            pattern: '^\\d{5}(-\\d{4})?$',
            placeholder: '10001 or 10001-1234',
            helperText: 'Enter 5-digit ZIP code or ZIP+4',
            example: '10001',
            normalize: (val) => (val || '').trim()
        },
        'CA': {
            countryCode: 'CA',
            countryName: 'Canada',
            label: 'Postal Code',
            required: true,
            minLength: 6,
            maxLength: 7,
            allowedChars: /^[A-Za-z0-9 ]$/,
            allowedRegex: /[^A-Za-z0-9 ]/g,
            pattern: '^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$',
            placeholder: 'K1A 0B1',
            helperText: 'Enter Canadian postal code (e.g. K1A 0B1)',
            example: 'K1A 0B1',
            normalize: (val) => {
                const clean = (val || '').toUpperCase().trim();
                const alphanumeric = clean.replace(/[^A-Z0-9]/g, '');
                if (alphanumeric.length === 6) {
                    return alphanumeric.slice(0, 3) + ' ' + alphanumeric.slice(3);
                }
                return clean;
            }
        },
        'MX': {
            countryCode: 'MX',
            countryName: 'Mexico',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '01000',
            helperText: 'Enter 5-digit postal code',
            example: '01000',
            normalize: (val) => (val || '').trim()
        },
        'BR': {
            countryCode: 'BR',
            countryName: 'Brazil',
            label: 'CEP / Postal Code',
            required: true,
            minLength: 8,
            maxLength: 9,
            allowedChars: /^[0-9-]$/,
            allowedRegex: /[^0-9-]/g,
            pattern: '^\\d{5}-?\\d{3}$',
            placeholder: '01310-100',
            helperText: 'Enter 8-digit CEP (e.g. 01310-100)',
            example: '01310-100',
            normalize: (val) => {
                const clean = (val || '').trim();
                if (/^\d{8}$/.test(clean)) {
                    return clean.slice(0, 5) + '-' + clean.slice(5);
                }
                return clean;
            }
        },
        'AR': {
            countryCode: 'AR',
            countryName: 'Argentina',
            label: 'Postal Code',
            required: true,
            minLength: 4,
            maxLength: 8,
            allowedChars: /^[A-Za-z0-9]$/,
            allowedRegex: /[^A-Za-z0-9]/g,
            pattern: '^([A-Za-z]\\d{4}[A-Za-z]{3}|\\d{4})$',
            placeholder: 'C1024CWN or 1024',
            helperText: 'Enter postal code (e.g. C1024CWN or 1024)',
            example: 'C1024CWN',
            normalize: (val) => (val || '').toUpperCase().trim()
        },
        'CL': {
            countryCode: 'CL',
            countryName: 'Chile',
            label: 'Postal Code',
            required: true,
            minLength: 7,
            maxLength: 7,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{7}$',
            placeholder: '8320000',
            helperText: 'Enter 7-digit postal code',
            example: '8320000',
            normalize: (val) => (val || '').trim()
        },
        'CO': {
            countryCode: 'CO',
            countryName: 'Colombia',
            label: 'Postal Code',
            required: true,
            minLength: 6,
            maxLength: 6,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{6}$',
            placeholder: '110111',
            helperText: 'Enter 6-digit postal code',
            example: '110111',
            normalize: (val) => (val || '').trim()
        },

        // --- Europe ---
        'GB': {
            countryCode: 'GB',
            countryName: 'United Kingdom',
            label: 'Postcode',
            required: true,
            minLength: 5,
            maxLength: 8,
            allowedChars: /^[A-Za-z0-9 ]$/,
            allowedRegex: /[^A-Za-z0-9 ]/g,
            pattern: '^([A-Za-z]{1,2}[0-9][A-Za-z0-9]?|[A-Za-z]{2}[0-9]{1,2})\\s?[0-9][A-Za-z]{2}$|^GIR\\s?0AA$',
            placeholder: 'SW1A 1AA',
            helperText: 'Enter a valid UK postcode (e.g. SW1A 1AA, M1 1AE)',
            example: 'SW1A 1AA',
            normalize: (val) => {
                const clean = (val || '').toUpperCase().trim().replace(/\s+/g, ' ');
                return clean;
            }
        },
        'FR': {
            countryCode: 'FR',
            countryName: 'France',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '75001',
            helperText: 'Enter 5-digit postal code (e.g. 75001)',
            example: '75001',
            normalize: (val) => (val || '').trim()
        },
        'DE': {
            countryCode: 'DE',
            countryName: 'Germany',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '10115',
            helperText: 'Enter 5-digit postal code (e.g. 10115)',
            example: '10115',
            normalize: (val) => (val || '').trim()
        },
        'ES': {
            countryCode: 'ES',
            countryName: 'Spain',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^(0[1-9]|[1-4][0-9]|5[0-2])\\d{3}$|^\\d{5}$',
            placeholder: '28001',
            helperText: 'Enter 5-digit postal code (e.g. 28001)',
            example: '28001',
            normalize: (val) => (val || '').trim()
        },
        'IT': {
            countryCode: 'IT',
            countryName: 'Italy',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '00100',
            helperText: 'Enter 5-digit postal code (e.g. 00100)',
            example: '00100',
            normalize: (val) => (val || '').trim()
        },
        'PT': {
            countryCode: 'PT',
            countryName: 'Portugal',
            label: 'Postal Code',
            required: true,
            minLength: 4,
            maxLength: 8,
            allowedChars: /^[0-9-]$/,
            allowedRegex: /[^0-9-]/g,
            pattern: '^\\d{4}(-\\d{3})?$|^\\d{7}$',
            placeholder: '1000-001',
            helperText: 'Enter 7-digit postal code (e.g. 1000-001)',
            example: '1000-001',
            normalize: (val) => {
                const clean = (val || '').trim();
                if (/^\d{7}$/.test(clean)) {
                    return clean.slice(0, 4) + '-' + clean.slice(4);
                }
                return clean;
            }
        },
        'NL': {
            countryCode: 'NL',
            countryName: 'Netherlands',
            label: 'Postal Code',
            required: true,
            minLength: 6,
            maxLength: 7,
            allowedChars: /^[A-Za-z0-9 ]$/,
            allowedRegex: /[^A-Za-z0-9 ]/g,
            pattern: '^\\d{4}\\s?[A-Za-z]{2}$',
            placeholder: '1234 AB',
            helperText: 'Enter 4 digits and 2 letters (e.g. 1234 AB)',
            example: '1234 AB',
            normalize: (val) => {
                const clean = (val || '').toUpperCase().trim();
                const alphanumeric = clean.replace(/[^A-Z0-9]/g, '');
                if (alphanumeric.length === 6 && /^\d{4}[A-Z]{2}$/.test(alphanumeric)) {
                    return alphanumeric.slice(0, 4) + ' ' + alphanumeric.slice(4);
                }
                return clean;
            }
        },
        'CH': {
            countryCode: 'CH',
            countryName: 'Switzerland',
            label: 'Postal Code',
            required: true,
            minLength: 4,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{4}$',
            placeholder: '8001',
            helperText: 'Enter 4-digit postal code',
            example: '8001',
            normalize: (val) => (val || '').trim()
        },
        'AT': {
            countryCode: 'AT',
            countryName: 'Austria',
            label: 'Postal Code',
            required: true,
            minLength: 4,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{4}$',
            placeholder: '1010',
            helperText: 'Enter 4-digit postal code',
            example: '1010',
            normalize: (val) => (val || '').trim()
        },
        'BE': {
            countryCode: 'BE',
            countryName: 'Belgium',
            label: 'Postal Code',
            required: true,
            minLength: 4,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{4}$',
            placeholder: '1000',
            helperText: 'Enter 4-digit postal code',
            example: '1000',
            normalize: (val) => (val || '').trim()
        },
        'SE': {
            countryCode: 'SE',
            countryName: 'Sweden',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 6,
            allowedChars: /^[0-9 ]$/,
            allowedRegex: /[^0-9 ]/g,
            pattern: '^\\d{3}\\s?\\d{2}$',
            placeholder: '111 22',
            helperText: 'Enter 5-digit postal code (e.g. 111 22)',
            example: '111 22',
            normalize: (val) => {
                const clean = (val || '').trim();
                if (/^\d{5}$/.test(clean)) {
                    return clean.slice(0, 3) + ' ' + clean.slice(3);
                }
                return clean;
            }
        },
        'NO': {
            countryCode: 'NO',
            countryName: 'Norway',
            label: 'Postal Code',
            required: true,
            minLength: 4,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{4}$',
            placeholder: '0001',
            helperText: 'Enter 4-digit postal code',
            example: '0001',
            normalize: (val) => (val || '').trim()
        },
        'DK': {
            countryCode: 'DK',
            countryName: 'Denmark',
            label: 'Postal Code',
            required: true,
            minLength: 4,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{4}$',
            placeholder: '1000',
            helperText: 'Enter 4-digit postal code',
            example: '1000',
            normalize: (val) => (val || '').trim()
        },
        'FI': {
            countryCode: 'FI',
            countryName: 'Finland',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '00100',
            helperText: 'Enter 5-digit postal code',
            example: '00100',
            normalize: (val) => (val || '').trim()
        },
        'PL': {
            countryCode: 'PL',
            countryName: 'Poland',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 6,
            allowedChars: /^[0-9-]$/,
            allowedRegex: /[^0-9-]/g,
            pattern: '^\\d{2}-?\\d{3}$',
            placeholder: '00-001',
            helperText: 'Enter 5-digit postal code (e.g. 00-001)',
            example: '00-001',
            normalize: (val) => {
                const clean = (val || '').trim();
                if (/^\d{5}$/.test(clean)) {
                    return clean.slice(0, 2) + '-' + clean.slice(2);
                }
                return clean;
            }
        },
        'IE': {
            countryCode: 'IE',
            countryName: 'Ireland',
            label: 'Eircode / Postal Code',
            required: false,
            minLength: 0,
            maxLength: 8,
            allowedChars: /^[A-Za-z0-9 ]$/,
            allowedRegex: /[^A-Za-z0-9 ]/g,
            pattern: '^([A-Za-z0-9]{3}\\s?[A-Za-z0-9]{4})?$',
            placeholder: 'D02 X285 (Optional)',
            helperText: 'Enter 7-character Eircode (Optional)',
            example: 'D02 X285',
            normalize: (val) => (val || '').toUpperCase().trim()
        },
        'RU': {
            countryCode: 'RU',
            countryName: 'Russia',
            label: 'Postal Code',
            required: true,
            minLength: 6,
            maxLength: 6,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{6}$',
            placeholder: '101000',
            helperText: 'Enter 6-digit postal code',
            example: '101000',
            normalize: (val) => (val || '').trim()
        },

        // --- Oceania & Africa ---
        'AU': {
            countryCode: 'AU',
            countryName: 'Australia',
            label: 'Postcode',
            required: true,
            minLength: 4,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{4}$',
            placeholder: '2000',
            helperText: 'Enter 4-digit postcode',
            example: '2000',
            normalize: (val) => (val || '').trim()
        },
        'NZ': {
            countryCode: 'NZ',
            countryName: 'New Zealand',
            label: 'Postcode',
            required: true,
            minLength: 4,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{4}$',
            placeholder: '6011',
            helperText: 'Enter 4-digit postcode',
            example: '6011',
            normalize: (val) => (val || '').trim()
        },
        'ZA': {
            countryCode: 'ZA',
            countryName: 'South Africa',
            label: 'Postal Code',
            required: true,
            minLength: 4,
            maxLength: 4,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{4}$',
            placeholder: '0001',
            helperText: 'Enter 4-digit postal code',
            example: '0001',
            normalize: (val) => (val || '').trim()
        },
        'EG': {
            countryCode: 'EG',
            countryName: 'Egypt',
            label: 'Postal Code',
            required: true,
            minLength: 5,
            maxLength: 5,
            allowedChars: /^[0-9]$/,
            allowedRegex: /[^0-9]/g,
            pattern: '^\\d{5}$',
            placeholder: '11511',
            helperText: 'Enter 5-digit postal code',
            example: '11511',
            normalize: (val) => (val || '').trim()
        },

        // --- Generic No-Postal-Code Countries ---
        'HK': { countryCode: 'HK', countryName: 'Hong Kong', label: 'Postal Code (Optional)', required: false, minLength: 0, maxLength: 20, pattern: '^.*$', placeholder: 'Optional (Not used)', helperText: 'Postal code is not required for this destination.' },
        'MO': { countryCode: 'MO', countryName: 'Macau', label: 'Postal Code (Optional)', required: false, minLength: 0, maxLength: 20, pattern: '^.*$', placeholder: 'Optional (Not used)', helperText: 'Postal code is not required for this destination.' },
        'BS': { countryCode: 'BS', countryName: 'Bahamas', label: 'Postal Code (Optional)', required: false, minLength: 0, maxLength: 20, pattern: '^.*$', placeholder: 'Optional', helperText: 'Postal code is not required for this destination.' },
        'FJ': { countryCode: 'FJ', countryName: 'Fiji', label: 'Postal Code (Optional)', required: false, minLength: 0, maxLength: 20, pattern: '^.*$', placeholder: 'Optional', helperText: 'Postal code is not required for this destination.' },
        'GH': { countryCode: 'GH', countryName: 'Ghana', label: 'Postal Code (Optional)', required: false, minLength: 0, maxLength: 20, pattern: '^.*$', placeholder: 'Optional', helperText: 'Postal code is not required for this destination.' },
        'PA': { countryCode: 'PA', countryName: 'Panama', label: 'Postal Code (Optional)', required: false, minLength: 0, maxLength: 20, pattern: '^.*$', placeholder: 'Optional', helperText: 'Postal code is not required for this destination.' },
        'UG': { countryCode: 'UG', countryName: 'Uganda', label: 'Postal Code (Optional)', required: false, minLength: 0, maxLength: 20, pattern: '^.*$', placeholder: 'Optional', helperText: 'Postal code is not required for this destination.' },
        'ZW': { countryCode: 'ZW', countryName: 'Zimbabwe', label: 'Postal Code (Optional)', required: false, minLength: 0, maxLength: 20, pattern: '^.*$', placeholder: 'Optional', helperText: 'Postal code is not required for this destination.' }
    };

    // Fallback rule for any unspecified country
    const DEFAULT_RULE = {
        countryCode: 'OTHER',
        countryName: 'Other',
        label: 'Postal / ZIP Code',
        required: false,
        minLength: 0,
        maxLength: 20,
        allowedChars: /^[A-Za-z0-9 -]$/,
        allowedRegex: /[^A-Za-z0-9 -]/g,
        pattern: '^.*$',
        placeholder: 'Postal / ZIP Code',
        helperText: 'Enter postal code (if applicable)',
        example: '10001',
        normalize: (val) => (val || '').trim()
    };

    // ── Country Code Aliases Map ──────────────────────────────────────────────
    const COUNTRY_ALIASES = {
        'INDIA': 'IN', 'BHARAT': 'IN', 'IND': 'IN',
        'UNITED STATES': 'US', 'USA': 'US', 'UNITED STATES OF AMERICA': 'US',
        'UNITED KINGDOM': 'GB', 'UK': 'GB', 'GREAT BRITAIN': 'GB', 'ENGLAND': 'GB', 'SCOTLAND': 'GB', 'WALES': 'GB',
        'OMAN': 'OM', 'SULTANATE OF OMAN': 'OM',
        'CANADA': 'CA',
        'AUSTRALIA': 'AU',
        'GERMANY': 'DE', 'DEUTSCHLAND': 'DE',
        'FRANCE': 'FR',
        'SPAIN': 'ES', 'ESPANA': 'ES',
        'ITALY': 'IT', 'ITALIA': 'IT',
        'PORTUGAL': 'PT',
        'NETHERLANDS': 'NL', 'HOLLAND': 'NL',
        'SWITZERLAND': 'CH',
        'SWEDEN': 'SE',
        'NORWAY': 'NO',
        'DENMARK': 'DK',
        'FINLAND': 'FI',
        'IRELAND': 'IE',
        'BELGIUM': 'BE',
        'AUSTRIA': 'AT',
        'POLAND': 'PL',
        'NEW ZEALAND': 'NZ',
        'SINGAPORE': 'SG',
        'MALAYSIA': 'MY',
        'UNITED ARAB EMIRATES': 'AE', 'UAE': 'AE', 'DUBAI': 'AE', 'ABU DHABI': 'AE',
        'SAUDI ARABIA': 'SA', 'KSA': 'SA',
        'QATAR': 'QA',
        'KUWAIT': 'KW',
        'BAHRAIN': 'BH',
        'JAPAN': 'JP', 'NIPPON': 'JP',
        'SOUTH KOREA': 'KR', 'KOREA': 'KR',
        'CHINA': 'CN',
        'HONG KONG': 'HK',
        'TAIWAN': 'TW',
        'THAILAND': 'TH',
        'INDONESIA': 'ID',
        'PHILIPPINES': 'PH',
        'VIETNAM': 'VN',
        'BRAZIL': 'BR', 'BRASIL': 'BR',
        'MEXICO': 'MX',
        'SOUTH AFRICA': 'ZA',
        'RUSSIA': 'RU', 'RUSSIAN FEDERATION': 'RU'
    };

    /**
     * Resolves country input (name or code) to ISO-2 uppercase code
     */
    function resolveCountryCode(input) {
        if (!input) return 'IN';
        const str = String(input).trim().toUpperCase();
        if (POSTAL_RULES[str]) return str;
        if (COUNTRY_ALIASES[str]) return COUNTRY_ALIASES[str];
        if (str.length === 2) return str;
        
        // Try fuzzy search in country aliases
        for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
            if (str.includes(alias) || alias.includes(str)) {
                return code;
            }
        }
        return str.substring(0, 2);
    }

    /**
     * Get postal code rule for a given country code or name
     */
    function getPostalRule(countryInput) {
        const iso = resolveCountryCode(countryInput);
        const rule = POSTAL_RULES[iso] || { ...DEFAULT_RULE, countryCode: iso, countryName: countryInput || 'Other' };
        return {
            ...rule,
            allowedRegex: rule.allowedRegex || /[^A-Za-z0-9 -]/g,
            normalize: rule.normalize || ((val) => (val || '').trim())
        };
    }

    /**
     * Validate postal code against country rules
     * @param {string} postalCode - The input postal code
     * @param {string} countryInput - Country name or ISO code
     * @returns {Object} { isValid: boolean, error?: string, normalized: string, countryCode: string }
     */
    function validatePostalCode(postalCode, countryInput) {
        const rule = getPostalRule(countryInput);
        const raw = String(postalCode || '').trim();

        // 1. Check if empty
        if (!raw) {
            if (rule.required) {
                return {
                    isValid: false,
                    error: `Postal code is required for ${rule.countryName}. Format: ${rule.example || rule.placeholder}`,
                    normalized: '',
                    countryCode: rule.countryCode
                };
            }
            return {
                isValid: true,
                error: null,
                normalized: '',
                countryCode: rule.countryCode
            };
        }

        // 2. Length checks on raw input before or after formatting
        if (rule.minLength && raw.length < rule.minLength) {
            return {
                isValid: false,
                error: `${rule.label || 'Postal code'} must be at least ${rule.minLength} characters for ${rule.countryName}.`,
                normalized: raw,
                countryCode: rule.countryCode
            };
        }
        if (rule.maxLength && raw.length > rule.maxLength) {
            return {
                isValid: false,
                error: `${rule.label || 'Postal code'} cannot exceed ${rule.maxLength} characters for ${rule.countryName}.`,
                normalized: raw,
                countryCode: rule.countryCode
            };
        }

        // 3. Normalize and check pattern
        const normalized = rule.normalize ? rule.normalize(raw) : raw;
        const reg = new RegExp(rule.pattern, 'i');

        if (!reg.test(normalized) && !reg.test(raw)) {
            let errorMsg = `Invalid ${rule.label || 'postal code'} for ${rule.countryName}.`;
            if (rule.placeholder) {
                errorMsg += ` Expected format: ${rule.placeholder}`;
            }
            return {
                isValid: false,
                error: errorMsg,
                normalized,
                countryCode: rule.countryCode
            };
        }

        return {
            isValid: true,
            error: null,
            normalized,
            countryCode: rule.countryCode
        };
    }

    // ── Export for Browser & Node.js ──────────────────────────────────────────
    const PostalModule = {
        rules: POSTAL_RULES,
        aliases: COUNTRY_ALIASES,
        resolveCountryCode,
        getPostalRule,
        validatePostalCode
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PostalModule;
    }
    if (typeof global !== 'undefined') {
        global.PostalRules = PostalModule;
        global.getPostalRule = getPostalRule;
        global.validatePostalCode = validatePostalCode;
        global.resolveCountryCode = resolveCountryCode;
    }
})(typeof window !== 'undefined' ? window : this);
