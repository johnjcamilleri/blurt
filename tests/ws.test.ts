/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert';
import {
    describe, it, before, after,
} from 'node:test';
import {type AddressInfo} from 'node:net';
import {io, type Socket} from 'socket.io-client';
import {
    httpServer,
    socketServer,
    createRoom,
    type Room,
} from '../src/server.js';

describe('Web Socket tests', () => {
    let teacherSocket: Socket;
    const studentSockets: Socket[] = [];
    let serverUrl: string;
    let room: Room;

    before(async () => {
        // Start the server
        await new Promise<void>(resolve => {
            httpServer.listen(() => {
                const {port} = httpServer.address() as AddressInfo;
                console.log(`server is running on port ${port}`);
                serverUrl = `http://localhost:${port}`;
                resolve();
            });
        });

        // Create a room
        room = createRoom('testroom');
        console.log(`created room ${room.name} with secret ${room.secret}`);

        // Connect clients
        teacherSocket = io(serverUrl, {query: {roomName: room.name, roomSecret: room.secret}});
        await new Promise<void>(resolve => {
            teacherSocket.on('connect', () => {
                console.log(`teacher socket connected ${teacherSocket.id}`);
                resolve();
            });
        });
        // studentSockets.push(
        //     io(serverUrl, {query: {roomName: room.name}}),
        //     io(serverUrl, {query: {roomName: room.name}}),
        // );
        // await new Promise<void>(resolve => {
        //     studentSockets[0].on('connect', resolve);
        // });
        // await new Promise<void>(resolve => {
        //     studentSockets[1].on('connect', resolve);
        // });
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

    it('handles get all responses', async () => {
        teacherSocket.emit('get responses');
        await new Promise<void>((resolve, reject) => {
            teacherSocket.on('all responses', data => {
                try {
                    assert.deepStrictEqual(data, []);
                    resolve();
                } catch (error) {
                    reject(error as Error);
                }
            });
        });
    });
});
