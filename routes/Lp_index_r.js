const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Home page
router.get('/', homeController.getHome);

// About page
router.get('/about', homeController.getAbout);

module.exports = router; 