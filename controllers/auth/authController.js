const jwt = require('jsonwebtoken');
const AuthService = require('../../services/auth/authService');

// Helper function to verify JWT token from cookie (shared logic from original routes)
const verifyJWTFromCookie = (req) => {
    try {
        const token = req.cookies?.token;
        if (!token) return null;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { id: decoded.id, userType: decoded.userType };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('JWT token expired');
        } else if (error.name === 'JsonWebTokenError') {
            console.log('Invalid JWT token');
        } else {
            console.error('JWT verification error:', error);
        }
        return null;
    }
};

class AuthController {
    /**
     * Verify Token (Endpoint /verify)
     */
    static async verifyToken(req, res) {
        try {
            // Check session
            if (req.session && req.session.user) {
                return res.status(200).json({ authenticated: true, user: req.session.user });
            }

            // Check JWT
            const jwtUser = verifyJWTFromCookie(req);
            if (jwtUser) {
                const userInfo = await AuthService.verifyUserFromToken(jwtUser);
                if (userInfo) {
                    req.session.user = userInfo;
                    return res.status(200).json({ authenticated: true, user: userInfo });
                }
            }

            return res.status(401).json({ authenticated: false, message: 'Not authenticated' });
        } catch (error) {
            console.error('Auth verification error:', error);
            return res.status(500).json({ authenticated: false, message: 'Server error' });
        }
    }

    /**
     * Sign out user (Endpoint /logout)
     */
    static async logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ message: 'Error logging out' });
            }

            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                path: '/'
            });

            return res.status(200).json({ message: 'Logged out successfully' });
        });
    }

    /**
     * Sign in user (Endpoint /signin)
     */
    static async signin(req, res) {
        try {
            const { email, password, remember } = req.body;

            const result = await AuthService.authenticateUser(email, password);

            if (result.error) {
                return res.status(result.status || 400).json({
                    message: result.suspended ? 'Access denied' : result.error,
                    error: result.error
                });
            }

            const { user, userType } = result;

            // Generate JWT token
            const token = jwt.sign(
                { id: user._id, userType },
                process.env.JWT_SECRET,
                { expiresIn: remember ? '7d' : '1h' }
            );

            // Set session data
            req.session.user = {
                id: user._id,
                email: user.email,
                userType,
                displayName: user.displayName || user.brandName || user.fullName || user.name
            };

            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
                path: '/'
            });

            // Redirect logic natively handled here as it's routing specific
            let redirectUrl;
            if (userType === 'brand') redirectUrl = '/brand/home';
            else if (userType === 'influencer') redirectUrl = '/influencer/home';
            else redirectUrl = '/customer';

            res.status(200).json({
                message: 'Sign-in successful',
                redirectUrl,
                user: req.session.user
            });
        } catch (err) {
            console.error('Signin error:', err);
            res.status(500).json({ message: err.message || 'Server error' });
        }
    }

    /**
     * Register a customer (Endpoint /customer/signup)
     */
    static async customerSignup(req, res) {
        try {
            const result = await AuthService.registerCustomer(req.body);

            if (result.error) {
                return res.status(result.status || 400).json({ message: result.error });
            }

            res.status(201).json({
                message: 'Signup successful! You can now sign in with your credentials.',
                customer: result.customer
            });
        } catch (err) {
            console.error('Customer signup error:', err);
            res.status(500).json({ message: err.message || 'Signup failed' });
        }
    }
}

module.exports = { AuthController, verifyJWTFromCookie };
