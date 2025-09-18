



// 1. Create the app first

import express from 'express';
import supabase from '../database/supabase-client.js';
const router = express.Router();
const SUPABASE_URL = process.env.SUPABASE_URL;
const CALLBACK_URL = process.env.BASE_URL + '/auth/oauth/callback';
const app = express();
// Email/password login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return res.render('login', { error: error.message });
  }
  // Set session token or cookie as needed
  req.session.user = data.user;
  req.session.save(() => {
    res.redirect('/home');
  });
});

// Email/password signup
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  if (error) {
    return res.render('login', { error: error.message });
  }
  res.render('login', { success: 'Signup successful! Please check your email to verify your account.' });
});

// Forgot password (show form)
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

// Forgot password (submit)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: CALLBACK_URL
  });
  if (error) {
    return res.render('forgot-password', { error: error.message });
  }
  res.render('forgot-password', { success: 'Check your email for a password reset link.' });
});

// Reset password (show form)
router.get('/reset-password', (req, res) => {
  // Supabase handles reset via email link, may not use this route unless you want a custom flow
  res.render('reset-password', { access_token: req.query.access_token });
});

// Reset password (submit)
router.post('/reset-password', async (req, res) => {
  const { access_token, password } = req.body;
  const { data, error } = await supabase.auth.updateUser(
    { password },
    { access_token }
  );
  if (error) {
    return res.render('reset-password', { error: error.message });
  }
  res.render('login', { success: 'Password updated successfully. You can now log in.' });
});

// Logout
router.get('/logout', async (req, res) => {
  await supabase.auth.signOut();
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

// Google OAuth
router.get('/google', (req, res) => {
  const redirectTo = encodeURIComponent(CALLBACK_URL);
  res.redirect(
    `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`
  );
});

// GitHub OAuth
router.get('/github', (req, res) => {
  const redirectTo = encodeURIComponent(CALLBACK_URL);
  res.redirect(
    `${SUPABASE_URL}/auth/v1/authorize?provider=github&redirect_to=${redirectTo}`
  );
});

// OAuth Callback
router.get('/oauth/callback', (req, res) => {
  res.render('oauth-callback');
});

router.post('/session', async (req, res) => {
  const { access_token } = req.body;
  // Optionally, verify the access token with Supabase
  // Fetch user info if needed
  req.session.user = { access_token }; // or fetch user info from Supabase
  res.sendStatus(200);
});

export default router;