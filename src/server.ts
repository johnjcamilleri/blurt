import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 128, // bytes or characters
});

export type ClientResponses = {
    [clientId: string]: string | null;
};

const clientResponses: ClientResponses = {};

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Socket.IO setup
io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);
    const isTeacher = socket.handshake.query.role === 'teacher';
    if (!isTeacher) {
        clientResponses[socket.id] = null;
    }

    // Handle client response
    socket.on('respond', (response: string) => {
        clientResponses[socket.id] = response;
        console.log(`Received response from ${socket.id}: ${response}`);
        io.emit('update responses', clientResponses); // broadcast
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        delete clientResponses[socket.id];
        io.emit('update responses', clientResponses);
    });

    // Send current responses
    socket.on('get responses', () => {
        socket.emit('update responses', clientResponses);
    });

    // Clear all responses
    socket.on('clear responses', () => {
        console.log(`Clearing responses`);
        Object.keys(clientResponses).forEach(clientId => {
            clientResponses[clientId] = null;
        });
        io.emit('update responses', clientResponses); // broadcast
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

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('Received shutdown signal, shutting down gracefully...');
    io.close(() => {
        console.log('Closed out remaining connections.');
        process.exit(0);
    });

    // Force close server after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
