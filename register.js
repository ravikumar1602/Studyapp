// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
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
const googleProvider = new GoogleAuthProvider();

// Function to show messages
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('registerMessage');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `alert-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.getElementById('registerBtn');
    const googleSignUpBtn = document.getElementById('googleSignUp');
    
    // Function to handle registration
    async function handleRegistration(userData, isGoogleSignUp = false) {
        try {
            // Check if user already exists in Firestore
            const userDoc = await getDoc(doc(db, 'users', userData.email));
            if (userDoc.exists()) {
                showMessage('An account with this email already exists.', 'error');
                return;
            }
            
            // Create user in Firebase Auth
            let userCredential;
            if (!isGoogleSignUp) {
                userCredential = await createUserWithEmailAndPassword(
                    auth, 
                    userData.email, 
                    userData.password
                );
            } else {
                // For Google sign-up, the user is already created
                userCredential = userData;
            }
            
            // Prepare user data for Firestore
            const userProfile = {
                uid: userCredential.user.uid,
                email: userData.email,
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                phone: userData.phone || '',
                city: userData.city || '',
                dob: userData.dob || '',
                gender: userData.gender || 'prefer-not-to-say',
                role: 'student',
                isApproved: false, // Admin approval required
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastLogin: null,
                emailVerified: userCredential.user.emailVerified,
                photoURL: userData.photoURL || ''
            };
            
            // Save user data to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
            
            // Show success message and redirect
            showMessage('Registration successful! Your account is pending admin approval.', 'success');
            
            // Redirect to login after a short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.innerHTML = 'Create Account';
            }
        }
    }
    
    // Handle form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get the submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            
            // Disable the button to prevent multiple clicks
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            
            try {
                // Get form values
                const userData = {
                    firstName: document.getElementById('firstName').value.trim(),
                    lastName: document.getElementById('lastName').value.trim(),
                    email: document.getElementById('email').value.trim().toLowerCase(),
                    password: document.getElementById('password').value,
                    dob: document.getElementById('dob').value,
                    gender: document.getElementById('gender').value,
                    phone: document.getElementById('phone').value.trim(),
                    city: document.getElementById('city').value.trim()
                };
                
                // Validate passwords match
                const confirmPassword = document.getElementById('confirmPassword').value;
                if (userData.password !== confirmPassword) {
                    showMessage('Passwords do not match!', 'error');
                    throw new Error('Passwords do not match');
                }
                
                // Validate password strength
                if (userData.password.length < 6) {
                    showMessage('Password must be at least 6 characters long', 'error');
                    throw new Error('Password too short');
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(userData.email)) {
                    showMessage('Please enter a valid email address', 'error');
                    throw new Error('Invalid email format');
                }
                
                // Process registration
                await handleRegistration(userData);
                
            } catch (error) {
                console.error('Form submission error:', error);
                // Error messages are already shown by handleRegistration or above validations
            } finally {
                // Re-enable the button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
    
    // Handle Google Sign Up
    if (googleSignUpBtn) {
        googleSignUpBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                
                // Check if user already exists in Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                
                // Send email verification
                // Note: You'll need to enable email verification in Firebase Console
                // await sendEmailVerification(user);
                
                // Show success message with approval notice
                alert('Registration successful! Please wait for admin approval. You will receive an email once your account is approved.');
                window.location.href = 'pending-approval.html';
                
            } catch (error) {
                console.error('Error during registration:', error);
                let errorMessage = 'An error occurred during registration. Please try again.';
                
                // Handle specific Firebase Auth errors
                switch(error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'An account with this email already exists.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password should be at least 6 characters.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email address.';
                        break;
                }
                
                alert(errorMessage);
                registerBtn.disabled = false;
                registerBtn.textContent = 'Create Account';
            }
        });
    }
    
    // Phone number validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Allow only numbers and limit to 10 digits
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }
    
    // Set max date for date of birth (must be at least 10 years old)
    const dobInput = document.getElementById('dob');
    if (dobInput) {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setFullYear(today.getFullYear() - 10);
        dobInput.max = maxDate.toISOString().split('T')[0];
    }
});
