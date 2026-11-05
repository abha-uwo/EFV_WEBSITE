/**
 * postalValidator.js — Backend Country-wise Postal / ZIP Code Validation Engine
 * Ensures data integrity for all physical orders before processing/fulfillment.
 */

const PostalRulesModule = require('../../public/js/postalRules');

/**
 * Validates a postal code for a specified country
 * @param {string} postalCode - The postal / PIN / ZIP code to validate
 * @param {string} countryInput - The destination country name or ISO code
 * @param {boolean} [isPhysical=true] - Whether the order contains physical goods
 * @returns {{ isValid: boolean, error?: string, normalized: string, countryCode: string }}
 */
function validatePostalCode(postalCode, countryInput, isPhysical = true) {
    // If order contains only digital items (e.g. eBook, Audiobook), postal code is not required
    if (!isPhysical) {
        return {
            isValid: true,
            error: null,
            normalized: String(postalCode || '000000').trim(),
            countryCode: 'IN'
        };
    }

    return PostalRulesModule.validatePostalCode(postalCode, countryInput);
}

module.exports = {
    ...PostalRulesModule,
    validatePostalCode
};
