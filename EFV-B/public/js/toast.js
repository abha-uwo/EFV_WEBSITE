/**
 * EFV Global Toast System
 * Usage: showToast("Message", "success" | "error" | "info");
 */
window.showToast = function (message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `efv-toast ${type}`;
    
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-triangle';
    if (type === 'info') icon = 'fa-info-circle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove
    const timer = setTimeout(() => {
        removeToast(toast);
    }, 4000);

    // Manual click to remove
    toast.onclick = () => {
        clearTimeout(timer);
        removeToast(toast);
    };
};

function removeToast(toast) {
    toast.style.animation = 'toastOut 0.4s ease forwards';
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 400);
}
