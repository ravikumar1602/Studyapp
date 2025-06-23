// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    updateDoc,
    query,
    where,
    orderBy,
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
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const usersSection = document.getElementById('users-section');
    const pendingUsersTableBody = document.getElementById('pendingUsersTableBody');
    const allUsersTableBody = document.getElementById('allUsersTableBody');
    const userApprovalModal = new bootstrap.Modal(document.getElementById('userApprovalModal'));
    const userDetailsContent = document.getElementById('userDetailsContent');
    const approveUserBtn = document.getElementById('approveUserBtn');
    const rejectUserBtn = document.getElementById('rejectUserBtn');
    const pendingUsersCount = document.getElementById('pendingUsersCount');
    const totalUsersCount = document.getElementById('totalUsersCount');
    
    // State
    let users = [];
    let currentViewingUserId = null;
    
    // Navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            
            // Update URL without page reload
            window.history.pushState({}, '', `#${target}`);
            
            // Show the selected section
            showSection(target);
            
            // Load data when users section is shown
            if (target === 'users') {
                loadUsers();
            } else if (target === 'courses') {
                // Load courses if needed
                if (typeof loadCourses === 'function') {
                    loadCourses();
                }
            } else if (target === 'dashboard') {
                // Load dashboard stats if needed
                if (typeof loadDashboardStats === 'function') {
                    loadDashboardStats();
                }
            }
            
            // Update active state
            navLinks.forEach(l => {
                const li = l.parentElement;
                li.classList.remove('active');
                if (l.getAttribute('href') === `#${target}`) {
                    li.classList.add('active');
                }
            });
            
            // Close mobile menu if open
            const sidebar = document.querySelector('.sidebar');
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        showSection(hash);
        
        // Update active nav item
        navLinks.forEach(link => {
            link.parentElement.classList.toggle('active', link.getAttribute('href') === `#${hash}`);
        });
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.createElement('button');
    mobileMenuToggle.className = 'btn btn-primary d-lg-none position-fixed';
    mobileMenuToggle.style.bottom = '20px';
    mobileMenuToggle.style.right = '20px';
    mobileMenuToggle.style.zIndex = '1040';
    mobileMenuToggle.style.width = '50px';
    mobileMenuToggle.style.height = '50px';
    mobileMenuToggle.style.borderRadius = '50%';
    mobileMenuToggle.style.display = 'flex';
    mobileMenuToggle.style.alignItems = 'center';
    mobileMenuToggle.style.justifyContent = 'center';
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    
    // Toggle sidebar on mobile
    mobileMenuToggle.onclick = function(e) {
        e.stopPropagation();
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
        
        // Add overlay when sidebar is open on mobile
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay && sidebar.classList.contains('active')) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '1040';
            overlay.onclick = function() {
                sidebar.classList.remove('active');
                document.body.removeChild(overlay);
            };
            document.body.appendChild(overlay);
        } else if (overlay && !sidebar.classList.contains('active')) {
            document.body.removeChild(overlay);
        }
    };
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (window.innerWidth < 992 && sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && e.target !== mobileMenuToggle) {
            sidebar.classList.remove('active');
            if (overlay) {
                document.body.removeChild(overlay);
            }
        }
    });
    
    document.body.appendChild(mobileMenuToggle);
    
    // Toggle sidebar on window resize
    function handleResize() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (window.innerWidth >= 992) {
            sidebar.classList.remove('active');
            if (overlay) {
                document.body.removeChild(overlay);
            }
        }
    }
    
    window.addEventListener('resize', handleResize);
    
    // Show/Hide sections
    function showSection(sectionId) {
        // Hide all sections first
        document.querySelectorAll('.dashboard-content > div').forEach(section => {
            section.classList.add('d-none');
        });
        
        // Show the selected section
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }
    }
    
    // Load users from Firestore
    async function loadUsers() {
        try {
            // Get all users
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            users = [];
            querySnapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            
            const pendingUsers = users.filter(user => !user.isApproved);
            const approvedUsers = users.filter(user => user.isApproved);
            
            // Update counts
            if (pendingUsersCount) pendingUsersCount.textContent = pendingUsers.length;
            if (totalUsersCount) totalUsersCount.textContent = users.length;
            
            renderPendingUsers(pendingUsers);
            renderAllUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
            showToast('Error', 'Failed to load users', 'error');
        }
    }
    
    // Render pending users table
    function renderPendingUsers(users) {
        if (!pendingUsersTableBody) return;
        
        pendingUsersTableBody.innerHTML = '';
        
        if (users.length === 0) {
            pendingUsersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="text-muted">No pending approvals</div>
                    </td>
                </tr>`;
            return;
        }
        
        users.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-user-details" data-user-id="${user.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>`;
            pendingUsersTableBody.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-user-details').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                showUserDetails(userId);
            });
        });
    }
    
    // Render all users table
    function renderAllUsers(users) {
        if (!allUsersTableBody) return;
        
        allUsersTableBody.innerHTML = '';
        
        if (users.length === 0) {
            allUsersTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="text-muted">No users found</div>
                    </td>
                </tr>`;
            return;
        }
        
        users.forEach((user, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${user.isApproved ? 'bg-success' : 'bg-warning'}">
                        ${user.isApproved ? 'Approved' : 'Pending'}
                    </span>
                </td>
                <td>${user.role || 'student'}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-user-details" data-user-id="${user.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>`;
            allUsersTableBody.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-user-details').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                showUserDetails(userId);
            });
        });
    }
    
    // Show user details in modal
    function showUserDetails(userId) {
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            showToast('Error', 'User not found', 'error');
            return;
        }
        
        currentViewingUserId = userId;
        
        // Update modal title
        document.getElementById('userApprovalModalLabel').textContent = 
            !user.isApproved ? 'Review User Registration' : 'User Details';
            
        // Show/hide action buttons based on user status
        if (!user.isApproved) {
            approveUserBtn.style.display = 'inline-block';
            rejectUserBtn.textContent = 'Reject';
            rejectUserBtn.classList.remove('btn-danger');
            rejectUserBtn.classList.add('btn-outline-danger');
        } else {
            approveUserBtn.style.display = 'none';
            rejectUserBtn.textContent = user.isActive ? 'Deactivate User' : 'Activate User';
            rejectUserBtn.classList.toggle('btn-danger', user.isActive);
            rejectUserBtn.classList.toggle('btn-outline-danger', !user.isActive);
        }
        
        // Format dates
        const formatDate = (timestamp) => {
            if (!timestamp) return 'N/A';
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString();
        };
        
        // Populate user details
        userDetailsContent.innerHTML = `
            <div class="mb-3">
                <h5>${user.displayName || user.firstName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'N/A'}</h5>
                <p class="text-muted mb-1">${user.email || 'N/A'}</p>
                <span class="badge ${user.isApproved ? 'bg-success' : 'bg-warning'}">
                    ${user.isApproved ? 'APPROVED' : 'PENDING'}
                </span>
                ${!user.isActive ? '<span class="badge bg-secondary ms-1">INACTIVE</span>' : ''}
            </div>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Role:</strong> ${user.role || 'Student'}</p>
                    <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                    <p><strong>Gender:</strong> ${user.gender || 'Not specified'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Registered:</strong> ${formatDate(user.createdAt)}</p>
                    <p><strong>Last Active:</strong> ${user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</p>
                    ${user.approvedAt ? `<p><strong>Approved On:</strong> ${formatDate(user.approvedAt)}</p>` : ''}
                </div>
            </div>
            ${user.city ? `<p><strong>City:</strong> ${user.city}</p>` : ''}
            ${user.dob ? `<p><strong>Date of Birth:</strong> ${user.dob}</p>` : ''}
        `;
        
        userApprovalModal.show();
    }
    
    // Approve user
    async function approveUser() {
        if (!currentViewingUserId) return;
        
        try {
            const userRef = doc(db, 'users', currentViewingUserId);
            await updateDoc(userRef, {
                isApproved: true,
                updatedAt: serverTimestamp(),
                approvedAt: serverTimestamp()
            });
            
            showToast('Success', 'User approved successfully', 'success');
            userApprovalModal.hide();
            loadUsers();
        } catch (error) {
            console.error('Error approving user:', error);
            showToast('Error', 'Failed to approve user', 'error');
        }
    }
    
    // Reject/Deactivate user
    async function rejectUser() {
        if (!currentViewingUserId) return;
        
        try {
            const userRef = doc(db, 'users', currentViewingUserId);
            const user = users.find(u => u.id === currentViewingUserId);
            
            if (user) {
                if (!user.isApproved) {
                    // If pending, mark as rejected
                    await updateDoc(userRef, {
                        isRejected: true,
                        updatedAt: serverTimestamp(),
                        rejectedAt: serverTimestamp()
                    });
                    showToast('Success', 'User registration rejected', 'success');
                } else {
                    // If approved, deactivate
                    await updateDoc(userRef, {
                        isActive: false,
                        updatedAt: serverTimestamp(),
                        deactivatedAt: serverTimestamp()
                    });
                    showToast('Success', 'User deactivated successfully', 'success');
                }
                
                userApprovalModal.hide();
                loadUsers();
            }
        } catch (error) {
            console.error('Error rejecting user:', error);
            showToast('Error', 'Failed to process request', 'error');
        }
    }
    
    // Event Listeners
    if (approveUserBtn) {
        approveUserBtn.addEventListener('click', approveUser);
    }
    
    if (rejectUserBtn) {
        rejectUserBtn.addEventListener('click', rejectUser);
    }
    
    // Initialize the dashboard with the active section
    const activeSection = window.location.hash.substring(1) || 'dashboard';
    showSection(activeSection);
    
    // Update active nav item
    navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${activeSection}`) {
            link.parentElement.classList.add('active');
        }
    });
    
    // Load users if on users section
    if (activeSection === 'users') {
        loadUsers();
    }
});
