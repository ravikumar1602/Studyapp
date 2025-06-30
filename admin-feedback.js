// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getDatabase, ref, onValue, update } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Firebase configuration
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
let app;
let database;

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('Firebase initialized successfully in admin-feedback.js');
} catch (error) {
    console.error('Error initializing Firebase in admin-feedback.js:', error);
}

// DOM Elements
const feedbackTableBody = document.getElementById('feedbackTableBody');
const pendingCountBadge = document.getElementById('pendingCountBadge');
const approvedCountBadge = document.getElementById('approvedCountBadge');
const rejectedCountBadge = document.getElementById('rejectedCountBadge');
let allFeedback = [];
let courses = {};

// Status colors
const statusColors = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'secondary'
};

// Status labels
const statusLabels = {
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected'
};

// Load all feedback
function loadAllFeedback() {
    try {
        console.log('Loading all feedback...');
        const feedbackRef = ref(database, 'feedback');
        
        onValue(feedbackRef, (snapshot) => {
            try {
                allFeedback = [];
                const feedbackData = snapshot.val() || {};
                
                console.log('Raw feedback data:', feedbackData);
                
                // Convert to array
                Object.entries(feedbackData).forEach(([courseId, courseFeedbacks]) => {
                    if (courseFeedbacks && typeof courseFeedbacks === 'object') {
                        Object.entries(courseFeedbacks).forEach(([feedbackId, feedback]) => {
                            if (feedback) {
                                allFeedback.push({
                                    id: feedbackId,
                                    courseId,
                                    ...feedback
                                });
                            }
                        });
                    }
                });
                
                console.log('Processed feedback items:', allFeedback.length);
                
                // Sort by timestamp (newest first)
                allFeedback.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                
                // Update counts
                updateFeedbackCounts();
                
                // Show pending feedback by default
                filterFeedback('pending');
                
            } catch (error) {
                console.error('Error processing feedback data:', error);
                showError('Error loading feedback data');
            }
        }, (error) => {
            console.error('Error reading feedback data:', error);
            showError('Failed to load feedback. Please try again.');
        });
        
    } catch (error) {
        console.error('Error setting up feedback listener:', error);
        showError('Failed to initialize feedback system');
    }
}

// Update feedback counts
function updateFeedbackCounts() {
    const pending = allFeedback.filter(fb => fb.status === 'pending').length;
    const approved = allFeedback.filter(fb => fb.status === 'approved').length;
    const rejected = allFeedback.filter(fb => fb.status === 'rejected').length;
    
    if (pendingCountBadge) pendingCountBadge.textContent = pending;
    if (approvedCountBadge) approvedCountBadge.textContent = approved;
    if (rejectedCountBadge) rejectedCountBadge.textContent = rejected;
    
    // Update browser tab title with pending count
    if (pending > 0) {
        document.title = `(${pending}) Admin Dashboard - StudyApp`;
    } else {
        document.title = 'Admin Dashboard - StudyApp';
    }
}

