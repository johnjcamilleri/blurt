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
    key: string;
};

function generateKey(response: string): string {
    const rand = Math.random().toString(36).slice(2);
    return rand;
}

type ResponsesStore = {
    raw: ClientResponses;
    counts: ResponseCount[];
    clear: () => void;
    pick: () => void;
    unpick: () => void;
    total: number;
    nonEmpty: number;
    show: boolean;
    getBadgeClass: (rc: ResponseCount) => string;
    getBadgeStyle: (rc: ResponseCount) => string;
    containerStyle: string;
};

type ControlsStore = {
    studentUrl: string;
    isQRCodeShown: boolean;
    mode: Mode;
    setMode: (mode: Mode) => void;
    areUpdatesPaused: boolean;
    pauseUpdates: () => void;
    resumeUpdates: () => void;
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

function getBadgeStyle(rc: ResponseCount): string {
    const c = document.createElement('span').style;
    c.fontSize = `${Math.max(0.1, (rc.count / this.total))}em`;
    return c.cssText;
}

const _responsesStore: ResponsesStore = {
    raw: new Map(),
    counts: [],
    clear() {
        socket.emit('clear responses');
        this.counts = [];
    },
    pick() {
        socket.emit('pick');
    },
    unpick() {
        socket.emit('unpick');
    },
    get total(): number {
        return this.raw.size;
    },
    get nonEmpty(): number {
        return Array.from(this.raw.values()).filter(response => response !== null && response !== '').length;
    },
    show: true,
    getBadgeClass,
    getBadgeStyle,
    get containerStyle(): string {
        const c = document.createElement('span').style;
        const fontSize = Math.max(80, window.innerHeight * 0.3);
        c.fontSize = `${fontSize}px`;
        c.height = '70vh';
        return c.cssText;
    },
};

const _controlsStore: ControlsStore = {
    studentUrl,
    isQRCodeShown: false,
    mode: 'off',
    setMode(mode: Mode) {
        (Alpine.store('responses') as ResponsesStore).clear();
        socket.emit('set mode', mode);
        this.mode = mode;
    },
    areUpdatesPaused: false,
    pauseUpdates() {
        this.areUpdatesPaused = true;
    },
    resumeUpdates() {
        this.areUpdatesPaused = false;
        socket.emit('get responses');
    },
};

Alpine.store('responses', _responsesStore);
Alpine.store('controls', _controlsStore);
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

socket.on('set mode', (mode: Mode) => {
    (Alpine.store('controls') as ControlsStore).mode = mode;
});

socket.on('all responses', (responses: Array<[string, string]>) => {
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
                key: generateKey(response),
            });
        }
    }

    const rs = Alpine.store('responses') as ResponsesStore;
    rs.raw = new Map(responses);
    rs.counts = responseCounts;
});

socket.on('update response', (socketId: string, response: string) => {
    const rs = Alpine.store('responses') as ResponsesStore;
    const cs = Alpine.store('controls') as ControlsStore;

    if (cs.areUpdatesPaused) return;

    const oldResponse = rs.raw.get(socketId);
    if (oldResponse === response) return;

    if (response === undefined || response === null) {
        rs.raw.delete(socketId);
    } else {
        rs.raw.set(socketId, response);
    }

    // Increment/Add
    if (response) {
        let foundNew = false;
        for (const rc of rs.counts) {
            if (rc.response === response) {
                rc.count++;
                foundNew = true;
                break;
            }
        }

        if (!foundNew) {
            rs.counts.push({
                response,
                count: 1,
                key: generateKey(response),
            });
        }
    }

    // Decrement/Remove
    if (oldResponse) {
        let removeOld = false;
        for (const rc of rs.counts) {
            if (rc.response === oldResponse) {
                rc.count--;
                if (rc.count < 1) removeOld = true;
                break;
            }
        }

        if (removeOld) {
            rs.counts = rs.counts.filter(rc => rc.count > 0);
        }
    }
});
