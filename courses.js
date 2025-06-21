// Configuration
const COURSES_PER_PAGE = 8;
let currentPage = 1;
let allCourses = [];
let filteredCourses = [];

// DOM Elements
const coursesGrid = document.querySelector('.courses-grid');
const paginationContainer = document.getElementById('pagination');
const loadingElement = document.getElementById('loading-courses');

// Function to fetch courses from localStorage
function getCourses() {
    try {
        return JSON.parse(localStorage.getItem('courses')) || [];
    } catch (error) {
        console.error('Error parsing courses from localStorage:', error);
        return [];
    }
}

// Function to display courses with pagination
function displayCourses(page = 1) {
    if (!coursesGrid) return;
    
    // Show loading state
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    
    // Get filtered courses or all active courses
    const coursesToDisplay = filteredCourses.length > 0 ? filteredCourses : allCourses;
    
    // Calculate pagination
    const startIndex = (page - 1) * COURSES_PER_PAGE;
    const endIndex = startIndex + COURSES_PER_PAGE;
    const paginatedCourses = coursesToDisplay.slice(startIndex, endIndex);
    
    // Clear existing course cards
    coursesGrid.innerHTML = '';
    
    if (paginatedCourses.length === 0) {
        showNoCoursesMessage();
        return;
    }
    
    // Generate course cards
    paginatedCourses.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesGrid.appendChild(courseCard);
    });
    
    // Update pagination
    updatePagination(coursesToDisplay.length, page);
    
    // Hide loading state
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Function to create a course card element
function createCourseCard(course) {
    const courseCard = document.createElement('div');
    courseCard.className = 'course-card';
    courseCard.setAttribute('data-category', course.category?.toLowerCase() || 'general');
    courseCard.setAttribute('data-level', course.level?.toLowerCase() || 'beginner');
    
    // Format price with Indian Rupee symbol
    const formattedPrice = course.price > 0 ? `₹${course.price.toLocaleString()}` : 'Free';
    const badgeText = course.price === 0 ? 'Free' : 'Premium';
    
    // Generate random rating between 4.0 and 5.0
    const rating = (Math.random() * 1 + 4).toFixed(1);
    const reviewCount = Math.floor(Math.random() * 1000) + 50;
    
    // Create course card HTML
    courseCard.innerHTML = `
        <div class="course-image">
            <img src="${course.image || `https://placehold.co/300x200/4a6cf7/ffffff.png?text=${encodeURIComponent(course.name || 'Course+Image')}`}" 
                 alt="${course.name}" 
                 onerror="this.onerror=null; this.src='https://placehold.co/300x200/d3d3d3/808080.png?text=Course+Image';">
            <span class="course-badge" style="background: ${course.price === 0 ? '#28a745' : '#4a6cf7'};">
                ${badgeText}
            </span>
        </div>
        <div class="course-content">
            <span class="course-category">${course.category || 'General'}</span>
            <h3 class="course-title">${course.name}</h3>
            <p class="course-description">${course.description || 'No description available.'}</p>
            <div class="course-meta">
                <div class="course-instructor">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor || 'Instructor')}&background=4a6cf7&color=fff" 
                         alt="${course.instructor || 'Instructor'}" 
                         class="instructor-avatar"
                         onerror="this.src='https://ui-avatars.com/api/?name=Instructor&background=4a6cf7&color=fff';">
                    <span class="instructor-name">${course.instructor || 'Instructor'}</span>
                </div>
                <div class="course-rating">
                    <i class="fas fa-star" style="color: #ffc107;"></i>
                    <span>${rating} (${reviewCount})</span>
                </div>
            </div>
            <div class="course-footer">
                <div class="course-duration">
                    <i class="far fa-clock"></i> ${course.duration || 4} weeks
                </div>
                <div class="course-price">
                    ${formattedPrice}
                </div>
            </div>
            <a href="course-details.html?id=${course.id}" class="button" style="width: 100%; text-align: center; margin-top: 1rem;">
                View Course
            </a>
        </div>`;
    
    return courseCard;
}

// Function to show no courses message
function showNoCoursesMessage() {
    coursesGrid.innerHTML = `
        <div class="no-courses" style="grid-column: 1 / -1; text-align: center; padding: 3rem 0;">
            <i class="fas fa-book-open" style="font-size: 3rem; color: #6c757d; margin-bottom: 1rem;"></i>
            <h3>No courses found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
        </div>`;
    
    // Hide pagination when no courses
    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }
}

// Function to update pagination controls
function updatePagination(totalCourses, currentPage) {
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(totalCourses / COURSES_PER_PAGE);
    
    // Don't show pagination if only one page
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <a href="#" class="page-link ${currentPage === 1 ? 'disabled' : ''}" 
           data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </a>`;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page
    if (startPage > 1) {
        paginationHTML += `
            <a href="#" class="page-link" data-page="1">1</a>
            ${startPage > 2 ? '<span class="page-dots">...</span>' : ''}`;
    }
    
    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <a href="#" class="page-link ${i === currentPage ? 'active' : ''}" 
               data-page="${i}">${i}</a>`;
    }
    
    // Last page
    if (endPage < totalPages) {
        paginationHTML += `
            ${endPage < totalPages - 1 ? '<span class="page-dots">...</span>' : ''}
            <a href="#" class="page-link" data-page="${totalPages}">${totalPages}</a>`;
    }
    
    // Next button
    paginationHTML += `
        <a href="#" class="page-link ${currentPage === totalPages ? 'disabled' : ''}" 
           data-page="${currentPage + 1}">
            <i class="fas fa-chevron-right"></i>
        </a>`;
    
    paginationContainer.innerHTML = paginationHTML;
    
    // Add event listeners to pagination links
    document.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (link.classList.contains('disabled')) return;
            
            const page = parseInt(link.dataset.page);
            if (!isNaN(page) && page !== currentPage) {
                currentPage = page;
                displayCourses(currentPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

// Function to sort courses based on selected criteria
function sortCourses(courses) {
    const sortBy = document.getElementById('sort-by')?.value || 'newest';
    
    return [...courses].sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                // Sort by creation date (newest first)
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                
            case 'popular':
                // Sort by number of students (descending)
                return (b.students || 0) - (a.students || 0);
                
            case 'price-low':
                // Sort by price (low to high)
                return (a.price || 0) - (b.price || 0);
                
            case 'price-high':
                // Sort by price (high to low)
                return (b.price || 0) - (a.price || 0);
                
            case 'rating':
                // Sort by rating (highest first)
                return (b.rating || 0) - (a.rating || 0);
                
            default:
                return 0;
        }
    });
}

// Function to filter courses based on search and filters
function filterCourses() {
    const searchTerm = (document.querySelector('.search-bar input')?.value || '').toLowerCase().trim();
    const categoryFilter = (document.querySelector('select[data-filter="category"]')?.value || 'all').toLowerCase();
    const levelFilter = (document.querySelector('select[data-filter="level"]')?.value || 'all').toLowerCase();
    
    // Reset to first page when filtering
    currentPage = 1;
    
    if (!searchTerm && categoryFilter === 'all' && levelFilter === 'all') {
        // No filters applied, show all active courses
        filteredCourses = [];
        displayCourses(currentPage);
        return;
    }
    
    // Apply filters
    filteredCourses = allCourses.filter(course => {
        const matchesSearch = !searchTerm || 
            course.name.toLowerCase().includes(searchTerm) || 
            (course.description && course.description.toLowerCase().includes(searchTerm)) ||
            (course.instructor && course.instructor.toLowerCase().includes(searchTerm));
            
        const matchesCategory = categoryFilter === 'all' || 
            (course.category && course.category.toLowerCase() === categoryFilter);
            
        const matchesLevel = levelFilter === 'all' || 
            (course.level && course.level.toLowerCase() === levelFilter);
        
        return matchesSearch && matchesCategory && matchesLevel;
    });
    
    // Apply sorting
    filteredCourses = sortCourses(filteredCourses);
    
    displayCourses(currentPage);
}

// Function to initialize the courses page
function initCoursesPage() {
    // Load courses
    allCourses = getCourses()
        .filter(course => course.status === 'active')
        .map(course => ({
            ...course,
            // Add a random number of students between 10 and 1000 if not set
            students: course.students || Math.floor(Math.random() * 1000) + 10,
            // Add a random rating between 3.5 and 5.0 if not set
            rating: course.rating || (Math.random() * 1.5 + 3.5).toFixed(1)
        }));
    
    // Set up event listeners for filters and sorting
    const searchInput = document.querySelector('.search-bar input');
    const filterSelects = document.querySelectorAll('.filter-select');
    const sortSelect = document.getElementById('sort-by');
    
    // Add input event with debounce for search
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterCourses, 300);
        });
    }
    
    // Add change event for filter selects
    filterSelects.forEach(select => {
        select.addEventListener('change', filterCourses);
    });
    
    // Add change event for sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            if (filteredCourses.length > 0) {
                filteredCourses = sortCourses(filteredCourses);
                displayCourses(currentPage);
            } else {
                filterCourses();
            }
        });
    }
    
    // Initial sort and display of courses
    allCourses = sortCourses(allCourses);
    displayCourses(currentPage);
    
    // Add a small delay to hide the loading spinner (for demo purposes)
    setTimeout(() => {
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }, 500);
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initCoursesPage);