// Filter feedback by status
function filterFeedback(status) {
    const filteredFeedback = status === 'all' 
        ? allFeedback 
        : allFeedback.filter(fb => fb.status === status);
    
    renderFeedbackTable(filteredFeedback);
    
    // Update active filter button
    document.querySelectorAll('[data-filter]').forEach(btn => {
        if (btn.getAttribute('data-filter') === status) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Render feedback table
function renderFeedbackTable(feedbackList) {
    if (!feedbackList || feedbackList.length === 0) {
        feedbackTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="fas fa-inbox fs-1 text-muted mb-3"></i>
                    <p class="mb-0">No feedback found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    feedbackTableBody.innerHTML = feedbackList.map((feedback, index) => {
        const date = new Date(feedback.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Truncate feedback if too long
        const truncatedFeedback = feedback.comment.length > 50 
            ? feedback.comment.substring(0, 50) + '...' 
            : feedback.comment;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${feedback.userPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(feedback.userName || 'User')}" 
                             alt="${feedback.userName}" 
                             class="rounded-circle me-2" 
                             width="32" 
                             height="32">
                        <div>
                            <div class="fw-semibold">${feedback.userName || 'Anonymous'}</div>
                            <small class="text-muted">${feedback.userEmail || ''}</small>
                        </div>
                    </div>
                </td>
                <td>${feedback.courseId || 'N/A'}</td>
                <td>
                    <span class="text-warning">
                        ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}
                    </span>
                </td>
                <td>
                    <div class="feedback-preview" data-bs-toggle="tooltip" data-bs-placement="top" title="${feedback.comment.replace(/"/g, '&quot;')}">
                        ${truncatedFeedback}
                    </div>
                </td>
                <td>${formattedDate}</td>
                <td>
                    <span class="badge bg-${statusColors[feedback.status] || 'secondary'}">
                        ${statusLabels[feedback.status] || feedback.status}
                    </span>
                </td>
                <td class="text-end">
                    ${feedback.status !== 'approved' ? `
                        <button class="btn btn-sm btn-success me-1 approve-btn" data-id="${feedback.id}" data-course="${feedback.courseId}">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    ${feedback.status !== 'rejected' ? `
                        <button class="btn btn-sm btn-danger me-1 reject-btn" data-id="${feedback.id}" data-course="${feedback.courseId}">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-primary view-feedback" data-id="${feedback.id}" data-course="${feedback.courseId}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Add event listeners to action buttons
    addFeedbackActionListeners();
}

// Add event listeners to feedback action buttons
function addFeedbackActionListeners() {
    // Approve feedback
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feedbackId = e.target.closest('.approve-btn').getAttribute('data-id');
            const courseId = e.target.closest('.approve-btn').getAttribute('data-course');
            updateFeedbackStatus(feedbackId, courseId, 'approved');
        });
    });
    
    // Reject feedback
    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feedbackId = e.target.closest('.reject-btn').getAttribute('data-id');
            const courseId = e.target.closest('.reject-btn').getAttribute('data-course');
            updateFeedbackStatus(feedbackId, courseId, 'rejected');
        });
    });
    
    // View feedback details
    document.querySelectorAll('.view-feedback').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const feedbackId = e.target.closest('.view-feedback').getAttribute('data-id');
            const courseId = e.target.closest('.view-feedback').getAttribute('data-course');
            showFeedbackDetails(feedbackId, courseId);
        });
    });
}

