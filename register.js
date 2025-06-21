document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const userData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                email: document.getElementById('email').value.trim().toLowerCase(),
                password: document.getElementById('password').value,
                dob: document.getElementById('dob').value,
                gender: document.getElementById('gender').value,
                phone: document.getElementById('phone').value.trim(),
                city: document.getElementById('city').value.trim(),
                createdAt: new Date().toISOString(),
                role: 'student', // Default role
                isApproved: false, // Admin approval required
                approvedAt: null,
                approvedBy: null
            };
            
            // Validate passwords match
            const confirmPassword = document.getElementById('confirmPassword').value;
            if (userData.password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            // Validate password strength (at least 8 characters)
            if (userData.password.length < 8) {
                alert('Password must be at least 8 characters long!');
                return;
            }
            
            // Check if user already exists
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userExists = users.some(user => user.email === userData.email);
            
            if (userExists) {
                alert('A user with this email already exists!');
                return;
            }
            
            // Add new user
            users.push(userData);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Show success message with approval notice
            alert('Registration successful! Please wait for admin approval. You will receive an email once your account is approved.');
            window.location.href = 'pending-approval.html';
        });
    }
    
    // Phone number validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Allow only numbers and limit to 10 digits
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }
    
    // Set max date for date of birth (must be at least 10 years old)
    const dobInput = document.getElementById('dob');
    if (dobInput) {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setFullYear(today.getFullYear() - 10);
        dobInput.max = maxDate.toISOString().split('T')[0];
    }
});
