import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

interface ClientResponse {
    [clientId: string]: string;
}

const clientResponses: ClientResponse = {};

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Socket.IO setup
io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle client response
    socket.on('response', (response: string) => {
        clientResponses[socket.id] = response;
        console.log(`Received response from ${socket.id}: ${response}`);
        io.emit('updateResponses', clientResponses);
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        delete clientResponses[socket.id];
        io.emit('updateResponses', clientResponses);
    });

    // Send the current responses to the newly connected teacher client
    socket.on('getResponses', () => {
        socket.emit('updateResponses', clientResponses);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Error handling
server.on('error', (error: NodeJS.ErrnoException) => {
    console.error(`Server error: ${error.message}`);
});
