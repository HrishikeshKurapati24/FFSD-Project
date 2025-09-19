document.addEventListener('DOMContentLoaded', () => {
    const storedUsername = localStorage.getItem('adminUsername');
    if (storedUsername) {
        document.getElementById('username').value = storedUsername;
        document.getElementById('rememberMe').checked = true;
    }

    // ==== LIVE VALIDATION UTILS ====
    function showError(input, message) {
        let error = input.parentElement.querySelector('.error-message');
        if (!error) {
            error = document.createElement('small');
            error.className = 'error-message';
            error.style.color = 'red';
            input.parentElement.appendChild(error);
        }
        error.innerText = message;
        input.style.borderColor = "red";
    }

    function clearError(input) {
        let error = input.parentElement.querySelector('.error-message');
        if (error) error.remove();
        input.style.borderColor = "";
    }

    function validateUsername(input) {
        const value = input.value.trim();
        if (value.length < 3) {
            showError(input, "Username must be at least 3 characters");
            return false;
        }
        clearError(input);
        return true;
    }

    function validatePassword(input) {
        const value = input.value.trim();
        if (value.length < 6) {
            showError(input, "Password must be at least 6 characters");
            return false;
        }
        clearError(input);
        return true;
    }

    // ==== LOGIN FORM VALIDATION ====
    const loginForm = document.getElementById('loginForm');
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');

    usernameField.addEventListener('input', () => validateUsername(usernameField));
    passwordField.addEventListener('input', () => validatePassword(passwordField));

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isUsernameValid = validateUsername(usernameField);
        const isPasswordValid = validatePassword(passwordField);

        if (!isUsernameValid || !isPasswordValid) {
            return; // block submission
        }

        const formData = new FormData(e.target);
        const data = {
            username: formData.get('username'),
            password: formData.get('password'),
            rememberMe: formData.get('rememberMe') === 'on'
        };

        try {
            const response = await fetch('/admin/login/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = result.redirect;
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login');
        }
    });

    // ==== FORGOT PASSWORD MODAL HANDLING ====
    const modal = document.getElementById('forgotPasswordModal');
    const btn = document.getElementById('forgotPasswordLink');
    const span = document.getElementsByClassName('close')[0];
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    btn.onclick = () => modal.style.display = "block";
    span.onclick = () => modal.style.display = "none";
    window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

    // ==== RESET FORM VALIDATION ====
    const resetUsernameField = document.getElementById('resetUsername');
    const newPasswordField = document.getElementById('newPassword');
    const confirmPasswordField = document.getElementById('confirmPassword');

    resetUsernameField.addEventListener('input', () => validateUsername(resetUsernameField));
    newPasswordField.addEventListener('input', () => validatePassword(newPasswordField));
    confirmPasswordField.addEventListener('input', () => {
        if (confirmPasswordField.value !== newPasswordField.value) {
            showError(confirmPasswordField, "Passwords do not match");
        } else {
            clearError(confirmPasswordField);
        }
    });

    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isResetUserValid = validateUsername(resetUsernameField);
        const isNewPassValid = validatePassword(newPasswordField);
        const isConfirmPassValid = newPasswordField.value === confirmPasswordField.value;

        if (!isResetUserValid || !isNewPassValid || !isConfirmPassValid) {
            if (!isConfirmPassValid) {
                showError(confirmPasswordField, "Passwords do not match");
            }
            return;
        }

        try {
            const response = await fetch('/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: resetUsernameField.value,
                    newPassword: newPasswordField.value
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Password reset successful! Please login with your new password.');
                modal.style.display = "none";
                forgotPasswordForm.reset();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while resetting password');
        }
    });
});