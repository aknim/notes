// Get all draggable labels
let labels = document.querySelectorAll('.floating-label');
let selectedLabels = [];  // To track multiple selected labels
let labelPositions = [];  // To avoid overlap

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
        if (!e.ctrlKey && !e.metaKey) { // Only drag if not using selection (Ctrl/Cmd)
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

