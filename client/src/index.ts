import { io } from 'socket.io-client';
import { debounce } from './common';

import Alpine from 'alpinejs';

// Initialize Alpine.js
// window['Alpine'] = Alpine;

const state = {
    response: '',
};
Alpine.data('state', () => state);
Alpine.start();

const socket = io();

const sendResponse = debounce((response: string) => {
    socket.emit('respond', response);
}, 200);

socket.on('update responses', (responses) => {
    if (socket.id && !responses[socket.id])
        state.response = '';
});

