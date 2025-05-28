const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.static('public'));


let livePlayers = [];
let board = [
    [ [], [], [], [], [], [] ],
    [ [], [], [], [], [], [] ],
    [ [], [], [], [], [], [] ],
    [ [], [], [], [], [], [] ],
    [ [], [], [], [], [], [] ],
    [ [], [], [], [], [], [] ],
];


io.on('connect', (socket) => {
    // Deciding color based on who entered first
    livePlayers.push({
        id: socket.id,
        color: '',
        name: 'Antoine',
        bricks: 16,
        capstone: true
    });

    updateGameRoles();

    //console.log(livePlayers);

    socket.on('move', (data) => {
        const destRow = data.destination[0];
        const destCol = data.destination[1];

        if (data.type === 'placement') {
            
            // Adding object to the servers board
            board[destRow][destCol].push({
                color: getPlayerById(socket.id).color,
                brickType: data.brickType
            });

            // Emitting changes to other players
            io.emit('boardUpdate', board);
            //console.log(board);

            // Decreasing the players amount of bricks
            getPlayerById(socket.id).bricks--;
        }
        else if (data.type === 'movement') {
            const destRow = data.destination[0];
            const destCol = data.destination[1];

            const startRow = data.start[0];
            const startCol = data.start[1];

            board[destRow][destCol].push(board[startRow][startCol]);
            board[startRow][startCol] = [];

            io.emit('boardUpdate', board);
            //console.log('Movement is not yet supported!');
        }
    })

    socket.on('getMyself', () => {
        socket.emit('getMyself', getPlayerById(socket.id));
    });

    socket.on('getBoard', () => {
        socket.emit('getBoard', board);
    });

    socket.on('disconnect', () => {
        const index = livePlayers.indexOf(getPlayerById(socket.id));
        livePlayers.splice(index, 1);
        updateGameRoles();
        console.log(socket.id + " disconnected!");
    })
});

function getPlayerById(id) {
    return livePlayers.find(p => p.id === id);
}

function updateGameRoles() {
    for (let i = 0; i < livePlayers.length; i++) {
        if (i === 0) {
            livePlayers[i].color = 'white';
        } else {
            livePlayers[i].color = 'black';
        }
    }

    io.emit('rolesUpdated');
}

server.listen(3001, () => {
    console.log('Listening at port 3001...');
}); 