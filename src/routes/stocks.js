const express = require('express');
const router = express.Router();
const stockService = require('../services/stockService');
const analysisService = require('../services/analysisService');

/**
 * GET /api/stocks
 * Get list of tracked stocks with analysis
 */
router.get('/', async (req, res) => {
    try {
        const tickers = stockService.getDefaultStocks();
        const stocksData = await stockService.fetchMultipleStockQuotes(tickers);
        
        if (!stocksData || stocksData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No stock data available'
            });
        }
        
        const analyzed = analysisService.analyzeMultipleStocks(stocksData);
        
        res.json({
            success: true,
            count: analyzed.length,
            stocks: analyzed
        });
    } catch (error) {
        console.error('Error in GET /api/stocks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stocks data',
            error: error.message
        });
    }
});

/**
 * GET /api/stocks/opportunities
 * Get stocks with profit potential above threshold
 */
router.get('/opportunities', async (req, res) => {
    try {
        const threshold = parseFloat(req.query.threshold) || 7;
        const tickers = stockService.getDefaultStocks();
        const stocksData = await stockService.fetchMultipleStockQuotes(tickers);
        
        if (!stocksData || stocksData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No stock data available'
            });
        }
        
        const analyzed = analysisService.analyzeMultipleStocks(stocksData);
        const opportunities = analysisService.filterByPotential(analyzed, threshold);
        
        res.json({
            success: true,
            threshold: threshold,
            count: opportunities.length,
            opportunities: opportunities
        });
    } catch (error) {
        console.error('Error in GET /api/stocks/opportunities:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching opportunities',
            error: error.message
        });
    }
});

/**
 * GET /api/stocks/:ticker
 * Get detailed information for a specific stock
 */
router.get('/:ticker', async (req, res) => {
    try {
        const ticker = req.params.ticker.toUpperCase();
        const range = req.query.range || '3mo';
        
        const stockData = await stockService.fetchHistoricalData(ticker, range);
        
        if (!stockData) {
            return res.status(404).json({
                success: false,
                message: `Stock ${ticker} not found`
            });
        }
        
        const analysis = analysisService.analyzeStock(stockData);
        
        res.json({
            success: true,
            stock: {
                ...stockData,
                analysis
            }
        });
    } catch (error) {
        console.error(`Error in GET /api/stocks/${req.params.ticker}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stock data',
            error: error.message
        });
    }
});

/**
 * GET /api/stocks/search/:query
 * Search for stocks by ticker
 */
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        
        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }
        
        const results = await stockService.searchStocks(query);
        
        if (!results || results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No stocks found'
            });
        }
        
        const analyzed = analysisService.analyzeMultipleStocks(results);
        
        res.json({
            success: true,
            query: query,
            count: analyzed.length,
            results: analyzed
        });
    } catch (error) {
        console.error(`Error in GET /api/stocks/search/${req.params.query}:`, error);
        res.status(500).json({
            success: false,
            message: 'Error searching stocks',
            error: error.message
        });
    }
});

module.exports = router;
