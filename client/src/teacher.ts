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

type State = {
    responses: ClientResponses;
    clearResponses: () => void;
    totalResponses: number;
    nonEmptyResponses: number;
    setMode: (Mode) => void;
};

const state = Alpine.reactive<State>({
    responses: {},
    clearResponses() {
        socket.emit('clear responses');
    },
    get totalResponses() {
        return Object.keys(this.responses).length;
    },
    get nonEmptyResponses() {
        return Object.values(this.responses).filter(response => response !== null && response !== '').length;
    },
    setMode(mode: Mode) {
        console.log(`setting mode to ${mode}`);
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

const responsesDiv = document.querySelector('#responses')!;
const renderResponses = debounce((responses: ClientResponses) => {
    state.responses = responses;
    responsesDiv.innerHTML = '';

    // Count the frequency of each response
    const responseCounts: Record<string, number> = {};
    for (const response of Object.values(responses)) {
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

socket.on('update responses', (responses: ClientResponses) => {
    renderResponses(responses);
});
