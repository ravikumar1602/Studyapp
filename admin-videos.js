// Import Firebase database
import { database } from './firebase-config.js';

// Admin Videos Management
let allVideos = [];
let courses = [];

// DOM Elements
const videosTableBody = document.getElementById('videosTableBody');
const addVideoBtn = document.getElementById('addVideoBtn');

// Reference to the courses in Firebase
const coursesRef = database.ref('courses');

// Initialize the videos page
document.addEventListener('DOMContentLoaded', function() {
    // Load courses from Firebase
    loadCourses().then(() => {
        // Check if we're on the videos page
        if (window.location.hash === '#videos') {
            loadAllVideos();
        }
    });
    
    // Add event listener for hash change to load videos when navigating to the videos section
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#videos') {
            loadAllVideos();
        }
    });
    
    // Add event listener for the add video button
    if (addVideoBtn) {
        addVideoBtn.addEventListener('click', showAddVideoForm);
    }
    
    // Event delegation for delete buttons
    document.addEventListener('click', function(event) {
        const deleteBtn = event.target.closest('.delete-video-btn');
        if (deleteBtn) {
            event.preventDefault();
            const videoId = deleteBtn.dataset.videoId;
            const courseId = deleteBtn.dataset.courseId;
            if (videoId && courseId) {
                deleteVideo(videoId, courseId, event);
            }
        }
    });
});

// Load courses from Firebase
async function loadCourses() {
    try {
        const snapshot = await coursesRef.once('value');
        const coursesData = snapshot.val() || {};
        
        // Convert to array and add id
        courses = Object.keys(coursesData).map(key => ({
            id: key,
            ...coursesData[key]
        }));
        
        return courses;
    } catch (error) {
        console.error('Error loading courses:', error);
        alert('Failed to load courses. Please try again.');
        return [];
    }
}

// Load all videos from all courses
function loadAllVideos() {
    allVideos = [];
    
    // Flatten videos from all courses
    courses.forEach(course => {
        if (course.videos) {
            Object.keys(course.videos).forEach(videoId => {
                const video = course.videos[videoId];
                allVideos.push({
                    ...video,
                    id: videoId,
                    courseId: course.id,
                    courseName: course.name
                });
            });
        }
    });
    
    renderVideosTable();
}

