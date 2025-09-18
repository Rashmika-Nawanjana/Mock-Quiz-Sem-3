import { supabase } from '../database/supabase-client.js';

// Middleware to check if user is authenticated
export const requireAuth = async (req, res, next) => {
    try {
        const token = req.session?.access_token || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.redirect('/login');
        }

        // Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            req.session?.destroy();
            return res.redirect('/login');
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.redirect('/login');
    }
};

// Middleware to redirect authenticated users from login page
export const redirectIfAuthenticated = async (req, res, next) => {
    try {
        const token = req.session?.access_token;
        
        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            
            if (user && !error) {
                return res.redirect('/profile');
            }
        }
        
        next();
    } catch (error) {
        console.error('Redirect middleware error:', error);
        next();
    }
};

// Middleware to optionally get user data (for pages that work with/without auth)
export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.session?.access_token;
        
        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            
            if (user && !error) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        next();
    }
};