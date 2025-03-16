import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';
const NUM_CLIENTS = 30;
const INTERVAL_MS = 1000;

const clients: Socket[] = [];

for (let i = 0; i < NUM_CLIENTS; i++) {
    const socket = io(SERVER_URL);

    socket.on('connect', () => {
        console.log(`Client ${i} connected: ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log(`Client ${i} disconnected: ${socket.id}`);
    });

    clients.push(socket);
}

setInterval(() => {
    clients.forEach((socket, index) => {
        const words = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape'];
        const response = words[Math.floor(Math.random() * words.length)];
        socket.emit('response', response);
        console.log(`Client ${index} sent: ${response}`);
    });
}, INTERVAL_MS);
