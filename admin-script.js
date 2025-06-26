// Import Firebase database
import { database } from './firebase-config.js';

// Security settings
let securitySettings = {
    disableRightClick: false,
    disableDevTools: false
};

document.addEventListener('DOMContentLoaded', async function() {
    // Course Management Variables
    let courses = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentCourseId = null;
    let isEditMode = false;
    
    // Reference to the courses in Firebase
    const coursesRef = database.ref('courses');
    
    // DOM Elements
    const coursesSection = document.getElementById('courses-section');
    const dashboardOverview = document.getElementById('dashboard-overview');
    const coursesTableBody = document.getElementById('coursesTableBody');
    const courseForm = document.getElementById('courseForm');
    const courseModal = new bootstrap.Modal(document.getElementById('courseModal'));
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    const saveCourseBtn = document.getElementById('saveCourseBtn');
    const addCourseBtn = document.getElementById('addCourseBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageLinks = document.querySelectorAll('.page-link:not(#prevPage a):not(#nextPage a)');
    
    // Navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            showSection(target);
            
            // Update active state
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');
        });
    });
    
    // Show/Hide sections
    function showSection(sectionId) {
        // Hide all sections first
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.add('d-none');
        });
        
        // Show the selected section
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.remove('d-none');
        }
        
        // Special handling for dashboard
        const dashboardOverview = document.getElementById('dashboard-overview');
        if (sectionId === 'dashboard' || sectionId === '') {
            dashboardOverview?.classList.remove('d-none');
        } else {
            dashboardOverview?.classList.add('d-none');
        }
        
        // Load section-specific data
        if (sectionId === 'courses') {
            renderCoursesTable();
        } else if (sectionId === 'videos') {
            // Initialize videos table when videos section is shown
            if (window.loadAllVideos && typeof window.loadAllVideos === 'function') {
                window.loadAllVideos();
            }
        }
    }
    
    // Course Form Handling
    addCourseBtn?.addEventListener('click', () => openCourseModal());
    saveCourseBtn?.addEventListener('click', saveCourse);
    confirmDeleteBtn?.addEventListener('click', deleteCourse);
    
    // Pagination
    prevPageBtn?.addEventListener('click', () => changePage(-1));
    nextPageBtn?.addEventListener('click', () => changePage(1));
    pageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = parseInt(link.textContent);
            renderCoursesTable();
        });
    });
    
    // Open Course Modal
    function openCourseModal(courseId = null) {
        isEditMode = courseId !== null;
        currentCourseId = courseId;
        
        const modalTitle = document.getElementById('courseModalLabel');
        const form = document.getElementById('courseForm');
        
        if (isEditMode) {
            modalTitle.textContent = 'Edit Course';
            const course = courses.find(c => c.id === courseId);
            if (course) {
                document.getElementById('courseName').value = course.name;
                document.getElementById('courseDescription').value = course.description;
                document.getElementById('courseInstructor').value = course.instructor;
                document.getElementById('courseDuration').value = course.duration;
                document.getElementById('coursePrice').value = course.price;
                document.getElementById('courseImage').value = course.image || '';
            }
        } else {
            modalTitle.textContent = 'Add New Course';
            form.reset();
        }
        
        courseModal.show();
    }
    
    // Save Course
    function saveCourse() {
        // Get form elements
        const form = document.getElementById('courseForm');
        const name = document.getElementById('courseName').value.trim();
        const description = document.getElementById('courseDescription').value.trim();
        const instructor = document.getElementById('courseInstructor').value.trim();
        const duration = document.getElementById('courseDuration').value;
        const price = document.getElementById('coursePrice').value;
        const image = document.getElementById('courseImage').value.trim();
        
        // Validate required fields
        if (!name || !description || !instructor || !duration || !price) {
            showToast('Validation Error', 'Please fill in all required fields', 'error');
            return;
        }
        
        // Validate price is a valid number
        if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            showToast('Validation Error', 'Please enter a valid price', 'error');
            return;
        }
        
        // Validate duration is a positive number
        if (isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
            showToast('Validation Error', 'Please enter a valid duration (must be greater than 0)', 'error');
            return;
        }
        
        const courseData = {
            id: isEditMode ? currentCourseId : Date.now().toString(),
            name,
            description,
            instructor,
            duration: parseInt(duration),
            price: parseFloat(price),
            image: image || `https://placehold.co/300x200/4a6cf7/ffffff.png?text=${encodeURIComponent(name || 'Course+Image')}`,
            students: isEditMode ? (courses.find(c => c.id === currentCourseId)?.students || 0) : 0,
            status: isEditMode ? (courses.find(c => c.id === currentCourseId)?.status || 'active') : 'active',
            createdAt: isEditMode ? (courses.find(c => c.id === currentCourseId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
        };
        
        if (isEditMode) {
            const index = courses.findIndex(c => c.id === currentCourseId);
            if (index !== -1) {
                courses[index] = courseData;
            }
        } else {
            courses.unshift(courseData);
        }
        
        saveCourses();
        courseModal.hide();
        renderCoursesTable();
    }
    
    // Delete Course
    async function deleteCourse() {
        try {
            const courseName = courses.find(c => c.id === currentCourseId)?.name || 'the course';
            
            // Delete from Firebase
            await coursesRef.child(currentCourseId).remove();
            
            // Update local state
            courses = courses.filter(course => course.id !== currentCourseId);
            
            showToast('Success', `Course "${courseName}" has been deleted`, 'success');
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast('Error', 'Failed to delete course. Please try again.', 'error');
        } finally {
            confirmModal.hide();
        }
    }
    
    // Confirm Delete
    function confirmDelete(courseId) {
        currentCourseId = courseId;
        confirmModal.show();
    }
    
    // Toggle Course Status
    async function toggleCourseStatus(courseId) {
        try {
            const course = courses.find(c => c.id === courseId);
            if (course) {
                const newStatus = course.status === 'active' ? 'inactive' : 'active';
                // Update in Firebase
                await coursesRef.child(courseId).update({ status: newStatus });
                // Update local state
                course.status = newStatus;
                // Show success message
                showToast('Success', `Course status updated to ${newStatus}`, 'success');
                // Re-render the table
                renderCoursesTable();
            }
        } catch (error) {
            console.error('Error toggling course status:', error);
            showToast('Error', 'Failed to update course status', 'error');
        }
    }
    
    // Save courses to Firebase
    async function saveCourses() {
        try {
            const courseData = isEditMode 
                ? courses.find(c => c.id === currentCourseId)
                : courses[0];
                
            if (!courseData) {
                throw new Error('No course data to save');
            }
            
            // Save to Firebase
            if (isEditMode) {
                await coursesRef.child(courseData.id).set(courseData);
            } else {
                const newCourseRef = coursesRef.push();
                courseData.id = newCourseRef.key;
                await newCourseRef.set(courseData);
            }
            
            // Show success message
            showToast('Success', `Course ${isEditMode ? 'updated' : 'added'} successfully!`, 'success');
            
            // Reset form and close modal if open
            if (document.getElementById('courseForm')) {
                document.getElementById('courseForm').reset();
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('courseModal'));
            if (modal) {
                modal.hide();
            }
            
            return true;
        } catch (error) {
            console.error('Error saving course:', error);
            showToast('Error', 'Failed to save course. Please try again.', 'error');
            return false;
        }
    }
    
    // Render Courses Table
    function renderCoursesTable() {
        if (!coursesTableBody) return;
        
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedCourses = courses.slice(start, end);
        
        coursesTableBody.innerHTML = '';
        
        if (paginatedCourses.length === 0) {
            coursesTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="text-muted">No courses found. Click the "Add New Course" button to get started.</div>
                    </td>
                </tr>`;
            return;
        }
        
        paginatedCourses.forEach((course, index) => {
            const row = document.createElement('tr');
            row.dataset.courseId = course.id;
            row.dataset.status = course.status;
            row.innerHTML = `
                <td data-label="#">${start + index + 1}</td>
                <td data-label="Course">
                    <div class="d-flex align-items-center">
                        <img src="${course.image}" alt="${course.name}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; margin-right: 10px;">
                        <div>
                            <div class="fw-semibold">${course.name}</div>
                            <small class="text-muted">${course.description.substring(0, 50)}${course.description.length > 50 ? '...' : ''}</small>
                        </div>
                    </div>
                </td>
                <td data-label="Instructor">${course.instructor}</td>
                <td data-label="Duration">${course.duration} weeks</td>
                <td data-label="Price">₹${course.price.toLocaleString()}</td>
                <td data-label="Students">${course.enrollmentCount || 0}</td>
                <td data-label="Status">
                    <span class="status-badge status-${course.status}">${course.status}</span>
                </td>
                <td data-label="Actions">
                    <button class="btn btn-sm btn-action btn-outline-primary" data-action="edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-action btn-outline-danger" data-action="delete">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-action btn-outline-${course.status === 'active' ? 'warning' : 'success'}" 
                            data-action="toggle-status">
                        <i class="fas fa-${course.status === 'active' ? 'eye-slash' : 'eye'}"></i>
                    </button>
                </td>`;
            coursesTableBody.appendChild(row);
        });
        
        // Update pagination info
        updatePagination();
    }
    
    // Update Pagination
    function updatePagination() {
        const totalPages = Math.ceil(courses.length / itemsPerPage);
        const showingFrom = courses.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
        const showingTo = Math.min(currentPage * itemsPerPage, courses.length);
        
        document.getElementById('showingFrom').textContent = showingFrom;
        document.getElementById('showingTo').textContent = showingTo;
        document.getElementById('totalCourses').textContent = courses.length;
        
        // Update pagination buttons
        prevPageBtn.classList.toggle('disabled', currentPage === 1);
        nextPageBtn.classList.toggle('disabled', currentPage >= totalPages);
        
        // Update active page
        document.querySelectorAll('.page-item').forEach(item => item.classList.remove('active'));
        const currentPageItem = Array.from(document.querySelectorAll('.page-link'))
            .find(link => parseInt(link.textContent) === currentPage)?.parentElement;
        if (currentPageItem) {
            currentPageItem.classList.add('active');
        }
    }
    
    // Change Page
    function changePage(direction) {
        const totalPages = Math.ceil(courses.length / itemsPerPage);
        const newPage = currentPage + direction;
        
        if (newPage > 0 && newPage <= totalPages) {
            currentPage = newPage;
            renderCoursesTable();
        }
    }
    
    // Load courses from Firebase
    async function loadCourses() {
        try {
            // First, get all users to count enrollments
            const usersSnapshot = await database.ref('users').once('value');
            const users = usersSnapshot.val() || {};
            
            // Create a map to count enrollments per course
            const courseEnrollments = {};
            
            // Count enrollments across all users
            Object.values(users).forEach(user => {
                if (user.enrolledCourses) {
                    Object.keys(user.enrolledCourses).forEach(courseId => {
                        if (!courseEnrollments[courseId]) {
                            courseEnrollments[courseId] = 0;
                        }
                        courseEnrollments[courseId]++;
                    });
                }
            });
            
            // Now load courses and add enrollment counts
            coursesRef.on('value', (snapshot) => {
                courses = [];
                snapshot.forEach((childSnapshot) => {
                    const course = childSnapshot.val();
                    // Add enrollment count to course data
                    course.enrollmentCount = courseEnrollments[course.id] || 0;
                    courses.push(course);
                });
                renderCoursesTable();
            }, (error) => {
                console.error('Error loading courses:', error);
                showToast('Error', 'Failed to load courses', 'error');
            });
            
        } catch (error) {
            console.error('Error loading enrollment data:', error);
            showToast('Error', 'Failed to load enrollment data', 'error');
        }
    }
    
    // Initialize data
    loadCourses().then(() => {
        // After courses are loaded, ensure events are set up
        setupCoursesTableEvents();
    });
    loadSecuritySettings();
    
    // Course data will be loaded from Firebase
    // Mobile menu toggle
    const mobileMenuToggle = document.createElement('button');
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(mobileMenuToggle);
    
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    
    // Toggle sidebar on mobile
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    }
    
    mobileMenuToggle.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
    
    // Show toast notification
    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast show ${type}`;
        
        const toastHeader = document.createElement('div');
        toastHeader.className = 'toast-header';
        
        // Add icon based on type
        let iconClass = 'info-circle';
        if (type === 'success') iconClass = 'check-circle';
        if (type === 'error') iconClass = 'exclamation-circle';
        if (type === 'warning') iconClass = 'exclamation-triangle';
        
        toastHeader.innerHTML = `
            <i class="fas fa-${iconClass} me-2"></i>
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        `;
        
        const toastBody = document.createElement('div');
        toastBody.className = 'toast-body';
        toastBody.textContent = message;
        
        toast.appendChild(toastHeader);
        toast.appendChild(toastBody);
        toastContainer.appendChild(toast);
        
        // Auto-remove toast after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Close button functionality
        const closeBtn = toast.querySelector('.btn-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }
    
    // Create toast container if it doesn't exist
    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    }

    // Initialize tooltips
    const tooltipElements = document.querySelectorAll('[data-toggle="tooltip"]');
    tooltipElements.forEach(el => {
        new bootstrap.Tooltip(el);
    });
    
    // Handle active states and navigation
    const currentLocation = window.location.hash || '#dashboard';
    const navItems = document.querySelectorAll('.sidebar-nav li');
    
    function updateActiveNav() {
        navItems.forEach(item => {
            const link = item.querySelector('a');
            if (link.getAttribute('href') === currentLocation) {
                item.classList.add('active');
                // Show the corresponding section
                const sectionId = currentLocation.substring(1);
                if (sectionId === 'courses') {
                    showSection('courses');
                } else {
                    showSection('dashboard');
                }
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // Initial active state update
    updateActiveNav();
    
    // Handle action buttons with event delegation for courses table
    function setupCoursesTableEvents() {
        const coursesTable = document.getElementById('coursesTable');
        if (coursesTable) {
            // Remove any existing event listeners to prevent duplicates
            coursesTable.removeEventListener('click', handleTableClick);
            // Add new event listener
            coursesTable.addEventListener('click', handleTableClick);
        }
    }
    
    function handleTableClick(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        const row = button.closest('tr');
        if (!row || !row.dataset.courseId) return;
        
        const courseId = row.dataset.courseId;
        e.stopPropagation();
        
        switch (action) {
            case 'edit':
                openCourseModal(courseId);
                break;
            case 'delete':
                confirmDelete(courseId);
                break;
            case 'toggle-status':
                toggleCourseStatus(courseId);
                break;
        }
    }
    
    // Initial setup of event listeners
    setupCoursesTableEvents();
    
    // Wrap the original renderCoursesTable to ensure events are set up after rendering
    const originalRenderCoursesTable = renderCoursesTable;
    renderCoursesTable = function() {
        const result = originalRenderCoursesTable.apply(this, arguments);
        setupCoursesTableEvents();
        return result;
    };
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        const newLocation = window.location.hash || '#dashboard';
        if (newLocation !== currentLocation) {
            currentLocation = newLocation;
            updateActiveNav();
        }
    });
    
    // Sample data for charts (you can replace with real data)
    const statsData = [
        { label: 'Total Users', value: 1245, change: 12.5, trend: 'up' },
        { label: 'Total Courses', value: 48, change: 8.3, trend: 'up' },
        { label: 'Active Sessions', value: 327, change: 3.2, trend: 'down' },
        { label: 'Revenue', value: 12489, change: 24.1, trend: 'up' }
    ];
    
    // Update stats cards with data
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        const data = statsData[index];
        if (data) {
            const countElement = card.querySelector('.count');
            const trendElement = card.querySelector('.trend');
            const trendIcon = card.querySelector('.trend i');
            
            if (countElement) {
                countElement.textContent = data.label === 'Revenue' 
                    ? `$${data.value.toLocaleString()}` 
                    : data.value.toLocaleString();
            }
            
            if (trendElement && trendIcon) {
                trendElement.textContent = `${data.change}%`;
                trendElement.className = `trend ${data.trend}`;
                trendIcon.className = `fas fa-arrow-${data.trend}`;
            }
        }
    });
    
    // Handle user dropdown
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';
        dropdownMenu.innerHTML = `
            <a href="#"><i class="fas fa-user"></i> Profile</a>
            <a href="#"><i class="fas fa-cog"></i> Settings</a>
            <a href="#"><i class="fas fa-sign-out-alt"></i> Logout</a>
        `;
        
        userProfile.parentNode.insertBefore(dropdownMenu, userProfile.nextSibling);
        
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
    
    // Add animation to stats cards on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.stat-card, .card, .feature-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };
    
    // Set initial styles for animation and apply security settings
    document.querySelectorAll('.stat-card, .card, .feature-card').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Run animation on load and scroll
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
    
    // Initialize any charts if needed (using Chart.js for example)
    if (typeof Chart !== 'undefined') {
        // Add your chart initialization code here
        // Example:
        // const ctx = document.getElementById('myChart').getContext('2d');
        // const myChart = new Chart(ctx, { ... });
    }
});

// Helper function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
