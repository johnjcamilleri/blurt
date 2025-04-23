import Alpine from 'alpinejs';
import makeEmojiRegex from 'emoji-regex-xs';
import Cookies from 'js-cookie';
import {io} from 'socket.io-client';
import QRCode from 'qrcode';
import {type ClientResponses, type Mode} from './common.js';

// Generate QR code for student view URL
const studentUrl = `${globalThis.location.origin}${globalThis.location.pathname}`;

const qrWidth = Math.min(window.innerWidth, window.innerHeight) - 100;
const qrOptions = {
    margin: 2,
    width: qrWidth,
    // color: {light: '#0000', dark: '#fffa'}, // inverted
};
const qrElement = document.querySelector('#qrcodeBig')!;
QRCode.toCanvas(qrElement, studentUrl, qrOptions, error => {
    if (error) console.error(error);
});

type ResponseCount = {
    response: string;
    count: number;
};

type State = {
    studentUrl: string;
    responses: ClientResponses;
    responseCounts: ResponseCount[];
    clearResponses: () => void;
    totalResponses: number;
    nonEmptyResponses: number;
    mode: Mode;
    setMode: (mode: Mode) => void;
    areResponsesShown: boolean;
    areUpdatesPaused: boolean;
    pauseUpdates: () => void;
    resumeUpdates: () => void;
    isQRCodeShown: boolean;
    getBadgeClass: (rc: ResponseCount) => string;
    getBadgeStyle: (rc: ResponseCount) => string;
    containerStyle: string;
};

const emojiRegex = makeEmojiRegex();

function getBadgeClass(rc: ResponseCount): string {
    let className = 'badge m-1';
    if (rc.response.match(emojiRegex)?.join('') === rc.response) {
        className += ' text-bg-dark';
    } else {
        switch (rc.response) {
            case 'yes': {
                className += ' text-bg-success';
                break;
            }

            case 'maybe': {
                className += ' text-bg-warning';
                break;
            }

            case 'no': {
                className += ' text-bg-danger';
                break;
            }

            default: {
                className += ' text-bg-secondary';
            }
        }
    }

    return className;
}

const state = Alpine.reactive<State>({
    studentUrl,
    responses: new Map(),
    responseCounts: [],
    clearResponses() {
        socket.emit('clear responses');
        state.responseCounts = [];
    },
    get totalResponses(): number {
        return this.responses.size;
    },
    get nonEmptyResponses(): number {
        return Array.from(this.responses.values()).filter(response => response !== null && response !== '').length;
    },
    mode: 'off',
    setMode(mode: Mode) {
        this.clearResponses();
        socket.emit('set mode', mode);
        state.mode = mode;
    },
    areResponsesShown: true,
    areUpdatesPaused: false,
    pauseUpdates() {
        state.areUpdatesPaused = true;
    },
    resumeUpdates() {
        state.areUpdatesPaused = false;
        socket.emit('get responses');
    },
    isQRCodeShown: false,
    getBadgeClass,
    getBadgeStyle(rc: ResponseCount) {
        const c = document.createElement('span').style;
        // TODO: seems to be a race condition here, rc.count is not updated when this is called
        console.debug(rc.response, rc.count, this.totalResponses);
        c.fontSize = `${Math.max(0.1, (rc.count / this.totalResponses))}em`;
        return c.cssText;
    },
    get containerStyle(): string {
        const c = document.createElement('span').style;
        const fontSize = Math.max(80, window.innerHeight * 0.3);
        c.fontSize = `${fontSize}px`;
        c.height = '70vh';
        return c.cssText;
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

    const responseCounts: ResponseCount[] = [];
    for (const rv of responses.values()) {
        const response = rv[1];
        if (!response) continue;
        let found = false;
        for (const rc of responseCounts) {
            if (rc.response === response) {
                rc.count++;
                found = true;
                break;
            }
        }

        if (!found) {
            responseCounts.push({
                response,
                count: 1,
            });
        }
    }

    state.responseCounts = responseCounts;
});

socket.on('update response', (socketId: string, response: string) => {
    if (state.areUpdatesPaused) return;

    const oldResponse = state.responses.get(socketId);
    if (oldResponse === response) return;

    if (response === undefined || response === null) {
        state.responses.delete(socketId);
    } else {
        state.responses.set(socketId, response);
    }

    // Increment/Add
    if (response) {
        let foundNew = false;
        for (const rc of state.responseCounts) {
            if (rc.response === response) {
                rc.count++;
                foundNew = true;
                break;
            }
        }

        if (!foundNew) {
            state.responseCounts.push({
                response,
                count: 1,
            });
        }
    }

    // Decrement/Remove
    if (oldResponse) {
        let removeOld = false;
        for (const rc of state.responseCounts) {
            if (rc.response === oldResponse) {
                rc.count--;
                if (rc.count < 1) removeOld = true;
                break;
            }
        }

        if (removeOld) {
            state.responseCounts = state.responseCounts.filter(rc => rc.count > 0);
        }
    }
});

socket.on('set mode', (mode: Mode) => {
    state.mode = mode;
});
