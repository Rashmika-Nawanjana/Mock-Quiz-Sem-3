# Supabase Authentication Setup Guide

## Prerequisites

1. **Supabase Account**: Create an account at [supabase.com](https://supabase.com)
2. **Node.js**: Version 16 or higher

## Step 1: Supabase Project Setup

1. Create a new project in Supabase Dashboard
2. Go to **Settings** → **API** 
3. Copy your:
   - **Project URL** 
   - **Public anon key**

## Step 2: Database Setup

1. In your Supabase project, go to **SQL Editor**
2. Run the database setup scripts in this order:
   ```sql
   -- Run these files from the database/ folder:
   \i create_tables.sql
   \i create_indexes.sql  
   \i functions_triggers.sql
   \i views.sql
   \i sample_data.sql
   ```

3. Or run the complete setup:
   ```sql
   \i setup.sql
   ```

## Step 3: Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Update your `.env` file with your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SESSION_SECRET=your_secure_random_string_here
   NODE_ENV=development
   PORT=3000
   ```

## Step 4: Install Dependencies

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client
- `express-session` - Session management
- `bcrypt` - Password hashing
- `dotenv` - Environment variables

## Step 5: Test the Setup

1. **Generate Password Hashes** (for sample data):
   ```bash
   cd database
   node hasher.js
   ```
   Copy the generated hashes into your `sample_data.sql`

2. **Start the Server**:
   ```bash
   npm run dev
   ```

3. **Test Authentication**:
   - Visit `http://localhost:3000/login`
   - Try signing up with a new account
   - Try logging in with existing credentials

## Step 6: Supabase Authentication Settings

In your Supabase Dashboard:

1. **Go to Authentication → Settings**
2. **Site URL**: Set to `http://localhost:3000` (development)
3. **Redirect URLs**: Add `http://localhost:3000/auth/callback`

## File Structure

```
Mock-Quiz-Sem-3/
├── middleware/
│   └── auth.js              # Authentication middleware
├── services/
│   └── auth-service.js      # Supabase authentication service
├── database/
│   ├── supabase-client.js   # Supabase client configuration
│   ├── hasher.js           # Password hashing utility
│   └── *.sql               # Database schema files
├── public/js/
│   └── login.js            # Updated frontend authentication
├── views/
│   ├── login.ejs           # Login/signup page
│   └── profile.ejs         # User profile page
├── .env                    # Environment variables (create this)
├── .env.example           # Environment template
└── server.mjs             # Updated Express server
```

## Key Features Implemented

- ✅ **User Registration/Login** with email and password
- ✅ **Session Management** with Express sessions
- ✅ **Password Hashing** using bcrypt
- ✅ **Protected Routes** requiring authentication
- ✅ **Form Validation** on frontend and backend
- ✅ **Error Handling** with user-friendly messages
- ✅ **Profile Management** with user data from Supabase

## Authentication Flow

1. **Signup**: User creates account → Supabase Auth + Custom users table
2. **Login**: User enters credentials → Supabase validates → Session created
3. **Protected Access**: Middleware checks session → Allows/denies access
4. **Logout**: Session destroyed → User redirected

## Next Steps

1. **Enable Social Auth** (Google/GitHub) in Supabase Dashboard
2. **Email Verification** - Configure in Supabase Auth settings  
3. **Password Reset** - Test the forgot password flow
4. **Profile Updates** - Add profile editing functionality
5. **Quiz Integration** - Connect quiz results to user accounts

## Troubleshooting

- **"Module not found"**: Run `npm install`
- **"Supabase connection failed"**: Check your `.env` credentials
- **"Session errors"**: Ensure `SESSION_SECRET` is set
- **"Database errors"**: Verify your SQL tables are created

## Security Notes

- Never commit `.env` file to git
- Use strong, unique `SESSION_SECRET` 
- Enable RLS (Row Level Security) in Supabase for production
- Set `NODE_ENV=production` for deployment