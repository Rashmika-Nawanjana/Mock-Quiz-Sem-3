// edit auth service to integrate with actual supabase
// Fixed slow height transition tab switching
function switchTab(tab) {
    const currentForm = document.querySelector('.auth-form.active');
    const targetForm = document.getElementById(tab + '-form');
    const currentTab = document.querySelector('.tab-btn.active');
    const targetTab = event.target;
    const formsContainer = document.querySelector('.forms-container');
    
    if (currentForm === targetForm) return;
    
    // Disable tab switching during transition
    document.querySelectorAll('.tab-btn').forEach(btn => btn.disabled = true);
    
    // Get current height for smooth transition
    const currentHeight = formsContainer.offsetHeight;
    
    // Temporarily show target form to measure its height
    targetForm.style.position = 'absolute';
    targetForm.style.opacity = '0';
    targetForm.style.visibility = 'hidden';
    targetForm.style.display = 'block';
    targetForm.classList.add('active');
    
    // Force reflow to get accurate height
    targetForm.offsetHeight;
    const targetHeight = targetForm.offsetHeight;
    
    // Reset target form to initial state
    targetForm.style.position = '';
    targetForm.style.opacity = '';
    targetForm.style.visibility = '';
    targetForm.style.display = 'none';
    targetForm.classList.remove('active');
    
    // Set initial height for smooth transition
    formsContainer.style.height = currentHeight + 'px';
    formsContainer.style.overflow = 'hidden';
    
    // Update tab states
    currentTab?.classList.remove('active');
    targetTab.classList.add('active');
    
    // Hide current form immediately
    if (currentForm) {
        currentForm.classList.remove('active');
    }
    
    // Start height transition
    setTimeout(() => {
        formsContainer.style.height = targetHeight + 'px';
    }, 50);
    
    // Show new form after a brief delay to let height transition start
    setTimeout(() => {
        targetForm.classList.add('active');
    }, 150);
    
    // Clean up and re-enable tabs after transition completes
    setTimeout(() => {
        formsContainer.style.height = '';
        formsContainer.style.overflow = '';
        document.querySelectorAll('.tab-btn').forEach(btn => btn.disabled = false);
    }, 1400); // Match the CSS transition duration (1.2s + buffer)
}

// Enhanced Password visibility toggle
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    // Add click animation
    button.style.transition = 'transform 0.3s ease';
    button.style.transform = 'translateY(-50%) scale(0.85)';
    
    setTimeout(() => {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            button.setAttribute('aria-label', 'Hide password');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            button.setAttribute('aria-label', 'Show password');
        }
        
        // Reset transform
        button.style.transform = 'translateY(-50%) scale(1)';
    }, 150);
}

// Enhanced Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /[0-9]/.test(password),
        symbols: /[^A-Za-z0-9]/.test(password)
    };
    
    Object.values(checks).forEach(check => {
        if (check) strength++;
    });
    
    return { strength, checks };
}

// Enhanced password strength indicator
function updatePasswordStrength() {
    const password = document.getElementById('signup-password');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!password || !strengthBar || !strengthText) return;
    
    password.addEventListener('input', function() {
        const { strength, checks } = checkPasswordStrength(this.value);
        const percentage = (strength / 5) * 100;
        
        // Smooth transition for strength bar
        strengthBar.style.transition = 'all 0.6s ease';
        strengthBar.style.background = `linear-gradient(90deg, 
            ${getStrengthColor(strength)} ${percentage}%, 
            rgba(255, 255, 255, 0.3) ${percentage}%)`;
        
        strengthText.textContent = getStrengthText(strength);
        strengthText.style.color = getStrengthColor(strength);
        strengthText.style.transition = 'color 0.6s ease';
        
        // Add visual feedback
        if (strength >= 4) {
            strengthBar.style.boxShadow = '0 3px 12px rgba(12, 166, 120, 0.4)';
        } else if (strength >= 3) {
            strengthBar.style.boxShadow = '0 3px 12px rgba(245, 159, 0, 0.4)';
        } else {
            strengthBar.style.boxShadow = '0 3px 12px rgba(250, 82, 82, 0.4)';
        }
    });
}

