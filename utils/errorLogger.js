/**
 * Error Logger Utility
 * Provides structured logging for errors with context
 */

const fs = require('fs');
const path = require('path');

/**
 * Error Logger Class
 */
class ErrorLogger {
    /**
     * Log error with context
     * @param {Error} error - The error object
     * @param {Object} context - Additional context (userId, route, etc.)
     */
    static log(error, context = {}) {
        const logEntry = this.formatErrorLog(error, context);

        // Log to console
        this.logToConsole(logEntry);

        // Log to file in production
        if (process.env.NODE_ENV === 'production') {
            this.logToFile(logEntry);
        }
    }

    /**
     * Format error log entry
     * @param {Error} error - The error object
     * @param {Object} context - Additional context
     * @returns {Object} Formatted log entry
     */
    static formatErrorLog(error, context = {}) {
        return {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            name: error.name || 'Error',
            message: error.message,
            statusCode: error.statusCode || 500,
            context: {
                userId: context.userId || 'anonymous',
                userType: context.userType || 'guest',
                route: context.route || 'unknown',
                method: context.method || 'unknown',
                ip: context.ip || 'unknown'
            },
            stack: error.stack,
            details: error.details || {},
            isOperational: error.isOperational !== undefined ? error.isOperational : false
        };
    }

    /**
     * Log to console with formatting
     * @param {Object} logEntry - Formatted log entry
     */
    static logToConsole(logEntry) {
        const isProduction = process.env.NODE_ENV === 'production';

        console.error('\n' + '='.repeat(80));
        console.error(`🚨 ERROR: ${logEntry.name} [${logEntry.statusCode}]`);
        console.error('='.repeat(80));
        console.error(`⏰ Time: ${logEntry.timestamp}`);
        console.error(`📍 Route: ${logEntry.context.method} ${logEntry.context.route}`);
        console.error(`👤 User: ${logEntry.context.userType} (${logEntry.context.userId})`);
        console.error(`💬 Message: ${logEntry.message}`);

        if (logEntry.details && Object.keys(logEntry.details).length > 0) {
            console.error(`📋 Details:`, JSON.stringify(logEntry.details, null, 2));
        }

        if (!isProduction && logEntry.stack) {
            console.error(`\n📚 Stack Trace:\n${logEntry.stack}`);
        }

        console.error('='.repeat(80) + '\n');
    }

    /**
     * Log to file
     * @param {Object} logEntry - Formatted log entry
     */
    static logToFile(logEntry) {
        try {
            const logsDir = path.join(__dirname, '..', 'logs');

            // Create logs directory if it doesn't exist
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }

            // Create log file name based on date
            const date = new Date().toISOString().split('T')[0];
            const logFile = path.join(logsDir, `error-${date}.log`);

            // Format log entry as JSON line
            const logLine = JSON.stringify(logEntry) + '\n';

            // Append to log file
            fs.appendFileSync(logFile, logLine, 'utf8');
        } catch (fileError) {
            console.error('Failed to write to log file:', fileError.message);
        }
    }

    /**
     * Log validation errors specifically
     * @param {Object} validationErrors - Validation error object
     * @param {Object} context - Additional context
     */
    static logValidationError(validationErrors, context = {}) {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        error.statusCode = 400;
        error.details = { errors: validationErrors };

        this.log(error, context);
    }

    /**
     * Log database errors specifically
     * @param {Error} dbError - Database error
     * @param {Object} context - Additional context
     */
    static logDatabaseError(dbError, context = {}) {
        const error = new Error(dbError.message || 'Database operation failed');
        error.name = 'DatabaseError';
        error.statusCode = 500;
        error.details = {
            code: dbError.code,
            mongoError: dbError.name
        };
        error.stack = dbError.stack;

        this.log(error, context);
    }

    /**
     * Get error logs for a specific date
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Array} Array of log entries
     */
    static getLogsByDate(date) {
        try {
            const logsDir = path.join(__dirname, '..', 'logs');
            const logFile = path.join(logsDir, `error-${date}.log`);

            if (!fs.existsSync(logFile)) {
                return [];
            }

            const logContent = fs.readFileSync(logFile, 'utf8');
            const logLines = logContent.trim().split('\n');

            return logLines.map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            }).filter(log => log !== null);
        } catch (error) {
            console.error('Failed to read log file:', error.message);
            return [];
        }
    }

    /**
     * Get error statistics for a date range
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Object} Error statistics
     */
    static getErrorStats(startDate, endDate) {
        const stats = {
            totalErrors: 0,
            errorsByType: {},
            errorsByRoute: {},
            errorsByUser: {}
        };

        // This is a simplified version - in production, you'd iterate through date range
        const logs = this.getLogsByDate(startDate);

        logs.forEach(log => {
            stats.totalErrors++;

            // Count by type
            stats.errorsByType[log.name] = (stats.errorsByType[log.name] || 0) + 1;

            // Count by route
            const route = log.context.route;
            stats.errorsByRoute[route] = (stats.errorsByRoute[route] || 0) + 1;

            // Count by user type
            const userType = log.context.userType;
            stats.errorsByUser[userType] = (stats.errorsByUser[userType] || 0) + 1;
        });

        return stats;
    }
}

module.exports = { ErrorLogger };
