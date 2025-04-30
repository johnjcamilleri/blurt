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
        studentSockets.push(
            io(serverUrl, {query: {roomName: room.name}}),
            io(serverUrl, {query: {roomName: room.name}}),
        );
        await Promise.all(
            studentSockets.map(async socket =>
                new Promise<void>(resolve => {
                    socket.on('connect', resolve);
                }),
            ),
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

    it('handles get all responses', async () => {
        teacherSocket.emit('get responses');
        await new Promise<void>((resolve, reject) => {
            teacherSocket.on('all responses', data => {
                try {
                    assert.strictEqual(data.length, studentSockets.length);
                    resolve();
                } catch (error) {
                    reject(error as Error);
                }
            });
        });
    });

    it('handles clear all responses', async () => {
        teacherSocket.emit('clear responses');
        await new Promise<void>((resolve, reject) => {
            const receivedByAll = new Set<Socket>();
            for (const socket of studentSockets) {
                socket.on('clear response', () => {
                    try {
                        receivedByAll.add(socket);
                        if (receivedByAll.size === studentSockets.length) {
                            resolve();
                        }
                    } catch (error) {
                        reject(error as Error);
                    }
                });
            }
        });
    });

    it('handles set mode', async () => {
        teacherSocket.emit('set mode', 'yes-no-maybe');
        await new Promise<void>((resolve, reject) => {
            const receivedByAll = new Set<Socket>();
            for (const socket of studentSockets) {
                socket.on('set mode', mode => {
                    try {
                        assert.strictEqual(mode, 'yes-no-maybe');
                        receivedByAll.add(socket);
                        if (receivedByAll.size === studentSockets.length) {
                            resolve();
                        }
                    } catch (error) {
                        reject(error as Error);
                    }
                });
            }
        });
    });

    it('handles student response', async () => {
        const response0 = 'foo';
        studentSockets[0].emit('respond', response0);
        await new Promise<void>((resolve, reject) => {
            teacherSocket.on('update response', (socketId, response) => {
                try {
                    assert.strictEqual(socketId, studentSockets[0].id);
                    assert.strictEqual(response, response0);
                    resolve();
                } catch (error) {
                    reject(error as Error);
                }
            });
        });
    });

    it('handles pick', async () => {
        teacherSocket.emit('pick');
        await new Promise<void>((resolve, reject) => {
            const pickedStudents = new Set<Socket>();
            for (const socket of studentSockets) {
                socket.on('picked', () => {
                    try {
                        pickedStudents.add(socket);
                        if (pickedStudents.size > 1) {
                            reject(new Error('More than one student received "picked"'));
                        }
                    } catch (error) {
                        reject(error as Error);
                    }
                });
            }

            // Wait a short time to ensure no additional "picked" events are received
            setTimeout(() => {
                try {
                    assert.strictEqual(pickedStudents.size, 1, 'Exactly one student should receive "picked"');
                    resolve();
                } catch (error) {
                    reject(error as Error);
                }
            }, 100);
        });
    });

    it('handles unpick', async () => {
        teacherSocket.emit('unpick');
        await new Promise<void>((resolve, reject) => {
            const receivedByAll = new Set<Socket>();
            for (const socket of studentSockets) {
                socket.on('unpicked', () => {
                    try {
                        receivedByAll.add(socket);
                        if (receivedByAll.size === studentSockets.length) {
                            resolve();
                        }
                    } catch (error) {
                        reject(error as Error);
                    }
                });
            }
        });
    });
});
