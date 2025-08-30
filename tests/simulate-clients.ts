/* eslint-disable array-element-newline */
import axios from 'axios';
import {io, type Socket} from 'socket.io-client';

// Usage: npm run sim [MODE] [NUM_CLIENTS] [NUM_RESPONSES]

const SERVER_URL = 'http://localhost:3000';
const ROOM_NAME = 'testroom';
const MODE = process.argv[2] || 'text';
const NUM_CLIENTS = Number(process.argv[3]) || 20;
const NUM_RESPONSES = Number(process.argv[4]) || 10;
const INTERVAL_MS = 3000; // delay between loop iterations
const SEND_DELAY_MS = 2000; // delay sending by up to
const NUM_MIN = -10;
const NUM_MAX = 64;
let RESPONSES: string[] = [];
if (MODE === 'text') {
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
    if (NUM_RESPONSES > FRUITS.length) {
        // 2-word answers, works up to 100² = 100 000
        const response_set = new Set<string>();
        while (response_set.size < NUM_RESPONSES) {
            const f1 = FRUITS[Math.floor(Math.random() * FRUITS.length)];
            const f2 = FRUITS[Math.floor(Math.random() * FRUITS.length)];
            response_set.add(`${f1} ${f2}`);
        }

        RESPONSES = Array.from(response_set);
    } else {
        // 1-word answers, works up to 100
        RESPONSES = FRUITS.sort(() => 0.5 - Math.random()).slice(0, NUM_RESPONSES);
    }
} else if (MODE === 'number') {
    RESPONSES = Array.from({length: NUM_RESPONSES}, () =>
        Math.floor(Math.random() * (NUM_MAX - NUM_MIN + 1)) + NUM_MIN,
    ).map(String);
}

const clients: Socket[] = [];

async function createTestRoom() {
    await axios.get(`${SERVER_URL}/${ROOM_NAME}`);
}

await createTestRoom();

for (let i = 0; i < NUM_CLIENTS; i++) {
    const socket = io(SERVER_URL, {query: {roomName: ROOM_NAME}});

    socket.on('connect', () => {
        console.log(`${socket.id} connected`);
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
    });

    clients.push(socket);
}

setInterval(() => {
    for (const socket of clients) {
        setTimeout(() => {
            // Weighted selection: earlier items are more likely
            const idx = Math.floor((Math.random() ** 1.5) * RESPONSES.length);
            const response = RESPONSES[idx];
            socket.emit('respond', response);
            console.log(`${socket.id} sent: ${response}`);
        }, Math.floor(Math.random() * SEND_DELAY_MS));
    }
}, INTERVAL_MS);

