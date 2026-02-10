const express = require('express');
const { BrandInfo } = require('../config/BrandMongo');
const { InfluencerInfo } = require('../config/InfluencerMongo');
const { Customer } = require('../config/CustomerMongo');
const CustomerModel = require('../models/CustomerModel');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// import passport from 'passport';

dotenv.config();

const router = express.Router();

// Helper function to verify JWT token from cookie
const verifyJWTFromCookie = (req) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Return user info from token
    return {
      id: decoded.id,
      userType: decoded.userType
    };
  } catch (error) {
    // Handle token expiration and other JWT errors
    if (error.name === 'TokenExpiredError') {
      console.log('JWT token expired');
      return null;
    } else if (error.name === 'JsonWebTokenError') {
      console.log('Invalid JWT token');
      return null;
    }
    console.error('JWT verification error:', error);
    return null;
  }
};

// Middleware to check if user is authenticated (supports both session and JWT)
const isAuthenticated = async (req, res, next) => {
  // First check for session (for EJS pages)
  if (req.session && req.session.user) {
    // Ensure req.user is set for consistency
    req.user = req.session.user;
    return next();
  }

  // If no session, check for JWT token in cookie (for React API)
  const jwtUser = verifyJWTFromCookie(req);

  if (jwtUser) {
    // Fetch user details from database to populate full user info
    try {
      let user;
      if (jwtUser.userType === 'brand') {
        user = await BrandInfo.findById(jwtUser.id).select('email displayName brandName').lean();
      } else if (jwtUser.userType === 'influencer') {
        user = await InfluencerInfo.findById(jwtUser.id).select('email displayName fullName').lean();
      } else if (jwtUser.userType === 'customer') {
        user = await Customer.findById(jwtUser.id).select('email name status admin_notes').lean();
      }

      if (user && jwtUser.userType === 'customer' && user.status === 'suspended') {
        const errorMessage = user.admin_notes || 'Your account has been suspended by the admin.';

        // Clear authentication to prevent further access during this request
        res.clearCookie('token');
        if (req.session) {
          req.session.destroy();
        }

        const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json');
        if (isAPIRequest) {
          return res.status(403).json({
            message: 'Access denied: ' + errorMessage,
            error: errorMessage
          });
        } else {
          return res.status(403).send(`
                  <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                      <h1 style="color: #ea4335;">Access Denied</h1>
                      <p>Your account has been suspended.</p>
                      <p><strong>Reason:</strong> ${errorMessage}</p>
                      <a href="/signin" style="color: #4285f4; text-decoration: none;">Return to Sign In</a>
                  </div>
              `);
        }
      }

      if (user) {
        // Populate req.user with full user info
        req.user = {
          id: jwtUser.id,
          email: user.email,
          userType: jwtUser.userType,
          displayName: user.displayName || user.brandName || user.fullName || user.name
        };

        // Optionally sync to session for compatibility
        req.session.user = req.user;
        return next();
      }
    } catch (error) {
      console.error('Error fetching user from database:', error);
    }
  }

  // Neither session nor valid JWT token found
  // Check if this is an API request (JSON) or page request (HTML)
  const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json');

  if (isAPIRequest) {
    return res.status(401).json({
      message: 'Authentication required',
      error: 'Token expired. Please sign in again.'
    });
  } else {
    // For page requests, redirect to signin (EJS pages)
    return res.redirect('/SignIn');
  }
};

// Middleware to check if user is a brand
const isBrand = (req, res, next) => {
  const userType = req.session?.user?.userType || req.user?.userType;

  if (userType === 'brand') {
    return next();
  }

  const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json');

  if (isAPIRequest) {
    return res.status(403).json({ message: 'Access denied: Brands only' });
  } else {
    return res.redirect('/SignIn');
  }
};

// Middleware to check if user is an influencer
const isInfluencer = (req, res, next) => {
  const userType = req.session?.user?.userType || req.user?.userType;

  if (userType === 'influencer') {
    return next();
  }

  const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json');

  if (isAPIRequest) {
    return res.status(403).json({ message: 'Access denied: Influencers only' });
  } else {
    return res.redirect('/SignIn');
  }
};

