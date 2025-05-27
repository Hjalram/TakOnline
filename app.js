const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

io.on('connection', (socket) => {


    console.log(socket.id);


});

server.listen(3001, () => {
    console.log('Listening at port 3001...');
}); 