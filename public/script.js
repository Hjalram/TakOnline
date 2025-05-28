const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const socket = io(); // Connecting to the server

let canvasRect = canvas.getBoundingClientRect();

canvas.width = canvasRect.width * devicePixelRatio;
canvas.height = canvasRect.height * devicePixelRatio;

ctx.scale(devicePixelRatio, devicePixelRatio);

let whiteRoad = new Image();
let blackRoad = new Image();
let whiteWall = new Image();
let blackWall = new Image();

whiteRoad.src = '/images/white.png';
blackRoad.src = '/images/brown.png';
whiteWall.src = '/images/whitewall.png';
blackWall.src = '/images/brownwall.png';

class Game {
    constructor() {
        this.board = [];
        this.size = 6;
        this.pixelSize;
        this.boardPos = { x: canvas.width/2, y: canvas.height/2 };
        this.showSelection = false;
        this.prefs;
        this.client;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    updateCanvasSize() {
        const canvasCell = document.querySelector('.canvas-cell');
        const rect = canvasCell.getBoundingClientRect();

        canvas.width = rect.height*0.8;
        canvas.height = canvas.width;

        this.boardPos = { x: canvas.width/2, y: canvas.height/2 };

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        //ctx.scale(devicePixelRatio, devicePixelRatio);
    }

    tileHovered(mouse) {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const xPos = col * this.prefs.cellDist + this.offsetX;
                const yPos = row * this.prefs.cellDist + this.offsetY;

                if (mouse.x >= xPos && mouse.x <= xPos + this.prefs.cellSize &&
                    mouse.y >= yPos && mouse.y <= yPos + this.prefs.cellSize) {
                    if (this.client.myself.color === 'white') return [row, col];
                    if (this.client.myself.color === 'black') return [this.size - 1 - row, this.size - 1 - col];
                }
            }
        }

        return false;
    }

    mousePosition(e) {
        // Calculating mouse pos
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        return { x: mouseX, y: mouseY };
    }

    clearScreen() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#555555'; // BG color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawBoard() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {

                // Drawing cell
                let currentTile;
                if (this.client.myself.color === 'black') currentTile = this.board[this.size - 1 - row][this.size - 1 - col];
                if (this.client.myself.color === 'white') currentTile = this.board[row][col];
                
                const xPos = col * this.prefs.cellDist + this.offsetX;
                const yPos = row * this.prefs.cellDist + this.offsetY;

                ctx.fillStyle = '#aaaaaa';
                ctx.fillRect(xPos, yPos, this.prefs.cellSize, this.prefs.cellSize);

                // Draw bricks if any
                if (currentTile.length !== 0) {
                    const topBrick = currentTile[currentTile.length-1];
                    let brickOffset = this.prefs.cellSize/2 - this.prefs.brickSize/2;

                    if (topBrick.color === 'white') {
                        ctx.fillStyle = '#ebceb0';
                        ctx.drawImage(whiteRoad, xPos + brickOffset, yPos + brickOffset, this.prefs.cellSize - 10, this.prefs.cellSize - 10);
                    }
                    else if (topBrick.color === 'black') {
                        ctx.fillStyle = '#634226';
                        ctx.drawImage(blackRoad, xPos + brickOffset, yPos + brickOffset, this.prefs.cellSize - 10, this.prefs.cellSize - 10);
                    }
                    else {
                        ctx.fillStyle = '#ff0000';
                    }

                    
                    //ctx.fillRect(xPos + brickOffset, yPos + brickOffset, this.prefs.cellSize - 10, this.prefs.cellSize - 10);
                    
                }

                // Showing directions
                ctx.font = '30px serif';
                ctx.fillStyle = '#aaaaaa';

                if (this.client.myself.color === 'white') {
                    ctx.fillText('N', this.boardPos.x - 10, this.boardPos.y - this.pixelSize/2 - 10);
                    ctx.fillText('S', this.boardPos.x - 10, this.boardPos.y + this.pixelSize/2 + 30);
                    ctx.fillText('W', this.boardPos.x - this.pixelSize/2 - 40, this.boardPos.y + 10);
                    ctx.fillText('E', this.boardPos.x + this.pixelSize/2 + 10, this.boardPos.y + 10);
                }
                
                if (this.client.myself.color === 'black') {
                    ctx.fillText('S', this.boardPos.x - 10, this.boardPos.y - this.pixelSize/2 - 10);
                    ctx.fillText('N', this.boardPos.x - 10, this.boardPos.y + this.pixelSize/2 + 30);
                    ctx.fillText('E', this.boardPos.x - this.pixelSize/2 - 30, this.boardPos.y + 10);
                    ctx.fillText('W', this.boardPos.x + this.pixelSize/2 + 10, this.boardPos.y + 10);
                }
            }
        }
    }

    update() {
        // Update variables
        this.size = this.board.length;
        console.log(this.size);
        this.pixelSize = (this.size-1)*this.prefs.cellDist + this.prefs.cellSize;
        this.offsetX = this.boardPos.x - this.pixelSize/2;
        this.offsetY = this.boardPos.y - this.pixelSize/2;

        this.clearScreen();

        if (this.showSelection) {
            ctx.fillStyle = '#333333';
            ctx.fillRect(clickPos.x - 60, clickPos.y - 50, 120, 40);
        }

    }
}

class Prefs {
    constructor() {
        this.cellDist = 50;
        this.cellSize = 45;
        this.brickSize = 35;
        this.theme = 'dark';
    }
}

class Client {
    constructor() {
        this.myself;
        this.gameRole;
        this.latestClickPos;
        this.latestSelectedTile;
    }
}

const game = new Game();
const prefs = new Prefs();
const client = new Client();

game.prefs = prefs;
game.client = client;
game.updateCanvasSize();

function update() {
    game.update();
    game.drawBoard();
    requestAnimationFrame(update);
}

function getMyself() {
    return new Promise((resolve) => {
        socket.emit('getMyself');
        socket.once('getMyself', (data) => {
            //myself = data;
            client.myself = data;

            resolve();
        });
    });
}

function getBoard() {
    return new Promise((resolve) => {
        socket.emit('getBoard');
        socket.once('getBoard', (data) => {
            game.board = data;
            //localBoard = data;
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

canvas.addEventListener('mousedown', (e) => {
    const mousePos = game.mousePosition(e);
    const tileIndex = game.tileHovered(mousePos);
    
    if (tileIndex) {
        if (game.board[tileIndex[0]][tileIndex[1]].length !== 0) {
            makeMove([5,5], [tileIndex[0], tileIndex[1]], null);
        } else {
            makeMove(tileIndex, null, 'road');
        }
    }
});

window.addEventListener('resize', () => {
    game.updateCanvasSize();
});

// Handling socket.io events

socket.on('connect', async () => {
    console.log('Welcome!');
    await getBoard();
    await getMyself();

    // Board size
    /*
    size = localBoard.length;
    pixelSizeBoard = (size-1)*cellDist + cellSize;
    offsetX = canvas.width/2 - pixelSizeBoard/2;
    offsetY = canvas.height/2 - pixelSizeBoard/2;
    */
    update();
});

socket.on('disconnect', () => {
    console.log('Bye!');
});

socket.on('boardUpdate', (data) => {
    game.board = data;
    //localBoard = data;
    //console.log(localBoard);
});

socket.on('rolesUpdated', async () => {
    await getMyself();
});