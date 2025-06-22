// Import Firebase functions
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Get the initialized Firebase instances from window
document.addEventListener('DOMContentLoaded', function() {
    const db = window.db; // Get the Firestore instance from the global scope
    // DOM Elements
    const usersSection = document.getElementById('users-section');
    const pendingUsersTableBody = document.getElementById('pendingUsersTableBody');
    const allUsersTableBody = document.getElementById('allUsersTableBody');
    const userApprovalModal = new bootstrap.Modal(document.getElementById('userApprovalModal'));
    const userDetailsContent = document.getElementById('userDetailsContent');
    const approveUserBtn = document.getElementById('approveUserBtn');
    const rejectUserBtn = document.getElementById('rejectUserBtn');
    
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
            
            // If users section is shown, load users
            if (target === 'users') {
                console.log('Loading users section...');
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
        console.log('Showing section:', sectionId);
        // Hide all sections
        document.querySelectorAll('.dashboard-content > div').forEach(section => {
            section.classList.add('d-none');
        });
        
        // Show the selected section
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
            console.log('Section shown:', targetSection.id);
        } else {
            console.warn('Section not found:', `${sectionId}-section`);
        }
        
        // Load users if users section is shown
        if (sectionId === 'users') {
            loadUsers();
        }
    }
    
    // Load users from Firestore
    async function loadUsers() {
        try {
            console.log('Loading users...');
            // Show loading state
            if (pendingUsersTableBody) pendingUsersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading users...</td></tr>';
            if (allUsersTableBody) allUsersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading users...</td></tr>';
            
            // Get all users from Firestore
            const usersSnapshot = await getDocs(collection(db, 'users'));
            console.log('Users snapshot:', usersSnapshot);
            
            const users = [];
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                console.log('User data:', doc.id, userData);
                users.push({
                    id: doc.id,
                    ...userData,
                    // Format dates for display
                    createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : 'N/A',
                    approvedAt: userData.approvedAt?.toDate ? userData.approvedAt.toDate().toLocaleDateString() : null,
                    lastLogin: userData.lastLogin?.toDate ? userData.lastLogin.toDate().toLocaleString() : 'Never'
                });
            });
            
            console.log('All users:', users);
            
            // Filter pending users (not approved yet and not rejected)
            const pendingUsers = users.filter(user => !user.isApproved && (!user.status || user.status === 'pending'));
            console.log('Pending users:', pendingUsers);
            
            // Render the tables
            if (pendingUsersTableBody) renderPendingUsers(pendingUsers);
            if (allUsersTableBody) renderAllUsers(users);
            
        } catch (error) {
            console.error('Error loading users:', error);
            showMessage('Failed to load users. Please try again.', 'error');
            
            if (pendingUsersTableBody) pendingUsersTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading users: ' + error.message + '</td></tr>';
            if (allUsersTableBody) allUsersTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading users: ' + error.message + '</td></tr>';
        }
    }
    
    // Render pending users table
    function renderPendingUsers(users) {
        if (!pendingUsersTableBody) return;
        
        if (users.length === 0) {
            pendingUsersTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No pending user approvals</td></tr>';
            return;
        }
        
        pendingUsersTableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.setAttribute('data-user-id', user.id);
            
            // Format display name
            const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No Name';
            
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        ${user.photoURL ? 
                            `<img src="${user.photoURL}" class="rounded-circle me-2" width="32" height="32" alt="${displayName}">` : 
                            `<div class="avatar-placeholder rounded-circle me-2" style="width: 32px; height: 32px; background-color: #e9ecef; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-user text-muted"></i>
                            </div>`
                        }
                        <div>
                            <div class="fw-medium">${displayName}</div>
                            <div class="text-muted small">${user.role || 'student'}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${user.city || 'N/A'}</td>
                <td>${user.createdAt || 'N/A'}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary view-user-btn" data-user-id="${user.id}" title="Review User">
                        <i class="fas fa-eye me-1"></i> Review
                    </button>
                </td>
            `;
            
            pendingUsersTableBody.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-user-id');
                const user = users.find(u => u.id === userId);
                if (user) {
                    showUserDetails(user);
                }
            });
        });
    }
    
    // Render all users table
    function renderAllUsers(users) {
        if (!allUsersTableBody) return;
        
        allUsersTableBody.innerHTML = '';
        
        if (users.length === 0) {
            allUsersTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No users found</td></tr>';
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
                    <button class="btn btn-sm btn-primary view-user-details" data-user-id="${user.id || user.email}">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>`;
            allUsersTableBody.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-user-details').forEach(btn => {
            btn.addEventListener('click', async function() {
                const userId = this.getAttribute('data-user-id');
                console.log('View button clicked for user ID:', userId);
                try {
                    // Get the full user data from Firestore
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    if (userDoc.exists()) {
                        showUserDetails({ id: userDoc.id, ...userDoc.data() });
                    } else {
                        console.error('User not found:', userId);
                        showMessage('User not found', 'error');
                    }
                } catch (error) {
                    console.error('Error loading user:', error);
                    showMessage('Error loading user details', 'error');
                }
            });
        });
    }
    
    // Show user details in modal
    function showUserDetails(user) {
        console.log('Showing user details:', user);
        currentViewingUserId = user.id || user;
        console.log('Current viewing user ID set to:', currentViewingUserId);
        
        // Format display name
        const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No Name';
        
        // Format dates
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return dateString;
            }
        };
        
        // Format user details in a more organized way
        const userDetails = [
            { 
                group: 'Basic Information',
                fields: [
                    { label: 'Email', value: user.email || 'N/A', icon: 'envelope' },
                    { label: 'Role', value: (user.role || 'student').charAt(0).toUpperCase() + (user.role || 'student').slice(1), icon: 'user-tag' },
                    { label: 'Phone', value: user.phone || 'N/A', icon: 'phone' },
                    { label: 'Gender', value: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'N/A', icon: 'venus-mars' },
                    { label: 'Date of Birth', value: user.dob ? formatDate(user.dob) : 'N/A', icon: 'calendar-day' }
                ]
            },
            {
                group: 'Location',
                fields: [
                    { label: 'Address', value: user.address || 'N/A', icon: 'map-marker-alt' },
                    { label: 'City', value: user.city || 'N/A', icon: 'city' },
                    { label: 'State', value: user.state || 'N/A', icon: 'map' },
                    { label: 'Country', value: user.country || 'N/A', icon: 'globe' },
                    { label: 'Pincode', value: user.pincode || 'N/A', icon: 'map-pin' }
                ]
            },
            {
                group: 'Account Status',
                fields: [
                    { label: 'Status', value: user.isApproved ? 'Approved' : user.status === 'rejected' ? 'Rejected' : 'Pending', icon: 'info-circle' },
                    { label: 'Email Verified', value: user.emailVerified ? 'Yes' : 'No', icon: 'envelope-open-text' },
                    { label: 'Created At', value: user.createdAt ? formatDate(user.createdAt) : 'N/A', icon: 'calendar-plus' },
                    { label: 'Approved At', value: user.approvedAt ? formatDate(user.approvedAt) : 'Not approved yet', icon: 'check-circle' },
                    { label: 'Last Login', value: user.lastLogin ? formatDate(user.lastLogin) : 'Never', icon: 'sign-in-alt' }
                ]
            }
        ];
        
        // Additional details if available
        if (user.education || user.occupation) {
            userDetails.push({
                group: 'Additional Information',
                fields: [
                    { label: 'Education', value: user.education || 'N/A', icon: 'graduation-cap' },
                    { label: 'Occupation', value: user.occupation || 'N/A', icon: 'briefcase' },
                    { label: 'Bio', value: user.bio || 'N/A', icon: 'file-alt', fullWidth: true }
                ]
            });
        }
        
        // Generate user details HTML
        let detailsHtml = `
            <div class="row">
                <div class="col-md-3 text-center mb-3">
                    ${user.photoURL ? 
                        `<img src="${user.photoURL}" class="rounded-circle img-thumbnail mb-2" width="120" height="120" alt="${displayName}">` : 
                        `<div class="avatar-placeholder rounded-circle mx-auto mb-2" style="width: 120px; height: 120px; background-color: #e9ecef; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                            <i class="fas fa-user text-muted"></i>
                        </div>`
                    }
                    <h5 class="mb-1">${displayName}</h5>
                    <div class="badge bg-${user.isApproved ? 'success' : user.status === 'rejected' ? 'danger' : 'warning'} mb-2">
                        ${user.isApproved ? 'Approved' : user.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">User ID: ${user.id || 'N/A'}</small>
                    </div>
                </div>
                <div class="col-md-9">
                    <div class="user-details-accordion" id="userDetailsAccordion">
        `;
        
        // Add user details in accordion sections
        userDetails.forEach((section, index) => {
            const sectionId = `section-${index}`;
            const isFirst = index === 0;
            
            detailsHtml += `
                <div class="card mb-2">
                    <div class="card-header p-0" id="heading-${sectionId}">
                        <h6 class="mb-0">
                            <button class="btn btn-link btn-block text-left p-3 d-flex justify-content-between align-items-center" 
                                    type="button" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target="#collapse-${sectionId}" 
                                    aria-expanded="${isFirst ? 'true' : 'false'}" 
                                    aria-controls="collapse-${sectionId}">
                                <span><i class="fas fa-${section.icon || 'info-circle'} me-2"></i>${section.group}</span>
                                <i class="fas fa-chevron-${isFirst ? 'up' : 'down'} transition"></i>
                            </button>
                        </h6>
                    </div>
                    <div id="collapse-${sectionId}" 
                         class="collapse ${isFirst ? 'show' : ''}" 
                         aria-labelledby="heading-${sectionId}" 
                         data-bs-parent="#userDetailsAccordion">
                        <div class="card-body">
                            <div class="row">
            `;
            
            section.fields.forEach(field => {
                const fieldClass = field.fullWidth ? 'col-12' : 'col-md-6';
                detailsHtml += `
                    <div class="${fieldClass} mb-3">
                        <div class="d-flex align-items-start">
                            <div class="me-2 text-muted" style="width: 24px;">
                                <i class="fas fa-${field.icon || 'circle'} fa-fw"></i>
                            </div>
                            <div>
                                <div class="text-muted small">${field.label}</div>
                                <div class="fw-medium">${field.value || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            detailsHtml += `
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Close the accordion and main container
        detailsHtml += `
                    </div>
                </div>
            </div>
            <style>
                .user-details-accordion .btn-link {
                    color: #495057;
                    text-decoration: none;
                    width: 100%;
                    text-align: left;
                }
                .user-details-accordion .btn-link:hover {
                    color: #0d6efd;
                }
                .user-details-accordion .card-header {
                    background-color: #f8f9fa;
                    border-bottom: 1px solid rgba(0,0,0,.125);
                }
                .user-details-accordion .transition {
                    transition: transform 0.3s ease;
                }
                .user-details-accordion .collapsed .transition {
                    transform: rotate(0deg);
                }
                .user-details-accordion .transition {
                    transform: rotate(180deg);
                }
            </style>
        `;
        
        // Update modal content
        userDetailsContent.innerHTML = detailsHtml;
        
        // Update modal title
        const modalTitle = document.querySelector('#userApprovalModal .modal-title');
        if (modalTitle) {
            modalTitle.textContent = `User: ${displayName}`;
        }
        
        // Update button states based on user status
        if (approveUserBtn) {
            approveUserBtn.disabled = user.isApproved;
            approveUserBtn.innerHTML = user.isApproved ? 
                '<i class="fas fa-check-circle me-1"></i> Already Approved' : 
                '<i class="fas fa-check-circle me-1"></i> Approve User';
            approveUserBtn.className = user.isApproved ? 'btn btn-success' : 'btn btn-outline-success';
        }
        
        if (rejectUserBtn) {
            rejectUserBtn.disabled = user.status === 'rejected';
            rejectUserBtn.innerHTML = user.status === 'rejected' ? 
                '<i class="fas fa-times-circle me-1"></i> User Rejected' : 
                '<i class="fas fa-times-circle me-1"></i> Reject User';
            rejectUserBtn.className = user.status === 'rejected' ? 'btn btn-secondary' : 'btn btn-outline-danger';
        }
        
        // Show the modal
        userApprovalModal.show();
    }
    
    // Approve user
    async function approveUser() {
        console.log('Approve button clicked');
        console.log('Current viewing user ID:', currentViewingUserId);
        if (!currentViewingUserId) {
            console.error('No user ID set for approval');
            return;
        }
        
        try {
            // Update user's approval status in Firestore
            const userRef = doc(db, 'users', currentViewingUserId);
            await updateDoc(userRef, {
                isApproved: true,
                status: 'approved',
                approvedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            // Update the UI
            const userRow = document.querySelector(`tr[data-user-id="${currentViewingUserId}"]`);
            if (userRow) {
                userRow.querySelector('.status-badge').textContent = 'Approved';
                userRow.querySelector('.status-badge').className = 'badge bg-success';
                
                // Remove from pending users table if it exists
                if (pendingUsersTableBody && userRow.closest('tbody') === pendingUsersTableBody) {
                    userRow.remove();
                }
            }
            
            // Close the modal
            userApprovalModal.hide();
            
            // Show success message
            showMessage('User approved successfully!', 'success');
            
            // Reload users to update the lists
            loadUsers();
        } catch (error) {
            console.error('Error approving user:', error);
            showMessage('Failed to approve user. Please try again.', 'error');
        }
    }
    
    // Reject/Deactivate user
    async function rejectUser() {
        console.log('Reject button clicked');
        console.log('Current viewing user ID:', currentViewingUserId);
        if (!currentViewingUserId) {
            console.error('No user ID set for rejection');
            return;
        }
        
        // Confirm before rejecting
        if (!confirm('Are you sure you want to reject this user? They will not be able to log in until approved by an admin.')) {
            return;
        }
        
        try {
            // Update user's status in Firestore
            const userRef = doc(db, 'users', currentViewingUserId);
            await updateDoc(userRef, {
                isApproved: false,
                status: 'rejected',
                rejectedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            // Update the UI
            const userRow = document.querySelector(`tr[data-user-id="${currentViewingUserId}"]`);
            if (userRow) {
                const statusBadge = userRow.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Rejected';
                    statusBadge.className = 'badge bg-danger';
                }
                
                // Remove from pending users table if it exists
                if (pendingUsersTableBody && userRow.closest('tbody') === pendingUsersTableBody) {
                    userRow.remove();
                }
            }
            
            // Close the modal
            userApprovalModal.hide();
            
            // Show success message
            showMessage('User rejected successfully!', 'success');
            
            // Reload users to update the lists
            loadUsers();
        } catch (error) {
            console.error('Error rejecting user:', error);
            showMessage('Failed to reject user. Please try again.', 'error');
        }
    }
    
    // Event Listeners
    console.log('Setting up event listeners...');
    console.log('Approve button element:', approveUserBtn);
    console.log('Reject button element:', rejectUserBtn);
    
    if (approveUserBtn) {
        console.log('Adding click listener to approve button');
        approveUserBtn.addEventListener('click', function(e) {
            console.log('Approve button clicked (new listener)');
            approveUser();
        });
    } else {
        console.error('Approve button not found!');
    }
    
    if (rejectUserBtn) {
        console.log('Adding click listener to reject button');
        rejectUserBtn.addEventListener('click', function(e) {
            console.log('Reject button clicked (new listener)');
            rejectUser();
        });
    } else {
        console.error('Reject button not found!');
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
