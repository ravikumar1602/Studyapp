// Course Manager - Handles all Firebase operations for courses

document.addEventListener('DOMContentLoaded', function() {
    // Initialize modals
    const addCourseModal = new bootstrap.Modal(document.getElementById('addCourseModal'));
    const editCourseModal = new bootstrap.Modal(document.getElementById('editCourseModal'));
    
    // DOM Elements
    const coursesTable = document.getElementById('coursesTableBody');
    const addCourseForm = document.getElementById('addCourseForm');
    const editCourseForm = document.getElementById('editCourseForm');
    
    // Load courses when page loads
    loadCourses();
    
    // Event Listeners
    document.getElementById('addCourseBtn').addEventListener('click', () => {
        addCourseModal.show();
    });
    
    // Handle add course form submission
    addCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addCourse();
    });
    
    // Handle edit course form submission
    editCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateCourse();
    });
});

// Load all courses from Firestore
async function loadCourses() {
    try {
        const coursesTable = document.getElementById('coursesTableBody');
        coursesTable.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';
        
        const snapshot = await db.collection('courses').orderBy('createdAt', 'desc').get();
        
        if (snapshot.empty) {
            coursesTable.innerHTML = '<tr><td colspan="6" class="text-center">No courses found</td></tr>';
            return;
        }
        
        coursesTable.innerHTML = '';
        
        snapshot.forEach(doc => {
            const course = { id: doc.id, ...doc.data() };
            renderCourseRow(course);
        });
    } catch (error) {
        console.error("Error loading courses: ", error);
        showAlert('Error loading courses. Please try again.', 'danger');
    }
}

