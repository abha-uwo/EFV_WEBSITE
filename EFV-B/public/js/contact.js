/**
 * EFV Contact JS - Form Validation & Submission
 */

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');


    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button');
            const originalText = btn.textContent;
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const message = document.getElementById('contact-message').value;

            btn.disabled = true;
            btn.textContent = 'Sending...';

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/support/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        subject: 'Contact Form Submission',
                        message
                    })
                });

                if (response.ok) {
                    // Show Official Success Modal
                    const successModal = document.getElementById('contact-success-modal');
                    if (successModal) {
                        successModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    }

                    btn.textContent = 'Message Sent';
                    contactForm.reset();
                } else {
                    throw new Error('Transmission failed');
                }
            } catch (err) {
                console.error('API Error:', err);
                if (typeof showToast === 'function') {
                    showToast('Transmission Interrupted. Please check your connection.');
                } else {
                    formMessage.textContent = 'Transmission Interrupted. Please check your connection.';
                    formMessage.classList.add('error');
                    formMessage.style.display = 'block';
                }
            } finally {
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = originalText;
                }, 3000);
            }
        });
    }

    // Close Success Modal
    const closeSuccessBtn = document.getElementById('close-success-modal');
    if (closeSuccessBtn) {
        closeSuccessBtn.onclick = () => {
            const successModal = document.getElementById('contact-success-modal');
            if (successModal) {
                successModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        };
    }

    // Waitlist Form Handling
    const waitlistBtn = document.getElementById('waitlist-btn');
    const waitlistEmail = document.getElementById('waitlist-email');
    const waitlistMessage = document.getElementById('waitlist-message');

    // Initialize EmailJS with Public Key (User needs to replace this)
    if (typeof emailjs !== 'undefined') {
        emailjs.init("YOUR_PUBLIC_KEY");
    }

    if (waitlistBtn && waitlistEmail) {
        waitlistBtn.addEventListener('click', async () => {
            const email = waitlistEmail.value.trim();

            if (!email || !email.includes('@')) {
                showWaitlistMessage('Please enter a valid email address.', 'error');
                return;
            }

            const originalText = waitlistBtn.textContent;
            waitlistBtn.disabled = true;
            waitlistBtn.textContent = 'Joining...';

            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (response.ok) {
                    showWaitlistMessage('Success! Your resonance is aligned. Check your inbox.', 'success');
                    waitlistBtn.textContent = "You're In!";
                    waitlistEmail.value = '';
                } else {
                    throw new Error('Subscription failed');
                }
            } catch (err) {
                console.error('Subscription Error:', err);
                showWaitlistMessage('Transmission failed. Ecosystem connection error.', 'error');
            } finally {
                setTimeout(() => {
                    waitlistBtn.disabled = false;
                    waitlistBtn.textContent = originalText;
                    waitlistMessage.style.display = 'none';
                }, 6000);
            }
        });
    }

    function showWaitlistMessage(text, type) {
        waitlistMessage.textContent = text;
        waitlistMessage.style.display = 'block';
        waitlistMessage.style.padding = '10px 15px';

        if (type === 'success') {
            waitlistMessage.style.background = 'rgba(46, 213, 115, 0.1)';
            waitlistMessage.style.color = '#2ed573';
            waitlistMessage.style.border = '1px solid #2ed573';
        } else {
            waitlistMessage.style.background = 'rgba(255, 71, 87, 0.1)';
            waitlistMessage.style.color = '#ff4757';
            waitlistMessage.style.border = '1px solid #ff4757';
        }
    }
});
