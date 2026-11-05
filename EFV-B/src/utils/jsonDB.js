const fs = require('fs').promises;
const path = require('path');

class JsonDB {
    constructor(filename) {
        this.filepath = path.join(__dirname, '../data', filename);
        this.cache = null;
        this.lastMtime = 0;
        this._writeLock = Promise.resolve();
    }

    async _read() {
        try {
            const stats = await fs.stat(this.filepath);
            if (this.cache && this.lastMtime === stats.mtimeMs) {
                return this.cache;
            }
            this.lastMtime = stats.mtimeMs;
            
            const data = await fs.readFile(this.filepath, 'utf8');
            if (!data || !data.trim()) {
                this.cache = [];
                return this.cache;
            }
            this.cache = JSON.parse(data);
            return this.cache;
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.cache = [];
                return this.cache;
            }
            throw error;
        }
    }

    async _write(data) {
        this.cache = data;
        const writeOp = async () => {
            await fs.writeFile(this.filepath, JSON.stringify(data, null, 2), 'utf8');
            const stats = await fs.stat(this.filepath);
            this.lastMtime = stats.mtimeMs;
        };
        this._writeLock = this._writeLock.then(writeOp).catch(writeOp);
        await this._writeLock;
    }

    async getAll() {
        return await this._read();
    }

    async getById(id) {
        const data = await this._read();
        return data.find(item => (item._id || item.id) === id);
    }

    async create(item) {
        const data = await this._read();
        const newItem = {
            ...item,
            _id: item._id || item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        data.push(newItem);
        await this._write(data);
        return newItem;
    }

    async update(id, updates) {
        const data = await this._read();
        const index = data.findIndex(item => (item._id || item.id) === id);
        if (index === -1) return null;

        let finalUpdates = updates;
        if (typeof updates === 'object' && updates !== null) {
            finalUpdates = { ...updates };
            if (finalUpdates.$set && typeof finalUpdates.$set === 'object') {
                Object.assign(finalUpdates, finalUpdates.$set);
                delete finalUpdates.$set;
            }
            if (finalUpdates.$inc && typeof finalUpdates.$inc === 'object') {
                for (let [k, v] of Object.entries(finalUpdates.$inc)) {
                    finalUpdates[k] = (Number(data[index][k]) || 0) + Number(v);
                }
                delete finalUpdates.$inc;
            }
            delete finalUpdates.$setOnInsert;
        }

        data[index] = {
            ...data[index],
            ...finalUpdates,
            updatedAt: new Date()
        };

        if (data[index].$set) {
            delete data[index].$set;
        }

        await this._write(data);
        return data[index];
    }

    async delete(id) {
        const data = await this._read();
        const filtered = data.filter(item => (item._id || item.id) !== id);
        await this._write(filtered);
        return true;
    }

    async write(fullData) {
        await this._write(fullData);
    }
}

module.exports = JsonDB;
