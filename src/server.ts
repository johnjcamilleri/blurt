#!/usr/bin/env node

import http from 'node:http';
import path from 'node:path';
import express from 'express';
import {Server, type Socket} from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 128, // bytes or characters
});

type ClientResponses = Map<string, string>;

const clientResponses: ClientResponses = new Map();

// Serve static files
const __dirname = import.meta.dirname;
app.use(express.static(path.join(__dirname, '../client')));

// Socket.IO setup
io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);
    const isTeacher = socket.handshake.query.role === 'teacher';
    if (!isTeacher) {
        clientResponses.set(socket.id as string, '');
    }

    // Handle client response
    socket.on('respond', (response: string) => {
        clientResponses.set(socket.id as string, response);
        console.log(`Received response from ${socket.id}: ${response}`);
        io.emit('update responses', Object.fromEntries(clientResponses));
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        clientResponses.delete(socket.id as string);
        io.emit('update responses', Object.fromEntries(clientResponses));
    });

    // Send current responses
    socket.on('get responses', () => {
        socket.emit('update responses', Object.fromEntries(clientResponses));
    });

    // Clear all responses
    socket.on('clear responses', () => {
        console.log('Clearing responses');
        for (const clientId of clientResponses.keys()) {
            clientResponses.set(clientId, '');
        }

        io.emit('update responses', Object.fromEntries(clientResponses)); // broadcast
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
    await io.close(() => {
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
