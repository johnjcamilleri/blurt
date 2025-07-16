import {io} from 'socket.io-client';
import Alpine from 'alpinejs';
import {debounce, type Mode} from './common.js';

const roomName = globalThis.location.pathname.slice(1);

const pickSound = new Audio('notification.mp3');

const socket = io({
    query: {
        roomName,
    },
});

const sendResponse = debounce((response: string) => {
    socket.emit('respond', response);
}, 200);

type State = {
    response: string;
    mode: Mode;
    picked: boolean;
};

const state = Alpine.reactive<State>({
    response: '',
    mode: 'off',
    picked: false,
});
Alpine.data('state', () => state);
Alpine.effect(() => {
    sendResponse(state.response);
});
Alpine.start();

socket.on('clear response', () => {
    state.picked = false;
    state.response = '';
});

socket.on('set mode', (mode: Mode) => {
    state.picked = false;
    state.mode = mode;
});

socket.on('picked', (mode: Mode) => {
    state.picked = true;
    pickSound.play().catch((error: unknown) => {
        console.error('Failed to play pick sound:', error);
    });
});

socket.on('unpicked', (mode: Mode) => {
    state.picked = false;
});
