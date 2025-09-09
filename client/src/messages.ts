import Cookies from 'js-cookie';

const message = Cookies.get('message');
if (message) {
    // Create a Bootstrap alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info position-fixed fade show text-nowrap fs-5 z-3';
    alertDiv.style.top = '50%';
    alertDiv.style.left = '50%';
    alertDiv.style.transform = 'translate(-50%, -50%)';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = message;

    // Append the alert to the body or a specific container
    document.body.prepend(alertDiv);

    // Automatically remove the alert after a few seconds
    setTimeout(() => {
        alertDiv.classList.remove('show'); // Trigger fade-out
        alertDiv.addEventListener('transitionend', () => {
            alertDiv.remove();
        }); // Remove from DOM after fade-out
    }, 2000);

    // Remove the message cookie
    Cookies.remove('message');
}