// Add a new course to Firestore
async function addCourse() {
    try {
        const form = document.getElementById('addCourseForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
        
        const courseData = {
            title: form.title.value,
            description: form.description.value,
            subject: form.subject.value,
            instructor: form.instructor.value,
            price: parseFloat(form.price.value) || 0,
            isFree: form.isFree.checked,
            thumbnailUrl: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Handle thumbnail upload if exists
        const thumbnailFile = form.thumbnail.files[0];
        if (thumbnailFile) {
            const storageRef = firebase.storage().ref(`course-thumbnails/${Date.now()}_${thumbnailFile.name}`);
            const uploadTask = storageRef.put(thumbnailFile);
            
            await uploadTask;
            const downloadURL = await storageRef.getDownloadURL();
            courseData.thumbnailUrl = downloadURL;
        }
        
        // Add course to Firestore
        await db.collection('courses').add(courseData);
        
        // Reset form and hide modal
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('addCourseModal')).hide();
        showAlert('Course added successfully!', 'success');
        
        // Reload courses
        await loadCourses();
        
    } catch (error) {
        console.error("Error adding course: ", error);
        showAlert('Error adding course. Please try again.', 'danger');
    } finally {
        const submitBtn = document.querySelector('#addCourseForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Add Course';
        }
    }
}

// Load course data into edit form
async function loadCourseForEdit(courseId) {
    try {
        const doc = await db.collection('courses').doc(courseId).get();
        if (!doc.exists) {
            showAlert('Course not found', 'warning');
            return;
        }
        
        const course = { id: doc.id, ...doc.data() };
        const form = document.getElementById('editCourseForm');
        
        form.courseId.value = course.id;
        form.title.value = course.title || '';
        form.description.value = course.description || '';
        form.subject.value = course.subject || '';
        form.instructor.value = course.instructor || '';
        form.price.value = course.price || 0;
        form.isFree.checked = course.isFree || false;
        
        // Show current thumbnail if exists
        const thumbnailPreview = document.getElementById('editThumbnailPreview');
        if (course.thumbnailUrl) {
            thumbnailPreview.innerHTML = `<img src="${course.thumbnailUrl}" class="img-thumbnail" style="max-height: 150px;">`;
        } else {
            thumbnailPreview.innerHTML = '<p>No thumbnail</p>';
        }
        
        // Show the edit modal
        const editModal = new bootstrap.Modal(document.getElementById('editCourseModal'));
        editModal.show();
        
    } catch (error) {
        console.error("Error loading course for edit: ", error);
        showAlert('Error loading course data', 'danger');
    }
}

// Update course in Firestore
async function updateCourse() {
    try {
        const form = document.getElementById('editCourseForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
        
        const courseId = form.courseId.value;
        const courseRef = db.collection('courses').doc(courseId);
        
        // Get current course data
        const doc = await courseRef.get();
        if (!doc.exists) {
            throw new Error('Course not found');
        }
        
        const courseData = {
            title: form.title.value,
            description: form.description.value,
            subject: form.subject.value,
            instructor: form.instructor.value,
            price: parseFloat(form.price.value) || 0,
            isFree: form.isFree.checked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Handle thumbnail upload if a new file is selected
        const thumbnailFile = form.thumbnail.files[0];
        if (thumbnailFile) {
            // Delete old thumbnail if exists
            const oldThumbnailUrl = doc.data().thumbnailUrl;
            if (oldThumbnailUrl) {
                try {
                    const oldThumbnailRef = firebase.storage().refFromURL(oldThumbnailUrl);
                    await oldThumbnailRef.delete();
                } catch (error) {
                    console.warn("Could not delete old thumbnail:", error);
                }
            }
            
            // Upload new thumbnail
            const storageRef = firebase.storage().ref(`course-thumbnails/${Date.now()}_${thumbnailFile.name}`);
            const uploadTask = storageRef.put(thumbnailFile);
            await uploadTask;
            courseData.thumbnailUrl = await storageRef.getDownloadURL();
        }
        
        // Update course in Firestore
        await courseRef.update(courseData);
        
        // Reset form and hide modal
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById('editCourseModal')).hide();
        showAlert('Course updated successfully!', 'success');
        
        // Reload courses
        await loadCourses();
        
    } catch (error) {
        console.error("Error updating course: ", error);
        showAlert('Error updating course. Please try again.', 'danger');
    } finally {
        const submitBtn = document.querySelector('#editCourseForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Update Course';
        }
    }
}

// Delete a course from Firestore
async function deleteCourse(courseId, courseTitle) {
    if (!confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        // First, delete the course thumbnail from storage if it exists
        const courseDoc = await db.collection('courses').doc(courseId).get();
        if (courseDoc.exists) {
            const courseData = courseDoc.data();
            if (courseData.thumbnailUrl) {
                try {
                    const thumbnailRef = firebase.storage().refFromURL(courseData.thumbnailUrl);
                    await thumbnailRef.delete();
                } catch (error) {
                    console.warn("Could not delete course thumbnail:", error);
                }
            }
        }
        
        // Then delete the course document
        await db.collection('courses').doc(courseId).delete();
        
        // Show success message and reload courses
        showAlert('Course deleted successfully!', 'success');
        await loadCourses();
        
    } catch (error) {
        console.error("Error deleting course: ", error);
        showAlert('Error deleting course. Please try again.', 'danger');
    }
}

// Render a single course row in the table
function renderCourseRow(course) {
    const coursesTable = document.getElementById('coursesTableBody');
    
    const row = document.createElement('tr');
    const safeTitle = course.title ? course.title.replace(/'/g, '\'') : '';
    row.innerHTML = `
        <td>
            ${course.thumbnailUrl ? 
                `<img src="${course.thumbnailUrl}" alt="${safeTitle}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">` : 
                '<div class="bg-light d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;"><i class="fas fa-book"></i></div>'
            }
        </td>
        <td>${course.title || 'Untitled Course'}</td>
        <td>${course.subject || '-'}</td>
        <td>${course.instructor || '-'}</td>
        <td>${course.isFree ? 'Free' : `$${parseFloat(course.price || 0).toFixed(2)}`}</td>
        <td>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="loadCourseForEdit('${course.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-outline-danger" onclick="deleteCourse('${course.id}', '${safeTitle}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </td>
    `;
    
    coursesTable.appendChild(row);
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.main-content');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-remove alert after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Preview thumbnail before upload
function previewThumbnail(input, previewId) {
    const preview = document.getElementById(previewId);
    const file = input.files[0];
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" class="img-thumbnail" style="max-height: 150px;">`;
        }
        
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '<p>No image selected</p>';
    }
}
