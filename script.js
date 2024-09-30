// Get all draggable labels
let labels = document.querySelectorAll('.floating-label');

// Keep track of positions to avoid overlap
let labelPositions = [];

// Set initial positions for non-overlapping
function setInitialPositions() {
    let startX = 100;
    let startY = 100;
    let gap = 100;

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
function makeLabelDraggable(label) {
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

            // Prevent overlapping
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

        // Update label position
        labelPositions.forEach(pos => {
            if (pos.element === label) {
                pos.left = label.offsetLeft;
                pos.top = label.offsetTop;
            }
        });
    });
}

// Double-click to create new label
document.addEventListener('dblclick', function(e) {
    // Create a new label
    const newLabel = document.createElement('div');
    newLabel.classList.add('floating-label', 'editable');
    newLabel.contentEditable = true;
    newLabel.innerText = 'New Label';
    newLabel.style.left = `${e.clientX}px`;
    newLabel.style.top = `${e.clientY}px`;

    // Add to the document and make it draggable
    document.body.appendChild(newLabel);
    labelPositions.push({
        element: newLabel,
        left: e.clientX,
        top: e.clientY,
        width: newLabel.offsetWidth,
        height: newLabel.offsetHeight
    });
    makeLabelDraggable(newLabel);

    // Save the text on blur (when editing is done)
    newLabel.addEventListener('blur', function() {
        newLabel.contentEditable = false; // Lock the label after editing
        newLabel.classList.remove('editable');
    });

    // Allow editing again on double-click
    newLabel.addEventListener('dblclick', function(e) {
        e.stopPropagation(); // Prevent creating a new label on this double-click
        newLabel.contentEditable = true;
        newLabel.classList.add('editable');
    });
});

// Apply draggable behavior to existing labels
labels.forEach(label => makeLabelDraggable(label));

// Initialize positions for existing labels
setInitialPositions();

