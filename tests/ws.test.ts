/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert';
import {
    describe, it, before, after,
} from 'node:test';
import http from 'node:http';
import {type AddressInfo} from 'node:net';
import axios from 'axios';
import cookie from 'cookie';
import {type Express} from 'express';
import {io, type Socket} from 'socket.io-client';
import {Server} from 'socket.io';
import {app, createRoom, type Room} from '../src/server.js';

describe('Web Socket tests', () => {
    let httpServer: http.Server;
    let socketServer: Server;
    let teacherSocket: Socket;
    const studentSockets: Socket[] = [];
    let serverUrl: string;
    let room: Room;

    before(async () => {
        // Start the server
        httpServer = http.createServer(app as Express);
        socketServer = new Server(httpServer);
        await new Promise<void>(resolve => {
            httpServer.listen(() => {
                const {port} = httpServer.address() as AddressInfo;
                serverUrl = `http://localhost:${port}`;
                resolve();
            });
        });

        // Create a room
        room = createRoom('testroom');

        // Connect clients
        teacherSocket = io(serverUrl, {query: {roomName: room.name, roomSecret: room.secret}});
        studentSockets.push(
            io(serverUrl, {query: {roomName: room.name}}),
            io(serverUrl, {query: {roomName: room.name}}),
        );
    });

    after(async () => {
        // Clean up after tests
        for (const socket of studentSockets) {
            socket.disconnect();
        }

        teacherSocket.disconnect();
        await socketServer.close();
        await new Promise<void>(resolve => {
            httpServer.close(() => {
                resolve();
            });
        });
    });

    it('handles student response', async () => {
        // TODO: not working
        studentSockets[0].emit('respond', 'yes');
        await new Promise<void>(resolve => {
            teacherSocket.on('update response', (socketId, response) => {
                assert.strictEqual(socketId, studentSockets[0].id);
                assert.strictEqual(response, 'yes');
                resolve();
            });
            setTimeout(() => {
                throw new Error('Test timed out');
            }, 3000);
        });
    });
});
