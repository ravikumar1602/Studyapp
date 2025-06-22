// Import the auth guard
import { checkAuthState } from './auth-guard.js';

// Check if user is authenticated and is an admin
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await checkAuthState('admin');
        
        if (user) {
            // Update UI to show logged-in user
            const userDisplayElements = document.querySelectorAll('.user-display-name, .user-email');
            userDisplayElements.forEach(element => {
                if (element.classList.contains('user-display-name')) {
                    element.textContent = user.displayName || user.firstName || user.email.split('@')[0];
                } else if (element.classList.contains('user-email')) {
                    element.textContent = user.email;
                }
            });
            
            // Show admin-specific elements
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(element => {
                element.style.display = 'block';
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
    }
});
