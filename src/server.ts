#!/usr/bin/env node
/* eslint-disable @stylistic/array-element-newline */

import http from 'node:http';
import {randomBytes} from 'node:crypto';
import cookieParser from 'cookie-parser';
import express, {type Request, type Response, type NextFunction} from 'express';
import {Server as SocketServer, type Socket} from 'socket.io';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.printf(({message}) => message as string),
    transports: [
        new winston.transports.Console(),
    ],
});

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
        secret: randomBytes(6).toString('hex'),
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

function isRoomNameValid(name: string): boolean {
    return (/^[\p{Letter}\d_-]{1,32}$/ui).test(name);
}

function isNavigation(req: Request): boolean {
    return req.headers['sec-fetch-mode'] === 'navigate';
}

// Create a room, server picks name
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

// Create a room with a supplied name
app.get('/create/:room', (req, res) => {
    const roomName = req.params.room;
    if (!isRoomNameValid(roomName)) {
        // Invalid room name, fail nicely for navigation requests
        if (isNavigation(req)) {
            res.cookie('message', 'invalid room name');
            res.cookie('room', roomName);
            res.redirect('/');
            return;
        }

        // Fail crudely otherwise
        res.sendStatus(400);
        return;
    }

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
            res.cookie('message', `room '${roomName}' already exists`);
            res.cookie('room', roomName);
            res.redirect('/');
        }
    } else {
        // Room doesn't exist, create as teacher
        logger.info(`[${roomName}] create room`);
        const room = createRoom(roomName);
        res.cookie(roomName, room.secret);
        res.redirect(`/${roomName}`);
    }
});

// Join a room
app.get('/:room', (req, res) => {
    const roomName = req.params.room;
    if (!isRoomNameValid(roomName)) {
        // Invalid room name, fail nicely for navigation requests
        if (isNavigation(req)) {
            res.cookie('message', 'invalid room name');
            res.cookie('room', roomName);
            res.redirect('/');
            return;
        }

        // Fail crudely otherwise
        res.sendStatus(400);
        return;
    }

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
        if (isNavigation(req)) {
            logger.info(`[${roomName}] room does not exist`);
            res.cookie('message', `room '${roomName}' does not exist`);
            res.cookie('room', roomName);
            res.redirect('/');
            return;
        }

        // Fail crudely otherwise
        res.sendStatus(404);
    }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof URIError) {
        res.sendStatus(400);
    } else {
        next();
    }
});

// Socket.IO setup
socketServer.on('connection', (socket: Socket) => {
    const {roomName} = socket.handshake.query; // should always be present
    const {roomSecret} = socket.handshake.query; // only present for teacher

    if (typeof roomName !== 'string') {
        logger.info(`[] ${socket.id} invalid room name`);
        socket.disconnect();
        return;
    }

    const room = rooms.get(roomName);

    if (!room) {
        logger.info(`[${roomName}] ${socket.id} room does not exist`);
        socket.disconnect();
        return;
    }

    const isTeacher = room.secret === roomSecret;
    if (isTeacher) {
        logger.info(`[${roomName}] ${socket.id} teacher connect`);
        room.teacherSocket = socket;
    } else {
        logger.info(`[${roomName}] ${socket.id} student connect`);
        room.studentResponses.set(socket.id, '');
    }

    socket.emit('set mode', room.mode);

    // Client disconnect
    socket.on('disconnect', () => {
        if (socket === room.teacherSocket) {
            logger.info(`[${roomName}] ${socket.id} teacher disconnect`);
            room.teacherSocket = undefined;
        } else {
            logger.info(`[${roomName}] ${socket.id} student disconnect`);
            room.studentResponses.delete(socket.id);
            room.teacherSocket?.emit('update response', socket.id, undefined);
        }

        setTimeout(() => {
            if (rooms.has(roomName) && room.teacherSocket === undefined && room.studentResponses.size === 0) {
                logger.info(`[${roomName}] close room`);
                rooms.delete(roomName);
            }
        }, 5000);
    });

    // Set mode
    socket.on('set mode', (newMode: Mode) => {
        logger.info(`[${roomName}] ${socket.id} set mode: ${newMode}`);
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
        logger.info(`[${roomName}] ${socket.id} get responses`);
        const serialised: Array<[string, string]> = [...room.studentResponses.entries()];
        socket.emit('all responses', serialised);
    });

    // Clear all responses
    socket.on('clear responses', () => {
        logger.info(`[${roomName}] ${socket.id} clear responses`);
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
        logger.info(`[${roomName}] ${socket.id} respond: ${response}`);
        room.studentResponses.set(socket.id, response);
        room.teacherSocket?.emit('update response', socket.id, response);
    });

    // Teacher picks student randomly
    socket.on('pick', (response?: string) => {
        if (response) {
            logger.info(`[${roomName}] ${socket.id} pick: "${response}"`);
        } else {
            logger.info(`[${roomName}] ${socket.id} pick`);
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
            logger.info(`[${roomName}] ${socket.id} no students to pick`);
            return;
        }

        // Pick random student
        const pickedStudent = pickCandidates[Math.floor(Math.random() * pickCandidates.length)];
        const studentSocket = socketServer.sockets.sockets.get(pickedStudent);
        if (studentSocket) {
            logger.info(`[${roomName}] ${socket.id} picked: ${pickedStudent}`);
            room.recentlyPickedStudents.push(pickedStudent);
            studentSocket.emit('picked');
        }
    });

    // Clear pick status
    socket.on('unpick', () => {
        logger.info(`[${roomName}] ${socket.id} unpick`);
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
        logger.info(`server is running on port ${PORT}`);
    });
}

// Error handling
httpServer.on('error', (error: NodeJS.ErrnoException) => {
    console.error(`server error: ${error.message}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('received shutdown signal, shutting down gracefully...');
    void socketServer.close(() => {
        logger.info('closed out remaining connections');
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
