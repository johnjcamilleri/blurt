import { io } from 'socket.io-client';
import { debounce } from './common';

const socket = io();

const responseInput = document.getElementById('responseInput') as HTMLInputElement;
const clearInputButton = document.getElementById('clearInput') as HTMLButtonElement;

const sendResponse = debounce((response) => {
    socket.emit('respond', response);
}, 200);

socket.on('update responses', (responses) => {
    if (socket.id && !responses[socket.id])
        responseInput.value = '';
});

responseInput.addEventListener('input', () => {
    sendResponse(responseInput.value);
});

document.querySelectorAll('button[data-prefill]').forEach(button => {
    button.addEventListener('click', () => {
        responseInput.value = button.textContent || "";
        sendResponse(button.textContent);
    });
});

clearInputButton.addEventListener('click', () => {
    responseInput.value = '';
    sendResponse('');
});
