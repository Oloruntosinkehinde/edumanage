/**
 * Helper utility functions
 */

/**
 * Generate a unique ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Generated ID
 */
const generateId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${prefix ? prefix + '_' : ''}${timestamp}${randomStr}`;
};

/**
 * Format date to ISO string without milliseconds
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date
 */
const formatDate = (date) => {
    if (!date) return null;
    date = new Date(date);
    return date.toISOString().split('.')[0] + 'Z';
};

/**
 * Sanitize an object by removing undefined or null values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj) => {
    const result = {};
    Object.entries(obj).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            result[key] = value;
        }
    });
    return result;
};

/**
 * Parse query parameters to a standard format
 * @param {Object} query - Express query object
 * @returns {Object} - Parsed query parameters
 */
const parseQueryParams = (query) => {
    const result = { ...query };
    
    // Handle pagination
    if (result.page) {
        const page = parseInt(result.page) || 1;
        const limit = parseInt(result.limit) || 10;
        result.offset = (page - 1) * limit;
        result.limit = limit;
    }
    
    // Handle boolean values
    ['is_read', 'is_pinned', 'is_active'].forEach(key => {
        if (result[key] !== undefined) {
            if (result[key] === 'true' || result[key] === '1') {
                result[key] = 1;
            } else if (result[key] === 'false' || result[key] === '0') {
                result[key] = 0;
            }
        }
    });
    
    return result;
};

module.exports = {
    generateId,
    formatDate,
    sanitizeObject,
    parseQueryParams
};