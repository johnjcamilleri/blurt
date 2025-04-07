import Alpine from 'alpinejs';
import Cookies from 'js-cookie';
import {io} from 'socket.io-client';
import QRCode from 'qrcode';
import {type ClientResponses, type Mode} from './common.js';
import cloud from './cloud.js';

// Generate QR code for student view URL
const studentViewUrl = `${globalThis.location.origin}${globalThis.location.pathname}`;
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
document.querySelector('#qrcodeText')!.textContent = studentViewUrl;

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
        cloud.clear();
    },
    get totalResponses(): number {
        return this.responses.size;
    },
    get nonEmptyResponses(): number {
        return Array.from(this.responses.values()).filter(response => response !== null && response !== '').length;
    },
    setMode(mode: Mode) {
        socket.emit('clear responses');
        cloud.clear();
        socket.emit('set mode', mode);
    },
});
Alpine.data('state', () => state);
Alpine.start();

// Get room name from URL path and secret from cookie
const roomName = globalThis.location.pathname.slice(1);
const roomSecret = Cookies.get(roomName);

// Connect web socket
const socket = io({
    query: {
        roomName,
        roomSecret,
    },
});

socket.on('connect', () => {
    socket.emit('get responses');
});

socket.on('all responses', (responses: Array<[string, string]>) => {
    state.responses = new Map(responses);
    cloud.render(state.responses);
});

socket.on('update response', (socketId: string, response: string) => {
    const oldResponse = state.responses.get(socketId);
    if (response === undefined || response === null) {
        state.responses.delete(socketId);
    } else {
        state.responses.set(socketId, response);
    }

    cloud.update(oldResponse, response, state.responses);
});
