// controller/brandController.js
const brandModel = require('../models/brandModel');

const brandController = {
  async getExplorePage(req, res) {
    brandModel.getAllBrands((err, brands) => {
      if (err) {
        res.status(500).send('Error fetching brands');
      } else {
        res.render('influencer/I_explore', { brands });
      }
    });
  }
};

module.exports = brandController;