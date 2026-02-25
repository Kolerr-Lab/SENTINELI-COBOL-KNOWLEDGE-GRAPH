/**
 * Activity Logger - Tracks API activity for system logs
 */

class ActivityLogger {
    constructor(maxLogs = 100) {
        this.logs = [];
        this.maxLogs = maxLogs;
    }

    log(type, message, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            type, // 'info', 'success', 'warning', 'error'
            message,
            metadata
        };

        this.logs.unshift(entry); // Add to beginning

        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        return entry;
    }

    info(message, metadata) {
        return this.log('info', message, metadata);
    }

    success(message, metadata) {
        return this.log('success', message, metadata);
    }

    warning(message, metadata) {
        return this.log('warning', message, metadata);
    }

    error(message, metadata) {
        return this.log('error', message, metadata);
    }

    getLogs(limit = 50) {
        return this.logs.slice(0, limit);
    }

    clear() {
        this.logs = [];
    }
}

// Singleton instance
const activityLogger = new ActivityLogger(100);

module.exports = activityLogger;
