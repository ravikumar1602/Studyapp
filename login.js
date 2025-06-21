document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signInBtn = document.querySelector('.btn-login');
    const socialLoginSection = document.querySelector('.social-login');
    const divider = document.querySelector('.divider');
    const authFooter = document.querySelector('.auth-footer');
    
    // Update email input to accept email or phone
    emailInput.placeholder = 'Enter your email or phone number';
    emailInput.type = 'text';
    emailInput.pattern = ".*"; // Remove email validation
    
    // Focus on email field when page loads
    emailInput.focus();
    
    // Function to check if user exists
    function checkUserExists(identifier) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        return users.some(u => u.email === identifier || u.phone === identifier);
    }
    
    // Function to handle login
    function handleLogin(e) {
        e.preventDefault();
        
        const identifier = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!identifier) {
            showMessage('Please enter your email or phone number', 'error');
            emailInput.focus();
            return;
        }
        
        // Check if user exists
        if (!checkUserExists(identifier)) {
            const register = confirm('No account found with this email/phone. Would you like to register instead?');
            if (register) {
                window.location.href = 'register.html';
            }
            return;
        }
        
        // If we get here, user exists - now check password
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => 
            (u.email === identifier || u.phone === identifier)
        );
        
        if (!user) {
            showMessage('An error occurred. Please try again.', 'error');
            return;
        }
        
        // Check if password is correct
        if (user.password !== password) {
            showMessage('Incorrect password. Please try again.', 'error');
            passwordInput.value = '';
            passwordInput.focus();
            return;
        }
        
        // Check if user is approved
        if (!user.isApproved) {
            showMessage('Your account is pending admin approval. Please wait for approval before logging in.', 'info');
            return;
        }
        
        // Store user session
        sessionStorage.setItem('currentUser', JSON.stringify({
            id: user.id || user.email,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role || 'student',
            isApproved: true
        }));
        
        // Show success message
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect based on role
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1500);
    }
    
    // Function to show messages
    function showMessage(message, type = 'info') {
        // Remove any existing messages
        const existingMessage = document.querySelector('.alert-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert-message ${type}`;
        messageDiv.textContent = message;
        
        // Insert message after the auth header
        const authHeader = document.querySelector('.auth-header');
        if (authHeader) {
            authHeader.parentNode.insertBefore(messageDiv, authHeader.nextSibling);
        }
        
        // Auto-remove message after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
    
    // Add event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        
        // Add real-time validation
        emailInput.addEventListener('blur', function() {
            const identifier = this.value.trim();
            if (identifier) {
                const userExists = checkUserExists(identifier);
                if (!userExists) {
                    showMessage('No account found with this email/phone. Please register first.', 'info');
                }
            }
        });
    }
});
