// Frontend Authentication Service using Supabase
import { supabase, authManager } from './supabase-client.js';

class AuthService {
    // Sign up with email and password
    static async signUp({ email, password, fullName }) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        username: email.split('@')[0]
                    }
                }
            });

            if (error) {
                throw error;
            }

            // Insert additional user data into custom users table
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('users')
                    .insert({
                        id: data.user.id,
                        email: data.user.email,
                        username: data.user.user_metadata.username || email.split('@')[0],
                        full_name: data.user.user_metadata.full_name || fullName,
                        role: 'student',
                        avatar_url: null
                    });

                if (profileError) {
                    console.warn('Profile creation warning:', profileError);
                }
            }

            return {
                success: true,
                user: data.user,
                session: data.session,
                message: 'Account created successfully! Please check your email to verify your account.'
            };
        } catch (error) {
            console.error('SignUp error:', error);
            return {
                success: false,
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
                success: true,
                user: data.user,
                session: data.session,
                message: 'Login successful!'
            };
        } catch (error) {
            console.error('SignIn error:', error);
            return {
                success: false,
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

            return {
                success: true,
                message: 'Logged out successfully!'
            };
        } catch (error) {
            console.error('SignOut error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Reset password
    static async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) {
                throw error;
            }

            return {
                success: true,
                message: 'Password reset email sent! Check your inbox.'
            };
        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update password
    static async updatePassword(newPassword) {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                throw error;
            }

            return {
                success: true,
                message: 'Password updated successfully!'
            };
        } catch (error) {
            console.error('Update password error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get user profile from custom users table
    static async getUserProfile(userId = null) {
        try {
            const targetUserId = userId || authManager.getCurrentUser()?.id;
            
            if (!targetUserId) {
                throw new Error('No user ID provided');
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', targetUserId)
                .single();

            if (error) {
                throw error;
            }

            return {
                success: true,
                user: data
            };
        } catch (error) {
            console.error('Get user profile error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update user profile
    static async updateUserProfile(updates) {
        try {
            const userId = authManager.getCurrentUser()?.id;
            
            if (!userId) {
                throw new Error('User not authenticated');
            }

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

            return {
                success: true,
                user: data,
                message: 'Profile updated successfully!'
            };
        } catch (error) {
            console.error('Update user profile error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Social authentication
    static async signInWithProvider(provider) {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: provider, // 'google', 'github', etc.
                options: {
                    redirectTo: `${window.location.origin}/profile.html`
                }
            });

            if (error) {
                throw error;
            }

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('Social auth error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export { AuthService };