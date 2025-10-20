const {
    calculatePercentageChange,
    calculateSMA,
    calculateSupportResistance,
    hasProfitPotential
} = require('../utils/helpers');

/**
 * Analyze stock for profit potential
 * @param {Object} stockData - Stock data from API
 * @returns {Object} Analysis results
 */
function analyzeStock(stockData) {
    if (!stockData || !stockData.historicalDataPrice) {
        return {
            hasPotential: false,
            profitPotential: 0,
            trend: 'neutral',
            analysis: 'Insufficient data for analysis'
        };
    }
    
    const prices = stockData.historicalDataPrice.map(item => item.close);
    const currentPrice = stockData.regularMarketPrice;
    
    // Calculate moving averages
    const sma5 = calculateSMA(prices, 5);
    const sma10 = calculateSMA(prices, 10);
    const sma20 = calculateSMA(prices, 20);
    
    // Calculate support and resistance
    const { support, resistance } = calculateSupportResistance(prices);
    
    // Determine trend
    let trend = 'neutral';
    if (currentPrice > sma5 && sma5 > sma10 && sma10 > sma20) {
        trend = 'bullish';
    } else if (currentPrice < sma5 && sma5 < sma10 && sma10 < sma20) {
        trend = 'bearish';
    }
    
    // Calculate profit potential based on resistance level
    const potentialPrice = resistance;
    const profitPotential = calculatePercentageChange(potentialPrice, currentPrice);
    
    // Check if volume is above average
    const volumes = stockData.historicalDataPrice.map(item => item.volume || 0);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const currentVolume = stockData.regularMarketVolume || 0;
    const volumeAboveAverage = currentVolume > avgVolume;
    
    // Calculate price changes
    const priceChange1d = stockData.regularMarketChangePercent || 0;
    const priceChange1w = prices.length >= 5 ? 
        calculatePercentageChange(currentPrice, prices[prices.length - 5]) : 0;
    const priceChange1m = prices.length >= 20 ? 
        calculatePercentageChange(currentPrice, prices[prices.length - 20]) : 0;
    
    // Determine if has potential (>7% and bullish trend)
    const hasPotential7 = hasProfitPotential(potentialPrice, currentPrice, 7) && 
                          trend === 'bullish';
    
    return {
        ticker: stockData.symbol,
        currentPrice,
        hasPotential: hasPotential7,
        profitPotential: profitPotential.toFixed(2),
        trend,
        support: support.toFixed(2),
        resistance: resistance.toFixed(2),
        sma5: sma5.toFixed(2),
        sma10: sma10.toFixed(2),
        sma20: sma20.toFixed(2),
        volumeAboveAverage,
        priceChange1d: priceChange1d.toFixed(2),
        priceChange1w: priceChange1w.toFixed(2),
        priceChange1m: priceChange1m.toFixed(2),
        analysis: generateAnalysisText(trend, profitPotential, volumeAboveAverage)
    };
}

/**
 * Generate analysis text based on indicators
 * @param {string} trend - Market trend
 * @param {number} profitPotential - Profit potential percentage
 * @param {boolean} volumeAboveAverage - Volume indicator
 * @returns {string} Analysis text
 */
function generateAnalysisText(trend, profitPotential, volumeAboveAverage) {
    let text = '';
    
    if (trend === 'bullish' && profitPotential >= 7) {
        text = 'Strong buy signal: Bullish trend with high profit potential (>7%)';
    } else if (trend === 'bullish' && profitPotential >= 3) {
        text = 'Moderate buy signal: Bullish trend with moderate profit potential';
    } else if (trend === 'bearish') {
        text = 'Sell signal: Bearish trend detected';
    } else {
        text = 'Neutral: Market consolidating, wait for better entry point';
    }
    
    if (volumeAboveAverage && trend === 'bullish') {
        text += '. High volume confirms upward momentum';
    }
    
    return text;
}

/**
 * Analyze multiple stocks and rank by potential
 * @param {Array} stocksData - Array of stock data
 * @returns {Array} Analyzed and ranked stocks
 */
function analyzeMultipleStocks(stocksData) {
    const analyzed = stocksData
        .map(stock => {
            const analysis = analyzeStock(stock);
            return {
                ...stock,
                analysis
            };
        })
        .sort((a, b) => {
            // Sort by profit potential (highest first)
            const potentialA = parseFloat(a.analysis.profitPotential) || 0;
            const potentialB = parseFloat(b.analysis.profitPotential) || 0;
            return potentialB - potentialA;
        });
    
    return analyzed;
}

/**
 * Filter stocks with potential above threshold
 * @param {Array} analyzedStocks - Array of analyzed stocks
 * @param {number} threshold - Profit threshold percentage
 * @returns {Array} Filtered stocks
 */
function filterByPotential(analyzedStocks, threshold = 7) {
    return analyzedStocks.filter(stock => {
        const potential = parseFloat(stock.analysis.profitPotential) || 0;
        return potential >= threshold && stock.analysis.trend === 'bullish';
    });
}

module.exports = {
    analyzeStock,
    analyzeMultipleStocks,
    filterByPotential
};
