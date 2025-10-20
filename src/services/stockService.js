const axios = require('axios');
const NodeCache = require('node-cache');
const mockDataService = require('./mockDataService');

// Cache for 5 minutes to avoid rate limits
const cache = new NodeCache({ stdTTL: 300 });

// Brapi base URL (free API for B3 stocks)
const BRAPI_BASE_URL = 'https://brapi.dev/api';

// Default B3 stocks to track
const DEFAULT_STOCKS = [
    'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3',
    'MGLU3', 'WEGE3', 'RENT3', 'B3SA3', 'SANB11'
];

// Flag to use mock data if API is unavailable
let useMockData = false;

/**
 * Fetch quote data for a single stock
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<Object>} Stock quote data
 */
async function fetchStockQuote(ticker) {
    const cacheKey = `quote_${ticker}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
        return cached;
    }
    
    // Use mock data if previously failed or in mock mode
    if (useMockData) {
        return await mockDataService.fetchMockStockQuote(ticker);
    }
    
    try {
        const response = await axios.get(`${BRAPI_BASE_URL}/quote/${ticker}`, {
            params: {
                range: '1mo',
                interval: '1d',
                fundamental: true
            },
            timeout: 10000
        });
        
        if (response.data && response.data.results && response.data.results.length > 0) {
            const data = response.data.results[0];
            cache.set(cacheKey, data);
            return data;
        }
        
        return null;
    } catch (error) {
        console.error(`Error fetching quote for ${ticker}:`, error.message);
        console.log('Switching to mock data mode...');
        useMockData = true;
        return await mockDataService.fetchMockStockQuote(ticker);
    }
}

/**
 * Fetch quotes for multiple stocks
 * @param {Array<string>} tickers - Array of stock ticker symbols
 * @returns {Promise<Array>} Array of stock quotes
 */
async function fetchMultipleStockQuotes(tickers = DEFAULT_STOCKS) {
    const cacheKey = `multiple_${tickers.join(',')}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
        return cached;
    }
    
    // Use mock data if previously failed or in mock mode
    if (useMockData) {
        return await mockDataService.fetchMockMultipleStockQuotes(tickers);
    }
    
    try {
        const tickersParam = tickers.join(',');
        const response = await axios.get(`${BRAPI_BASE_URL}/quote/${tickersParam}`, {
            params: {
                range: '1mo',
                interval: '1d',
                fundamental: true
            },
            timeout: 15000
        });
        
        if (response.data && response.data.results) {
            const data = response.data.results;
            cache.set(cacheKey, data);
            return data;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching multiple quotes:', error.message);
        console.log('Switching to mock data mode...');
        useMockData = true;
        return await mockDataService.fetchMockMultipleStockQuotes(tickers);
    }
}

/**
 * Fetch historical data for a stock
 * @param {string} ticker - Stock ticker symbol
 * @param {string} range - Time range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
 * @returns {Promise<Object>} Historical data
 */
async function fetchHistoricalData(ticker, range = '3mo') {
    const cacheKey = `history_${ticker}_${range}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
        return cached;
    }
    
    // Use mock data if previously failed or in mock mode
    if (useMockData) {
        return await mockDataService.fetchMockHistoricalData(ticker, range);
    }
    
    try {
        const response = await axios.get(`${BRAPI_BASE_URL}/quote/${ticker}`, {
            params: {
                range: range,
                interval: '1d'
            },
            timeout: 10000
        });
        
        if (response.data && response.data.results && response.data.results.length > 0) {
            const data = response.data.results[0];
            cache.set(cacheKey, data);
            return data;
        }
        
        return null;
    } catch (error) {
        console.error(`Error fetching historical data for ${ticker}:`, error.message);
        console.log('Switching to mock data mode...');
        useMockData = true;
        return await mockDataService.fetchMockHistoricalData(ticker, range);
    }
}

/**
 * Search for stocks by query
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching stocks
 */
async function searchStocks(query) {
    try {
        // Use mock search if in mock mode
        if (useMockData) {
            return await mockDataService.searchMockStocks(query);
        }
        
        // For now, return filtered list from default stocks
        // Brapi doesn't have a dedicated search endpoint
        const filtered = DEFAULT_STOCKS.filter(ticker => 
            ticker.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filtered.length > 0) {
            return await fetchMultipleStockQuotes(filtered);
        }
        
        // Try to fetch the query directly
        const result = await fetchStockQuote(query.toUpperCase());
        return result ? [result] : [];
    } catch (error) {
        console.error('Error searching stocks:', error.message);
        return [];
    }
}

/**
 * Get default watchlist stocks
 * @returns {Array<string>} Array of default stock tickers
 */
function getDefaultStocks() {
    return DEFAULT_STOCKS;
}

module.exports = {
    fetchStockQuote,
    fetchMultipleStockQuotes,
    fetchHistoricalData,
    searchStocks,
    getDefaultStocks
};
