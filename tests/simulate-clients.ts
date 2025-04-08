/* eslint-disable array-element-newline */
import readline from 'node:readline';
import axios from 'axios';
import {io, type Socket} from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';
const ROOM_NAME = 'testroom';
const NUM_CLIENTS = 30;
const INTERVAL_MS = 2000; // delay between loop iterations
const SEND_DELAY_MS = 2000; // delay sending by 0..X
const WORD_NO = 5;
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
const WORDS = ['yes', 'no', 'maybe', ...FRUITS.sort(() => 0.5 - Math.random()).slice(0, WORD_NO)];

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

let loopActive = false; // Tracks whether the loop is running
let intervalId: NodeJS.Timeout | undefined; // Stores the interval ID

function startLoop() {
    if (loopActive) return; // Prevent multiple loops
    loopActive = true;
    console.log('Loop started');
    intervalId = setInterval(() => {
        for (const socket of clients) {
            setTimeout(() => {
                const response = WORDS[Math.floor(Math.random() * WORDS.length)];
                socket.emit('respond', response);
                console.log(`${socket.id} sent: ${response}`);
            }, Math.floor(Math.random() * SEND_DELAY_MS));
        }
    }, INTERVAL_MS);
}

function stopLoop() {
    if (!loopActive) return; // Prevent stopping if not active
    loopActive = false;
    console.log('Loop stopped');
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
}

// Set up keyboard input listener
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log('Press RETURN to start/stop the loop, or CTRL+C to exit.');

rl.on('line', input => {
    if (input.trim() === '') {
        if (loopActive) {
            stopLoop();
        } else {
            startLoop();
        }
    }
});
