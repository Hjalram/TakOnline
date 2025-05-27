const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const socket = io();

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

async function update() {
    clearScreen();

    drawBoard();

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
            // Draw Rectangle
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

            
            if (currentTile.length !== 0) {
                const topBrick = currentTile[currentTile.length-1];
                if (topBrick.color === 'white') {
                    ctx.fillStyle = '#ffffff';
                }
                else if (topBrick.color === 'black') {
                    ctx.fillStyle = '#000000';
                }
                else {
                    ctx.fillStyle = '#ff0000';
                }

                let brickOffset = cellSize/2 - brickSize/2;
                ctx.fillRect(xPos + brickOffset, yPos + brickOffset, cellSize - 10, cellSize - 10);
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

canvas.addEventListener('mousedown', (e) => {

    // Calculating mouse pos
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const tileIndex = isMouseHoveringTile(mouseX, mouseY);
    if (tileIndex !== false) {
        makeMove(tileIndex, null, 'road');
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