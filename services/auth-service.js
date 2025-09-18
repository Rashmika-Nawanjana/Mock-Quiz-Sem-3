import { supabase } from '../database/supabase-client.js';
import { hashPassword, verifyPassword } from '../database/hasher.js';

export class AuthService {
    // Sign up with email and password
    static async signUp({ email, password, name }) {
        try {
            // Hash the password
            const hashedPassword = await hashPassword(password);
            
            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        username: email.split('@')[0] // Generate username from email
                    }
                }
            });

            if (authError) {
                throw authError;
            }

            // Insert user data into our custom users table
            if (authData.user) {
                const { error: userError } = await supabase
                    .from('users')
                    .insert({
                        id: authData.user.id,
                        email: authData.user.email,
                        password_hash: hashedPassword,
                        username: authData.user.user_metadata.username,
                        full_name: authData.user.user_metadata.full_name,
                        role: 'student'
                    });

                if (userError) {
                    console.error('User insertion error:', userError);
                    // Don't throw here as auth user is already created
                }
            }

            return {
                user: authData.user,
                session: authData.session,
                error: null
            };
        } catch (error) {
            console.error('SignUp error:', error);
            return {
                user: null,
                session: null,
                error: error.message
            };
        }
    }

    // Sign in with email and password
    static async signIn({ email, password }) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            return {
                user: data.user,
                session: data.session,
                error: null
            };
        } catch (error) {
            console.error('SignIn error:', error);
            return {
                user: null,
                session: null,
                error: error.message
            };
        }
    }

    // Sign out
    static async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                throw error;
            }

            return { error: null };
        } catch (error) {
            console.error('SignOut error:', error);
            return { error: error.message };
        }
    }

    // Reset password
    static async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password`
            });

            if (error) {
                throw error;
            }

            return { error: null };
        } catch (error) {
            console.error('Reset password error:', error);
            return { error: error.message };
        }
    }

    // Update password
    static async updatePassword(newPassword) {
        try {
            const hashedPassword = await hashPassword(newPassword);
            
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                throw error;
            }

            // Update password hash in our users table
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('users')
                    .update({ password_hash: hashedPassword })
                    .eq('id', user.id);
            }

            return { error: null };
        } catch (error) {
            console.error('Update password error:', error);
            return { error: error.message };
        }
    }

    // Get user profile
    static async getUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                throw error;
            }

            return { user: data, error: null };
        } catch (error) {
            console.error('Get user profile error:', error);
            return { user: null, error: error.message };
        }
    }

    // Update user profile
    static async updateUserProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return { user: data, error: null };
        } catch (error) {
            console.error('Update user profile error:', error);
            return { user: null, error: error.message };
        }
    }

    // Verify user session
    static async verifySession(token) {
        try {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            
            if (error || !user) {
                throw new Error('Invalid session');
            }

            return { user, error: null };
        } catch (error) {
            console.error('Verify session error:', error);
            return { user: null, error: error.message };
        }
    }
}