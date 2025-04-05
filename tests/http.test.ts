/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert';
import {
    describe, it, before, after,
} from 'node:test';
import http from 'node:http';
import {type AddressInfo} from 'node:net';
import axios, {type AxiosError, type AxiosResponse} from 'axios';
import cookie from 'cookie';
import {type Express} from 'express';
import {Server} from 'socket.io';
import {app} from '../src/server.js';

describe('HTTP tests', () => {
    let httpServer: http.Server;
    let socketServer: Server;
    let serverUrl: string;
    const roomName = 'testroom';
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
        const res = await axios.get(`${serverUrl}/${roomName}`);
        assert.strictEqual(res.status, 201);
        const cookies = res.headers['set-cookie'];
        assert(cookies && cookies.length > 0, 'Expected cookies to be set');
        const cookiesObj = cookie.parse(cookies[0]);
        roomSecret = cookiesObj[roomName]!;
        assert(roomSecret, 'Expected roomName and roomSecret in cookies');
    });

    after(async () => {
        // Clean up after tests
        await socketServer.close();
        await new Promise<void>(resolve => {
            httpServer.close(() => {
                resolve();
            });
        });
    });

    it('responds to GET /', async () => {
        const res = await axios.get(`${serverUrl}/`);
        assert.strictEqual(res.status, 200);
        assert.match(res.data as string, /Create room/);
    });

    it('creates a new room GET /new', async () => {
        const res = await axios.get(`${serverUrl}/new`, {maxRedirects: 0})
            .catch((error: unknown) => (error as AxiosError).response as AxiosResponse);
        assert.strictEqual(res.status, 302);
        assert(res.headers.location, 'Expected a redirect location header');
        const redirectUrl = res.headers.location as string;
        assert.notStrictEqual(redirectUrl, `/${roomName}`);
        assert.match(redirectUrl, /\/[a-z0-8]{5}/);
    });

    it('joins an existing room GET /join', async () => {
        const res = await axios.get(`${serverUrl}/join/${roomName}`, {maxRedirects: 0})
            .catch((error: unknown) => (error as AxiosError).response as AxiosResponse);
        assert.strictEqual(res.status, 302);
        assert(res.headers.location, 'Expected a redirect location header');
        const redirectUrl = res.headers.location as string;
        assert.strictEqual(redirectUrl, `/${roomName}`);
    });

    it('doesn\'t join a non-existant room GET /join', async () => {
        const res = await axios.get(`${serverUrl}/join/junkyroom`, {maxRedirects: 0})
            .catch((error: unknown) => (error as AxiosError).response as AxiosResponse);
        assert.strictEqual(res.status, 302);
        assert(res.headers.location, 'Expected a redirect location header');
        const redirectUrl = res.headers.location as string;
        assert.strictEqual(redirectUrl, '/');
    });

    it('joins an existing room as student GET /:room', async () => {
        const res = await axios.get(`${serverUrl}/${roomName}`);
        assert.strictEqual(res.status, 200);
        assert.match(res.data as string, /dist\/student\.js/);
    });

    it('joins an existing room as teacher GET /:room', async () => {
        const res = await axios.get(`${serverUrl}/${roomName}`, {
            headers: {
                cookie: cookie.serialize(roomName, roomSecret),
            },
        });
        assert.strictEqual(res.status, 200);
        assert.match(res.data as string, /dist\/teacher\.js/);
    });
});
