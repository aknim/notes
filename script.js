// Get all draggable labels
const labels = document.querySelectorAll('.floating-label');

labels.forEach(label => {
    let offsetX = 0, offsetY = 0, isDragging = false;

    label.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - label.offsetLeft;
        offsetY = e.clientY - label.offsetTop;

        // Bring label to the front while dragging
        label.style.zIndex = '1000';
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
        label.style.zIndex = '1';     // Reset z-index after dragging
    });
});

