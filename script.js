// Get the draggable label
const label = document.getElementById('draggable-label');

// Variables to store the mouse position and label position
let offsetX = 0, offsetY = 0, isDragging = false;

label.addEventListener('mousedown', function(e) {
    isDragging = true;
    offsetX = e.clientX - label.offsetLeft;
    offsetY = e.clientY - label.offsetTop;

    // Change cursor to dragging style
    label.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', function(e) {
    if (isDragging) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Move the label with the mouse
        label.style.left = (mouseX - offsetX) + 'px';
        label.style.top = (mouseY - offsetY) + 'px';
    }
});

document.addEventListener('mouseup', function() {
    isDragging = false;
    label.style.cursor = 'move';  // Change cursor back to move
});

