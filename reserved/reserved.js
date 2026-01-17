const container = document.querySelector('.container');

/** @param {number} x @param {number} y */
function setPosition(x, y) {
    container.style.left = x + 'px';
    container.style.top = y + 'px';
}

// Load position from localStorage if it exists
function loadPosition() {
    const left = localStorage.getItem('containerLeft');
    const top = localStorage.getItem('containerTop');
    if (left !== null && top !== null) {
        container.style.left = left + 'px';
        container.style.top = top + 'px';
    } else {
        centerContainer();
    }
}

// Center container if no saved position
function centerContainer() {
    container.style.left = (window.innerWidth - container.offsetWidth) / 2 + 'px';
    container.style.top = (window.innerHeight - container.offsetHeight) / 2 + 'px';
}

loadPosition();

// Re-center on window resize only if there’s no saved position
window.addEventListener('resize', () => {
    if (!localStorage.getItem('containerLeft')) {
        centerContainer();
    }
});

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

container.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    container.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    let left = e.clientX - offsetX;
    let top = e.clientY - offsetY;

    // keep container inside viewport
    const maxLeft = window.innerWidth - container.offsetWidth;
    const maxTop = window.innerHeight - container.offsetHeight;

    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left > maxLeft) left = maxLeft;
    if (top > maxTop) top = maxTop;

    container.style.left = left + 'px';
    container.style.top = top + 'px';
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        container.style.cursor = 'grab';
        
        // Save position to localStorage
        localStorage.setItem('containerLeft', container.offsetLeft);
        localStorage.setItem('containerTop', container.offsetTop);
    }
});
