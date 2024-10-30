// Get all draggable labels
let labels = document.querySelectorAll('.floating-label');
let selectedLabels = [];
let selectedItems = [];
let labelPositions = [];
let selectedLabel = null; // Keep track of the label to apply the color
let selectedLine = null;

// For Saving To Browser
let lastSaveTimeLabel = document.getElementById('lastSaveTime');
console.log(lastSaveTimeLabel.innerText);
let currId = "notes-"+new Date();
console.log("currId: "+currId);

// For line drawing
let isShiftPressed = false;
let firstLabel = null;
let lineCanvas = document.getElementById('lineCanvas');
let ctx = lineCanvas.getContext('2d');
let lines = []; // Store drawn lines between labels

let tmp = null;

// Buttons
const deleteButton = document.getElementById('deleteButton');
const flipLineButton = document.getElementById('flipButton');
const colorPicker = document.getElementById('colorPicker');

deleteButton.addEventListener('click', deleteSelectedItem);
flipLineButton.addEventListener('click', flipLineDirection);
colorPicker.addEventListener('input', changeSelectedItemColor);

resizeCanvas();// Initialize positions for existing labels
setInitialPositions();
// Apply draggable and editable behavior to existing labels
labels.forEach(label => makeLabelDraggableAndEditable(label));

// #region INITIALISING FUNCTIONS

// Resize the canvas to the window size
function resizeCanvas() {
    lineCanvas.width = window.innerWidth;
    lineCanvas.height = window.innerHeight;
}
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
            width: label.offsetWidth,
            height: label.offsetHeight,
            color: getComputedStyle(label).color // Add color property to label position
        });
    });
}

// #endregion

function getValFromPx(position){
    return parseFloat(position.replace('px', ''));
}

// #region EVENT LISTENERS 

window.addEventListener('resize', resizeCanvas);

// Optionally, listen for 'Delete' key press to delete label
document.addEventListener('keydown', (event) => {
    if ((event.key === 'Backspace' || event.key === 'Delete') && ((event.ctrlKey)&&(selectedLabel||selectedLine))) {
        deleteSelectedItem(); 
    }
 });

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
            const inputJSON = prompt("Enter the JSON data to CREATE labels and lines:");
            if (inputJSON) {
                try {
                    const parsedData = JSON.parse(inputJSON);
                    loadFromJSON(parsedData);
                } catch (error) {
                    alert("Invalid JSON format. Please try again.");
                }
            }
        }

        if (e.key === 'p') {
            e.preventDefault();
            const inputJSON = prompt("Enter the JSON data to ADD labels and lines:");
            if (inputJSON) {
                try {
                    const parsedData = JSON.parse(inputJSON);
                    addNewFromJSON(parsedData);
                } catch (error) {
                    alert("Invalid JSON format. Please try again.");
                }
            }
        }
    }
});

// Track if the Shift key is pressed
document.addEventListener('keydown', function(e) {
    if (e.key === 'Shift') {
        isShiftPressed = true;
    }
});

// Shift releasing
document.addEventListener('keyup', function(e) {
    if (e.key === 'Shift') {
        isShiftPressed = false;
        firstLabel = null;  // Reset first label if shift is released
    }
});

// Selecting Line
document.addEventListener('click', function(e) {
    const clickX = e.clientX;
    const clickY = e.clientY; 

    lines.forEach((line, index) => {
        if (isClickNearLine(clickX, clickY, line)) {
            selectLine(line);
            selectedLabel = null;
            redrawLines();
        }
        else{
            unselectLine(line);
        }
    });
});

// Double-click to create a new label
document.addEventListener('dblclick', function(e) {

    const clickX = e.clientX;
    const clickY = e.clientY;

    // Check if user double-clicked near any of the lines
    lines.forEach((line, index) => {
        if (isClickNearLine(clickX, clickY, line)) {
            selectedLine = line;
        }
    })

    // If a line is found, flip its direction
    if (selectedLine!=null) {
        flipLineDirection();
        return;
    }

    // Create a new label
    const newLabel = document.createElement('div');
    newLabel.classList.add('floating-label', 'editable');
    newLabel.contentEditable = true;
    newLabel.textContent = 'New Label';
    newLabel.style.left = `${e.clientX}px`;
    newLabel.style.top = `${e.clientY}px`;

    // Add to the document and make it draggable and editable
    document.body.appendChild(newLabel);

    labelPositions.push({
        element: newLabel,
        // left: e.clientX,
        // top: e.clientY,
        width: newLabel.offsetWidth,
        height: newLabel.offsetHeight
    });
    makeLabelDraggableAndEditable(newLabel);
});

