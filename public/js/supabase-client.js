// Frontend Supabase Client Configuration
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

// Supabase configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your actual URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual key

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// Authentication state management
class AuthManager {
    constructor() {
        this.user = null;
        this.session = null;
        this.listeners = [];
        this.init();
    }

    async init() {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        this.session = session;
        this.user = session?.user || null;

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            this.session = session;
            this.user = session?.user || null;
            this.notifyListeners(event, session);
        });

        // Notify initial state
        this.notifyListeners('INITIAL_SESSION', session);
    }

    // Subscribe to auth state changes
    onAuthStateChange(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    notifyListeners(event, session) {
        this.listeners.forEach(listener => listener(event, session));
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.user;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get current session
    getCurrentSession() {
        return this.session;
    }
}

// Create global auth manager instance
export const authManager = new AuthManager();

// Utility functions
export const isAuthenticated = () => authManager.isAuthenticated();
export const getCurrentUser = () => authManager.getCurrentUser();
export const getCurrentSession = () => authManager.getCurrentSession();