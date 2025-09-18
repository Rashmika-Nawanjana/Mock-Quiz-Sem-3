// Main Application Controller
import { supabase, authManager } from './supabase-client.js';
import { AuthService } from './auth-service.js';

class QuizApp {
    constructor() {
        this.currentUser = null;
        this.modules = [];
        this.init();
    }

    async init() {
        // Check authentication state
        authManager.onAuthStateChange((event, session) => {
            this.currentUser = session?.user || null;
            this.updateNavigation();
            this.updateWelcomeMessage();
        });

        // Load modules
        await this.loadModules();
        
        // Setup navigation
        this.setupNavigation();
        
        // Check for URL parameters (for OAuth callbacks)
        this.handleAuthCallback();
    }

    // Handle OAuth callback
    async handleAuthCallback() {
        const { data, error } = await supabase.auth.getSession();
        if (data?.session) {
            // User logged in via OAuth, redirect to profile
            window.location.href = '/profile.html';
        }
    }

    // Update navigation based on auth state
    updateNavigation() {
        const authNav = document.getElementById('auth-nav');
        if (!authNav) return;

        if (this.currentUser) {
            authNav.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user me-1"></i>
                        ${this.currentUser.email}
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="/profile.html">
                            <i class="fas fa-user me-2"></i>Profile
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="app.logout()">
                            <i class="fas fa-sign-out-alt me-2"></i>Logout
                        </a></li>
                    </ul>
                </li>
            `;
        } else {
            authNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="/login.html">
                        <i class="fas fa-sign-in-alt me-1"></i>Login
                    </a>
                </li>
            `;
        }
    }

    // Update welcome message
    updateWelcomeMessage() {
        const userWelcome = document.getElementById('user-welcome');
        const userName = document.getElementById('user-name');
        
        if (this.currentUser && userWelcome && userName) {
            userName.textContent = this.currentUser.user_metadata?.full_name || this.currentUser.email;
            userWelcome.style.display = 'block';
        } else if (userWelcome) {
            userWelcome.style.display = 'none';
        }
    }

    // Load modules from Supabase
    async loadModules() {
        try {
            const { data, error } = await supabase
                .from('modules')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');

            if (error) {
                console.error('Error loading modules:', error);
                this.showFallbackModules();
                return;
            }

            this.modules = data;
            this.renderModules();
        } catch (error) {
            console.error('Failed to load modules:', error);
            this.showFallbackModules();
        }
    }

    // Render modules grid
    renderModules() {
        const modulesGrid = document.getElementById('modules-grid');
        if (!modulesGrid) return;

        if (this.modules.length === 0) {
            modulesGrid.innerHTML = `
                <div class="no-modules">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No modules available at the moment.</p>
                </div>
            `;
            return;
        }

        modulesGrid.innerHTML = this.modules.map(module => `
            <div class="quiz-card" onclick="this.navigateToModule('${module.name}')">
                <div class="quiz-title">
                    <i class="${module.icon || 'fas fa-book'} me-2" style="color: ${module.color || '#007bff'}"></i>
                    ${module.display_name}
                </div>
                <div class="quiz-description">${module.description || 'Test your knowledge in this subject'}</div>
                <a href="/modules/${module.name}.html" class="btn-quiz">
                    <i class="fas fa-play"></i>View Quizzes
                </a>
            </div>
        `).join('');
    }

    // Show fallback modules if database fails
    showFallbackModules() {
        const modulesGrid = document.getElementById('modules-grid');
        if (!modulesGrid) return;

        const fallbackModules = [
            { name: 'intro-ai', display_name: 'Introduction to AI', icon: 'fas fa-brain', color: '#FF6B6B' },
            { name: 'database', display_name: 'Database Systems', icon: 'fas fa-database', color: '#4ECDC4' },
            { name: 'os', display_name: 'Operating Systems', icon: 'fas fa-desktop', color: '#FFEAA7' },
            { name: 'networking', display_name: 'Data Communication', icon: 'fas fa-network-wired', color: '#98D8C8' }
        ];

        modulesGrid.innerHTML = fallbackModules.map(module => `
            <div class="quiz-card">
                <div class="quiz-title">
                    <i class="${module.icon} me-2" style="color: ${module.color}"></i>
                    ${module.display_name}
                </div>
                <div class="quiz-description">Test your knowledge in this subject</div>
                <a href="/modules/${module.name}.html" class="btn-quiz">
                    <i class="fas fa-play"></i>View Quizzes
                </a>
            </div>
        `).join('');
    }

    // Navigate to module page
    navigateToModule(moduleName) {
        if (this.currentUser) {
            window.location.href = `/modules/${moduleName}.html`;
        } else {
            // Redirect to login if not authenticated
            sessionStorage.setItem('redirectAfterLogin', `/modules/${moduleName}.html`);
            window.location.href = '/login.html';
        }
    }

    // Setup navigation handlers
    setupNavigation() {
        // Handle redirect after login
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl && this.currentUser) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        }
    }

    // Logout function
    async logout() {
        try {
            const result = await AuthService.signOut();
            if (result.success) {
                window.location.href = '/index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Check if user is authenticated
    requireAuth() {
        if (!this.currentUser) {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }
}

// Initialize app
const app = new QuizApp();

// Make app globally available
window.app = app;

// Export for other modules
export { app };