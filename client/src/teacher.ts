import Alpine from 'alpinejs';
import makeEmojiRegex from 'emoji-regex-xs';
import Cookies from 'js-cookie';
import {io} from 'socket.io-client';
import QRCode from 'qrcode';
import {type ClientResponses, type Mode, sdbm} from './common.js';

// Generate QR code for student view URL
const studentUrl = `${globalThis.location.origin}${globalThis.location.pathname}`;

function generateQRCode() {
    const qrWidth = Math.min(window.innerWidth, window.innerHeight) - 120;
    const qrOptions = {
        margin: 2,
        width: qrWidth,
    };
    const qrElement = document.querySelector('#qrcodeBig')!;
    QRCode.toCanvas(qrElement, studentUrl, qrOptions, error => {
        if (error) console.error(error);
    });
}

// Generate QR code initially
generateQRCode();

// Adjust QR code on window resize
window.addEventListener('resize', generateQRCode);

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
    pick: (response?: string) => void;
    unpick: () => void;
    total: number;
    nonEmpty: number;
    getBadgeClass: (rc: ResponseCount) => string;
    getBadgeStyle: (rc: ResponseCount) => string;
    containerStyle: string;
};

type ControlsStore = {
    studentUrl: string;
    isQRCodeShown: boolean;
    isZenMode: boolean;
    areResponsesShown: boolean;
    areCountsShown: boolean;
    mode: Mode;
    setMode: (mode: Mode) => void;
    areUpdatesPaused: boolean;
    pauseUpdates: () => void;
    resumeUpdates: () => void;
};

const emojiRegex = makeEmojiRegex();

function getBadgeClass(rc: ResponseCount): string {
    const rs = Alpine.store('responses') as ResponsesStore;
    const cs = Alpine.store('controls') as ControlsStore;

    let className = 'badge m-1 transition';
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

    if (cs.mode === 'text') {
        // Deterministically pick opacity by hashing response string
        const opacities = [30, 50, 75, 100];
        const hash = sdbm(rc.response);
        const opacityIndex = Math.abs(hash) % opacities.length;
        const opacityLevel = opacities[opacityIndex];
        className += ` bg-opacity-${opacityLevel}`;
    } else if (cs.mode === 'number' && rs.counts.length > 1) {
        // Scale opacity based on value rank
        const opacities = [20, 30, 40, 50, 60, 70, 80, 90, 100];
        const min = Number(rs.counts[0].response);
        const max = Number((rs.counts.at(-1)!).response);
        const val = Number(rc.response);
        if (!Number.isNaN(min) && !Number.isNaN(max) && !Number.isNaN(val) && max !== min) {
            const percent = (val - min) / (max - min);
            const opacityIndex = Math.round(percent * (opacities.length - 1));
            const opacityLevel = opacities[opacityIndex];
            className += ` bg-opacity-${opacityLevel}`;
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
    pick(response?: string) {
        socket.emit('pick', response);
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
    getBadgeClass,
    getBadgeStyle,
    get containerStyle(): string {
        const c = document.createElement('span').style;
        const area = window.innerWidth * window.innerHeight;
        const fontSize = Math.max(24, Math.ceil(area / 2500));
        c.fontSize = `${fontSize}px`;
        const navHeight = document.querySelector('nav')?.getBoundingClientRect().height;
        c.height = `calc(100vh - ${navHeight}px - 24px - 24px)`;
        return c.cssText;
    },
};

const _controlsStore: ControlsStore = {
    studentUrl,
    isQRCodeShown: false,
    isZenMode: false,
    areResponsesShown: true,
    areCountsShown: false,
    mode: 'off',
    setMode(mode: Mode) {
        const rs = Alpine.store('responses') as ResponsesStore;
        rs.clear();
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

// Recalculate all counts from full set of responses
function computeResponseCounts(responses: Array<[string, string]>): ResponseCount[] {
    const cs = Alpine.store('controls') as ControlsStore;

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
            const newRC = {
                response,
                count: 1,
                key: generateKey(response),
            };
            if (cs.mode === 'number') {
                // insert in place for numeric mode
                let inserted = false;
                for (let i = 0; i < responseCounts.length; i++) {
                    // eslint-disable-next-line max-depth
                    if (Number(responseCounts[i].response) > Number(response)) { // Compare as numbers
                        responseCounts.splice(i, 0, newRC);
                        inserted = true;
                        break;
                    }
                }

                if (!inserted) {
                    responseCounts.push(newRC);
                }
            } else {
                responseCounts.push(newRC);
            }
        }
    }

    return responseCounts;
}

socket.on('all responses', (responses: Array<[string, string]>) => {
    const rs = Alpine.store('responses') as ResponsesStore;
    rs.raw = new Map(responses);
    rs.counts = computeResponseCounts(responses);
});

// Redraw on window resize
window.addEventListener('resize', () => {
    const rs = Alpine.store('responses') as ResponsesStore;
    const responses = Array.from(rs.raw.entries());
    rs.counts = computeResponseCounts(responses);
});

// Update a single response in existing counts
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

    // Increment/Add new response
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
            const newRC = {
                response,
                count: 1,
                key: generateKey(response),
            };
            if (cs.mode === 'number') {
                // insert in place for numeric mode
                let inserted = false;
                for (let i = 0; i < rs.counts.length; i++) {
                    // eslint-disable-next-line max-depth
                    if (Number(rs.counts[i].response) > Number(response)) { // Compare as numbers
                        rs.counts.splice(i, 0, newRC);
                        inserted = true;
                        break;
                    }
                }

                if (!inserted) {
                    rs.counts.push(newRC);
                }
            } else {
                rs.counts.push(newRC);
            }
        }
    }

    // Decrement/Remove old response
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

// Add global keyboard shortcuts
document.addEventListener('keydown', event => {
    const cs = Alpine.store('controls') as ControlsStore;
    const rs = Alpine.store('responses') as ResponsesStore;

    switch (event.key) {
        // Toggle QR code visibility
        case 'q': {
            cs.isQRCodeShown = !cs.isQRCodeShown;
            break;
        }

        // Toggle Zen mode
        case 'z': {
            cs.isZenMode = !cs.isZenMode;
            break;
        }

        // Hide/show responses
        case 'h':
        case 's': {
            cs.areResponsesShown = !cs.areResponsesShown;
            break;
        }

        // Hide/show counts
        case '/': {
            cs.areCountsShown = !cs.areCountsShown;
            break;
        }

        // Pause/resume updates
        case ' ': {
            if (cs.areUpdatesPaused) {
                cs.resumeUpdates();
            } else {
                cs.pauseUpdates();
            }

            break;
        }

        // Clear responses
        case 'c': {
            rs.clear();
            break;
        }

        // Pick response
        case 'p': {
            rs.pick();
            break;
        }

        // Unpick response
        case 'u': {
            rs.unpick();
            break;
        }

        // Change mode
        case '0':
        case 'o': {
            cs.setMode('off');
            break;
        }

        case '1':
        case 't': {
            cs.setMode('text');
            break;
        }

        case '2':
        case 'n': {
            cs.setMode('number');
            break;
        }

        case '3':
        case 'y': {
            cs.setMode('yes-no-maybe');
            break;
        }

        default: {
            break;
        }
    }
});
