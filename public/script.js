const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const socket = io(); // Connecting to the server

canvas.width = 700;
canvas.height = 400;

let myself;
let localBoard = [];

const cellSize = 45;
const cellDist = 50;
const brickSize = 35;

// Board size
let size = localBoard.length;
let pixelSizeBoard = (size-1)*cellDist + cellSize;
let offsetX = canvas.width/2 - pixelSizeBoard/2;
let offsetY = canvas.height/2 - pixelSizeBoard/2;

let showSelection = false;
let clickPos;
let selectedTile;

async function update() {
    clearScreen();

    drawBoard();

    if (showSelection) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(clickPos.x - 60, clickPos.y - 50, 120, 40);
    }

    requestAnimationFrame(update);
}

function clearScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#555555'; // BG color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBoard() {
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {

            // Drawing cell
            let currentTile;
            if (myself.color === 'black') {
                currentTile = localBoard[size - 1 - row][size - 1 - col];
            }
            if (myself.color === 'white') {
                currentTile = localBoard[row][col];
            }
            
            const xPos = col * cellDist + offsetX;
            const yPos = row * cellDist + offsetY;

            ctx.fillStyle = '#aaaaaa';
            ctx.fillRect(xPos, yPos, cellSize, cellSize);

            // Draw bricks if any
            if (currentTile.length !== 0) {
                const topBrick = currentTile[currentTile.length-1];
                if (topBrick.color === 'white') {
                    ctx.fillStyle = '#ebceb0';
                }
                else if (topBrick.color === 'black') {
                    ctx.fillStyle = '#634226';
                }
                else {
                    ctx.fillStyle = '#ff0000';
                }

                let brickOffset = cellSize/2 - brickSize/2;
                ctx.fillRect(xPos + brickOffset, yPos + brickOffset, cellSize - 10, cellSize - 10);
            }

            // Showing directions
            ctx.font = '30px serif';
            ctx.fillStyle = '#aaaaaa';

            if (myself.color === 'white') {
                ctx.fillText('N', canvas.width/2 - 10, canvas.height/2 - pixelSizeBoard/2 - 10);
                ctx.fillText('S', canvas.width/2 - 10, canvas.height/2 + pixelSizeBoard/2 + 30);
                ctx.fillText('W', canvas.width/2 - pixelSizeBoard/2 - 40, canvas.height/2 + 10);
                ctx.fillText('E', canvas.width/2 + pixelSizeBoard/2 + 10, canvas.height/2 + 10);
            }
            
            if (myself.color === 'black') {
                ctx.fillText('S', canvas.width/2 - 10, canvas.height/2 - pixelSizeBoard/2 - 10);
                ctx.fillText('N', canvas.width/2 - 10, canvas.height/2 + pixelSizeBoard/2 + 30);
                ctx.fillText('E', canvas.width/2 - pixelSizeBoard/2 - 30, canvas.height/2 + 10);
                ctx.fillText('W', canvas.width/2 + pixelSizeBoard/2 + 10, canvas.height/2 + 10);
            }
        }
    }
}

function getMyself() {
    return new Promise((resolve) => {
        socket.emit('getMyself');
        socket.once('getMyself', (data) => {
            myself = data;
            resolve();
        });
    });
}

function getBoard() {
    return new Promise((resolve) => {
        socket.emit('getBoard');
        socket.once('getBoard', (data) => {
            localBoard = data;
            resolve();
        });
    });
}

async function makeMove(destination, start=null, brickType=null) {
    if (start === null && brickType !== null) {

        // Placing
        socket.emit('move', {
            type: 'placement',
            destination: destination,
            start: null,
            brickType: brickType,
        });
    } 
    else if (start !== null && brickType === null) {

        // Moving
        socket.emit('move', {
            type: 'movement',
            destination: destination,
            start: start,
            brickType: null,
        });
    } 
    else {
        console.log('Incorrect Move!');
        return;
    }
}

function isMouseHoveringTile(mouseX, mouseY) {
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const xPos = col * cellDist + offsetX;
            const yPos = row * cellDist + offsetY;

            if (mouseX >= xPos && mouseX <= xPos + cellSize &&
                mouseY >= yPos && mouseY <= yPos + cellSize) {
                if (myself.color === 'white') return [row, col];
                if (myself.color === 'black') return [size - 1 - row, size - 1 - col];
            }
        }
    }

    return false;
}

function getMousePosition(e) {
    // Calculating mouse pos
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    return { x: mouseX, y: mouseY };
}

canvas.addEventListener('mousedown', (e) => {
    const mousePos = getMousePosition(e);
    const tileIndex = isMouseHoveringTile(mousePos.x, mousePos.y);
    

    if (!showSelection && tileIndex) {

        if (localBoard[tileIndex[0]][tileIndex[1]].length !== 0) {
            makeMove([5,5], [tileIndex[0], tileIndex[1]], null);
        }
        else {
            showSelection = true;
            selectedTile = tileIndex;
            clickPos = mousePos;
        }
    }
    else if (showSelection) {
        makeMove(selectedTile, null, 'road');
        showSelection = false;
    }
});

// Handling socket.io events

socket.on('connect', async () => {
    console.log('Welcome!');
    await getBoard();
    await getMyself();

    // Board size
    size = localBoard.length;
    pixelSizeBoard = (size-1)*cellDist + cellSize;
    offsetX = canvas.width/2 - pixelSizeBoard/2;
    offsetY = canvas.height/2 - pixelSizeBoard/2;

    update();
});

socket.on('disconnect', () => {
    console.log('Bye!');
});

socket.on('boardUpdate', (data) => {
    localBoard = data;
    //console.log(localBoard);
});

socket.on('rolesUpdated', async () => {
    await getMyself();
});