document.addEventListener('keydown', function(e) {
    // Check if it's Cmd + Shift + 'c' 
    if (e.shiftKey && e.key.toLowerCase() === 'c') {
        if (selectedLabel) {
            toggleCollapse(selectedLabel); // Collapse the selected label
        }
    } 
});

document.addEventListener('keydown', function(e) {
    if (e.shiftKey && e.key.toLowerCase() === 's') {
        if (selectedLabel) {
            saveCurrAndNextLabelsAndLines(selectedLabel); // save the selected label and next labels, including lines
        }
    }
});

// Add event listener to the button to show local storage
document.getElementById('show-localstorage').addEventListener('click', showLocalStorage);


// #endregion

function saveCurrAndNextLabelsAndLines(label){
    let linkedLabelsAndLinesList = collectLinkedLabelsAndLines(label);
    let collectedLabels = linkedLabelsAndLinesList.linkedLabelsList;
    let collectedLines = linkedLabelsAndLinesList.linesList;


    filteredLabelPositions = labelPositions.filter(item1 =>
        collectedLabels.some(item2 => item1.element.innerHTML === item2.innerHTML)
    );

    savingLabelsData = filteredLabelPositions.map(labelPos => ({
        html: labelPos.element.innerHTML.trim(),
        left: getValFromPx(labelPos.element.style.left),
        top: getValFromPx(labelPos.element.style.top),
        color: labelPos.color || "#3498db",
        collapsed: labelPos.element.collapsed,
        visibility: labelPos.element.style.visibility,
        backgroundColor: labelPos.element.style.backgroundColor,
        wasTitle: labelPos.element.title
    }));

    savingLinesData = collectedLines.map(line => ({
        from: line.label1.textContent.trim(), 
        to: line.label2.textContent.trim(),
        fromPosition: {
            x: line.x1,
            y: line.y1
        },
        toPosition: {
            x: line.x2,
            y: line.y2
        },
        hidden: line.hidden,
        color: line.color || "#e74c3c",
        width: line.width || 2
    }));

    const collectedLabelsAndLinesState = {
        labels: savingLabelsData,
        lines:savingLinesData
    };

    console.log(JSON.stringify(collectedLabelsAndLinesState, null, 2));
}

function addNewFromJSON(data){
    if (data.labels) {
        data.labels.forEach(labelData => {
            newLabel = document.createElement('div');
            newLabel.classList.add('floating-label');
            newLabel.innerHTML = labelData.html?labelData.html:labelData.text;
            newLabel.style.left = `${labelData.left}px`;
            newLabel.style.top = `${labelData.top}px`;
            newLabel.style.color = labelData.color;
            newLabel.style.borderColor = labelData.color;
            newLabel.style.visibility = labelData.visibility?labelData.visibility:"visible";
            newLabel.style.backgroundColor = labelData.backgroundColor;
            newLabel.wasTitle = labelData.wasTitle; // maybe also add labelData.title so that can load even from saveState not just saveCollectedLabels

            document.body.appendChild(newLabel);
            labelPositions.push({
                element: newLabel,
                width: newLabel.offsetWidth,
                height: newLabel.offsetHeight,
                color: labelData.color,
                collapsed: labelData.collapsed
            });

            makeLabelDraggableAndEditable(newLabel);
        });
    }

    if (data.lines) {
        data.lines.forEach(lineData => {
            const label1 = findLabelByText(lineData.from);
            const label2 = findLabelByText(lineData.to);
            if (label1 && label2) {
                drawLineBetweenLabels(label1, label2, lineData.color, lineData.width, lineData.hidden);
            }
        })
    }
}

function toggleCollapse(label) {
    label.collapsed = !label.collapsed;
    if (label.collapsed) {
        label.style.backgroundColor = 'lightgray'; 
        hideNextLabelsAndLines(label);
        redrawLines();
    } else {
        label.style.backgroundColor = label.originalColor || 'white';
        showNextLabelsAndLines(label);
        redrawLines();
    }
}