// Update feedback status
async function updateFeedbackStatus(feedbackId, courseId, status) {
    if (!feedbackId || !courseId) {
        console.error('Missing feedbackId or courseId', { feedbackId, courseId });
        showToast('Error: Missing required information', 'error');
        return;
    }

    try {
        console.log('Updating feedback:', { feedbackId, courseId, status });
        
        // Update the status in the database
        const updates = {};
        updates[`feedback/${courseId}/${feedbackId}/status`] = status;
        updates[`feedback/${courseId}/${feedbackId}/updatedAt`] = Date.now();
        
        // Use the update function to update multiple paths
        const dbRef = ref(database);
        await update(dbRef, updates);
        
        console.log('Feedback status updated in database');
        
        // Update the local data
        const feedbackIndex = allFeedback.findIndex(fb => fb.id === feedbackId && fb.courseId === courseId);
        if (feedbackIndex !== -1) {
            allFeedback[feedbackIndex].status = status;
            allFeedback[feedbackIndex].updatedAt = Date.now();
            
            // Update the UI
            updateFeedbackCounts();
            
            // Refresh the current filter view
            const currentFilter = document.querySelector('[data-filter].active')?.getAttribute('data-filter') || 'pending';
            filterFeedback(currentFilter);
            
            showToast(`Feedback ${status} successfully`, 'success');
        } else {
            console.warn('Feedback not found in local data, reloading...');
            loadAllFeedback(); // Reload all feedback if local data is out of sync
        }
    } catch (error) {
        console.error('Error updating feedback status:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        // More specific error message based on error type
        let errorMessage = 'Failed to update feedback status';
        if (error.code === 'PERMISSION_DENIED') {
            errorMessage = 'You do not have permission to update feedback';
        } else if (error.code === 'UNAVAILABLE') {
            errorMessage = 'Network error. Please check your connection';
        }
        
        showToast(errorMessage, 'error');
    }
}

// Show feedback details in a modal
function showFeedbackDetails(feedbackId, courseId) {
    const feedback = allFeedback.find(fb => fb.id === feedbackId && fb.courseId === courseId);
    if (!feedback) return;
    
    const date = new Date(feedback.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const modalHTML = `
        <div class="modal fade" id="feedbackDetailsModal" tabindex="-1" aria-labelledby="feedbackDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="feedbackDetailsModalLabel">Feedback Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4">
                            <div class="col-md-2">
                                <img src="${feedback.userPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(feedback.userName || 'User')}" 
                                     alt="${feedback.userName}" 
                                     class="img-fluid rounded-circle">
                            </div>
                            <div class="col-md-10">
                                <h4>${feedback.userName || 'Anonymous'}</h4>
                                <p class="text-muted mb-1">${feedback.userEmail || 'No email provided'}</p>
                                <p class="mb-0">
                                    <span class="text-warning">
                                        ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}
                                    </span>
                                    <span class="ms-2">${formattedDate}</span>
                                </p>
                            </div>
                        </div>
                        <div class="mb-4">
                            <h5>Feedback</h5>
                            <div class="p-3 bg-light rounded">
                                ${feedback.comment.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        <div class="mb-3">
                            <h5>Course: ${feedback.courseId || 'N/A'}</h5>
                        </div>
                        <div class="mb-3">
                            <h5>Status</h5>
                            <span class="badge bg-${statusColors[feedback.status] || 'secondary'}">
                                ${statusLabels[feedback.status] || feedback.status}
                            </span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${feedback.status !== 'approved' ? `
                            <button type="button" class="btn btn-success approve-btn" 
                                data-id="${feedback.id}" data-course="${feedback.courseId}">
                                <i class="fas fa-check me-1"></i> Approve
                            </button>
                        ` : ''}
                        ${feedback.status !== 'rejected' ? `
                            <button type="button" class="btn btn-danger reject-btn" 
                                data-id="${feedback.id}" data-course="${feedback.courseId}">
                                <i class="fas fa-times me-1"></i> Reject
                            </button>
                        ` : ''}
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('feedbackDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to the page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize the modal
    const modal = new bootstrap.Modal(document.getElementById('feedbackDetailsModal'));
    modal.show();
    
    // Add event listeners to modal buttons
    document.getElementById('feedbackDetailsModal').addEventListener('shown.bs.modal', function () {
        // Approve button in modal
        const approveBtn = this.querySelector('.approve-btn');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                const feedbackId = approveBtn.getAttribute('data-id');
                const courseId = approveBtn.getAttribute('data-course');
                updateFeedbackStatus(feedbackId, courseId, 'approved');
                modal.hide();
            });
        }
        
        // Reject button in modal
        const rejectBtn = this.querySelector('.reject-btn');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                const feedbackId = rejectBtn.getAttribute('data-id');
                const courseId = rejectBtn.getAttribute('data-course');
                updateFeedbackStatus(feedbackId, courseId, 'rejected');
                modal.hide();
            });
        }
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    
    toast.show();
    
    // Remove toast from DOM after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function () {
        toastElement.remove();
    });
}

// Initialize the feedback management
function initFeedbackManagement() {
    // Add filter button click handlers
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.getAttribute('data-filter');
            filterFeedback(filter);
        });
    });
    
    // Load all feedback
    loadAllFeedback();
    
    // Listen for new feedback in real-time
    const feedbackRef = ref(database, 'feedback');
    onValue(feedbackRef, (snapshot) => {
        // This will trigger whenever feedback is added, updated, or removed
        // The loadAllFeedback function will handle the update
    });
}

// Show error message in the UI
function showError(message) {
    const feedbackTableBody = document.getElementById('feedbackTableBody');
    if (feedbackTableBody) {
        feedbackTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-circle fa-2x mb-2"></i>
                    <p class="mb-0">${message}</p>
                    <button class="btn btn-sm btn-outline-primary mt-2" onclick="location.reload()">
                        <i class="fas fa-sync-alt me-1"></i> Try Again
                    </button>
                </td>
            </tr>
        `;
    }
    
    // Also show toast notification
    showToast(message, 'error');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing feedback...');
    
    // Check if we're on the feedback page
    if (window.location.hash === '#feedback' || document.getElementById('feedback-section')) {
        console.log('Feedback section found, initializing...');
        try {
            initFeedbackManagement();
        } catch (error) {
            console.error('Error initializing feedback management:', error);
            showError('Failed to initialize feedback system');
        }
    }
});

// Handle hash changes to show the correct section
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#feedback') {
        console.log('Hash changed to #feedback, initializing...');
        try {
            initFeedbackManagement();
        } catch (error) {
            console.error('Error initializing feedback management on hash change:', error);
            showError('Failed to load feedback section');
        }
    }
});

// Export functions for debugging
window.adminFeedback = {
    loadAllFeedback,
    filterFeedback,
    updateFeedbackStatus,
    showFeedbackDetails
};
