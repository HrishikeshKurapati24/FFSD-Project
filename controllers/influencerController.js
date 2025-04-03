// controller/influencerController.js
const influencerModel = require('../model/influencerModel');

const getInfluencerExplorePage = (req, res) => {
  influencerModel.getAllInfluencers((err, influencers) => {
    if (err) {
      console.error('Controller error:', err);
      res.status(500).send('Error fetching influencers');
    } else {
      console.log('Controller sending influencers to view:', influencers);
      res.render('brand/B2_explore', { influencers: influencers || [] });
    }
  });
};

module.exports = { getInfluencerExplorePage };