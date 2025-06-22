// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged,
    signOut as firebaseSignOut
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    getDoc 
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

// Auth state observer
function checkAuthState(requiredRole = null) {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (!user) {
                    // No user is signed in
                    if (window.location.pathname !== '/login.html' && 
                        window.location.pathname !== '/register.html' &&
                        !window.location.pathname.includes('pending-approval.html')) {
                        window.location.href = 'login.html';
                    }
                    resolve(null);
                    return;
                }

                // User is signed in, check if user document exists
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                
                if (!userDoc.exists()) {
                    await firebaseSignOut(auth);
                    window.location.href = 'login.html';
                    resolve(null);
                    return;
                }

                const userData = userDoc.data();

                // Check if user is approved
                if (!userData.isApproved) {
                    if (!window.location.pathname.includes('pending-approval.html')) {
                        sessionStorage.setItem('pendingApprovalEmail', userData.email || user.email);
                        window.location.href = 'pending-approval.html';
                    }
                    resolve(null);
                    return;
                }

                // Check role if required
                if (requiredRole && userData.role !== requiredRole) {
                    if (userData.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                    resolve(null);
                    return;
                }

                // User is authenticated and authorized
                resolve({
                    uid: user.uid,
                    email: user.email,
                    ...userData
                });

            } catch (error) {
                console.error('Auth check error:', error);
                reject(error);
            } finally {
                unsubscribe();
            }
        });
    });
}

// Sign out function
async function signOut() {
    try {
        await firebaseSignOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// Add sign out functionality to all sign out buttons
document.addEventListener('DOMContentLoaded', () => {
    const signOutButtons = document.querySelectorAll('.sign-out-btn, [data-action="signout"]');
    signOutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            signOut();
        });
    });
});

export { checkAuthState, signOut, auth, db };
