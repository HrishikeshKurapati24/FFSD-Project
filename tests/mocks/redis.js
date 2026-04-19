const EventEmitter = require('events');

class RedisMock extends EventEmitter {
    constructor() {
        super();
        this.data = new Map();
        
        // Wrap methods in jest.fn() for testing
        this.get = jest.fn(this.get.bind(this));
        this.set = jest.fn(this.set.bind(this));
        this.del = jest.fn(this.del.bind(this));
        this.scan = jest.fn(this.scan.bind(this));
        this.quit = jest.fn(this.quit.bind(this));
    }

    async get(key) {
        return this.data.get(key) || null;
    }

    async set(key, value, mode, ttl) {
        this.data.set(key, value);
        return 'OK';
    }

    async del(...keys) {
        let count = 0;
        for (const key of keys) {
            if (this.data.delete(key)) count++;
        }
        return count;
    }

    async scan(cursor, match, pattern, count, limit) {
        // Simple mock scan
        const keys = Array.from(this.data.keys());
        return ['0', keys];
    }

    async quit() {
        return 'OK';
    }
}

const mockInstance = new RedisMock();

module.exports = mockInstance;
