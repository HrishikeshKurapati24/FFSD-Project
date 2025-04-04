// controller/requestController.js
const requestModel = require('../models/requestModel');

const getReceivedRequestsPage = (req, res) => {
  requestModel.getAllRequests((err, requests) => {
    if (err) {
      console.error('Controller error:', err);
      res.status(500).send('Error fetching collab requests');
    } else {
      console.log('Controller sending requests to view:', requests);
      res.render('brand/B2_recievedRequests', { requests: requests || [] });
    }
  });
};

module.exports = { getReceivedRequestsPage };