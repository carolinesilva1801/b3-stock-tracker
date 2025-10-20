/**
 * Mock data service for testing when Brapi is unavailable
 * Generates realistic B3 stock data for development/testing
 */

const DEFAULT_STOCKS = [
    'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3',
    'MGLU3', 'WEGE3', 'RENT3', 'B3SA3', 'SANB11'
];

const STOCK_NAMES = {
    'PETR4': 'Petrobras PN',
    'VALE3': 'Vale ON',
    'ITUB4': 'Itaú Unibanco PN',
    'BBDC4': 'Bradesco PN',
    'ABEV3': 'Ambev ON',
    'MGLU3': 'Magazine Luiza ON',
    'WEGE3': 'WEG ON',
    'RENT3': 'Localiza ON',
    'B3SA3': 'B3 ON',
    'SANB11': 'Santander Units'
};

/**
 * Generate realistic price history
 */
function generatePriceHistory(basePrice, days = 30) {
    const history = [];
    let currentPrice = basePrice;
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Random walk with slight trend
        const change = (Math.random() - 0.48) * 0.03; // Slightly positive bias
        currentPrice = currentPrice * (1 + change);
        
        const volume = Math.floor(Math.random() * 50000000) + 10000000;
        
        history.push({
            date: Math.floor(date.getTime() / 1000),
            open: currentPrice * 0.99,
            high: currentPrice * 1.02,
            low: currentPrice * 0.98,
            close: currentPrice,
            volume: volume,
            adjustedClose: currentPrice
        });
    }
    
    return history;
}

/**
 * Generate mock stock data
 */
function generateMockStock(ticker) {
    // Base prices for different stocks
    const basePrices = {
        'PETR4': 38.50,
        'VALE3': 65.80,
        'ITUB4': 25.30,
        'BBDC4': 13.90,
        'ABEV3': 12.85,
        'MGLU3': 3.45,
        'WEGE3': 42.20,
        'RENT3': 58.90,
        'B3SA3': 12.75,
        'SANB11': 28.40
    };
    
    const basePrice = basePrices[ticker] || 20.00;
    const history = generatePriceHistory(basePrice);
    const currentPrice = history[history.length - 1].close;
    const previousClose = history[history.length - 2].close;
    
    const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
    const volume = history[history.length - 1].volume;
    
    return {
        symbol: ticker,
        shortName: STOCK_NAMES[ticker] || ticker,
        longName: STOCK_NAMES[ticker] || ticker,
        currency: 'BRL',
        regularMarketPrice: currentPrice,
        regularMarketDayHigh: currentPrice * 1.02,
        regularMarketDayLow: currentPrice * 0.98,
        regularMarketVolume: volume,
        regularMarketPreviousClose: previousClose,
        regularMarketChange: currentPrice - previousClose,
        regularMarketChangePercent: changePercent,
        regularMarketTime: new Date().toISOString(),
        marketCap: Math.floor(Math.random() * 100000000000),
        historicalDataPrice: history,
        validRanges: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'],
        validIntervals: ['1d', '1wk', '1mo']
    };
}

/**
 * Fetch mock quote for a single stock
 */
function fetchMockStockQuote(ticker) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(generateMockStock(ticker));
        }, 100);
    });
}

/**
 * Fetch mock quotes for multiple stocks
 */
function fetchMockMultipleStockQuotes(tickers = DEFAULT_STOCKS) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const stocks = tickers.map(ticker => generateMockStock(ticker));
            resolve(stocks);
        }, 200);
    });
}

/**
 * Fetch mock historical data
 */
function fetchMockHistoricalData(ticker, range = '3mo') {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(generateMockStock(ticker));
        }, 100);
    });
}

/**
 * Search mock stocks
 */
function searchMockStocks(query) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const filtered = DEFAULT_STOCKS.filter(ticker => 
                ticker.toLowerCase().includes(query.toLowerCase())
            );
            
            if (filtered.length > 0) {
                const stocks = filtered.map(ticker => generateMockStock(ticker));
                resolve(stocks);
            } else {
                // Try to generate for the query itself
                resolve([generateMockStock(query.toUpperCase())]);
            }
        }, 100);
    });
}

module.exports = {
    fetchMockStockQuote,
    fetchMockMultipleStockQuotes,
    fetchMockHistoricalData,
    searchMockStocks,
    generateMockStock
};
