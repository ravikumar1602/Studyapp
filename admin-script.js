document.addEventListener('DOMContentLoaded', function() {
    // Course Management Variables
    let courses = JSON.parse(localStorage.getItem('courses')) || [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let currentCourseId = null;
    let currentSubjectId = null;
    let isEditMode = false;
    let isSubjectEditMode = false;
    
    // Initialize modals
    const subjectsModal = new bootstrap.Modal(document.getElementById('subjectsModal'));
    const subjectModal = new bootstrap.Modal(document.getElementById('subjectModal'));
    
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
    
    // Add action buttons event listeners
    document.getElementById('addSubjectBtn')?.addEventListener('click', () => openSubjectModal());
    document.getElementById('saveSubjectBtn')?.addEventListener('click', saveSubject);
    document.getElementById('addVideoBtn')?.addEventListener('click', addVideoField);
    
    // Handle video list events using event delegation
    document.getElementById('videosList')?.addEventListener('click', function(e) {
        if (e.target.closest('.remove-video')) {
            e.target.closest('.video-item').remove();
        }
    });
    
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
        if (sectionId === 'courses') {
            coursesSection.classList.remove('d-none');
            dashboardOverview.classList.add('d-none');
            renderCoursesTable();
        } else {
            coursesSection.classList.add('d-none');
            dashboardOverview.classList.remove('d-none');
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
    
    // Manage Subjects
    function openSubjectsModal(courseId) {
        currentCourseId = courseId;
        const course = courses.find(c => c.id === courseId);
        if (!course) return;
        
        // Initialize subjects array if it doesn't exist
        if (!course.subjects) {
            course.subjects = [];
            saveCourses();
        }
        
        document.getElementById('courseTitleForSubjects').textContent = `Subjects for: ${course.name}`;
        renderSubjectsList(course.subjects);
        subjectsModal.show();
    }
    
    function openSubjectModal(subjectId = null) {
        isSubjectEditMode = subjectId !== null;
        currentSubjectId = subjectId;
        
        const modalTitle = document.getElementById('subjectModalLabel');
        const form = document.getElementById('subjectForm');
        const videosList = document.getElementById('videosList');
        
        if (isSubjectEditMode) {
            const course = courses.find(c => c.id === currentCourseId);
            const subject = course.subjects.find(s => s.id === subjectId);
            
            if (subject) {
                modalTitle.textContent = 'Edit Subject';
                document.getElementById('subjectId').value = subject.id;
                document.getElementById('subjectName').value = subject.name;
                document.getElementById('subjectDescription').value = subject.description || '';
                
                // Clear existing video fields
                videosList.innerHTML = '';
                
                // Add video fields
                if (subject.videos && subject.videos.length > 0) {
                    subject.videos.forEach(video => {
                        addVideoField(video);
                    });
                } else {
                    addVideoField(); // Add one empty video field
                }
            }
        } else {
            modalTitle.textContent = 'Add New Subject';
            form.reset();
            videosList.innerHTML = '';
            addVideoField(); // Add one empty video field
        }
        
        subjectModal.show();
    }
    
    function addVideoField(video = { title: '', url: '' }) {
        const template = document.getElementById('videoItemTemplate');
        const clone = template.content.cloneNode(true);
        
        if (video.title) {
            clone.querySelector('.video-title').value = video.title;
        }
        if (video.url) {
            clone.querySelector('.video-url').value = video.url;
        }
        
        document.getElementById('videosList').appendChild(clone);
    }
    
    function saveSubject() {
        const course = courses.find(c => c.id === currentCourseId);
        if (!course) return;
        
        const subjectName = document.getElementById('subjectName').value.trim();
        const subjectDescription = document.getElementById('subjectDescription').value.trim();
        
        if (!subjectName) {
            alert('Please enter a subject name');
            return;
        }
        
        // Collect videos
        const videoItems = Array.from(document.querySelectorAll('.video-item'));
        const videos = [];
        
        for (const item of videoItems) {
            const title = item.querySelector('.video-title').value.trim();
            const url = item.querySelector('.video-url').value.trim();
            
            if (title && url) {
                videos.push({ title, url });
            }
        }
        
        if (videos.length === 0) {
            alert('Please add at least one video');
            return;
        }
        
        const subjectData = {
            id: isSubjectEditMode ? currentSubjectId : Date.now().toString(),
            name: subjectName,
            description: subjectDescription,
            videos: videos,
            createdAt: isSubjectEditMode ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (!course.subjects) {
            course.subjects = [];
        }
        
        if (isSubjectEditMode) {
            const index = course.subjects.findIndex(s => s.id === currentSubjectId);
            if (index !== -1) {
                course.subjects[index] = { ...course.subjects[index], ...subjectData };
            }
        } else {
            course.subjects.push(subjectData);
        }
        
        saveCourses();
        renderSubjectsList(course.subjects);
        subjectModal.hide();
    }
    
    function renderSubjectsList(subjects) {
        const tbody = document.getElementById('subjectsList');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!subjects || subjects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-3 text-muted">
                        No subjects found. Click "Add Subject" to get started.
                    </td>
                </tr>`;
            return;
        }
        
        subjects.forEach((subject, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${subject.name}</td>
                <td>${subject.videos?.length || 0} videos</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-subject" data-id="${subject.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-subject ms-1" data-id="${subject.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>`;
            tbody.appendChild(row);
        });
        
        // Add event listeners to the new buttons
        tbody.querySelectorAll('.edit-subject').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openSubjectModal(btn.dataset.id);
            });
        });
        
        tbody.querySelectorAll('.delete-subject').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
                    const course = courses.find(c => c.id === currentCourseId);
                    if (course && course.subjects) {
                        course.subjects = course.subjects.filter(s => s.id !== btn.dataset.id);
                        saveCourses();
                        renderSubjectsList(course.subjects);
                    }
                }
            });
        });
    }
    
    // Save Course
    function saveCourse() {
        const name = document.getElementById('courseName').value.trim();
        const description = document.getElementById('courseDescription').value.trim();
        const instructor = document.getElementById('courseInstructor').value.trim();
        const duration = document.getElementById('courseDuration').value;
        const price = document.getElementById('coursePrice').value;
        const image = document.getElementById('courseImage').value.trim();
        
        if (!name || !description || !instructor || !duration || !price) {
            alert('Please fill in all required fields');
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
    function deleteCourse() {
        courses = courses.filter(course => course.id !== currentCourseId);
        saveCourses();
        confirmModal.hide();
        renderCoursesTable();
    }
    
    // Confirm Delete
    function confirmDelete(courseId) {
        currentCourseId = courseId;
        confirmModal.show();
    }
    
    // Toggle Course Status
    function toggleCourseStatus(courseId) {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            course.status = course.status === 'active' ? 'inactive' : 'active';
            saveCourses();
            renderCoursesTable();
        }
    }
    
    // Save courses to localStorage
    function saveCourses() {
        localStorage.setItem('courses', JSON.stringify(courses));
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
                <td data-label="Students">${course.students || 0}</td>
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
    
    // Initialize sample data if none exists
    if (courses.length === 0) {
        // Initialize with sample subjects and videos for demo
        const sampleSubjects = [
            {
                id: 'sub1',
                name: 'Introduction to Course',
                description: 'Get started with the basics of this course',
                videos: [
                    { title: 'Welcome to the Course', url: 'https://example.com/videos/welcome' },
                    { title: 'Course Overview', url: 'https://example.com/videos/overview' }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'sub2',
                name: 'Advanced Topics',
                description: 'Dive deeper into advanced concepts',
                videos: [
                    { title: 'Advanced Concepts Part 1', url: 'https://example.com/videos/advanced1' },
                    { title: 'Advanced Concepts Part 2', url: 'https://example.com/videos/advanced2' }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        courses = [
            {
                id: '1',
                name: 'Web Development Bootcamp',
                description: 'Learn full-stack web development with modern technologies',
                instructor: 'John Doe',
                duration: 12,
                price: 4999,
                image: 'https://via.placeholder.com/300x200?text=Web+Development',
                students: 125,
                status: 'active',
                createdAt: '2024-01-15T10:30:00Z'
            },
            {
                id: '2',
                name: 'Data Science Fundamentals',
                description: 'Master the basics of data science and machine learning',
                instructor: 'Jane Smith',
                duration: 16,
                price: 6999,
                image: 'https://via.placeholder.com/300x200?text=Data+Science',
                students: 89,
                status: 'active',
                createdAt: '2024-02-01T14:45:00Z'
            }
        ];
        saveCourses();
    }
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
    
    // Handle action buttons with event delegation
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        const row = button.closest('tr');
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
    });
    
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
    
    // Set initial styles for animation
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
