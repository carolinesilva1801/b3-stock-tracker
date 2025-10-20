/**
 * B3 Stock Tracker - Main Application
 * Frontend logic for the dashboard
 */

class StockTracker {
    constructor() {
        this.stocks = [];
        this.filteredStocks = [];
        this.autoRefreshInterval = null;
        this.API_BASE = '/api';
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadStocks();
        this.startAutoRefresh();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadStocks();
        });

        // Search functionality
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.searchStocks();
        });

        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchStocks();
            }
        });

        // Filter checkboxes
        document.getElementById('filterOpportunities')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filterBullish')?.addEventListener('change', () => {
            this.applyFilters();
        });
    }

    /**
     * Load stocks from API
     */
    async loadStocks() {
        this.showLoading();
        this.hideError();

        try {
            const response = await fetch(`${this.API_BASE}/stocks`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load stocks');
            }

            this.stocks = data.stocks;
            this.applyFilters();
            this.updateSummaryCards();
            this.updateLastUpdate();
            this.checkAndNotifyOpportunities();

        } catch (error) {
            console.error('Error loading stocks:', error);
            this.showError('Erro ao carregar dados das ações. Tente novamente.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Search for stocks by ticker
     */
    async searchStocks() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim();

        if (!query || query.length < 2) {
            alert('Digite pelo menos 2 caracteres para buscar');
            return;
        }

        this.showLoading();
        this.hideError();

        try {
            const response = await fetch(`${this.API_BASE}/stocks/search/${encodeURIComponent(query)}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Stock not found');
            }

            this.stocks = data.results;
            this.applyFilters();
            this.updateSummaryCards();

        } catch (error) {
            console.error('Error searching stocks:', error);
            this.showError(`Nenhuma ação encontrada para "${query}"`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Apply filters to stocks
     */
    applyFilters() {
        let filtered = [...this.stocks];

        const filterOpportunities = document.getElementById('filterOpportunities')?.checked;
        const filterBullish = document.getElementById('filterBullish')?.checked;

        if (filterOpportunities) {
            filtered = filtered.filter(stock => {
                const potential = parseFloat(stock.analysis.profitPotential) || 0;
                return potential >= 7 && stock.analysis.trend === 'bullish';
            });
        }

        if (filterBullish) {
            filtered = filtered.filter(stock => stock.analysis.trend === 'bullish');
        }

        this.filteredStocks = filtered;
        this.renderStocksTable();
        this.renderOpportunities();
    }

    /**
     * Render stocks table
     */
    renderStocksTable() {
        const tbody = document.getElementById('stocksTableBody');
        if (!tbody) return;

        if (this.filteredStocks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 40px;">
                        Nenhuma ação encontrada com os filtros selecionados.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredStocks.map(stock => {
            const analysis = stock.analysis;
            const price = stock.regularMarketPrice || 0;
            const changePercent = stock.regularMarketChangePercent || 0;
            const volume = stock.regularMarketVolume || 0;

            const trendClass = analysis.trend === 'bullish' ? 'trend-bullish' : 
                              analysis.trend === 'bearish' ? 'trend-bearish' : 'trend-neutral';
            
            const trendIcon = analysis.trend === 'bullish' ? '📈' : 
                            analysis.trend === 'bearish' ? '📉' : '➡️';

            const changeClass = changePercent >= 0 ? 'change-positive' : 'change-negative';
            const changeSign = changePercent >= 0 ? '+' : '';

            const potential = parseFloat(analysis.profitPotential) || 0;
            const potentialClass = potential >= 7 ? 'potential-high' : 
                                   potential >= 3 ? 'potential-medium' : 'potential-low';

            const volumeIcon = analysis.volumeAboveAverage ? '🔥' : '📊';

            return `
                <tr class="fade-in">
                    <td><span class="ticker-badge">${stock.symbol}</span></td>
                    <td>${stock.longName || stock.shortName || '-'}</td>
                    <td><strong>R$ ${price.toFixed(2)}</strong></td>
                    <td class="${changeClass}">${changeSign}${changePercent.toFixed(2)}%</td>
                    <td class="${parseFloat(analysis.priceChange1w) >= 0 ? 'change-positive' : 'change-negative'}">
                        ${analysis.priceChange1w >= 0 ? '+' : ''}${analysis.priceChange1w}%
                    </td>
                    <td class="${parseFloat(analysis.priceChange1m) >= 0 ? 'change-positive' : 'change-negative'}">
                        ${analysis.priceChange1m >= 0 ? '+' : ''}${analysis.priceChange1m}%
                    </td>
                    <td class="${potentialClass}">
                        ${potential >= 0 ? '+' : ''}${potential.toFixed(2)}%
                    </td>
                    <td>
                        <span class="trend-badge ${trendClass}">
                            ${trendIcon} ${this.translateTrend(analysis.trend)}
                        </span>
                    </td>
                    <td>
                        <span class="volume-indicator">
                            ${volumeIcon} ${this.formatVolume(volume)}
                        </span>
                    </td>
                    <td style="max-width: 300px;">${analysis.analysis}</td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Render opportunities section
     */
    renderOpportunities() {
        const opportunitiesSection = document.getElementById('opportunitiesSection');
        const opportunitiesGrid = document.getElementById('opportunitiesGrid');

        if (!opportunitiesSection || !opportunitiesGrid) return;

        const opportunities = this.stocks.filter(stock => {
            const potential = parseFloat(stock.analysis.profitPotential) || 0;
            return potential >= 7 && stock.analysis.trend === 'bullish';
        });

        if (opportunities.length === 0) {
            opportunitiesSection.style.display = 'none';
            return;
        }

        opportunitiesSection.style.display = 'block';

        opportunitiesGrid.innerHTML = opportunities.map(stock => {
            const analysis = stock.analysis;
            const price = stock.regularMarketPrice || 0;
            const potential = parseFloat(analysis.profitPotential) || 0;

            return `
                <div class="opportunity-card fade-in">
                    <div class="opportunity-header">
                        <div class="opportunity-ticker">${stock.symbol}</div>
                        <div class="opportunity-potential">+${potential.toFixed(2)}%</div>
                    </div>
                    <div class="opportunity-name">${stock.longName || stock.shortName || '-'}</div>
                    <div class="opportunity-price">R$ ${price.toFixed(2)}</div>
                    <div class="opportunity-details">
                        📊 SMA5: R$ ${analysis.sma5}<br>
                        🎯 Resistência: R$ ${analysis.resistance}<br>
                        🔥 Volume ${analysis.volumeAboveAverage ? 'acima da média' : 'normal'}<br>
                        💡 ${analysis.analysis}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Update summary cards
     */
    updateSummaryCards() {
        const totalStocks = this.stocks.length;
        
        const opportunities = this.stocks.filter(stock => {
            const potential = parseFloat(stock.analysis.profitPotential) || 0;
            return potential >= 7 && stock.analysis.trend === 'bullish';
        }).length;

        const bullish = this.stocks.filter(stock => 
            stock.analysis.trend === 'bullish'
        ).length;

        const bearish = this.stocks.filter(stock => 
            stock.analysis.trend === 'bearish'
        ).length;

        document.getElementById('totalStocks').textContent = totalStocks;
        document.getElementById('opportunities').textContent = opportunities;
        document.getElementById('bullish').textContent = bullish;
        document.getElementById('bearish').textContent = bearish;
    }

    /**
     * Check and notify opportunities
     */
    checkAndNotifyOpportunities() {
        if (typeof notificationManager === 'undefined') {
            return;
        }

        const opportunities = this.stocks.filter(stock => {
            const potential = parseFloat(stock.analysis.profitPotential) || 0;
            return potential >= 7 && stock.analysis.trend === 'bullish';
        });

        if (opportunities.length > 0) {
            notificationManager.notifyOpportunities(opportunities);
        }
    }

    /**
     * Start auto refresh
     */
    startAutoRefresh() {
        // Refresh every 5 minutes
        this.autoRefreshInterval = setInterval(() => {
            this.loadStocks();
        }, 300000);
    }

    /**
     * Update last update timestamp
     */
    updateLastUpdate() {
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            const now = new Date();
            lastUpdate.textContent = now.toLocaleString('pt-BR');
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const error = document.getElementById('error');
        const errorText = document.getElementById('errorText');
        if (error && errorText) {
            errorText.textContent = message;
            error.style.display = 'flex';
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        const error = document.getElementById('error');
        if (error) {
            error.style.display = 'none';
        }
    }

    /**
     * Translate trend to Portuguese
     */
    translateTrend(trend) {
        const translations = {
            'bullish': 'Alta',
            'bearish': 'Baixa',
            'neutral': 'Neutro'
        };
        return translations[trend] || trend;
    }

    /**
     * Format volume for display
     */
    formatVolume(volume) {
        if (volume >= 1000000) {
            return (volume / 1000000).toFixed(1) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(1) + 'K';
        }
        return volume.toString();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new StockTracker();
    window.stockTracker = app; // Make available globally for debugging
});
