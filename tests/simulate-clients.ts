/* eslint-disable array-element-newline */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import axios from 'axios';
import {io, type Socket} from 'socket.io-client';

// Usage: npm run sim ...
const argv = yargs(hideBin(process.argv)).options({
    url: { type: 'string', default: 'http://localhost:3000'},
    room: { type: 'string', default: 'testroom'},
    mode: { choices: ['text', 'number', 'yes-no-maybe', 'multi-5'], default: 'text' },
    clients: { type: 'number', default: 20, describe: 'number of clients' },
    responses: { type: 'number', default: 10, describe: 'number of possible responses' },
    active: { type: 'number', default: 1.0, describe: 'fraction of clients that are active (0.0-1.0)' },
    skew: { type: 'number', default: 1, describe: 'make certain responses more frequent (1 = uniform, >1 favours earlier responses)' },
}).parseSync()

const SEND_DELAY_MS = 2000; // spread out responses over this amount of time
let RESPONSES: string[] = []; // possible responses which can be sent
if (argv.mode === 'text') {
    const FRUITS = [
        'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew', 'kiwi', 'lemon',
        'mango', 'nectarine', 'orange', 'papaya', 'quince', 'raspberry', 'strawberry', 'tangerine', 'ugli', 'vanilla',
        'watermelon', 'xigua', 'yellowfruit', 'zucchini', 'apricot', 'blackberry', 'blueberry', 'cantaloupe', 'dragonfruit', 'eggplant',
        'feijoa', 'gooseberry', 'huckleberry', 'imbe', 'jackfruit', 'kumquat', 'lime', 'mulberry', 'nectar', 'olive',
        'peach', 'plum', 'quandong', 'rambutan', 'soursop', 'tamarind', 'ugni', 'voavanga', 'wolfberry', 'ximenia',
        'yam', 'ziziphus', 'acerola', 'bilberry', 'clementine', 'damson', 'elder', 'fingerlime', 'grapefruit', 'honeyberry',
        'indianfig', 'jabuticaba', 'kiwano', 'longan', 'mandarin', 'naranjilla', 'olive', 'persimmon', 'quararibea', 'roseapple',
        'sapodilla', 'tangelo', 'ugni', 'vaccinium', 'waxapple', 'ximenia', 'yumberry', 'zabergau', 'ackee', 'breadfruit',
        'calamondin', 'durian', 'emblic', 'farkleberry', 'gac', 'hornedmelon', 'ilama', 'jostaberry', 'kabosu', 'lucuma',
        'mammee', 'noni', 'osageorange', 'pitanga', 'quenepa', 'ribes', 'santol', 'tamarillo', 'uchuva', 'voavanga',
    ]; // size 100
    if (argv.responses > FRUITS.length) {
        // 2-word answers, works up to 100² = 100 000
        const response_set = new Set<string>();
        while (response_set.size < argv.responses) {
            const f1 = FRUITS[Math.floor(Math.random() * FRUITS.length)];
            const f2 = FRUITS[Math.floor(Math.random() * FRUITS.length)];
            response_set.add(`${f1} ${f2}`);
        }

        RESPONSES = Array.from(response_set);
    } else {
        // 1-word answers, works up to 100
        RESPONSES = FRUITS.sort(() => 0.5 - Math.random()).slice(0, argv.responses);
    }
} else if (argv.mode === 'number') {
    const NUM_MIN = -10;
    const NUM_MAX = 64;
    RESPONSES = Array.from({length: argv.responses}, () =>
        Math.floor(Math.random() * (NUM_MAX - NUM_MIN + 1)) + NUM_MIN,
    ).map(String);
} else if (argv.mode === 'yes-no-maybe') {
    RESPONSES = ['yes', 'no', 'maybe'];
} else if (argv.mode === 'multi-5') {
    RESPONSES = ['A', 'B', 'C', 'D', 'E'];
}

// Create room
async function createTestRoom() {
    await axios.get(`${argv.url}/${argv.room}`);
}
await createTestRoom();

// Create clients
const clients: Socket[] = [];
for (let i = 0; i < argv.clients; i++) {
    const socket = io(argv.url, {query: {roomName: argv.room}});

    socket.on('connect', () => {
        console.log(`${socket.id} connected`);
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
    });

    clients.push(socket);
}

// Send responses
for (const socket of clients) {
    setTimeout(() => {
        if (Math.random() < argv.active) {
            // Weighted selection: earlier items are more likely
            const idx = Math.floor((Math.random() ** argv.skew) * RESPONSES.length);
            const response = RESPONSES[idx];
            socket.emit('respond', response);
            console.log(`${socket.id} sent: ${response}`);
        } else {
            // Send nothing
            socket.emit('respond', '');
        }
    }, Math.floor(Math.random() * SEND_DELAY_MS));
}

