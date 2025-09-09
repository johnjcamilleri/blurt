#!/usr/bin/env node
/* eslint-disable array-element-newline */

import http from 'node:http';
import cookieParser from 'cookie-parser';
import express from 'express';
import {Server as SocketServer, type Socket} from 'socket.io';

type StudentResponses = Map<string, string>;
type Mode = 'off' | 'text' | 'number' | 'yes-no-maybe';
export type Room = {
    name: string;
    secret: string;
    studentResponses: StudentResponses;
    teacherSocket?: Socket;
    mode: Mode;
    recentlyPickedStudents: string[];
};
export const createRoom = (roomName: string): Room => {
    const room: Room = {
        name: roomName,
        secret: Math.random().toString(36).slice(2, 15),
        studentResponses: new Map(),
        teacherSocket: undefined,
        mode: 'off',
        recentlyPickedStudents: [],
    };
    rooms.set(roomName, room);
    return room;
};

const rooms = new Map<string, Room>();

const app = express();
export const httpServer = http.createServer(app);
export const socketServer = new SocketServer(httpServer, {
    maxHttpBufferSize: 128, // bytes or characters
});

app.use(express.static('./client/public'));
app.get('/favicon.ico', (req, res) => {
    res.sendStatus(404);
});
app.use(cookieParser());

const FRUITS = [
    'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'melon', 'kiwi', 'lemon',
    'mango', 'nectarine', 'orange', 'papaya', 'quince', 'raspberry', 'strawberry', 'tangerine',
    'apricot', 'blackberry', 'blueberry', 'feijoa', 'lime', 'peach', 'plum',
];

app.get('/create', (req, res) => {
    let newName = '';
    let attempts = 0;
    while (attempts < 10 && !newName) {
        const fruitName = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        if (!rooms.has(fruitName)) {
            newName = fruitName;
        }

        attempts++;
    }

    if (!newName) {
        newName = Math.random().toString(36).slice(2, 7);
        if (rooms.has(newName)) {
            res.status(409).send('Gave up generating room name');
            return;
        }
    }

    res.redirect(`/create/${newName}`);
});

app.get('/create/:room', (req, res) => {
    const roomName = req.params.room;
    if (rooms.has(roomName)) {
        // Room exists, check if owner
        const room = rooms.get(roomName);
        const sentSecret = req.cookies[roomName] as string;
        if (sentSecret && room?.secret === sentSecret) {
            // If sending secret which matches, join as teacher
            res.redirect(`/${roomName}`);
        } else {
            // Otherwise fail
            res.clearCookie(roomName); // in case cookie is stale
            res.cookie('message', `Room '${roomName}' already exists`);
            res.redirect('/');
        }
    } else {
        // Room doesn't exist, create as teacher
        console.log(`[${roomName}] create room`);
        const room = createRoom(roomName);
        res.cookie(roomName, room.secret);
        res.cookie('message', `Room '${roomName}' created`);
        res.redirect(`/${roomName}`);
    }
});

app.get('/:room', (req, res) => {
    const roomName = req.params.room;
    if (rooms.has(roomName)) {
        // Room exists
        const room = rooms.get(roomName);
        const sentSecret = req.cookies[roomName] as string;
        if (sentSecret && room?.secret === sentSecret) {
            // If sending secret which matches, join as teacher
            res.sendFile('teacher.html', {root: './client/src'});
        } else {
            // Otherwise join as student
            res.clearCookie(roomName); // in case cookie is stale
            res.sendFile('student.html', {root: './client/src'});
        }
    } else {
        // Room doesn't exist, fail nicely for navigation requests
        const isNavigation = req.headers['sec-fetch-mode'] === 'navigate';
        if (isNavigation) {
            console.log(`[${roomName}] room does not exist`);
            res.cookie('message', `Room '${roomName}' does not exist`);
            res.redirect('/');
            return;
        }

        // Fail crudely otherwise
        res.sendStatus(404);
    }
});

