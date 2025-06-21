// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs 
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC7tdxFyTOWOqaAxJptAq5vZm92oz1v05M",
    authDomain: "study-portal-bef7a.firebaseapp.com",
    databaseURL: "https://study-portal-bef7a-default-rtdb.firebaseio.com",
    projectId: "study-portal-bef7a",
    storageBucket: "study-portal-bef7a.appspot.com",
    messagingSenderId: "335677529543",
    appId: "1:335677529543:web:0e95959d30b3b3daf4cde2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signInBtn = document.querySelector('.btn-login');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    
    // Focus on email field when page loads
    emailInput.focus();
    
    // Function to handle login
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email) {
            showMessage('Please enter your email', 'error');
            emailInput.focus();
            return;
        }
        
        if (!password) {
            showMessage('Please enter your password', 'error');
            passwordInput.focus();
            return;
        }
        
        // Disable the button to prevent multiple clicks
        signInBtn.disabled = true;
        signInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        
        try {
            // Sign in with email and password
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Check if user is approved in Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                if (!userData.isApproved) {
                    // Store user email in session storage to show on pending approval page
                    sessionStorage.setItem('pendingApprovalEmail', userData.email || user.email);
                    await auth.signOut();
                    // Redirect to pending approval page
                    window.location.href = 'pending-approval.html';
                    return;
                }
                
                // Store user data in session storage
                sessionStorage.setItem('currentUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: userData.displayName || `${userData.firstName} ${userData.lastName}`.trim(),
                    role: userData.role || 'student',
                    isApproved: userData.isApproved || false
                }));
                
                // Redirect based on user role
                if (userData.role === 'admin') {
                    window.location.href = 'admin/dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                await auth.signOut();
                showMessage('User data not found. Please contact support.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed. Please check your credentials and try again.';
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled. Please contact support.';
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            // Re-enable the button
            signInBtn.disabled = false;
            signInBtn.innerHTML = 'Sign In';
        }
        
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
    
    // Function to check if user exists in Firestore
    async function checkUserExists(email) {
        try {
            // First check if email is valid
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return false;
            }
            
            // Check if user exists in Firestore by querying users collection
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);
            
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking user existence:', error);
            return false;
        }
    }
    
    // Add event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        
        // Real-time email validation
        emailInput.addEventListener('blur', async function() {
            const email = this.value.trim();
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showMessage('Please enter a valid email address', 'error');
                    return;
                }
                
                try {
                    const userExists = await checkUserExists(email);
                    if (!userExists) {
                        showMessage('No account found with this email. Please register first.', 'info');
                    }
                } catch (error) {
                    console.error('Error during email validation:', error);
                }
            }
        });
        
        // Clear messages when user starts typing
        emailInput.addEventListener('input', function() {
            const messageDiv = document.getElementById('loginMessage');
            if (messageDiv && messageDiv.style.display !== 'none') {
                messageDiv.style.display = 'none';
            }
        });
        
        // Forgot password functionality
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', async function(e) {
                e.preventDefault();
                const email = emailInput.value.trim() || prompt('Please enter your email address to reset your password:');
                if (email) {
                    try {
                        await sendPasswordResetEmail(auth, email);
                        showMessage('Password reset email sent! Please check your inbox.', 'success');
                    } catch (error) {
                        console.error('Error sending password reset email:', error);
                        let errorMessage = 'Failed to send password reset email. ';
                        if (error.code === 'auth/user-not-found') {
                            errorMessage += 'No user found with this email address.';
                        } else {
                            errorMessage += 'Please try again later.';
                        }
                        showMessage(errorMessage, 'error');
                    }
                }
            });
        }
    }
});