// Render videos in the table
function renderVideosTable() {
    if (!videosTableBody) return;
    
    if (allVideos.length === 0) {
        videosTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fas fa-video-slash fa-3x mb-3"></i>
                        <p>No videos found</p>
                    </div>
                </td>
            </tr>`;
        return;
    }
    
    videosTableBody.innerHTML = allVideos.map(video => {
        // Ensure we have valid data
        const videoId = video.id || '';
        const courseId = video.courseId || '';
        const title = video.title || 'Untitled Video';
        const courseName = video.courseName || 'N/A';
        const duration = video.duration || 'N/A';
        const url = video.url || '';
        const safeTitle = title.replace(/'/g, "\\'");
        const safeUrl = url ? url.replace(/'/g, "\\'") : '#';
        const videoType = getVideoType(url);
        const addedDate = video.addedDate ? new Date(video.addedDate).toLocaleDateString() : 'N/A';
        
        return `
            <tr data-video-id="${videoId}" data-course-id="${courseId}">
                <td>${title}</td>
                <td>${courseName}</td>
                <td>${duration}</td>
                <td>${videoType}</td>
                <td>${addedDate}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="playVideo('${safeUrl}', '${safeTitle}')" ${!url ? 'disabled' : ''}>
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary me-2" onclick="editVideo('${videoId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-video-btn" data-video-id="${videoId}" data-course-id="${courseId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Get video type from URL
function getVideoType(url) {
    if (!url) return 'Unknown';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'YouTube';
    } else if (url.includes('drive.google.com')) {
        return 'Google Drive';
    } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
        return 'Direct Video';
    }
    
    return 'Link';
}

// Show add video form
function showAddVideoForm() {
    if (courses.length === 0) {
        alert('Please create a course first before adding videos.');
        return;
    }
    
    const courseOptions = courses.map(course => 
        `<option value="${course.id}">${course.name}</option>`
    ).join('');
    
    const formHtml = `
        <div class="modal fade" id="videoFormModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add New Video</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="videoForm">
                            <div class="mb-3">
                                <label for="videoTitle" class="form-label">Video Title</label>
                                <input type="text" class="form-control" id="videoTitle" required>
                            </div>
                            <div class="mb-3">
                                <label for="videoSubject" class="form-label">Subject (Optional)</label>
                                <input type="text" class="form-control" id="videoSubject" placeholder="e.g., Mathematics, Physics, etc.">
                                <div class="form-text">Leave blank if not applicable</div>
                            </div>
                            <div class="mb-3">
                                <label for="videoCourse" class="form-label">Course</label>
                                <select class="form-select" id="videoCourse" required>
                                    <option value="">Select a course</option>
                                    ${courseOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="videoUrl" class="form-label">Video URL</label>
                                <input type="url" class="form-control" id="videoUrl" placeholder="https://youtube.com/... or https://drive.google.com/..." required>
                                <div class="form-text">Supported: YouTube, Google Drive, or direct video links</div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="videoDuration" class="form-label">Duration (HH:MM:SS)</label>
                                    <input type="text" class="form-control" id="videoDuration" placeholder="00:00:00" pattern="^([0-9]{1,2}:)?[0-9]{1,2}:[0-9]{2}$" required>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveVideoBtn">Save Video</button>
                    </div>
                </div>
            </div>
        </div>`;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('videoFormModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', formHtml);
    
    // Initialize modal
    const videoModal = new bootstrap.Modal(document.getElementById('videoFormModal'));
    videoModal.show();
    
        // Add event listener for save button with error handling
    const saveBtn = document.getElementById('saveVideoBtn');
    if (saveBtn) {
        // Remove any existing event listeners to prevent duplicates
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        // Add new event listener
        newSaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveVideo().catch(error => {
                console.error('Error in saveVideo:', error);
                alert('An error occurred while saving the video. Please check the console for details.');
            });
        });
    }
    
    // Clean up when modal is closed
    const modal = document.getElementById('videoFormModal');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }
}

// Save video to course
async function saveVideo() {
    console.log('saveVideo function called');
    
    const title = document.getElementById('videoTitle')?.value.trim();
    const courseId = document.getElementById('videoCourse')?.value;
    const url = document.getElementById('videoUrl')?.value.trim();
    const duration = document.getElementById('videoDuration')?.value.trim();
    const subject = document.getElementById('videoSubject')?.value.trim() || '';
    
    console.log('Form values:', { title, courseId, url, duration, subject });
    
    if (!title || !courseId || !url || !duration) {
        const missingFields = [];
        if (!title) missingFields.push('title');
        if (!courseId) missingFields.push('course');
        if (!url) missingFields.push('URL');
        if (!duration) missingFields.push('duration');
        
        alert(`Please fill in all required fields. Missing: ${missingFields.join(', ')}`);
        return false;
    }
    
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
        alert('Selected course not found.');
        return;
    }
    
    try {
        const courseRef = database.ref(`courses/${courseId}`);
        const videoId = database.ref().child('videos').push().key;
        
        const newVideo = {
            title: title,
            url: url,
            duration: duration,
            addedDate: new Date().toISOString(),
            subject: subject || null
        };
        
        // Add video to the course's videos in Firebase
        const videoRef = courseRef.child('videos').child(videoId);
        await videoRef.set(newVideo);
        
        // Reload courses and videos
        await loadCourses();
        loadAllVideos();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('videoFormModal'));
        modal.hide();
        
        // Show success message
        console.log('Video added successfully');
        showToast('Success', 'Video added successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error saving video:', error);
        showToast('Error', `Failed to save video: ${error.message}`, 'danger');
        return false;
    }
}

