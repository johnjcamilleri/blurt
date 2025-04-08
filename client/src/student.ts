import {io} from 'socket.io-client';
import Alpine from 'alpinejs';
import {debounce, type Mode} from './common.js';

const roomName = globalThis.location.pathname.slice(1);

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
};

const state = Alpine.reactive<State>({
    response: '',
    mode: 'free-text',
});
Alpine.data('state', () => state);
Alpine.effect(() => {
    sendResponse(state.response);
});
Alpine.start();

socket.on('clear response', () => {
    state.response = '';
});

socket.on('set mode', (mode: Mode) => {
    state.mode = mode;
});
