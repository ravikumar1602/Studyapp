// Import Firebase database
import { database } from './firebase-config.js';

// Configuration
const COURSES_PER_PAGE = 8;
let currentPage = 1;
let allCourses = [];
let filteredCourses = [];

// DOM Elements
const coursesGrid = document.querySelector('.courses-grid');
const paginationContainer = document.getElementById('pagination');
const loadingElement = document.getElementById('loading-courses');

// Function to fetch courses from Firebase Realtime Database
function getCourses(callback) {
    try {
        const coursesRef = database.ref('courses');
        
        // Set up real-time listener
        coursesRef.on('value', (snapshot) => {
            const coursesData = snapshot.val();
            const coursesList = [];
            
            if (coursesData) {
                // Convert the object of courses to an array and filter out inactive courses
                Object.keys(coursesData).forEach(key => {
                    const course = coursesData[key];
                    // Only include active courses (status not 'inactive' or undefined)
                    if (course.status !== 'inactive') {
                        coursesList.push({
                            id: key,
                            ...course
                        });
                    }
                });
            }
            
            allCourses = coursesList;
            filteredCourses = [];
            
            if (typeof callback === 'function') {
                callback(coursesList);
            }
            
            // Update the display with the first page
            displayCourses(1);
        }, (error) => {
            console.error('Error fetching courses:', error);
            if (typeof callback === 'function') {
                callback([]);
            }
        });
        
        return []; // Initial empty array, will be updated by the listener
    } catch (error) {
        console.error('Error in getCourses:', error);
        if (typeof callback === 'function') {
            callback([]);
        }
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
function sortCourses(courses, sortBy = 'newest') {
if (!Array.isArray(courses)) return [];

return [...courses].sort((a, b) => {
    switch (sortBy) {
        case 'newest':
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'rating-desc':
            return (b.rating || 0) - (a.rating || 0);
        case 'price-asc':
            return (a.price || 0) - (b.price || 0);
        case 'price-desc':
            return (b.price || 0) - (a.price || 0);
        case 'title-asc':
            return (a.name || '').localeCompare(b.name || '');
        case 'title-desc':
            return (b.name || '').localeCompare(a.name || '');
        default:
            return 0;
    }
});
}

// Function to filter courses based on search and filters
function filterCourses() {
const searchInput = document.getElementById('course-search');
const categoryFilter = document.getElementById('category-filter');
const levelFilter = document.getElementById('level-filter');
const sortSelect = document.getElementById('sort-courses');

if (!searchInput || !categoryFilter || !levelFilter || !sortSelect) return;

const searchTerm = searchInput.value.trim().toLowerCase();
const category = categoryFilter.value;
const level = levelFilter.value;
const sortBy = sortSelect.value;

// Start with all courses
filteredCourses = [...allCourses];

// Apply filters
if (searchTerm) {
    filteredCourses = filteredCourses.filter(course => 
        (course.name && course.name.toLowerCase().includes(searchTerm)) ||
        (course.description && course.description.toLowerCase().includes(searchTerm)) ||
        (course.instructor && course.instructor.toLowerCase().includes(searchTerm)) ||
        (course.category && course.category.toLowerCase().includes(searchTerm))
    );
}

if (category) {
    filteredCourses = filteredCourses.filter(course => 
        course.category && course.category.toLowerCase() === category.toLowerCase()
    );
}

if (level) {
    filteredCourses = filteredCourses.filter(course => 
        course.level && course.level.toLowerCase() === level.toLowerCase()
    );
}

// Sort the filtered results
filteredCourses = sortCourses(filteredCourses, sortBy);

// Reset to first page and display results
currentPage = 1;
displayCourses(currentPage);
}

// Function to initialize the courses page
function initCoursesPage() {
// Show loading state
if (loadingElement) {
    loadingElement.style.display = 'block';
}

// Get all courses from Firebase
getCourses((courses) => {
    // Hide loading state
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }

    if (!courses || courses.length === 0) {
        showNoCoursesMessage();
        return;
    }

    // Update filters with unique categories and levels
    updateFilters(courses);

    // Set up event listeners for filters
    const searchInput = document.getElementById('course-search');
    const categoryFilter = document.getElementById('category-filter');
    const levelFilter = document.getElementById('level-filter');
    const sortSelect = document.getElementById('sort-courses');

    if (searchInput) searchInput.addEventListener('input', filterCourses);
    if (categoryFilter) categoryFilter.addEventListener('change', filterCourses);
    if (levelFilter) levelFilter.addEventListener('change', filterCourses);
    if (sortSelect) sortSelect.addEventListener('change', filterCourses);
});
}

// Function to update filter dropdowns with unique values
function updateFilters(courses) {
    const categoryFilter = document.getElementById('category-filter');
    const levelFilter = document.getElementById('level-filter');
    
    if (!categoryFilter || !levelFilter) return;
    
    // Get unique categories and levels
    const categories = new Set();
    const levels = new Set();
    
    courses.forEach(course => {
        if (course.category) categories.add(course.category);
        if (course.level) levels.add(course.level);
    });
    
    // Update category filter
    const categoryOptions = ['<option value="">All Categories</option>'];
    categories.forEach(category => {
        categoryOptions.push(`<option value="${category}">${category}</option>`);
    });
    categoryFilter.innerHTML = categoryOptions.join('');
    
    // Update level filter
    const levelOptions = ['<option value="">All Levels</option>'];
    levels.forEach(level => {
        levelOptions.push(`<option value="${level}">${level}</option>`);
    });
    levelFilter.innerHTML = levelOptions.join('');
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initCoursesPage);
