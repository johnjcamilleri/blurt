/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert';
import {
    describe, it, before, after,
} from 'node:test';
import http from 'node:http';
import {type AddressInfo} from 'node:net';
import {type Express} from 'express';
import {io, type Socket} from 'socket.io-client';
import {Server} from 'socket.io';
import {app} from '../src/server.js';

describe('Server Tests', () => {
    let httpServer: http.Server;
    let socketServer: Server;
    let clientSocket: Socket;
    let serverUrl: string;
    let roomName: string;
    let roomSecret: string;

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
        await new Promise<void>(resolve => {
            http.get(`${serverUrl}/testroom`, res => {
                // TODO assertions here need to reject promise
                assert.strictEqual(res.statusCode, 200);

                const cookies = res.headers['set-cookie'];
                assert(cookies && cookies.length > 0, 'Expected cookies to be set');
                console.log('cookies asserted');
                const cookie = cookies[0];
                console.log(cookie);
                // TODO: cookie parsing incorrect
                const match = /roomName=([^;]+);.*roomSecret=([^;]+)/.exec(cookie);
                assert(match, 'Expected roomName and roomSecret in cookies');
                console.log('cookies asserted 2');
                roomName = match[1];
                roomSecret = match[2];
                console.log(roomName);
                console.log(roomSecret);
                resolve();
            });
        });

        // Connect a client
        // clientSocket = io(serverUrl, { query: {} });
        // clientSocket.on('connect', resolve);
    });

    after(async () => {
        // Clean up after tests
        // clientSocket.close();
        console.log('closing');
        await socketServer.close();
        await new Promise<void>(resolve => {
            httpServer.close(() => {
                resolve();
            });
        });
    });

    it('should respond to HTTP GET /', () => {
        http.get(`${serverUrl}/`, res => {
            assert.strictEqual(res.statusCode, 200);
        });
    });

    // it('should handle socket connection', async () => {
    //     clientSocket.emit('get responses');
    //     await new Promise<void>(resolve => {
    //         clientSocket.on('all responses', responses => {
    //             assert.deepStrictEqual(responses, []); // Expect no responses initially
    //             resolve();
    //         });
    //     });
    // });

    // it('should handle student response', () => {
    //     clientSocket.emit('respond', 'yes');
    //     clientSocket.on('update response', (socketId, response) => {
    //         assert.strictEqual(response, 'yes');
    //     });
    // });
});
