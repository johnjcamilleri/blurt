#!/usr/bin/env node

import http from 'node:http';
import cookieParser from 'cookie-parser';
import express from 'express';
import {Server, type Socket} from 'socket.io';

type StudentResponses = Map<string, string>;
type Mode = 'free-text' | 'code' | 'yes-no-maybe';
type Room = {
    secret: string;
    studentResponses: StudentResponses;
    teacherSocket?: Socket;
    mode: Mode;
};
const createRoom = (name: string): Room => ({
    secret: Math.random().toString(36).slice(2, 15),
    studentResponses: new Map(),
    teacherSocket: undefined,
    mode: 'free-text',
});
const rooms = new Map<string, Room>();

export const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 128, // bytes or characters
});

app.use(express.static('./client'));
app.use(cookieParser());

app.get('/new', (req, res) => {
    // TODO: choose better name & check if taken
    const newName = Math.random().toString(36).slice(2, 7);
    res.redirect(`/${newName}`);
});
app.get('/join/:room', (req, res) => {
    const roomName = req.params.room;
    if (rooms.has(roomName)) {
        res.redirect(`/${roomName}`);
    } else {
        // TODO: UI message that room not found
        res.redirect('/');
    }
});
app.get('/:room', (req, res) => {
    const roomName = req.params.room;
    if (rooms.has(roomName)) {
        // Room exists
        const room = rooms.get(roomName);
        const sentSecret = req.cookies[roomName] as string;
        if (sentSecret && room?.secret === sentSecret) {
            // If sending secret which matches, re-join as teacher
            res.sendFile('teacher.html', {root: './client/src'});
        } else {
            // Otherwise join as student
            res.clearCookie(roomName); // in case cookie is stale
            res.sendFile('student.html', {root: './client/src'});
        }
    } else {
        // Room doesn't exist, create as teacher
        console.log(`[${roomName}] create room`);
        const room = createRoom(roomName);
        rooms.set(roomName, room);
        res.cookie(roomName, room.secret);
        res.sendFile('teacher.html', {root: './client/src'});
        // TODO: UI message that room was created
    }
});

// Socket.IO setup
io.on('connection', (socket: Socket) => {
    const roomName = socket.handshake.query.roomName; // should always be present
    const roomSecret = socket.handshake.query.roomSecret; // only present for teacher

    if (typeof roomName !== 'string') {
        console.log(`${socket.id} invalid room name`);
        socket.disconnect();
        return;
    }

    const room = rooms.get(roomName);

    if (!room) {
        console.log(`${socket.id} room does not exist: ${roomName}`);
        socket.disconnect();
        return;
    }

    const isTeacher = room.secret === roomSecret;
    if (isTeacher) {
        console.log(`[${roomName}] ${socket.id} teacher connect`);
        room.teacherSocket = socket;
    } else {
        console.log(`[${roomName}] ${socket.id} student connected`);
        room.studentResponses.set(socket.id, '');
        socket.emit('set mode', room.mode);
    }

    // Handle client disconnect
    socket.on('disconnect', () => {
        if (socket === room.teacherSocket) {
            console.log(`[${roomName}] ${socket.id} teacher disconnect`);
            room.teacherSocket = undefined;
        } else {
            console.log(`[${roomName}] ${socket.id} student disconnect`);
            room.studentResponses.delete(socket.id);
            room.teacherSocket?.emit('update response', socket.id, undefined);
        }

        if (room.teacherSocket === undefined && room.studentResponses.size === 0) {
            console.log(`[${roomName}] close room`);
            rooms.delete(roomName);
        }
    });

    // Handle set mode
    socket.on('set mode', (newMode: Mode) => {
        console.log(`[${roomName}] ${socket.id} set mode: ${newMode}`);
        room.mode = newMode;
        for (const socketId of room.studentResponses.keys()) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('set mode', newMode);
            }
        }
    });

    // Send all responses
    socket.on('get responses', () => {
        console.log(`[${roomName}] ${socket.id} get responses`);
        const serialised: Array<[string, string]> = Array.from(room.studentResponses.entries());
        socket.emit('all responses', serialised);
    });

    // Clear all responses
    socket.on('clear responses', () => {
        console.log(`[${roomName}] ${socket.id} clear responses`);
        for (const socketId of room.studentResponses.keys()) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('clear response');
            }
        }
    });

    // Handle student response
    socket.on('respond', (response: string) => {
        console.log(`[${roomName}] ${socket.id} respond: ${response}`);
        room.studentResponses.set(socket.id, response);
        room.teacherSocket?.emit('update response', socket.id, response);
    });
});

// Start the server
const PORT = process.env.PORT ?? 3000; // eslint-disable-line @typescript-eslint/naming-convention
server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});

// Error handling
server.on('error', (error: NodeJS.ErrnoException) => {
    console.error(`server error: ${error.message}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('received shutdown signal, shutting down gracefully...');
    void io.close(() => {
        console.log('closed out remaining connections');
        process.exit(0);
    });

    // Force close server after 10 seconds
    setTimeout(() => {
        console.error('could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10_000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
