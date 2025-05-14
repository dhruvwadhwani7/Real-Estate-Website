// Back to Home button functionality
document.querySelector('.back-home').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'index.html';
});

// Form validation functions
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    
    return {
        isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
        strength: calculatePasswordStrength(password)
    };
};

const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    
    return strength;
};

const validatePhone = (phone) => {
    const re = /^\d{10}$/;
    return re.test(phone);
};

// Show/Hide password toggle
document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        const input = e.target.parentElement.querySelector('input');
        if (input.type === 'password') {
            input.type = 'text';
            e.target.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            e.target.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
});

// Password strength visualization
const passwordInput = document.getElementById('password');
if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
        const strength = calculatePasswordStrength(e.target.value);
        const meter = e.target.parentElement.querySelector('.strength-meter');
        
        meter.className = 'strength-meter';
        if (strength >= 4) {
            meter.classList.add('strength-strong');
        } else if (strength >= 2) {
            meter.classList.add('strength-medium');
        } else if (strength >= 1) {
            meter.classList.add('strength-weak');
        }
    });
}

// Sign Up Form Validation
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(error => error.textContent = '');
        document.querySelectorAll('.input-group').forEach(group => {
            group.classList.remove('error', 'success');
        });

        // Validate Full Name
        const fullName = document.getElementById('fullName');
        if (fullName.value.trim().length < 3) {
            showError(fullName, 'Name must be at least 3 characters');
            isValid = false;
        } else {
            showSuccess(fullName);
        }

        // Validate Email
        const email = document.getElementById('email');
        if (!validateEmail(email.value)) {
            showError(email, 'Please enter a valid email');
            isValid = false;
        } else {
            showSuccess(email);
        }

        // Validate Phone
        const phone = document.getElementById('phone');
        if (!validatePhone(phone.value)) {
            showError(phone, 'Please enter a valid 10-digit phone number');
            isValid = false;
        } else {
            showSuccess(phone);
        }

        // Validate Password
        const password = document.getElementById('password');
        const { isValid: isPasswordValid, strength } = validatePassword(password.value);
        if (!isPasswordValid) {
            showError(password, 'Password must be at least 8 characters with uppercase, lowercase, number and special character');
            isValid = false;
        } else {
            showSuccess(password);
        }

        // Validate Confirm Password
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword.value !== password.value) {
            showError(confirmPassword, 'Passwords do not match');
            isValid = false;
        } else if (confirmPassword.value) {
            showSuccess(confirmPassword);
        }

        // Terms checkbox validation
        const termsCheck = document.getElementById('termsCheck');
        if (!termsCheck.checked) {
            showError(termsCheck, 'You must accept the terms and conditions');
            isValid = false;
        }

        const submitBtn = document.getElementById('submitBtn');
        const loadingModal = document.getElementById('loadingModal');
        const loadingSpinner = submitBtn.querySelector('.loading-spinner');
        const btnText = submitBtn.querySelector('.btn-text');
        const formError = document.getElementById('formError');

        if (isValid) {
            try {
                // Show loading state
                submitBtn.disabled = true;
                btnText.style.display = 'none';
                loadingSpinner.style.display = 'inline-block';
                formError.style.display = 'none';

                const formData = {
                    fullName: document.getElementById('fullName').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    password: document.getElementById('password').value,
                    userType: document.querySelector('input[name="userType"]:checked').value
                };

                const response = await fetch('http://localhost:5000/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                    credentials: 'omit'
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    loadingModal.style.display = 'none';
                    document.getElementById('successModal').style.display = 'flex';
                    // Don't redirect immediately, let user see the success message
                } else {
                    loadingModal.style.display = 'none';
                    if (data.message.includes('email') || data.message.includes('phone')) {
                        const message = data.message.includes('email')
                            ? 'An account already exists with this email address.'
                            : 'An account already exists with this phone number.';
                        showErrorModal(message);
                    } else {
                        formError.textContent = data.message || 'Registration failed';
                        formError.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Signup error:', error);
                formError.textContent = 'Network error. Please try again.';
                formError.style.display = 'block';
                loadingModal.style.display = 'none';
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                btnText.style.display = 'inline';
                loadingSpinner.style.display = 'none';
            }
        }
    });
}