// Edit video
async function editVideo(videoId) {
    try {
        // Find the video in allVideos array
        const video = allVideos.find(v => v.id === videoId);
        
        if (!video) {
            alert('Video not found');
            return;
        }
        
        // Get the course of the video
        const course = courses.find(c => c.id === video.courseId);
        if (!course) {
            alert('Course not found');
            return;
        }
        
        // Get all courses for the dropdown
        const courseOptions = courses.map(c => 
            `<option value="${c.id}" ${c.id === video.courseId ? 'selected' : ''}>${c.name || 'Untitled Course'}</option>`
        ).join('');
        
        const formHtml = `
            <div class="modal fade" id="editVideoModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Video</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editVideoForm">
                                <div class="mb-3">
                                    <label for="editVideoTitle" class="form-label">Video Title</label>
                                    <input type="text" class="form-control" id="editVideoTitle" value="${video.title.replace(/"/g, '&quot;')}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editVideoSubject" class="form-label">Subject (Optional)</label>
                                    <input type="text" class="form-control" id="editVideoSubject" 
                                           value="${(video.subject || '').replace(/"/g, '&quot;')}" 
                                           placeholder="e.g., Mathematics, Physics, etc.">
                                    <div class="form-text">Leave blank if not applicable</div>
                                </div>
                                <div class="mb-3">
                                    <label for="editVideoCourse" class="form-label">Course</label>
                                    <select class="form-select" id="editVideoCourse" required>
                                        <option value="">Select a course</option>
                                        ${courseOptions}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="editVideoUrl" class="form-label">Video URL</label>
                                    <input type="url" class="form-control" id="editVideoUrl" value="${video.url.replace(/"/g, '&quot;')}" required>
                                    <div class="form-text">Supported: YouTube, Google Drive, or direct video links</div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="editVideoDuration" class="form-label">Duration (HH:MM:SS)</label>
                                        <input type="text" class="form-control" id="editVideoDuration" value="${video.duration.replace(/"/g, '&quot;')}" pattern="^([0-9]{1,2}:)?[0-9]{1,2}:[0-9]{2}$" required>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="updateVideoBtn">Update Video</button>
                        </div>
                    </div>
                </div>
            </div>`;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('editVideoModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', formHtml);
        
        // Initialize modal
        const editModal = new bootstrap.Modal(document.getElementById('editVideoModal'));
        editModal.show();
        
        // Add event listener for update button
        document.getElementById('updateVideoBtn').addEventListener('click', () => {
            updateVideo(videoId, video.courseId);
        });
        
        // Clean up when modal is closed
        document.getElementById('editVideoModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
        
    } catch (error) {
        console.error('Error in editVideo:', error);
        showToast('Error', 'Failed to load video editor', 'danger');
    }
}

// Update video
async function updateVideo(videoId, oldCourseId) {
    try {
        console.log('updateVideo called with:', { videoId, oldCourseId });
        
        const title = document.getElementById('editVideoTitle').value.trim();
        const courseId = document.getElementById('editVideoCourse').value;
        const url = document.getElementById('editVideoUrl').value.trim();
        const duration = document.getElementById('editVideoDuration').value.trim();
        const subject = document.getElementById('editVideoSubject')?.value.trim() || '';
        
        if (!title || !courseId || !url || !duration) {
            const missingFields = [];
            if (!title) missingFields.push('title');
            if (!courseId) missingFields.push('course');
            if (!url) missingFields.push('URL');
            if (!duration) missingFields.push('duration');
            
            showToast('Error', `Please fill in all required fields. Missing: ${missingFields.join(', ')}`, 'danger');
            return;
        }
        
        const videoRef = database.ref(`courses/${courseId}/videos/${videoId}`);
        const oldVideoRef = database.ref(`courses/${oldCourseId}/videos/${videoId}`);
        
        const updatedVideo = {
            title,
            subject: subject || null,
            url,
            duration,
            updatedAt: new Date().toISOString()
        };
        
        // If course changed, move the video to the new course
        if (oldCourseId !== courseId) {
            // First get the existing video data
            const snapshot = await oldVideoRef.once('value');
            const videoData = snapshot.val();
            
            if (!videoData) {
                throw new Error('Video not found in the old course');
            }
            
            // Add to new course
            await videoRef.set({
                ...videoData,
                ...updatedVideo
            });
            
            // Remove from old course
            await oldVideoRef.remove();
        } else {
            // Update in same course
            await videoRef.update(updatedVideo);
        }
        
        // Reload data
        await loadCourses();
        loadAllVideos();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editVideoModal'));
        if (modal) {
            modal.hide();
        }
        
        showToast('Success', 'Video updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating video:', error);
        showToast('Error', `Failed to update video: ${error.message}`, 'danger');
    }
}

// Delete video
async function deleteVideo(videoId, courseId, event) {
    try {
        // Create a custom confirmation dialog
        const confirmed = await new Promise((resolve) => {
            // Generate unique IDs for this modal instance
            const modalId = `confirmDeleteModal_${Date.now()}`;
            const confirmBtnId = `confirmDeleteBtn_${Date.now()}`;
            const cancelBtnId = `cancelDeleteBtn_${Date.now()}`;
            
            const modalHtml = `
                <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Confirm Deletion</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                Are you sure you want to delete this video? This action cannot be undone.
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" id="${cancelBtnId}">Cancel</button>
                                <button type="button" class="btn btn-danger" id="${confirmBtnId}">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            
            // Remove existing modals if any
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.id.startsWith('confirmDeleteModal_')) {
                    bootstrap.Modal.getInstance(modal)?.dispose();
                    modal.remove();
                }
            });
            
            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modalEl = document.getElementById(modalId);
            const modal = new bootstrap.Modal(modalEl, {
                backdrop: 'static',
                keyboard: false
            });
            
            // Show the modal
            modal.show();
            
            // Function to clean up and resolve
            const cleanupAndResolve = (result) => {
                modal.hide();
                modalEl.remove();
                resolve(result);
            };
            
            // Set up event listeners for the modal buttons
            const confirmBtn = document.getElementById(confirmBtnId);
            const cancelBtn = document.getElementById(cancelBtnId);
            
            const confirmHandler = () => cleanupAndResolve(true);
            const cancelHandler = () => cleanupAndResolve(false);
            
            confirmBtn.addEventListener('click', confirmHandler);
            cancelBtn.addEventListener('click', cancelHandler);
            
            // Handle modal close via backdrop click or ESC key
            const hiddenHandler = () => {
                modalEl.removeEventListener('hidden.bs.modal', hiddenHandler);
                modal.dispose();
                modalEl.remove();
                resolve(false);
            };
            
            modalEl.addEventListener('hidden.bs.modal', hiddenHandler);
            
            // Clean up event listeners when done
            return () => {
                confirmBtn.removeEventListener('click', confirmHandler);
                cancelBtn.removeEventListener('click', cancelHandler);
                modalEl.removeEventListener('hidden.bs.modal', hiddenHandler);
            };
        });
        
        if (!confirmed) {
            return;
        }
        
        console.log('Deleting video:', { videoId, courseId });
        
        // Get the button that was clicked
        const deleteBtn = event?.target.closest('button');
        const originalHtml = deleteBtn?.innerHTML;
        
        // Show loading state
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        }
        
        // Delete from Firebase
        const videoRef = database.ref(`courses/${courseId}/videos/${videoId}`);
        await videoRef.remove();
        
        // Update the UI immediately
        const videoRow = document.querySelector(`tr[data-video-id="${videoId}"]`);
        if (videoRow) {
            videoRow.remove();
        }
        
        // Show success message
        showToast('Success', 'Video deleted successfully!', 'success');
        
        // Reload the videos list to ensure consistency
        setTimeout(async () => {
            try {
                await loadCourses();
                loadAllVideos();
            } catch (error) {
                console.error('Error refreshing videos:', error);
            }
        }, 500);
        
    } catch (error) {
        console.error('Error deleting video:', error);
        showToast('Error', `Failed to delete video: ${error.message}`, 'danger');
    } finally {
        // Reset button state if the button still exists
        if (event && event.target) {
            const deleteBtn = event.target.closest('button');
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            }
        }
    }
}

// Global video player functions
window.playVideo = function(url, title) {
    try {
        console.log('playVideo called with:', { url, title });
        
        if (!url) {
            console.error('No URL provided for video');
            alert('No video URL provided');
            return;
        }

        // Convert URLs to proper embed format
        let videoUrl = url;
        
        // Handle YouTube URLs
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            
            // Extract video ID from different YouTube URL formats
            if (url.includes('youtube.com/watch?v=')) {
                // Standard YouTube watch URL
                const match = url.match(/[?&]v=([^&]+)/);
                if (match && match[1]) {
                    videoId = match[1].split('&')[0]; // Get only the video ID, remove any parameters
                }
            } else if (url.includes('youtu.be/')) {
                // Short YouTube URL
                const match = url.match(/youtu.be\/([^?&]+)/);
                if (match && match[1]) {
                    videoId = match[1];
                }
            } else if (url.includes('youtube.com/embed/')) {
                // Already an embed URL
                videoId = url.split('/embed/')[1].split('?')[0];
            } else if (url.includes('youtube.com/live/')) {
                // YouTube Live URL
                const match = url.match(/youtube.com\/live\/([^?&]+)/);
                if (match && match[1]) {
                    videoId = match[1].split('?')[0];
                }
            }
            
            if (videoId) {
                if (url.includes('youtube.com/live/')) {
                    // For live streams, use the live URL with the video ID
                    videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
                } else {
                    // For regular videos
                    videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
                }
            } else {
                console.error('Invalid YouTube URL format');
                alert('Invalid YouTube URL format');
                return;
            }
        } 
        // Handle Google Drive URLs
        else if (url.includes('drive.google.com/file/d/')) {
            // Convert Google Drive file view URL to embed URL
            const fileMatch = url.match(/\/file\/d\/([^\/]+)/);
            if (fileMatch && fileMatch[1]) {
                videoUrl = `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
            } else {
                console.error('Invalid Google Drive URL format');
                alert('Invalid Google Drive URL format');
                return;
            }
        }
        
        // Create or get modal
        let modal = document.getElementById('videoPlayerModal');
        let modalInstance = null;
        
        if (modal) {
            // Update existing modal
            const titleEl = modal.querySelector('.modal-title');
            if (titleEl && title) titleEl.textContent = title;
        } else {
            // Create new modal
            modal = document.createElement('div');
            modal.id = 'videoPlayerModal';
            modal.className = 'modal fade';
            modal.tabIndex = '-1';
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title || 'Video Player'}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center p-0">
                            <div class="ratio ratio-16x9">
                                <iframe id="videoFrame" src="" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen>
                                </iframe>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Initialize modal
            modalInstance = new bootstrap.Modal(modal);
        }
        
        // Update video source
        const videoFrame = document.getElementById('videoFrame');
        if (videoFrame) {
            console.log('Setting video source to:', videoUrl);
            videoFrame.src = videoUrl;
        }
        
        // Show the modal
        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(modal);
        }
        modalInstance.show();
        
        // Clean up when modal is closed
        modal.addEventListener('hidden.bs.modal', function () {
            const frame = document.getElementById('videoFrame');
            if (frame) {
                frame.src = '';
            }
            // Remove modal from DOM to prevent multiple instances
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 500);
        });
        
    } catch (error) {
        console.error('Error in playVideo:', error);
        alert('Error playing video: ' + error.message);
    }
};

// Make functions available globally
window.playVideo = playVideo;
window.editVideo = editVideo;
window.deleteVideo = deleteVideo;

// Show toast notification
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${title}</strong><br>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    
    bsToast.show();
    
    // Remove toast from DOM after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Create toast container if it doesn't exist
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1100';
    document.body.appendChild(container);
    return container;
}
window.loadAllVideos = loadAllVideos;
