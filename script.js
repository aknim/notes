// Get all draggable labels
let labels = document.querySelectorAll('.floating-label');
let selectedLabels = [];
let labelPositions = [];
let selectedLabel = null; // Keep track of the label to apply the color

// Get the color picker element
const colorPicker = document.getElementById('colorPicker');

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
        label.style.color = "#3498db";

        labelPositions.push({
            element: label,
            left: xPos,
            top: yPos,
            width: label.offsetWidth,
            height: label.offsetHeight,
            color: getComputedStyle(label).color // Add color property to label position
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
        } else {
            selectedLabel = label; //Store the clicked label for color application
        }
    });
}



// Update the label's color when colorPicker changes
colorPicker.addEventListener('input', function(){
    if (selectedLabel){
        const newColor = colorPicker.value;
        selectedLabel.style.color = newColor;
        selectedLabel.style.borderColor = newColor;

        // Update the label color in labelPositions
        labelPositions.forEach(pos => {
            if (pos.element === selectedLabel){
                pos.color = newColor;
            }
        })
    }
})

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
        updateColorPicker(label);
    }

    
}

// Function to update color picker based on selected label's color
function updateColorPicker(label) {
    const colorPicker = document.getElementById('colorPicker'); // Ensure this matches your HTML
    const currentColor = label.style.color; // Get the current color of the label
    colorPicker.value = rgbToHex(currentColor); // Update the color picker value to the label's color
}

// Function to convert RGB color to HEX (if needed)
function rgbToHex(rgb) {
    const rgbArray = rgb.match(/\d+/g); // Extract RGB values
    if (rgbArray) {
        const r = parseInt(rgbArray[0]);
        const g = parseInt(rgbArray[1]);
        const b = parseInt(rgbArray[2]);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return '#000000'; // Default to black if not valid
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
        


        const label1Rect = line.label1.getBoundingClientRect();
        const label2Rect = line.label2.getBoundingClientRect();

        // Get center points of both labels
        const label1Center = getLabelCenter(label1Rect);
        const label2Center = getLabelCenter(label2Rect);

        // Calculate the differences in positions
        const deltaX = label2Center.x - label1Center.x;
        const deltaY = label2Center.y - label1Center.y;

        // Determine from which side of label1 to start and which side of label2 to end
        let startX, startY, endX, endY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // The labels are mostly horizontally aligned
            if (deltaX > 0) {
                // Label 2 is to the right of Label 1
                startX = label1Rect.right;
                startY = label1Center.y;
                endX = label2Rect.left;
                endY = label2Center.y;
            } else {
                // Label 2 is to the left of Label 1
                startX = label1Rect.left;
                startY = label1Center.y;
                endX = label2Rect.right;
                endY = label2Center.y;
            }
        } else {
            // The labels are mostly vertically aligned
            if (deltaY > 0) {
                // Label 2 is below Label 1
                startX = label1Center.x;
                startY = label1Rect.bottom;
                endX = label2Center.x;
                endY = label2Rect.top;
            } else {
                // Label 2 is above Label 1
                startX = label1Center.x;
                startY = label1Rect.top;
                endX = label2Center.x;
                endY = label2Rect.bottom;
            }
        }

        // const x1 = rect1.left + rect1.width / 2;
        // const y1 = rect1.top + rect1.height / 2;
        // const x2 = rect2.left + rect2.width / 2;
        // const y2 = rect2.top + rect2.height / 2;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#e74c3c';  // Line color (red)
        ctx.lineWidth = 2;
        ctx.stroke();

        // Update the stored positions for the line
        line.x1 = startX;
        line.y1 = startY;
        line.x2 = endX;
        line.y2 = endY;

        console.log("called");

        

        // Draw arrowhead
        const headLength = 30; // Length of arrow head
        const angle = Math.atan2(endY - startY, endX - startX); // Calculate angle of the line
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.strokeStyle = 'blue';
        ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
        //ctx.stroke();
        ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
        //ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fillStyle = 'blue'; // Fill color for the arrowhead
        ctx.fill();
    });
}

// Function to get the center of a label
function getLabelCenter(rect) {
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
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
// Detect Cmd + N or Ctrl + N to open prompt for JSON input
// Combined event listener for both save (Ctrl/Cmd + S) and new (Ctrl/Cmd + N)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        // Ctrl + S or Cmd + S: Save the current state
        if (e.key === 's') {
            e.preventDefault();  // Prevent default browser save action
            saveState();
        }
        
        // Ctrl + N or Cmd + N: Open JSON input to create labels and lines
        if (e.key === 'n') {
            e.preventDefault();  // Prevent default browser new document action
            const inputJSON = prompt("Enter the JSON data to create labels and lines:");
            if (inputJSON) {
                try {
                    const parsedData = JSON.parse(inputJSON);
                    loadFromJSON(parsedData);
                } catch (error) {
                    alert("Invalid JSON format. Please try again.");
                }
            }
        }
    }
});

// Function to load labels and lines from provided JSON
function loadFromJSON(data) {
    // Clear existing labels and lines
    clearAllLabelsAndLines();

    // Load labels
    if (data.labels) {
        data.labels.forEach(labelData => {
            const newLabel = document.createElement('div');
            newLabel.classList.add('floating-label');
            newLabel.innerText = labelData.text;
            newLabel.style.left = `${labelData.left}px`;
            newLabel.style.top = `${labelData.top}px`;
            newLabel.style.color = labelData.color;
            newLabel.style.borderColor = labelData.color;

            document.body.appendChild(newLabel);

            labelPositions.push({
                element: newLabel,
                left: labelData.left,
                top: labelData.top,
                width: newLabel.offsetWidth,
                height: newLabel.offsetHeight,
                color: labelData.color
            });

            makeLabelDraggableAndEditable(newLabel);
        });
    }

    // Load lines
    if (data.lines) {
        data.lines.forEach(lineData => {
            const label1 = findLabelByText(lineData.from);
            const label2 = findLabelByText(lineData.to);

            if (label1 && label2) {
                drawLineBetweenLabels(label1, label2);
            }
        });
    }
}

// Function to clear all existing labels and lines
function clearAllLabelsAndLines() {
    labels.forEach(label => label.remove());
    labels = [];

    lines = [];
    labelPositions = [];
    ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
}

// Function to find a label by its text
function findLabelByText(text) {
    return labelPositions.find(labelPos => labelPos.element.innerText.trim() === text)?.element;
}


function saveState() {
    const labelsData = labelPositions.map(labelPos => ({
        text: labelPos.element.innerText.trim(),  // Get only the innerText (label content)
        left: labelPos.left,                      // Get the x (left) position of the label
        top: labelPos.top,                        // Get the y (top) position of the label
        color: labelPos.color || "#3498db"        // Include color (default if not set)
    }));

    const linesData = lines.map(line => ({
        from: line.label1.innerText.trim(),       // Get the text of the first label connected by the line
        to: line.label2.innerText.trim(),         // Get the text of the second label connected by the line
        fromPosition: {                           // The starting position of the line
            x: line.x1,
            y: line.y1
        },
        toPosition: {                             // The ending position of the line
            x: line.x2,
            y: line.y2
        }
    }));

    const state = {
        labels: labelsData,
        lines: linesData
    };

    console.log(JSON.stringify(state, null, 2));  // Log the clean state as a formatted JSON string
}