// Socket.IO setup
socketServer.on('connection', (socket: Socket) => {
    const roomName = socket.handshake.query.roomName; // should always be present
    const roomSecret = socket.handshake.query.roomSecret; // only present for teacher

    if (typeof roomName !== 'string') {
        console.log(`[] ${socket.id} invalid room name`);
        socket.disconnect();
        return;
    }

    const room = rooms.get(roomName);

    if (!room) {
        console.log(`[${roomName}] ${socket.id} room does not exist`);
        socket.disconnect();
        return;
    }

    const isTeacher = room.secret === roomSecret;
    if (isTeacher) {
        console.log(`[${roomName}] ${socket.id} teacher connect`);
        room.teacherSocket = socket;
    } else {
        console.log(`[${roomName}] ${socket.id} student connect`);
        room.studentResponses.set(socket.id, '');
    }

    socket.emit('set mode', room.mode);

    // Client disconnect
    socket.on('disconnect', () => {
        if (socket === room.teacherSocket) {
            console.log(`[${roomName}] ${socket.id} teacher disconnect`);
            room.teacherSocket = undefined;
        } else {
            console.log(`[${roomName}] ${socket.id} student disconnect`);
            room.studentResponses.delete(socket.id);
            room.teacherSocket?.emit('update response', socket.id, undefined);
        }

        setTimeout(() => {
            if (rooms.has(roomName) && room.teacherSocket === undefined && room.studentResponses.size === 0) {
                console.log(`[${roomName}] close room`);
                rooms.delete(roomName);
            }
        }, 5000);
    });

    // Set mode
    socket.on('set mode', (newMode: Mode) => {
        console.log(`[${roomName}] ${socket.id} set mode: ${newMode}`);
        room.mode = newMode;
        for (const socketId of room.studentResponses.keys()) {
            const socket = socketServer.sockets.sockets.get(socketId);
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
            const socket = socketServer.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit('clear response');
            }
        }
    });

    // Student response
    socket.on('respond', (response: string) => {
        response = response.trim();
        console.log(`[${roomName}] ${socket.id} respond: ${response}`);
        room.studentResponses.set(socket.id, response);
        room.teacherSocket?.emit('update response', socket.id, response);
    });

    // Teacher picks student randomly
    socket.on('pick', (response?: string) => {
        if (response) {
            console.log(`[${roomName}] ${socket.id} pick: "${response}"`);
        } else {
            console.log(`[${roomName}] ${socket.id} pick`);
        }

        // First unpick all
        for (const socketId of room.studentResponses.keys()) {
            const studentSocket = socketServer.sockets.sockets.get(socketId);
            if (studentSocket) {
                studentSocket.emit('unpicked');
            }
        }

        // Trim recently piced list to half size of all students
        while (room.recentlyPickedStudents.length > room.studentResponses.size / 2) {
            room.recentlyPickedStudents.shift();
        }

        // Get candidates for picking
        let pickCandidates: string[] = [];
        for (const [id, resp] of room.studentResponses.entries()) {
            if (room.recentlyPickedStudents.includes(id)) {
                // Skip recently picked students
                continue;
            }

            if (response) {
                // Pick from students with a given response
                if (response === resp) {
                    pickCandidates.push(id);
                }
            } else {
                // Pick any student
                pickCandidates.push(id);
            }
        }

        if (pickCandidates.length === 0 && response) {
            // Ignore recently picked list in the hopes of finding a candidate
            pickCandidates = [];
            for (const [id, resp] of room.studentResponses.entries()) {
                if (response === resp) {
                    pickCandidates.push(id);
                }
            }
        }

        if (pickCandidates.length === 0) {
            console.log(`[${roomName}] ${socket.id} no students to pick`);
            return;
        }

        // Pick random student
        const pickedStudent = pickCandidates[Math.floor(Math.random() * pickCandidates.length)];
        const studentSocket = socketServer.sockets.sockets.get(pickedStudent);
        if (studentSocket) {
            console.log(`[${roomName}] ${socket.id} picked: ${pickedStudent}`);
            room.recentlyPickedStudents.push(pickedStudent);
            studentSocket.emit('picked');
        }
    });

    // Clear pick status
    socket.on('unpick', () => {
        console.log(`[${roomName}] ${socket.id} unpick`);
        for (const socketId of room.studentResponses.keys()) {
            const studentSocket = socketServer.sockets.sockets.get(socketId);
            if (studentSocket) {
                studentSocket.emit('unpicked');
            }
        }
    });
});

// Start the server
const PORT = process.env.PORT ?? 3000;
if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, () => {
        console.log(`server is running on port ${PORT}`);
    });
}

// Error handling
httpServer.on('error', (error: NodeJS.ErrnoException) => {
    console.error(`server error: ${error.message}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('received shutdown signal, shutting down gracefully...');
    void socketServer.close(() => {
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
