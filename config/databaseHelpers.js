const db = require('./database');

const DatabaseHelpers = {
    // Add new influencer
    async addInfluencer(influencer) {
        const newId = db.inMemoryDB.influencers.length + 1;
        const newInfluencer = {
            id: newId,
            ...influencer,
            status: 'pending'
        };
        db.inMemoryDB.influencers.push(newInfluencer);
        return newInfluencer;
    },

    // Add new brand
    async addBrand(brand) {
        const newId = db.inMemoryDB.brands.length + 1;
        const newBrand = {
            id: newId,
            ...brand,
            status: 'pending'
        };
        db.inMemoryDB.brands.push(newBrand);
        return newBrand;
    },

    // Reset database to initial state
    async resetDatabase() {
        db.inMemoryDB.influencers = [];
        db.inMemoryDB.brands = [];
        db.inMemoryDB.collaborations = [];
        db.inMemoryDB.feedback = [];
    }
};

module.exports = DatabaseHelpers; 