function getStrengthColor(strength) {
    const colors = [
        '#fa5252', // Very weak - red
        '#fd7e14', // Weak - orange  
        '#f59f00', // Fair - yellow
        '#40c057', // Good - light green
        '#0ca678'  // Strong - green
    ];
    return colors[strength - 1] || '#e9ecef';
}

function getStrengthText(strength) {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return strength > 0 ? texts[strength - 1] : 'Password strength';
}

// Enhanced form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
            
            // Add shake animation
            input.addEventListener('animationend', () => {
                input.classList.remove('error');
            }, { once: true });
        } else {
            input.classList.remove('error');
        }
    });
    
    // Enhanced password confirmation check for signup
    if (formId === 'signup-form') {
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
            document.getElementById('confirm-password').classList.add('error');
            showAlert('Passwords do not match', 'error');
            isValid = false;
        }
        
        // Check password strength
        const { strength } = checkPasswordStrength(password);
        if (strength < 3) {
            showAlert('Password is too weak. Please use a stronger password.', 'error');
            isValid = false;
        }
    }
    
    return isValid;
}

// Enhanced alert system
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => {
        alert.style.transition = 'all 0.5s ease';
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(-30px) scale(0.9)';
        setTimeout(() => alert.remove(), 500);
    });
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        ${message}
    `;
    
    document.querySelector('.auth-card').appendChild(alert);
    
    // Auto remove after 6 seconds
    setTimeout(() => {
        alert.style.transition = 'all 0.5s ease';
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(-30px) scale(0.9)';
        setTimeout(() => alert.remove(), 500);
    }, 6000);
}

// Enhanced form submission handling with Supabase
import { AuthService } from './auth-service.js';

function handleFormSubmission() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formId = this.closest('.auth-form').id;
            
            if (validateForm(formId)) {
                // Add loading state
                const submitBtn = this.querySelector('.auth-btn');
                const originalText = submitBtn.innerHTML;
                
                submitBtn.style.transition = 'all 0.4s ease';
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    ${formId === 'login-form' ? 'Signing In...' : 'Creating Account...'}
                `;
                
                try {
                    let result;
                    const formData = new FormData(this);
                    
                    if (formId === 'login-form') {
                        // Handle login
                        result = await AuthService.signIn({
                            email: formData.get('email'),
                            password: formData.get('password')
                        });
                    } else {
                        // Handle signup
                        result = await AuthService.signUp({
                            email: formData.get('email'),
                            password: formData.get('password'),
                            fullName: formData.get('name')
                        });
                    }
                    
                    if (result.success) {
                        showAlert(result.message, 'success');
                        
                        // Redirect after success
                        if (formId === 'login-form') {
                            setTimeout(() => {
                                window.location.href = '/profile.html';
                            }, 1500);
                        } else {
                            // For signup, stay on login page to show verification message
                            setTimeout(() => {
                                switchTab('login');
                            }, 2000);
                        }
                    } else {
                        showAlert(result.error, 'error');
                    }
                } catch (error) {
                    console.error('Form submission error:', error);
                    showAlert('An unexpected error occurred. Please try again.', 'error');
                } finally {
                    // Reset button state
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    });
    
    // Handle social login buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const provider = this.classList.contains('google') ? 'google' : 'github';
            
            // Add loading state
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';
            
            try {
                const result = await AuthService.signInWithProvider(provider);
                
                if (!result.success) {
                    showAlert(result.error, 'error');
                    this.style.opacity = '1';
                    this.style.pointerEvents = 'auto';
                }
                // Success will redirect automatically
            } catch (error) {
                console.error('Social login error:', error);
                showAlert('Social login failed. Please try again.', 'error');
                this.style.opacity = '1';
                this.style.pointerEvents = 'auto';
            }
        });
    });
}

