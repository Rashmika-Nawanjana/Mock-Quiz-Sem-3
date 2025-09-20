



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
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error && error.message.toLowerCase().includes('email not confirmed')) {
    // Resend confirmation email
    await supabase.auth.resend({ type: 'signup', email });
    return res.render('login', { error: 'Your email is not confirmed. A new confirmation email has been sent. Please check your inbox.', activeTab: 'login' });
  } else if (error && error.message.includes('Invalid login credentials')) {
    // Try to sign up if user not found
    const signup = await supabase.auth.signUp({ email, password });
    if (signup.error) {
      return res.render('login', { error: signup.error.message, activeTab: 'login' });
    }
    // Ask user to check email for confirmation
    return res.render('login', { success: 'Account created! Please check your email to confirm, then log in.', activeTab: 'login' });
  } else if (error) {
    return res.render('login', { error: error.message, activeTab: 'login' });
  }
  // Upsert user into Supabase users table
  const user = data.user;
  if (user) {
    const { id, email, user_metadata } = user;
    const full_name = user_metadata?.full_name || user_metadata?.name || null;
    const avatar_url = user_metadata?.avatar_url || user_metadata?.picture || null;
    const { data: upsertData, error: upsertError } = await supabase.from('users').upsert([
      {
        id,
        email,
        full_name,
        avatar_url,
        is_active: true,
        updated_at: new Date().toISOString(),
      }
    ], { onConflict: 'id' });
    if (upsertError) {
      console.error('Supabase user upsert error:', upsertError);
    } else {
      console.log('Supabase user upsert success:', upsertData);
    }
  // Resolve avatar URL once and cache in session
  let avatar_url_resolved = '/images/avatar.jpg';
  if (avatar_url) {
    if (avatar_url.startsWith('http')) {
      avatar_url_resolved = avatar_url;
    } else {
      avatar_url_resolved = `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/${avatar_url}`;
    }
  }
  req.session.user = { id, email, name: full_name, avatar_url, avatar_url_resolved };
  }
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
    return res.render('login', { error: error.message, activeTab: 'signup' });
  }
  // After signup, switch to login tab and show message
  res.render('login', { success: 'Signup successful! Please check your email to verify your account, then log in.', activeTab: 'login' });
// Always define activeTab when rendering login page
router.get('/login', (req, res) => {
  res.render('login', { activeTab: 'login' });
});
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
  // Fetch user info from Supabase
  const { data: { user }, error } = await supabase.auth.getUser(access_token);
  if (error || !user) return res.status(401).send('Unauthorized');
  console.log('Supabase user_metadata:', user.user_metadata);
  // Upsert user into Supabase users table (OAuth)
  const { id, email, user_metadata } = user;
  const full_name = user_metadata?.full_name || user_metadata?.name || null;
  const avatar_url = user_metadata?.avatar_url || user_metadata?.picture || null;
  const { data: upsertData, error: upsertError } = await supabase.from('users').upsert([
    {
      id,
      email,
      full_name,
      avatar_url,
      is_active: true,
      updated_at: new Date().toISOString(),
    }
  ], { onConflict: 'id' });
  if (upsertError) {
    console.error('Supabase user upsert error:', upsertError);
  } else {
    console.log('Supabase user upsert success:', upsertData);
  }
  req.session.user = { id, email, full_name, avatar_url };
  req.session.save(() => res.sendStatus(200));
});

export default router;