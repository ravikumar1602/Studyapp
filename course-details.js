document.addEventListener('DOMContentLoaded', function() {
    // Get course ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');
    
    if (!courseId) {
        window.location.href = 'courses.html';
        return;
    }
    
    // Get course data from localStorage
    const courses = JSON.parse(localStorage.getItem('courses')) || [];
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
        document.getElementById('subjectsList').innerHTML = `
            <div class="alert alert-warning">
                Course not found. <a href="courses.html" class="alert-link">Browse all courses</a>
            </div>`;
        return;
    }
    
    // Display course details
    document.title = `${course.name} | StudyApp`;
    document.getElementById('courseTitle').textContent = course.name;
    document.getElementById('courseDescription').textContent = course.description;
    document.getElementById('courseBanner').src = course.image || 'https://placehold.co/1200x400?text=Course+Banner';
    document.getElementById('instructorName').textContent = course.instructor;
    document.getElementById('courseDuration').textContent = `${course.duration} weeks`;
    document.getElementById('courseStudents').textContent = course.students || 0;
    document.getElementById('coursePrice').textContent = course.price ? `₹${course.price.toLocaleString()}` : 'Free';
    
    // Set instructor image (using UI Avatars as fallback)
    const instructorInitials = course.instructor.split(' ').map(n => n[0]).join('');
    document.getElementById('instructorImage').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(instructorInitials)}&background=0D8ABC&color=fff`;
    
    // Display subjects and videos
    renderSubjects(course.subjects || []);
    
    // Function to handle enrollment
    function handleEnrollment() {
        const enrollBtn = document.getElementById('enrollBtn');
        if (!enrollBtn) return;

        // Disable button to prevent multiple clicks
        enrollBtn.disabled = true;
        enrollBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';
        
        try {
            // Check if user is logged in
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            
            if (!isLoggedIn || !currentUser) {
                // If not logged in, redirect to login page with return URL
                const returnUrl = encodeURIComponent(window.location.href);
                window.location.href = `login.html?returnUrl=${returnUrl}&enroll=true`;
                return;
            }
            
            // Get or initialize enrollments
            let enrollments = JSON.parse(localStorage.getItem('userEnrollments') || '{}');
            if (!enrollments[currentUser.id]) {
                enrollments[currentUser.id] = [];
            }
            
            const isEnrolled = enrollments[currentUser.id].includes(courseId);
            
            if (isEnrolled) {
                // If already enrolled, go to course content
                window.location.href = `study.html?courseId=${courseId}`;
            } else {
                // If free course, enroll directly
                if (!course.price || course.price === 0) {
                    enrollments[currentUser.id].push(courseId);
                    localStorage.setItem('userEnrollments', JSON.stringify(enrollments));
                    
                    // Update course student count
                    course.students = (course.students || 0) + 1;
                    const courseIndex = courses.findIndex(c => c.id === courseId);
                    if (courseIndex !== -1) {
                        courses[courseIndex] = course;
                        localStorage.setItem('courses', JSON.stringify(courses));
                    }
                    
                    // Show success message
                    alert('Successfully enrolled in the course!');
                    updateEnrollButton();
                    window.location.href = `study.html?courseId=${courseId}`;
                } else {
                    // For paid courses, redirect to checkout
                    window.location.href = `checkout.html?courseId=${courseId}`;
                }
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            // Re-enable button
            if (enrollBtn) {
                updateEnrollButton();
            }
        }
    }
    
    // Add click event listener to enroll button
    const enrollBtn = document.getElementById('enrollBtn');
    if (enrollBtn) {
        enrollBtn.addEventListener('click', handleEnrollment);
    }
    
    // Update button text and state based on enrollment status
    function updateEnrollButton() {
        const enrollBtn = document.getElementById('enrollBtn');
        if (!enrollBtn) return;
        
        try {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            
            if (!isLoggedIn || !currentUser) {
                enrollBtn.textContent = 'Enroll Now';
                enrollBtn.className = 'btn btn-primary w-100';
                enrollBtn.disabled = false;
                return;
            }
            
            const enrollments = JSON.parse(localStorage.getItem('userEnrollments') || '{}');
            const isEnrolled = enrollments[currentUser.id] && enrollments[currentUser.id].includes(courseId);
            
            if (isEnrolled) {
                enrollBtn.innerHTML = '<i class="fas fa-play-circle me-2"></i>Continue Learning';
                enrollBtn.className = 'btn btn-success w-100';
            } else if (course.price && course.price > 0) {
                enrollBtn.innerHTML = `<i class="fas fa-shopping-cart me-2"></i>Enroll Now - ₹${course.price.toLocaleString()}`;
                enrollBtn.className = 'btn btn-primary w-100';
            } else {
                enrollBtn.innerHTML = '<i class="fas fa-user-plus me-2"></i>Enroll for Free';
                enrollBtn.className = 'btn btn-primary w-100';
            }
            enrollBtn.disabled = false;
        } catch (error) {
            console.error('Error updating enroll button:', error);
            enrollBtn.textContent = 'Enroll Now';
            enrollBtn.className = 'btn btn-primary w-100';
            enrollBtn.disabled = false;
        }
    }
    
    // Initial button update
    updateEnrollButton();
    
    // Initialize video modal
    const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
    document.getElementById('videoModal').addEventListener('hidden.bs.modal', function() {
        const iframe = document.getElementById('videoFrame');
        iframe.src = ''; // Stop video when modal is closed
    });
    
    // Handle video play
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('play-video')) {
            e.preventDefault();
            const videoUrl = e.target.dataset.videoUrl;
            const videoTitle = e.target.dataset.videoTitle;
            
            if (videoUrl) {
                document.getElementById('videoModalLabel').textContent = videoTitle;
                const videoFrame = document.getElementById('videoFrame');
                
                // Handle different video platforms
                let embedUrl = videoUrl;
                
                // YouTube
                if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                    let videoId = '';
                    if (videoUrl.includes('v=')) {
                        videoId = videoUrl.split('v=')[1].split('&')[0];
                    } else if (videoUrl.includes('youtu.be/')) {
                        videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
                    }
                    
                    if (videoId) {
                        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                    }
                } 
                // Vimeo
                else if (videoUrl.includes('vimeo.com')) {
                    const videoId = videoUrl.split('vimeo.com/')[1].split('?')[0];
                    embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
                }
                
                videoFrame.src = embedUrl;
                videoModal.show();
            }
        }
    });
});

// Render subjects and videos
function renderSubjects(subjects) {
    const container = document.getElementById('subjectsList');
    
    if (!subjects || subjects.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                No subjects available for this course yet. Please check back later.
            </div>`;
        document.getElementById('subjectCount').textContent = '0';
        return;
    }
    
    // Update subject count
    document.getElementById('subjectCount').textContent = subjects.length;
    
    // Create subject accordion
    let html = '<div class="accordion" id="subjectsAccordion">';
    
    subjects.forEach((subject, index) => {
        const isFirst = index === 0;
        const collapsedClass = isFirst ? '' : 'collapsed';
        const showClass = isFirst ? 'show' : '';
        const expanded = isFirst ? 'true' : 'false';
        
        html += `
        <div class="card mb-3">
            <div class="card-header bg-light" id="heading${index}">
                <h2 class="mb-0">
                    <button class="btn btn-link btn-block text-start ${collapsedClass}" 
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#collapse${index}" 
                            aria-expanded="${expanded}" 
                            aria-controls="collapse${index}">
                        <i class="fas fa-book me-2"></i>
                        ${subject.name}
                        <span class="badge bg-secondary ms-2">${subject.videos?.length || 0} videos</span>
                    </button>
                </h2>
            </div>
            <div id="collapse${index}" 
                 class="collapse ${showClass}" 
                 aria-labelledby="heading${index}" 
                 data-bs-parent="#subjectsAccordion">
                <div class="card-body">
                    ${subject.description ? `<p class="text-muted mb-3">${subject.description}</p>` : ''}
                    <div class="list-group">
                        ${renderVideos(subject.videos || [])}
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Render videos list
function renderVideos(videos) {
    if (!videos || videos.length === 0) {
        return '<div class="text-muted p-3">No videos available for this subject.</div>';
    }
    
    return videos.map((video, index) => `
        <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
           data-video-url="${video.url}" data-video-title="${video.title}">
            <div class="d-flex align-items-center">
                <div class="me-3 text-muted">${index + 1}.</div>
                <div>
                    <h6 class="mb-0">${video.title}</h6>
                    <small class="text-muted">${getVideoDuration()}</small>
                </div>
            </div>
            <button class="btn btn-sm btn-outline-primary play-video" 
                    data-video-url="${video.url}"
                    data-video-title="${video.title}">
                <i class="fas fa-play"></i> Play
            </button>
        </a>`).join('');
}

// Helper function to generate random video duration (for demo)
function getVideoDuration() {
    const minutes = Math.floor(Math.random() * 15) + 5; // 5-20 minutes
    return `${minutes} min`;
}

// Handle video playback
function playVideo(url, title) {
    const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
    const videoFrame = document.getElementById('videoFrame');
    
    document.getElementById('videoModalLabel').textContent = title;
    
    // In a real app, you would handle different video platforms here
    // For now, we'll just use a placeholder
    videoFrame.src = url;
    videoModal.show();
}