// Enhanced smooth animations
function addSmoothAnimations() {
    // Entrance animation for auth card
    const authCard = document.querySelector('.auth-card');
    authCard.style.opacity = '0';
    authCard.style.transform = 'translateY(50px) scale(0.9)';
    
    setTimeout(() => {
        authCard.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        authCard.style.opacity = '1';
        authCard.style.transform = 'translateY(0) scale(1)';
    }, 150);
    
    // Floating shapes animation
    const shapes = document.querySelectorAll('.shape');
    shapes.forEach((shape, index) => {
        shape.style.animationDelay = `${index * 3}s`;
        shape.style.opacity = '0';
        
        setTimeout(() => {
            shape.style.transition = 'opacity 1.5s ease';
            shape.style.opacity = '0.7';
        }, 800 + index * 300);
    });
}

// Auto-hide alerts
function autoHideAlerts() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            alert.style.opacity = '0';
            alert.style.transform = 'translateX(-30px) scale(0.9)';
            setTimeout(() => alert.remove(), 600);
        }, 6000);
    });
}

// Enhanced input interactions
function enhanceInputInteractions() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        // Focus animations
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.03)';
            this.parentElement.style.transition = 'transform 0.3s ease';
            
            // Animate icon
            const icon = this.parentElement.querySelector('i:not(.toggle-password i)');
            if (icon && !icon.closest('.toggle-password')) {
                icon.style.transform = 'scale(1.15)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
            
            // Reset icon
            const icon = this.parentElement.querySelector('i:not(.toggle-password i)');
            if (icon && !icon.closest('.toggle-password')) {
                icon.style.transform = 'scale(1)';
            }
        });
        
        // Typing animation
        input.addEventListener('input', function() {
            this.style.transition = 'background 0.4s ease';
            if (this.value) {
                this.style.background = 'rgba(255, 255, 255, 0.9)';
            } else {
                this.style.background = 'var(--input-bg)';
            }
        });
    });
}

// Initialize all functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create forms container for height transitions - FIXED
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm && signupForm) {
        // Check if forms container already exists
        let formsContainer = document.querySelector('.forms-container');
        
        if (!formsContainer) {
            formsContainer = document.createElement('div');
            formsContainer.className = 'forms-container';
            
            // Insert container before the first form
            loginForm.parentNode.insertBefore(formsContainer, loginForm);
            
            // Move both forms into the container
            formsContainer.appendChild(loginForm);
            formsContainer.appendChild(signupForm);
        }
    }
    
    updatePasswordStrength();
    handleFormSubmission();
    addSmoothAnimations();
    autoHideAlerts();
    enhanceInputInteractions();
    
    // Initialize password toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.setAttribute('aria-label', 'Show password');
        button.setAttribute('type', 'button');
        
        // Ensure proper icon positioning
        const icon = button.querySelector('i');
        if (icon) {
            icon.style.position = 'static';
            icon.style.left = 'auto';
            icon.style.transform = 'none';
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            const focusedElement = document.activeElement;
            if (focusedElement.classList.contains('tab-btn')) {
                focusedElement.style.boxShadow = '0 0 0 2px var(--primary)';
            }
        }
    });
});

// Social login handlers
function handleGoogleLogin() {
    const btn = document.querySelector('.social-btn.google');
    btn.style.transition = 'transform 0.3s ease';
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
        window.location.href = '/auth/google';
    }, 200);
}

function handleGitHubLogin() {
    const btn = document.querySelector('.social-btn.github');
    btn.style.transition = 'transform 0.3s ease';
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
        window.location.href = '/auth/github';
    }, 200);
}

// Social button click handlers
document.addEventListener('DOMContentLoaded', function() {
    const googleBtn = document.querySelector('.social-btn.google');
    const githubBtn = document.querySelector('.social-btn.github');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleGoogleLogin();
        });
    }
    
    if (githubBtn) {
        githubBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleGitHubLogin();
        });
    }
});