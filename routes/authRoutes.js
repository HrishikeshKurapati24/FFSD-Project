const express = require('express');
const { BrandInfo } = require('../config/BrandMongo');
const { InfluencerInfo } = require('../config/InfluencerMongo');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// import passport from 'passport';

dotenv.config();

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Middleware to check if user is a brand
const isBrand = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.userType === 'brand') {
    return next();
  }
  res.status(403).json({ message: 'Access denied: Brands only' });
};

// Middleware to check if user is an influencer
const isInfluencer = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.userType === 'influencer') {
    return next();
  }
  res.status(403).json({ message: 'Access denied: Influencers only' });
};

router.post('/logout', (req, res) => {
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    // Clear cookie
    res.clearCookie('token', { httpOnly: true, path: '/' });
    res.redirect('/');
  });
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    // Try to find brand first
    let user = await BrandInfo.findOne({ email });
    let userType = 'brand';
    let redirectUrl = '/brand/home';

    // If not found, try influencer
    if (!user) {
      user = await InfluencerInfo.findOne({ email });
      userType = 'influencer';
      redirectUrl = '/influencer/home';
    }

    // If no user found
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, userType },
      process.env.JWT_SECRET,
      {
        expiresIn: remember ? '7d' : '1h'
      }
    );

    // Set session data
    req.session.user = {
      id: user._id,
      email: user.email,
      userType,
      displayName: user.displayName || user.brandName || user.fullName
    };

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000
    };

    // Set cookie
    res.cookie('token', token, cookieOptions);

    // Send response
    res.status(200).json({
      message: 'Sign-in successful',
      redirectUrl,
      user: req.session.user
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// router.post('/forgot-password', async (req, res) => {
//   try {
//     const { email } = req.body;

//     // Check both brand and influencer collections
//     const brand = await BrandInfo.findOne({ email });
//     const influencer = await InfluencerInfo.findOne({ email });

//     if (!brand && !influencer) {
//       return res.status(400).json({ message: 'Email not found' });
//     }

//     // TODO: Implement password reset logic
//     // For now, just send a success message
//     res.status(200).json({ message: 'Password reset instructions sent to your email' });
//   } catch (err) {
//     console.error('Forgot password error:', err);
//     res.status(500).json({ message: err.message || 'Server error' });
//   }
// });

// Export the router and middleware functions
module.exports = {
  router,
  isAuthenticated,
  isBrand,
  isInfluencer
};