// Middleware to check if user is a customer
const isCustomer = (req, res, next) => {
  const userType = req.session?.user?.userType || req.user?.userType;

  if (userType === 'customer') {
    return next();
  }

  const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json');

  if (isAPIRequest) {
    return res.status(403).json({ message: 'Access denied: Customers only' });
  } else {
    return res.redirect('/signin');
  }
};

// Auth verification endpoint for React to check authentication status
router.get('/verify', async (req, res) => {
  try {
    // First check for session (for EJS pages)
    if (req.session && req.session.user) {
      return res.status(200).json({
        authenticated: true,
        user: req.session.user
      });
    }

    // If no session, check for JWT token in cookie (for React API)
    const jwtUser = verifyJWTFromCookie(req);

    if (jwtUser) {
      // Fetch user details from database to populate full user info
      try {
        let user;
        if (jwtUser.userType === 'brand') {
          user = await BrandInfo.findById(jwtUser.id).select('email displayName brandName').lean();
        } else if (jwtUser.userType === 'influencer') {
          user = await InfluencerInfo.findById(jwtUser.id).select('email displayName fullName').lean();
        } else if (jwtUser.userType === 'customer') {
          user = await Customer.findById(jwtUser.id).select('email name').lean();
        }

        if (user) {
          const userInfo = {
            id: jwtUser.id,
            email: user.email,
            userType: jwtUser.userType,
            displayName: user.displayName || user.brandName || user.fullName || user.name
          };

          // Optionally sync to session for compatibility
          req.session.user = userInfo;

          return res.status(200).json({
            authenticated: true,
            user: userInfo
          });
        }
      } catch (error) {
        console.error('Error fetching user from database:', error);
      }
    }

    // Not authenticated
    return res.status(401).json({
      authenticated: false,
      message: 'Not authenticated'
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({
      authenticated: false,
      message: 'Server error'
    });
  }
});

router.post('/logout', (req, res) => {
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json');
      if (isAPIRequest) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      return res.redirect('/');
    }

    // Clear JWT cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    });

    // Check if this is an API request (JSON) or page request (HTML)
    const isAPIRequest = req.headers.accept && req.headers.accept.includes('application/json');

    if (isAPIRequest) {
      return res.status(200).json({ message: 'Logged out successfully' });
    } else {
      return res.redirect('/');
    }
  });
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    // Try to find brand first (include password explicitly)
    let user = await BrandInfo.findOne({ email }).select('+password');
    let userType = 'brand';
    let redirectUrl = '/brand/home';

    // If not found, try influencer
    if (!user) {
      // Try influencer next (include password explicitly)
      user = await InfluencerInfo.findOne({ email }).select('+password');
      userType = 'influencer';
      redirectUrl = '/influencer/home';
    }

    // If not found, try customer
    if (!user) {
      // Customer schema hides password by default (select: false).
      // Explicitly include password so we can compare hashes during signin.
      user = await Customer.findOne({ email }).select('+password');
      userType = 'customer';
      redirectUrl = '/customer';
    }

    // If no user found
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check for suspension (Customer only)
    if (userType === 'customer' && user.status === 'suspended') {
      const errorMessage = user.admin_notes || 'Your account has been suspended by the admin.';
      return res.status(403).json({
        message: 'Access denied',
        error: errorMessage
      });
    }

    // Defensive check: ensure we have a password hash to compare
    if (!user.password) {
      // Missing password hash — don't reveal details to client. Log for admin.
      console.warn('Signin warning: missing password hash for user', { email, userType, id: user._id });
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
      displayName: user.displayName || user.brandName || user.fullName || user.name
    };

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
      path: '/'
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

// Customer signup route
router.post('/customer/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new customer and let schema hooks hash the password
    const newCustomer = new Customer({
      name,
      email: email.toLowerCase(),
      password: password,
      phone: phone || ''
    });

    const savedCustomer = await newCustomer.save();

    // Return without password
    const customerResponse = savedCustomer.toObject();
    delete customerResponse.password;

    res.status(201).json({
      message: 'Signup successful! You can now sign in with your credentials.',
      customer: customerResponse
    });
  } catch (err) {
    console.error('Customer signup error:', err);
    res.status(500).json({ message: err.message || 'Signup failed' });
  }
});

// Export the router and middleware functions
module.exports = {
  router,
  isAuthenticated,
  isBrand,
  isInfluencer,
  isCustomer
};