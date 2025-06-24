// Admin Videos Management
let allVideos = [];

// DOM Elements
const videosTableBody = document.getElementById('videosTableBody');
const addVideoBtn = document.getElementById('addVideoBtn');

// Initialize the videos page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the videos page
    if (window.location.hash === '#videos') {
        loadAllVideos();
    }
    
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
});

// Load all videos from all courses
function loadAllVideos() {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    allVideos = [];
    
    // Flatten videos from all courses
    courses.forEach(course => {
        if (course.videos && course.videos.length > 0) {
            course.videos.forEach(video => {
                allVideos.push({
                    ...video,
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
    
    videosTableBody.innerHTML = allVideos.map(video => `
        <tr data-video-id="${video.id}" data-course-id="${video.courseId}">
            <td>${video.title || 'Untitled Video'}</td>
            <td>${video.courseName || 'N/A'}</td>
            <td>${video.duration || 'N/A'}</td>
            <td>${getVideoType(video.url)}</td>
            <td>${new Date(video.addedDate).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="playVideo('${video.url.replace(/'/g, "\\'")}', '${(video.title || 'Video').replace(/'/g, "\\'")}')">
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary me-2" onclick="editVideo('${video.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteVideo('${video.id}', '${video.courseId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
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
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    
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
    
    // Add event listener for save button
    document.getElementById('saveVideoBtn').addEventListener('click', saveVideo);
    
    // Clean up when modal is closed
    document.getElementById('videoFormModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Save video to course
function saveVideo() {
    const title = document.getElementById('videoTitle').value.trim();
    const courseId = document.getElementById('videoCourse').value;
    const url = document.getElementById('videoUrl').value.trim();
    const duration = document.getElementById('videoDuration').value.trim();
    
    if (!title || !courseId || !url || !duration) {
        alert('Please fill in all required fields.');
        return;
    }
    
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
        alert('Selected course not found.');
        return;
    }
    
    // Initialize videos array if it doesn't exist
    if (!courses[courseIndex].videos) {
        courses[courseIndex].videos = [];
    }
    
    const newVideo = {
        id: Date.now().toString(),
        title: title,
        url: url,
        duration: duration,
        addedDate: new Date().toISOString()
    };
    
    // Add video to course
    courses[courseIndex].videos.push(newVideo);
    
    // Save to localStorage
    localStorage.setItem('courses', JSON.stringify(courses));
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('videoFormModal'));
    modal.hide();
    
    // Reload videos
    loadAllVideos();
    
    // Show success message
    alert('Video added successfully!');
}

// Edit video
function editVideo(videoId) {
    const video = allVideos.find(v => v.id === videoId);
    if (!video) return;
    
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const courseOptions = courses.map(course => 
        `<option value="${course.id}" ${course.id === video.courseId ? 'selected' : ''}>${course.name}</option>`
    ).join('');
    
    const formHtml = `
        <div class="modal fade" id="videoFormModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Video</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="videoForm">
                            <div class="mb-3">
                                <label for="videoTitle" class="form-label">Video Title</label>
                                <input type="text" class="form-control" id="videoTitle" value="${video.title || ''}" required>
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
                                <input type="url" class="form-control" id="videoUrl" value="${video.url || ''}" required>
                                <div class="form-text">Supported: YouTube, Google Drive, or direct video links</div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="videoDuration" class="form-label">Duration (HH:MM:SS)</label>
                                    <input type="text" class="form-control" id="videoDuration" value="${video.duration || '00:00:00'}" pattern="^([0-9]{1,2}:)?[0-9]{1,2}:[0-9]{2}$" required>
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
    const existingModal = document.getElementById('videoFormModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', formHtml);
    
    // Initialize modal
    const videoModal = new bootstrap.Modal(document.getElementById('videoFormModal'));
    videoModal.show();
    
    // Add event listener for update button
    document.getElementById('updateVideoBtn').addEventListener('click', function() {
        updateVideo(videoId, video.courseId);
    });
    
    // Clean up when modal is closed
    document.getElementById('videoFormModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// Update video
function updateVideo(videoId, oldCourseId) {
    const title = document.getElementById('videoTitle').value.trim();
    const newCourseId = document.getElementById('videoCourse').value;
    const url = document.getElementById('videoUrl').value.trim();
    const duration = document.getElementById('videoDuration').value.trim();
    
    if (!title || !newCourseId || !url || !duration) {
        alert('Please fill in all required fields.');
        return;
    }
    
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    
    // Find the video in the old course and remove it
    const oldCourseIndex = courses.findIndex(c => c.id === oldCourseId);
    if (oldCourseIndex !== -1 && courses[oldCourseIndex].videos) {
        const videoIndex = courses[oldCourseIndex].videos.findIndex(v => v.id === videoId);
        if (videoIndex !== -1) {
            // If moving to a different course, remove from old course
            if (oldCourseId !== newCourseId) {
                const [video] = courses[oldCourseIndex].videos.splice(videoIndex, 1);
                
                // Update video details
                video.title = title;
                video.url = url;
                video.duration = duration;
                
                // Add to new course
                const newCourseIndex = courses.findIndex(c => c.id === newCourseId);
                if (newCourseIndex !== -1) {
                    if (!courses[newCourseIndex].videos) {
                        courses[newCourseIndex].videos = [];
                    }
                    courses[newCourseIndex].videos.push(video);
                }
            } else {
                // Just update the video in the same course
                courses[oldCourseIndex].videos[videoIndex] = {
                    ...courses[oldCourseIndex].videos[videoIndex],
                    title: title,
                    url: url,
                    duration: duration
                };
            }
            
            // Save changes
            localStorage.setItem('courses', JSON.stringify(courses));
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('videoFormModal'));
            modal.hide();
            
            // Reload videos
            loadAllVideos();
            
            // Show success message
            alert('Video updated successfully!');
            return;
        }
    }
    
    alert('Failed to update video. Please try again.');
}

// Delete video
function deleteVideo(videoId, courseId) {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
        return;
    }
    
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex !== -1 && courses[courseIndex].videos) {
        const videoIndex = courses[courseIndex].videos.findIndex(v => v.id === videoId);
        
        if (videoIndex !== -1) {
            // Remove the video
            courses[courseIndex].videos.splice(videoIndex, 1);
            
            // Save changes
            localStorage.setItem('courses', JSON.stringify(courses));
            
            // Reload videos
            loadAllVideos();
            
            // Show success message
            alert('Video deleted successfully!');
            return;
        }
    }
    
    alert('Failed to delete video. Please try again.');
}

// Make functions available globally
window.playVideo = playVideo;
window.editVideo = editVideo;
window.deleteVideo = deleteVideo;
window.loadAllVideos = loadAllVideos;
