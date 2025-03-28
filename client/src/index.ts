import { io } from 'socket.io-client';
import { debounce } from './common';

import Alpine from 'alpinejs';
const socket = io();

const sendResponse = debounce((response: string) => {
    socket.emit('respond', response);
}, 200);

const state = Alpine.reactive({
    response: '',
});
Alpine.data('state', () => state);
Alpine.effect(() => {
    sendResponse(state.response);
});
Alpine.start();

socket.on('update responses', (responses) => {
    if (socket.id && !responses[socket.id]) {
        state.response = '';
    }
});

