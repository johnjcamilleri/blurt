/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert';
import {
    describe, it, before, after,
} from 'node:test';
import {type AddressInfo} from 'node:net';
import axios, {type AxiosError, type AxiosResponse} from 'axios';
import cookie from 'cookie';
import {
    httpServer,
    createRoom,
    type Room,
} from '../src/server.js';

describe('HTTP tests', () => {
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
    });

    after(async () => {
        // Clean up after tests
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
        assert.notStrictEqual(redirectUrl, `/${room.name}`);
        assert.match(redirectUrl, /\/[a-z\d]{3,}/);
    });

    it('joins an existing room GET /join', async () => {
        const res = await axios.get(`${serverUrl}/join/${room.name}`, {maxRedirects: 0})
            .catch((error: unknown) => (error as AxiosError).response as AxiosResponse);
        assert.strictEqual(res.status, 302);
        assert(res.headers.location, 'Expected a redirect location header');
        const redirectUrl = res.headers.location as string;
        assert.strictEqual(redirectUrl, `/${room.name}`);
    });

    it('doesn\'t join a non-existant room GET /join', async () => {
        const res = await axios.get(`${serverUrl}/join/junkyroom`, {maxRedirects: 0})
            .catch((error: unknown) => (error as AxiosError).response as AxiosResponse);
        assert.strictEqual(res.status, 302);
        assert(res.headers.location, 'Expected a redirect location header');
        const redirectUrl = res.headers.location as string;
        assert.strictEqual(redirectUrl, '/');
    });

    it('creates a room as teacher GET /:room', async () => {
        const newRoomName = 'newroom';
        const res = await axios.get(`${serverUrl}/${newRoomName}`);
        assert.strictEqual(res.status, 201);
        assert.match(res.data as string, /dist\/teacher\.js/);

        const cookies = res.headers['set-cookie'];
        assert(cookies && cookies.length > 0, 'Expected cookies to be set');
        const cookiesObj = cookie.parse(cookies[0]);
        const roomSecret = cookiesObj[newRoomName]!;
        assert(roomSecret, 'Expected room name and secret in cookies');
    });

    it('joins an existing room as teacher GET /:room', async () => {
        const res = await axios.get(`${serverUrl}/${room.name}`, {
            headers: {
                cookie: cookie.serialize(room.name, room.secret),
            },
        });
        assert.strictEqual(res.status, 200);
        assert.match(res.data as string, /dist\/teacher\.js/);
    });

    it('joins an existing room as student GET /:room', async () => {
        const res = await axios.get(`${serverUrl}/${room.name}`);
        assert.strictEqual(res.status, 200);
        assert.match(res.data as string, /dist\/student\.js/);
    });
});
