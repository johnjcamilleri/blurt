import { io } from 'socket.io-client';
import QRCode from 'qrcode';

import { debounce } from './common';

// Generate QR code for student view URL
const studentViewUrl = `${window.location.origin}/`;
const qrcodeCanvas = document.getElementById('qrcode');

function renderSmall() {
    const qrOptions = {
        width: 80,
        margin: 2,
        color: { light: "#0000", dark: "#fffa" }
    };
    QRCode.toCanvas(qrcodeCanvas, studentViewUrl, qrOptions, (error) => {
        if (error) console.error(error);
    });
}
function renderBig() {
    const width = Math.min(window.innerWidth, window.innerHeight) - 100;
    const qrOptions = { margin: 2, width };
    QRCode.toCanvas(qrcodeCanvas, studentViewUrl, qrOptions, (error) => {
        if (error) console.error(error);
    });
}
renderSmall();

// Display the value of the QR code
const qrcodeValue = document.getElementById('qrcodeValue') as HTMLElement;
qrcodeValue.textContent = studentViewUrl;

// Grow/shrink the QR code
const qrcodeContainer = document.getElementById('qrcodeContainer') as HTMLElement;
let isFullscreen = false;
qrcodeContainer.addEventListener('click', () => {
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
        renderBig();
        qrcodeContainer.style.bottom = '0';
        qrcodeContainer.style.right = '0';
        qrcodeContainer.style.width = '100vw';
        qrcodeContainer.style.height = '100vh';
        qrcodeContainer.style.fontSize = 'xx-large';
        qrcodeContainer.style.backgroundColor = 'white';
        qrcodeValue.style.display = 'block';
    } else {
        renderSmall();
        qrcodeContainer.style = "";
        qrcodeValue.style.display = 'none';
    }
});

const socket = io({
    query: {
        role: 'teacher'
    }
});

socket.on('connect', () => {
    socket.emit('get responses');
});

// TODO share definition with server.ts
type ClientResponses = {
    [clientId: string]: string | null;
};

const responseStatsDiv = document.getElementById('responseStats') as HTMLElement;
const responsesDiv = document.getElementById('responses') as HTMLElement;
const renderResponses = debounce((responses: ClientResponses) => {
    const totalClients = Object.keys(responses).length;
    const nonEmptyResponses = Object.values(responses).filter(response => response !== null && response !== '').length;
    responseStatsDiv.innerHTML = `${nonEmptyResponses}/${totalClients}`;
    responsesDiv.innerHTML = '';

    // Count the frequency of each response
    const responseCounts: { [response:string]: number } = {};
    for (const response of Object.values(responses)) {
        if (!response) continue;
        responseCounts[response] = (responseCounts[response] || 0) + 1;
    }

    // Create a cloud of responses
    for (const [response, count] of Object.entries(responseCounts)) {
        const responseElement = document.createElement('span');
        responseElement.className = 'badge m-1';
        switch (response) {
            case 'yes': responseElement.className += ' bg-success'; break;
            case 'maybe': responseElement.className += ' bg-warning'; break;
            case 'no': responseElement.className += ' bg-danger'; break;
            default: responseElement.className += ' bg-secondary';
        }
        responseElement.textContent = response;
        responseElement.style.fontSize = `${10 + count * 5}px`; // Increase font size based on count
        responsesDiv.appendChild(responseElement);
    }
}, 200);

socket.on('update responses', (responses) => {
    renderResponses(responses);
});

let showResponses = true;
const hideButton = document.getElementById('hideButton') as HTMLButtonElement;
hideButton.addEventListener('click', () => {
    showResponses = !showResponses;
    if (showResponses) {
        hideButton.textContent = 'hide';
        responsesDiv.classList.remove('d-none');
    } else {
        hideButton.textContent = 'show';
        responsesDiv.classList.add('d-none');
    }
});

const clearResponsesButton = document.getElementById('clearButton') as HTMLButtonElement;
clearResponsesButton.addEventListener('click', () => {
    socket.emit('clear responses');
});
