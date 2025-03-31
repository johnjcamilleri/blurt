#!/usr/bin/env node

import http from 'node:http';
import express from 'express';
import {Server, type Socket} from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 128, // bytes or characters
});

type StudentResponses = Map<string, string>;

const studentResponses: StudentResponses = new Map();

const teacherSockets: Set<Socket> = new Set<Socket>();

type Mode = 'free-text' | 'code' | 'yes-no-maybe';

let mode: Mode = 'code';

// Serve static files
app.use(express.static('./client'));

// Socket.IO setup
io.on('connection', (socket: Socket) => {
    const isTeacher = socket.handshake.query.role === 'teacher';
    if (isTeacher) {
        console.log(`Teacher connected: ${socket.id}`);
        teacherSockets.add(socket);
    } else {
        console.log(`Student connected: ${socket.id}`);
        studentResponses.set(socket.id, '');
        socket.emit('set mode', mode);
    }

    // Handle client disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        studentResponses.delete(socket.id);
        for (const teacherSocket of teacherSockets) {
            teacherSocket.emit('update response', socket.id, undefined);
        }
    });

    // Handle set mode
    socket.on('set mode', (newMode: Mode) => {
        console.log(`Set mode: ${newMode}`);
        mode = newMode;
        io.emit('set mode', mode);
    });

    // Send all responses
    socket.on('get responses', () => {
        console.log('Get responses');
        const serialised: Array<[string, string]> = Array.from(studentResponses.entries());
        socket.emit('all responses', serialised);
    });

    // Clear all responses
    socket.on('clear responses', () => {
        console.log('Clearing responses');
        for (const socketId of studentResponses.keys()) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('clear response');
            }
        }
    });

    // Handle student response
    socket.on('respond', (response: string) => {
        console.log(`Received response from ${socket.id}: ${response}`);
        studentResponses.set(socket.id, response);
        for (const teacherSocket of teacherSockets) {
            teacherSocket.emit('update response', socket.id, response);
        }
    });
});

// Start the server
const PORT = process.env.PORT ?? 3000; // eslint-disable-line @typescript-eslint/naming-convention
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Error handling
server.on('error', (error: NodeJS.ErrnoException) => {
    console.error(`Server error: ${error.message}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('Received shutdown signal, shutting down gracefully...');
    void io.close(() => {
        console.log('Closed out remaining connections.');
        process.exit(0);
    });

    // Force close server after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10_000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
