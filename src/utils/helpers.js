/**
 * Helper functions for the B3 Stock Tracker
 */

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
function calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Calculate simple moving average
 * @param {Array} prices - Array of prices
 * @param {number} period - Period for average
 * @returns {number} Moving average
 */
function calculateSMA(prices, period) {
    if (!prices || prices.length < period) return 0;
    const slice = prices.slice(-period);
    const sum = slice.reduce((acc, price) => acc + price, 0);
    return sum / period;
}

/**
 * Calculate support and resistance levels
 * @param {Array} prices - Array of prices
 * @returns {Object} Support and resistance levels
 */
function calculateSupportResistance(prices) {
    if (!prices || prices.length === 0) {
        return { support: 0, resistance: 0 };
    }
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    return {
        support: min,
        resistance: max
    };
}

/**
 * Format number as Brazilian Real
 * @param {number} value - Value to format
 * @returns {string} Formatted value
 */
function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Format percentage with sign
 * @param {number} value - Percentage value
 * @returns {string} Formatted percentage
 */
function formatPercentage(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0.00%';
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

/**
 * Check if a stock has potential profit above threshold
 * @param {number} projectedPrice - Projected price
 * @param {number} currentPrice - Current price
 * @param {number} threshold - Profit threshold (default 7%)
 * @returns {boolean} Has potential
 */
function hasProfitPotential(projectedPrice, currentPrice, threshold = 7) {
    if (!projectedPrice || !currentPrice) return false;
    const potential = calculatePercentageChange(projectedPrice, currentPrice);
    return potential >= threshold;
}

module.exports = {
    calculatePercentageChange,
    calculateSMA,
    calculateSupportResistance,
    formatBRL,
    formatPercentage,
    hasProfitPotential
};
