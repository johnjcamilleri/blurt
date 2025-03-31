import Alpine from 'alpinejs';
import {io} from 'socket.io-client';
import QRCode from 'qrcode';
import {debounce, type ClientResponses, type Mode} from './common.js';

// Generate QR code for student view URL
const studentViewUrl = `${globalThis.location.origin}/`;
function renderSmall(element: HTMLElement) {
    const qrOptions = {
        width: 80,
        margin: 2,
        color: {light: '#0000', dark: '#fffa'},
    };
    QRCode.toCanvas(element, studentViewUrl, qrOptions, error => {
        if (error) console.error(error);
    });
}

function renderBig(element: HTMLElement) {
    const width = Math.min(window.innerWidth, window.innerHeight) - 100;
    const qrOptions = {margin: 2, width};
    QRCode.toCanvas(element, studentViewUrl, qrOptions, error => {
        if (error) console.error(error);
    });
}

renderSmall(document.querySelector('#qrcodeSmall')!);
renderBig(document.querySelector('#qrcodeBig')!);

const responsesDiv = document.querySelector('#responses')!;

// Render the response cloud
const renderResponseCloud = debounce((responses: ClientResponses) => {
    responsesDiv.innerHTML = '';

    // Count the frequency of each response
    const responseCounts: Record<string, number> = {};
    for (const response of responses.values()) {
        if (!response) continue;
        responseCounts[response] = (responseCounts[response] || 0) + 1;
    }

    // Create a cloud of responses
    for (const [response, count] of Object.entries(responseCounts)) {
        const responseElement = document.createElement('span');
        responseElement.className = 'badge m-1';
        switch (response) {
            case 'yes': {
                responseElement.className += ' bg-success';
                break;
            }

            case 'maybe': {
                responseElement.className += ' bg-warning';
                break;
            }

            case 'no': {
                responseElement.className += ' bg-danger';
                break;
            }

            default: {
                responseElement.className += ' bg-secondary';
            }
        }

        responseElement.textContent = response;
        responseElement.style.fontSize = `${10 + (count * 5)}px`; // Increase font size based on count
        responsesDiv.append(responseElement);
    }
}, 200);

// Clear the response cloud
const clearResponseCloud = () => {
    responsesDiv.innerHTML = '';
};

type State = {
    responses: ClientResponses;
    clearResponses: () => void;
    totalResponses: number;
    nonEmptyResponses: number;
    setMode: (Mode) => void;
};

const state = Alpine.reactive<State>({
    responses: new Map(),
    clearResponses() {
        socket.emit('clear responses');
        clearResponseCloud();
    },
    get totalResponses(): number {
        return this.responses.size;
    },
    get nonEmptyResponses(): number {
        return Array.from(this.responses.values()).filter(response => response !== null && response !== '').length;
    },
    setMode(mode: Mode) {
        socket.emit('clear responses');
        clearResponseCloud();
        socket.emit('set mode', mode);
    },
});
Alpine.data('state', () => state);
Alpine.start();

const socket = io({
    query: {
        role: 'teacher',
    },
});

socket.on('connect', () => {
    socket.emit('get responses');
});

socket.on('all responses', (responses: Array<[string, string]>) => {
    state.responses = new Map(responses);
    renderResponseCloud(state.responses);
});

socket.on('update response', (socketId: string, response: string) => {
    if (response === undefined || response === null) {
        state.responses.delete(socketId);
    } else {
        state.responses.set(socketId, response);
    }

    renderResponseCloud(state.responses);
});
