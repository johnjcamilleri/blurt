import {io} from 'socket.io-client';
import Alpine from 'alpinejs';
import {debounce, type Mode} from './common.js';

const socket = io();

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
    console.log(`received mode: ${mode}`);
    state.mode = mode;
});
