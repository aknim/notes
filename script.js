// Get all draggable labels
const labels = document.querySelectorAll('.floating-label');

// Keep track of their positions to avoid overlap
let labelPositions = [];

// Set initial non-overlapping positions
function setInitialPositions() {
    let startX = 100;
    let startY = 100;
    let gap = 100; // Space between labels

    labels.forEach((label, index) => {
        const xPos = startX + (index * gap);
        const yPos = startY + (index * gap);

        label.style.left = `${xPos}px`;
        label.style.top = `${yPos}px`;

        labelPositions.push({
            element: label,
            left: xPos,
            top: yPos,
            width: label.offsetWidth,
            height: label.offsetHeight
        });
    });
}

// Function to detect overlap
function isOverlapping(element, xPos, yPos) {
    const elemWidth = element.offsetWidth;
    const elemHeight = element.offsetHeight;

    for (let i = 0; i < labelPositions.length; i++) {
        const otherLabel = labelPositions[i];

        if (element !== otherLabel.element) {
            if (
                xPos < otherLabel.left + otherLabel.width &&
                xPos + elemWidth > otherLabel.left &&
                yPos < otherLabel.top + otherLabel.height &&
                yPos + elemHeight > otherLabel.top
            ) {
                return true;
            }
        }
    }
    return false;
}

// Make labels draggable
labels.forEach(label => {
    let offsetX = 0, offsetY = 0, isDragging = false;

    label.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - label.offsetLeft;
        offsetY = e.clientY - label.offsetTop;

        label.style.zIndex = '1000';
        label.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const newLeft = mouseX - offsetX;
            const newTop = mouseY - offsetY;

            // Check for overlap before moving
            if (!isOverlapping(label, newLeft, newTop)) {
                label.style.left = `${newLeft}px`;
                label.style.top = `${newTop}px`;
            }
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        label.style.cursor = 'move';
        label.style.zIndex = '1';

        // Update the stored position of the label after dragging
        labelPositions.forEach(pos => {
            if (pos.element === label) {
                pos.left = label.offsetLeft;
                pos.top = label.offsetTop;
            }
        });
    });
});

// Initialize positions for all labels
setInitialPositions();