function showErrorModal(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const loadingModal = document.getElementById('loadingModal');
    
    loadingModal.style.display = 'none'; // Hide loading modal
    errorMessage.textContent = message + ' Would you like to sign in instead?';
    errorModal.style.display = 'flex';
}

function closeErrorModal() {
    document.getElementById('errorModal').style.display = 'none';
}

function redirectToSignIn() {
    window.location.href = 'signIn.html';
}

function showSuccessModal() {
    const successModal = document.getElementById('successModal');
    successModal.style.display = 'flex';
}

function proceedToSignIn() {
    window.location.href = 'signIn.html';
}

// Sign In Form Validation
const signinForm = document.querySelector('.signin-form');
if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;

        const email = signinForm.querySelector('input[type="email"]');
        const password = signinForm.querySelector('input[type="password"]');
        const signinError = document.getElementById('signinError');

        if (!validateEmail(email.value)) {
            showError(email, 'Please enter a valid email');
            isValid = false;
        } else {
            showSuccess(email);
        }

        if (password.value.length < 8) {
            showError(password, 'Password must be at least 8 characters');
            isValid = false;
        } else {
            showSuccess(password);
        }

        if (isValid) {
            const loadingModal = document.getElementById('loadingModal');
            loadingModal.style.display = 'flex';
            signinError.style.display = 'none';

            try {
                const response = await fetch('http://localhost:5000/api/signin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email.value, password: password.value })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Store user data in localStorage
                    localStorage.setItem('userEmail', email.value);
                    localStorage.setItem('userData', JSON.stringify(data.userData));
                    
                    // Add admin redirection logic
                    if (data.userData.userType === 'admin') {
                        window.location.href = 'admin-main.html';
                    } else if (data.userData.userType === 'seller') {
                        window.location.href = 'home3.html';
                    } else {
                        window.location.href = 'home2.html';
                    }
                } else {
                    signinError.textContent = data.message || 'Incorrect email or password';
                    signinError.style.display = 'block';
                }
            } catch (error) {
                console.error('Sign-in error:', error);
                signinError.textContent = 'Network error. Please try again.';
                signinError.style.display = 'block';
            } finally {
                loadingModal.style.display = 'none';
            }
        }
    });
}

// Helper Functions
function showError(input, message) {
    const formGroup = input.parentElement;
    formGroup.classList.remove('success');
    formGroup.classList.add('error');
    const errorMessage = formGroup.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.textContent = message;
        // Reset animation
        formGroup.style.animation = 'none';
        formGroup.offsetHeight; // Trigger reflow
        formGroup.style.animation = 'shake 0.3s ease-in-out';
    }
}

function showSuccess(input) {
    const formGroup = input.parentElement;
    formGroup.classList.remove('error');
    formGroup.classList.add('success');
    const icon = formGroup.querySelector('i:first-child');
    // Reset animation
    icon.style.animation = 'none';
    icon.offsetHeight; // Trigger reflow
    icon.style.animation = 'success 0.3s ease';
}

// Real-time validation
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', validateField);
});

function validateField(e) {
    const input = e.target;
    const inputType = input.type;

    switch(inputType) {
        case 'email':
            if (!validateEmail(input.value)) {
                showError(input, 'Please enter a valid email');
            } else {
                showSuccess(input);
            }
            break;
        case 'password':
            const { isValid, strength } = validatePassword(input.value);
            if (!isValid) {
                showError(input, 'Password must meet all requirements');
            } else {
                showSuccess(input);
            }
            break;
        case 'tel':
            if (!validatePhone(input.value)) {
                showError(input, 'Please enter a valid phone number');
            } else {
                showSuccess(input);
            }
            break;
    }
}
