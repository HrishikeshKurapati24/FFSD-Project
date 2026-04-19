const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

const app = express();

// Middleware
app.use(cors({ credentials: true, origin: true }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Routes
const adminRoutes = require("./routes/adminRoutes");
const influencerRoutes = require("./routes/influencerRoutes");
const brandRoutes = require("./routes/brandRoutes");
const customerRoutes = require("./routes/customerRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const { router: authRouter } = require('./routes/authRoutes');
const landingRoutes = require('./routes/landingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/', landingRoutes);
app.use('/admin', adminRoutes);
app.use('/influencer', influencerRoutes);
app.use('/brand', brandRoutes);
app.use('/customer', customerRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/auth', authRouter);
app.use('/api/notifications', notificationRoutes);

// Error Handling
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
