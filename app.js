const express = require('express');
const app = express();
const session = require("express-session");
const adminRoutes = require("./routes/adminRoutes");
const influencerRoutes = require("./routes/influencerRoutes");
const path = require('path');

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
}));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    next();
});

// Route for the Landing_page
app.get('/', (req, res) => {
    res.render('home_page/Lp_index'); // This will render 'views/Lp_index.ejs'
});

// Route for the about_page
app.get('/about', (req, res) => {
    res.render('home_page/about_page'); // This will render 'views/Lp_index.ejs'
});

// Route for the sup_role
app.get('/Sup_role', (req, res) => {
    res.render('home_page/Sup_role'); // This will render 'views/Lp_index.ejs'
});

// Route for the SignIn
app.get('/SignIn', (req, res) => {
    res.render('home_page/SignIn'); // This will render 'views/Lp_index.ejs'
});

// Route for the Home icon
app.get('/Lp_index', (req, res) => {
    res.render('home_page/Lp_index'); // This will render 'views/Lp_index.ejs'
});

// Route for the Sup_i
app.get('/influencer/Sup_i', (req, res) => {
    res.render('home_page/Sup_i'); // This will render 'views/Lp_index.ejs'
});

// Route for the Sup_b
app.get('/brand/Sup_b', (req, res) => {
    res.render('home_page/Sup_b'); // This will render 'views/Lp_index.ejs'
});

// Route for the I_index
app.get('/influencer/home', (req, res) => {
    res.render('influencer/I_index'); // This will render 'views/Lp_index.ejs'
});

app.use("/influencer", influencerRoutes);

// Route for the I_profile2
app.get('/influencer/profile', (req, res) => {
    res.render('influencer/I_profile2'); // This will render 'views/Lp_index.ejs'
});

// Route for the I_collab
app.get('/influencer/collab', (req, res) => {
    res.render('influencer/I_collab'); // This will render 'views/Lp_index.ejs'
});

// Route for the /Collab_form_open
app.get('/influencer/Collab_form_open', (req, res) => {
    res.render('influencer/Collab_form_open'); // This will render 'views/Lp_index.ejs'
});

// Route for the B2_index
app.get('/brand/home', (req, res) => {
    res.render('brand/B2_index'); // This will render 'views/Lp_index.ejs'
});

// Route for the /B2_profile2
app.get('/brand/profile', (req, res) => {
    res.render('brand/B2_profile2'); // This will render 'views/Lp_index.ejs'
});

// Route for the /B2_collab
app.get('/brand/collab', (req, res) => {
    res.render('brand/B2_collab'); // This will render 'views/Lp_index.ejs'
});

// Route for the /B2_explore
app.get('/brand/explore', (req, res) => {
    res.render('brand/B2_explore'); // This will render 'views/Lp_index.ejs'
});

// Route for the Create_collab
app.get('/brand/create_collab', (req, res) => {
    res.render('brand/Create_collab'); // This will render 'views/Lp_index.ejs'
});

// Route for the B2_recievedRequests
app.get('/brand/recievedRequests', (req, res) => {
    res.render('brand/B2_recievedRequests'); // This will render 'views/Lp_index.ejs'
});

// Route for the B2_transation
app.get('/brand/transaction', (req, res) => {
    res.render('brand/B2_transationp'); // This will render 'views/Lp_index.ejs'
});

app.get('/customer/offers', (req, res) => {
    res.render('customer/customers_offers_page');
});


app.get('/customer/reviews', (req, res) => {
    res.render('customer/customers_reviews_page');
});
//Admin Panel Routing
// Mount all routes under /admin
app.use("/admin", adminRoutes);

// Root route redirect
app.get("/admin", (req, res) => {
    res.redirect("/dashboard");
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).render('error', {
        error: 'Something went wrong!',
        message: err.message
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;