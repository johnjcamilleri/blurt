/* eslint-disable array-element-newline */
import axios from 'axios';
import {io, type Socket} from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';
const ROOM_NAME = 'testroom';
const NUM_CLIENTS = 20;
const INTERVAL_MS = 2000; // delay between loop iterations
const SEND_DELAY_MS = 1000; // delay sending by up to
const WORD_NO = 3;
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
];
const WORDS = FRUITS.sort(() => 0.5 - Math.random()).slice(0, WORD_NO);

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
            const response = WORDS[Math.floor(Math.random() * WORDS.length)];
            socket.emit('respond', response);
            console.log(`${socket.id} sent: ${response}`);
        }, Math.floor(Math.random() * SEND_DELAY_MS));
    }
}, INTERVAL_MS);

