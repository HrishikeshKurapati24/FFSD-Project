document.addEventListener('DOMContentLoaded', () => {
    const storedUsername = localStorage.getItem('adminUsername');
    if (storedUsername) {
        document.getElementById('username').value = storedUsername;
        document.getElementById('rememberMe').checked = true;
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = {
            username: formData.get('username'),
            password: formData.get('password'),
            rememberMe: formData.get('rememberMe') === 'on'
        };

        try {
            const response = await fetch('/admin/login/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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

    // Forgot Password Modal Handling
    const modal = document.getElementById('forgotPasswordModal');
    const btn = document.getElementById('forgotPasswordLink');
    const span = document.getElementsByClassName('close')[0];
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    // Open modal
    btn.onclick = function () {
        modal.style.display = "block";
    }

    // Close modal
    span.onclick = function () {
        modal.style.display = "none";
    }

    // Close modal when clicking outside
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Handle forgot password form submission
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('resetUsername').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        try {
            const response = await fetch('/admin/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    newPassword
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