// Recursively hide next labels and lines
function hideNextLabelsAndLines(label) {
    lines.forEach(line => {
        if (line.label1 === label) {
            line.hidden = true; 
            line.label2.style.visibility = 'hidden';
            line.label2.collapsed = true; 
            hideNextLabelsAndLines(line.label2);
        }
    });
}

// Recursively show next labels and lines
function showNextLabelsAndLines(label) {
    lines.forEach(line => {
        if (line.label1 === label) {
            line.hidden = false;
            line.label2.style.visibility = 'visible';
            line.label2.style.backgroundColor = label.originalColor || 'white';
            line.label2.collapsed = false;
            showNextLabelsAndLines(line.label2);
        }
    });
}

// #region COLOR FUNCTIONS 

colorPicker.addEventListener("click", function(e) {
    e.stopPropagation();
})

// Update the label's color when colorPicker changes
function changeSelectedItemColor(e){
    e.stopPropagation();
    if (selectedLabel) changeSelectedLabelColor();
    else if (selectedLine) changeSelectedLineColor();
}

function changeSelectedLabelColor(){
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

// Update the label's color when colorPicker changes
function changeSelectedLineColor(){
        const newColor = colorPicker.value;
        selectedLine.color = newColor;

        // Update the label color in labelPositions
        lines.forEach(line => {
            if (line=== selectedLine){
                line.color = newColor;
            }
        });
        redrawLines();
}



// Function to update color picker based on selected item's color
function updateColorPickerFromLabel(label){
    const colorPicker = document.getElementById('colorPicker'); 
    
    const currentColor = label.style.color; // Color of label
    colorPicker.value = rgbToHex(currentColor); // Update the color picker value to the label's color
}

// Function to update color picker based on selected item's color
function updateColorPickerFromLine(line){
    const colorPicker = document.getElementById('colorPicker'); 
    
    const currentColor = line.color; // Color of line
    colorPicker.value = currentColor; // Update the color picker value to the line's color
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

// #endregion



function updateLinkedLabels(labelsList, diffX, diffY){
    labelsList.forEach(label => {
        label.style.left = getValFromPx(label.style.left) + diffX + "px";
        label.style.top = getValFromPx(label.style.top) + diffY + "px";
    });
}

function collectLinkedLabelsAndLines(label){
    startingLabels = [label];
    linkedLabelsList = [];
    linesList = [];

    while(startingLabels.length !==0 ){
        currLabel = startingLabels.shift();
        linkedLabelsList.push(currLabel);
        lines.forEach(line => {
            if(line.label1 === currLabel){
                startingLabels.push(line.label2);
                linesList.push(line);
            }
        })
    }
    collectedLabelsAndLinesList = {linkedLabelsList, linesList};
    return collectedLabelsAndLinesList;
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
                if(label.collapsed){
                    const linkedLabelsList = collectLinkedLabelsAndLines(label).linkedLabelsList;
                    diffX = newLeft - getValFromPx(label.style.left);
                    diffY = newTop - getValFromPx(label.style.top);
                    updateLinkedLabels(linkedLabelsList, diffX, diffY);
                }
                else{
                    label.style.left = `${newLeft}px`;
                    label.style.top = `${newTop}px`;
                }
               redrawLines(); // Update lines when label is dragged
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
                pos.element.style.left = `${label.offsetLeft}px`;
                pos.element.style.top = `${label.offsetTop}px`;
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
        if(label.title) document.title = label.textContent;
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

// Function to detect overlap
function isOverlapping(element, xPos, yPos) {
    const elemWidth = element.offsetWidth;
    const elemHeight = element.offsetHeight;

    for (let i = 0; i < labelPositions.length; i++) {
        const otherLabel = labelPositions[i];

        if (element !== otherLabel.element) {
            if (
                xPos < getValFromPx(otherLabel.element.style.left) + otherLabel.width &&
                xPos + elemWidth > getValFromPx(otherLabel.element.style.left) &&
                yPos < getValFromPx(otherLabel.element.style.top) + otherLabel.height &&
                yPos + elemHeight > getValFromPx(otherLabel.element.style.top)
            ) {
                return true;
            }
        }
    }
    return false;
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
        updateColorPickerFromLabel(label);
    }

    
}

// Function to find a label by its text
function findLabelByText(text) {
    return labelPositions.find(labelPos => labelPos.element.textContent.trim() === text)?.element;
}

// #region DELETE FUNCTIONS 

// Function to delete selected label or line
function deleteSelectedItem() {
    if (selectedLabel) {
        deleteSelectedLabel();
    } else if (selectedLine){
        deleteSelectedLine();
    }
}

// Function to delete the selected line
function deleteSelectedLine(){
    if(selectedLine !== null){
        let index = lines.findIndex(e => e === selectedLine);
        lines.splice(index, 1);
        selectedLine = null; 
        redrawLines();
    }
}

// Function to delete the selected label
function deleteSelectedLabel() {
    if (selectedLabel) {
        // Remove the label from the DOM
        selectedLabel.remove(); 

        // Remove the label from the labelPositions array
        labelPositions = labelPositions.filter(pos => pos.element !== selectedLabel);

        // Update lines if any were connected to the deleted label
        lines = lines.filter(line => {

            if (line.label1 === selectedLabel || line.label2 === selectedLabel) {
                return false; // Remove lines connected to the deleted label
            }
            return true;
        });
        redrawLines(); // Redraw lines after deletion

        selectedLabel = null; // Clear the selection
    }
}

// #endregion

// Function to get the center of a label
function getLabelCenter(rect) {
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Function to flip the direction of a line
function flipLineDirection(){
    const tempLabel = selectedLine.label1;
    selectedLine.label1 = selectedLine.label2;
    selectedLine.label2 = tempLabel;

    // Swap the starting and ending points as well
    const tempX = selectedLine.x1;
    const tempY = selectedLine.y1;
    selectedLine.x1 = selectedLine.x2;
    selectedLine.y1 = selectedLine.y2;
    selectedLine.x2 = tempX;
    selectedLine.y2 = tempY;

    redrawLines(); // Redraw all lines after flipping
}

// Function to draw a line between two labels
function drawLineBetweenLabels(label1, label2, lineColor, lineWidth, lineHidden = false) {
    const rect1 = label1.getBoundingClientRect();
    const rect2 = label2.getBoundingClientRect();

    const x1 = rect1.left + rect1.width / 2;
    const y1 = rect1.top + rect1.height / 2;
    const x2 = rect2.left + rect2.width / 2;
    const y2 = rect2.top + rect2.height / 2;

    // Store the line information for later updates
    let l = {
        label1,
        label2,
        x1,
        y1,
        x2,
        y2,
        color: lineColor?lineColor: "#e74c3c",
        width: lineWidth?lineWidth:2,
        hidden: lineHidden,
    };
    selectLine(l);
    lines.push(l);

    redrawLines();
}


// Function to clear and drawn all lines
function redrawLines() {
    // Clear the canvas
    ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

    // Redraw each line
    lines.forEach(line => {
        if (line.hidden) return; 
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

        

        if(line===selectedLine){
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';  // Line color (red)
            ctx.lineWidth = 8;
            ctx.stroke();
            ctx.closePath();
        }

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = line.color?line.color:'#e74c3c';  // Line color (red)
        ctx.lineWidth = 2;//line.width;
        ctx.stroke();
        ctx.closePath();

        // Update the stored positions for the line
        line.x1 = startX;
        line.y1 = startY;
        line.x2 = endX;
        line.y2 = endY;

        // Draw arrowhead
        const headLength = 30; // Length of arrow head
        const angle = Math.atan2(endY - startY, endX - startX); // Calculate angle of the line
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.strokeStyle = 'blue';
        ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = 'blue'; // Fill color for the arrowhead
        ctx.fill();
    });
}




// #region SAVE & LOAD 

function getState(){
    const labelsData = labelPositions.map(labelPos => ({
        //text: labelPos.element.textContent.trim(),  // Get only the innerText (label content)
        html: labelPos.element.innerHTML.trim(),
        left: getValFromPx(labelPos.element.style.left),                      // Get the x (left) position of the label
        top: getValFromPx(labelPos.element.style.top),                        // Get the y (top) position of the label
        color: labelPos.color || "#3498db",        // Include color (default if not set)
        collpased: labelPos.element.collapsed,
        visibility: labelPos.element.style.visibility,
        backgroundColor: labelPos.element.style.backgroundColor,
        title: labelPos.element.title
    }));

    const linesData = lines.map(line => ({
        from: line.label1.textContent.trim(),       // Get the text of the first label connected by the line
        to: line.label2.textContent.trim(),         // Get the text of the second label connected by the line
        fromPosition: {                           // The starting position of the line
            x: line.x1,
            y: line.y1
        },
        toPosition: {                             // The ending position of the line
            x: line.x2,
            y: line.y2
        },
        hidden: line.hidden,
        color: line.color || "#e74c3c",
        width: line.width || 2,
    }));

    const state = {
        labels: labelsData,
        lines: linesData
    };
    return state;
}

function downloadDataAsFile(){
    let state = getState();
    state.title = document.title;
    state.time = ""+new Date();

    const blob = new Blob([JSON.stringify(state), null, 2], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'autosave.json';
    link.click();

    console.log('Downloaded saved data as file.');
}

function showLocalStorage() {
    const container = document.getElementById('localstorage-contents');
    container.innerHTML = ''; // Clear previous contents

    // Create a list to show each localStorage item
    const ul = document.createElement('ul');

    // Loop through localStorage items
    for (let i=0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);

        const li = document.createElement('li');
        // li.textContent = `${key}: ${value}`;
        
        // Create a delete button for each item
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Del';
        deleteButton.onclick = () => {
            localStorage.removeItem(key);
            showLocalStorage(); // Refresh the displayed list
        };
        li.appendChild(deleteButton);
        li.appendChild(document.createTextNode(`${key}: ${value}`));
        

        
        ul.appendChild(li);
    }

    // Add a button to clear all localStorage items
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All';
    clearButton.onclick = () => {
        localStorage.clear();
        showLocalStorage(); // Refresh the displayed list
    }

    container.appendChild(ul);
    container.appendChild(clearButton);
    container.style.display = 'block'; // Show the container
}

function autoSave(){
    let state = getState();
    state.title = document.title;
    state.time = ""+new Date();

    localStorage.setItem(currId, JSON.stringify(state));
    lastSaveTimeLabel.innerText = "Last locally saved: "+state.time;
}


function saveState() {
    const state = getState();
    console.log(JSON.stringify(state, null, 2));  // Log the clean state as a formatted JSON string
}

// Function to load labels and lines from provided JSON
function loadFromJSON(data) {
    // Clear existing labels and lines
    clearAllLabelsAndLines();
    tmp = data;

    // Load labels
    if (data.labels) {
        data.labels.forEach(labelData => {
            const newLabel = document.createElement('div');
            newLabel.classList.add('floating-label');
            //newLabel.textContent = labelData.text;
            newLabel.innerHTML = labelData.html?labelData.html:labelData.text;
            newLabel.style.left = `${labelData.left}px`;
            newLabel.style.top = `${labelData.top}px`;
            newLabel.style.color = labelData.color;
            newLabel.style.borderColor = labelData.color;
            newLabel.style.visibility = labelData.visibility?labelData.visibility:'visible';
            newLabel.style.backgroundColor = labelData.backgroundColor;
            newLabel.title = labelData.title;

            
            document.body.appendChild(newLabel);
            labelPositions.push({
                element: newLabel,
                width: newLabel.offsetWidth,
                height: newLabel.offsetHeight,
                color: labelData.color, //? redundant and not necessary?
                collapsed: labelData.collapsed
            });
            //Set title
            if (labelData.title === true || labelData.title==="true") document.title = newLabel.innerText;

            makeLabelDraggableAndEditable(newLabel);
        });
    }

    // Load lines
    if (data.lines) {
        data.lines.forEach(lineData => {
            const label1 = findLabelByText(lineData.from);
            const label2 = findLabelByText(lineData.to);
            if (label1 && label2) {
                drawLineBetweenLabels(label1, label2, lineData.color, lineData.width, lineData.hidden);
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

// #endregion

// #region HELPER LINE FUNCTIONS

// Function to highlight the selected line
function selectLine(line) {
    // Update line appearance for selection (e.g., change color or width)
    selectedLine = line;
    updateColorPickerFromLine(selectedLine);
    redrawLines();
}

// Function to unhighlight non-selected lines
function unselectLine(line){
    // Restore line appearance to default
    if(line===selectedLine) selectedLine = null;
    redrawLines();
}

// Helper function to check if a click is near a line
function isClickNearLine(x, y, line) {
    const tolerance = 5; // Distance in pixels to consider a "near" click
    const distance = pointToLineDistance(x, y, line.x1, line.y1, line.x2, line.y2);
    return distance <= tolerance;
}

// Calculate the distance from a point to a line segment
function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    const param = len_sq !==0 ? dot / len_sq : -1;

    let xx, yy;

    if (param <0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// #endregion

setInterval(autoSave, 10000);