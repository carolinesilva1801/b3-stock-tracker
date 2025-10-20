/**
 * Notification System for B3 Stock Tracker
 * Handles browser notifications for stock opportunities
 */

class NotificationManager {
    constructor() {
        this.permissionGranted = false;
        this.notifiedStocks = new Set();
        this.init();
    }

    /**
     * Initialize notification system
     */
    init() {
        this.checkPermission();
        this.setupEventListeners();
    }

    /**
     * Check current notification permission
     */
    checkPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        this.permissionGranted = Notification.permission === 'granted';
        this.updateButtonState();
        return this.permissionGranted;
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            alert('Seu navegador não suporta notificações');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permissionGranted = true;
            this.updateButtonState();
            this.showNotification(
                'Notificações Ativadas! 🎉',
                'Você receberá alertas sobre oportunidades de lucro > 7%'
            );
            return true;
        }

        if (Notification.permission === 'denied') {
            alert('Permissão de notificações negada. Por favor, habilite nas configurações do navegador.');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permissionGranted = permission === 'granted';
            this.updateButtonState();

            if (this.permissionGranted) {
                this.showNotification(
                    'Notificações Ativadas! 🎉',
                    'Você receberá alertas sobre oportunidades de lucro > 7%'
                );
            }

            return this.permissionGranted;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Show a notification
     */
    showNotification(title, body, options = {}) {
        if (!this.permissionGranted) {
            return;
        }

        const defaultOptions = {
            body: body,
            icon: '📈',
            badge: '📊',
            tag: 'b3-stock-tracker',
            requireInteraction: false,
            ...options
        };

        try {
            const notification = new Notification(title, defaultOptions);

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // Auto close after 10 seconds
            setTimeout(() => notification.close(), 10000);

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    /**
     * Notify about stock opportunities
     */
    notifyOpportunities(opportunities) {
        if (!this.permissionGranted || !opportunities || opportunities.length === 0) {
            return;
        }

        opportunities.forEach(stock => {
            const stockId = `${stock.symbol}_${stock.analysis.profitPotential}`;
            
            // Avoid duplicate notifications
            if (this.notifiedStocks.has(stockId)) {
                return;
            }

            this.notifiedStocks.add(stockId);

            const potential = parseFloat(stock.analysis.profitPotential);
            const title = `🎯 Oportunidade: ${stock.symbol}`;
            const body = `Potencial de lucro: +${potential.toFixed(2)}%\n` +
                        `Preço atual: R$ ${stock.regularMarketPrice.toFixed(2)}\n` +
                        `Tendência: ${stock.analysis.trend === 'bullish' ? 'Alta 📈' : 'Neutra'}`;

            this.showNotification(title, body, {
                tag: `opportunity-${stock.symbol}`,
                requireInteraction: true
            });
        });

        // Clear old notifications after 1 hour
        setTimeout(() => {
            this.notifiedStocks.clear();
        }, 3600000);
    }

    /**
     * Notify about significant market changes
     */
    notifyMarketChange(stock, changeType, changeValue) {
        if (!this.permissionGranted) {
            return;
        }

        let title = '';
        let body = '';

        if (changeType === 'surge') {
            title = `📈 ${stock.symbol} em Alta!`;
            body = `Subiu ${changeValue.toFixed(2)}% hoje`;
        } else if (changeType === 'drop') {
            title = `📉 ${stock.symbol} em Queda`;
            body = `Caiu ${Math.abs(changeValue).toFixed(2)}% hoje`;
        }

        this.showNotification(title, body, {
            tag: `change-${stock.symbol}`,
            requireInteraction: false
        });
    }

    /**
     * Update notification button state
     */
    updateButtonState() {
        const button = document.getElementById('notificationBtn');
        const icon = document.getElementById('notificationIcon');

        if (!button || !icon) {
            return;
        }

        if (this.permissionGranted) {
            button.textContent = '🔔 Notificações Ativas';
            button.classList.add('notification-enabled');
            button.classList.remove('notification-disabled');
            button.disabled = false;
        } else if (Notification.permission === 'denied') {
            button.textContent = '🔕 Notificações Bloqueadas';
            button.classList.add('notification-disabled');
            button.classList.remove('notification-enabled');
            button.disabled = true;
        } else {
            button.textContent = '🔔 Ativar Notificações';
            button.classList.remove('notification-enabled', 'notification-disabled');
            button.disabled = false;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const button = document.getElementById('notificationBtn');
            if (button) {
                button.addEventListener('click', () => {
                    this.requestPermission();
                });
            }
        });
    }
}

// Create global instance
const notificationManager = new NotificationManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}
