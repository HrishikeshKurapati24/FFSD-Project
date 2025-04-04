// controller/collabController.js
const collabModel = require('../models/collabModel');

// For I_collab
const getCollabPage = (req, res) => {
  collabModel.getAllCollabs((err, collabs) => {
    if (err) {
      console.error('Controller error:', err);
      res.status(500).send('Error fetching collabs');
    } else {
      console.log('Controller sending collabs to view (I_collab):', collabs);
      res.render('influencer/I_collab', { collabs: collabs || [] });
    }
  });
};

// For B2_collab
const getB2CollabPage = (req, res) => {
  collabModel.getAllCollabs((err, collabs) => {
    if (err) {
      console.error('Controller error:', err);
      res.status(500).send('Error fetching collabs');
    } else {
      console.log('Controller sending collabs to view (B2_collab):', collabs);
      res.render('brand/B2_collab', { collabs: collabs || [] });
    }
  });
};

// For Collab_form_open
const getCollabDetailPage = (req, res) => {
  const collabId = req.query.id; // Assuming ID is passed as a query parameter
  if (!collabId) {
    return res.status(400).send('Collab ID is required');
  }
  collabModel.getCollabById(collabId, (err, collab) => {
    if (err) {
      console.error('Controller error:', err);
      res.status(500).send('Error fetching collab details');
    } else if (!collab) {
      res.status(404).send('Collab not found');
    } else {
      console.log('Controller sending collab to view (Collab_form_open):', collab);
      res.render('influencer/Collab_form_open', { collab });
    }
  });
};

module.exports = { getCollabPage, getB2CollabPage, getCollabDetailPage };