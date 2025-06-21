document.addEventListener('DOMContentLoaded', function() {
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
    
    // Load users from localStorage
    function loadUsers() {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Remove any test users (you can customize this filter as needed)
        users = users.filter(user => {
            // Keep only users with proper email format and required fields
            return user.email && 
                   user.email.includes('@') && 
                   user.firstName && 
                   user.lastName &&
                   !user.email.includes('test') &&
                   !user.email.includes('example');
        });
        
        // Sort users by registration date (newest first)
        users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        renderPendingUsers(users.filter(user => !user.isApproved));
        renderAllUsers(users);
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
                    <button class="btn btn-sm btn-primary view-user-details" data-user-id="${user.id || user.email}">
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
                        <div class="modal-body" id="userDetailsContent">
                <!-- User details will be loaded here -->
                <div class="approval-details mt-3">
                    <h6>Approval Details:</h6>
                    <p class="mb-1" id="approvalStatus"></p>
                    <p class="mb-1" id="approvedBy"></p>
                    <p class="mb-0" id="approvedAt"></p>
                </div>
            </div>`;
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
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                showUserDetails(userId);
            });
        });
    }
    
    // Show user details in modal
    function showUserDetails(userId) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => (u.id === userId) || (u.email === userId));
        
        if (!user) {
            alert('User not found!');
            return;
        }
        
        currentViewingUserId = user.id || user.email;
        
        // Format user details with enhanced approval information
        const userDetails = `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0">${user.firstName} ${user.lastName}</h5>
                    <span class="badge ${user.isApproved ? 'bg-success' : 'bg-warning'}">
                        ${user.isApproved ? 'Approved' : 'Pending Approval'}
                    </span>
                </div>
                
                <div class="row g-2 mb-3">
                    <div class="col-md-6">
                        <div class="p-2 border rounded">
                            <small class="text-muted d-block">Email</small>
                            <strong>${user.email}</strong>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-2 border rounded">
                            <small class="text-muted d-block">Phone</small>
                            <strong>${user.phone || 'N/A'}</strong>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-2 border rounded">
                            <small class="text-muted d-block">Gender</small>
                            <strong>${user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not specified'}</strong>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-2 border rounded">
                            <small class="text-muted d-block">City</small>
                            <strong>${user.city || 'N/A'}</strong>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-2 border rounded">
                            <small class="text-muted d-block">Date of Birth</small>
                            <strong>${user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}</strong>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-2 border rounded">
                            <small class="text-muted d-block">Registered On</small>
                            <strong>${new Date(user.createdAt).toLocaleString()}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="approval-details p-3 bg-light rounded">
                    <h6 class="border-bottom pb-2 mb-3">Approval Information</h6>
                    <div class="row g-2">
                        <div class="col-12">
                            <small class="text-muted d-block">Status</small>
                            <strong>${user.isApproved ? 'Approved' : 'Pending Approval'}</strong>
                        </div>
                        ${user.isApproved ? `
                            <div class="col-md-6">
                                <small class="text-muted d-block">Approved By</small>
                                <strong>${user.approvedBy || 'System Administrator'}</strong>
                            </div>
                            <div class="col-md-6">
                                <small class="text-muted d-block">Approval Date</small>
                                <strong>${user.approvedAt ? new Date(user.approvedAt).toLocaleString() : 'N/A'}</strong>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>`;
        
        userDetailsContent.innerHTML = userDetails;
        
        // Show/hide buttons based on approval status
        if (user.isApproved) {
            approveUserBtn.classList.add('d-none');
            rejectUserBtn.textContent = 'Deactivate';
        } else {
            approveUserBtn.classList.remove('d-none');
            rejectUserBtn.textContent = 'Reject';
        }
        
        userApprovalModal.show();
    }
    
    // Approve user
    function approveUser() {
        if (!currentViewingUserId) return;
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => (u.id === currentViewingUserId) || (u.email === currentViewingUserId));
        
        if (userIndex !== -1) {
            users[userIndex].isApproved = true;
            users[userIndex].approvedAt = new Date().toISOString();
            users[userIndex].approvedBy = 'admin'; // In a real app, this would be the admin's ID
            
            localStorage.setItem('users', JSON.stringify(users));
            
            // Show success message and reload
            alert('User approved successfully!');
            userApprovalModal.hide();
            loadUsers();
            
            // In a real app, you would send an email notification here
        }
    }
    
    // Reject/Deactivate user
    function rejectUser() {
        if (!currentViewingUserId) return;
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => (u.id === currentViewingUserId) || (u.email === currentViewingUserId));
        
        if (userIndex !== -1) {
            const user = users[userIndex];
            const action = user.isApproved ? 'deactivate' : 'reject';
            
            if (confirm(`Are you sure you want to ${action} this user?`)) {
                if (action === 'reject') {
                    // Remove user if rejecting during approval
                    users.splice(userIndex, 1);
                } else {
                    // Deactivate user if already approved
                    users[userIndex].isApproved = false;
                }
                
                localStorage.setItem('users', JSON.stringify(users));
                
                // Show success message and reload
                alert(`User ${action}ed successfully!`);
                userApprovalModal.hide();
                loadUsers();
            }
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
