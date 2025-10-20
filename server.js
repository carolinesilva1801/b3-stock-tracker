const express = require('express');
const cors = require('cors');
const path = require('path');
const stocksRouter = require('./src/routes/stocks');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/stocks', stocksRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'B3 Stock Tracker API is running',
        timestamp: new Date().toISOString()
    });
});

// Root route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   B3 Stock Tracker Dashboard               ║
║   Server running on port ${PORT}            ║
║   http://localhost:${PORT}                  ║
╚════════════════════════════════════════════╝
    `);
});

module.exports = app;
