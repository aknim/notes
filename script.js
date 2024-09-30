// Get all draggable labels
let labels = document.querySelectorAll('.floating-label');
let selectedLabels = [];
let labelPositions = [];

// For line drawing
let isShiftPressed = false;
let firstLabel = null;
let lineCanvas = document.getElementById('lineCanvas');
let ctx = lineCanvas.getContext('2d');
let lines = []; // Store drawn lines between labels

// Resize the canvas to the window size
function resizeCanvas() {
    lineCanvas.width = window.innerWidth;
    lineCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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

// Make labels draggable and editable on double-click
function makeLabelDraggableAndEditable(label) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    // Enable dragging
    label.addEventListener('mousedown', function(e) {
        if (!isDragging) {
            handleSelection(e, label); // Handle selection on mouse down
        }

        // Start dragging
        if (!e.ctrlKey && !e.metaKey && !isShiftPressed) { // Only drag if not using selection (Ctrl/Cmd/Shift)
            isDragging = true;
            offsetX = e.clientX - label.offsetLeft;
            offsetY = e.clientY - label.offsetTop;

            label.style.zIndex = '1000';
            label.style.cursor = 'grabbing';
        }
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
                updateLines(); // Update lines when label is dragged
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

    // Make text editable on double-click
    label.addEventListener('dblclick', function(e) {
        e.stopPropagation(); // Prevent creating a new label on this double-click
        label.contentEditable = true;
        label.classList.add('editable');
    });

    // Save text on blur
    label.addEventListener('blur', function() {
        label.contentEditable = false; // Lock the label after editing
        label.classList.remove('editable');
    });

    // Handle Shift+Click for line drawing
    label.addEventListener('click', function(e) {
        if (isShiftPressed) {
            if (!firstLabel) {
                firstLabel = label; // Set the first label
            } else {
                drawLineBetweenLabels(firstLabel, label); // Draw a line between first and second labels
                firstLabel = null; // Reset the first label
            }
        }
    });
}

// Function to handle label selection
function handleSelection(e, label) {
    if (e.ctrlKey || e.metaKey) { // Check if Ctrl (Windows) or Cmd (Mac) is held
        // Toggle selection
        if (selectedLabels.includes(label)) {
            label.classList.remove('selected');
            selectedLabels = selectedLabels.filter(item => item !== label);
        } else {
            label.classList.add('selected');
            selectedLabels.push(label);
        }
    } else {
        // Deselect all other labels if Ctrl/Cmd is not held
        selectedLabels.forEach(l => l.classList.remove('selected'));
        selectedLabels = [label];
        label.classList.add('selected');
    }
}

// Function to draw a line between two labels
function drawLineBetweenLabels(label1, label2) {
    const rect1 = label1.getBoundingClientRect();
    const rect2 = label2.getBoundingClientRect();

    const x1 = rect1.left + rect1.width / 2;
    const y1 = rect1.top + rect1.height / 2;
    const x2 = rect2.left + rect2.width / 2;
    const y2 = rect2.top + rect2.height / 2;

    // Store the line information for later updates
    lines.push({
        label1,
        label2,
        x1,
        y1,
        x2,
        y2
    });

    updateLines();
}

// Function to update all drawn lines
function updateLines() {
    // Clear the canvas
    ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

    // Redraw each line
    lines.forEach(line => {
        const rect1 = line.label1.getBoundingClientRect();
        const rect2 = line.label2.getBoundingClientRect();

        const x1 = rect1.left + rect1.width / 2;
        const y1 = rect1.top + rect1.height / 2;
        const x2 = rect2.left + rect2.width / 2;
        const y2 = rect2.top + rect2.height / 2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#e74c3c';  // Line color (red)
        ctx.lineWidth = 2;
        ctx.stroke();

        // Update the stored positions for the line
        line.x1 = x1;
        line.y1 = y1;
        line.x2 = x2;
        line.y2 = y2;
    });
}

// Track if the Shift key is pressed
document.addEventListener('keydown', function(e) {
    if (e.key === 'Shift') {
        isShiftPressed = true;
    }
});

document.addEventListener('keyup', function(e) {
    if (e.key === 'Shift') {
        isShiftPressed = false;
        firstLabel = null;  // Reset first label if shift is released
    }
});

// Double-click to create a new label
document.addEventListener('dblclick', function(e) {
    // Create a new label
    const newLabel = document.createElement('div');
    newLabel.classList.add('floating-label', 'editable');
    newLabel.contentEditable = true;
    newLabel.innerText = 'New Label';
    newLabel.style.left = `${e.clientX}px`;
    newLabel.style.top = `${e.clientY}px`;

    // Add to the document and make it draggable and editable
    document.body.appendChild(newLabel);
    labelPositions.push({
        element: newLabel,
        left: e.clientX,
        top: e.clientY,
        width: newLabel.offsetWidth,
        height: newLabel.offsetHeight
    });
    makeLabelDraggableAndEditable(newLabel);
});

// Apply draggable and editable behavior to existing labels
labels.forEach(label => makeLabelDraggableAndEditable(label));

// Initialize positions for existing labels
setInitialPositions();

