import {io} from 'socket.io-client';
import Alpine from 'alpinejs';
import {debounce, type ClientResponses} from './common.js';

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

socket.on('update responses', (responses: ClientResponses) => {
    if (socket.id && !responses[socket.id]) {
        state.response = '';
    }
});

