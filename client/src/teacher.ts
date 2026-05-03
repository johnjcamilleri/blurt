import Alpine from 'alpinejs';
import makeEmojiRegex from 'emoji-regex-xs';
import Cookies from 'js-cookie';
import {io} from 'socket.io-client';
import QRCode from 'qrcode';
import {
    type ClientResponses, type Mode, sdbm, debounce, randomChoice
} from './common.js';

// Generate QR code for student view URL
const studentUrl = `${globalThis.location.origin}${globalThis.location.pathname}`;

function generateQRCode() {
    const qrWidth = Math.min(window.innerWidth, window.innerHeight) - 140;
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
window.addEventListener('resize', debounce(generateQRCode, 200));

type ResponseCount = {
    response: string;
    count: number;
    key: string;
};

// Generate random response key
function generateKey(response: string): string {
    const rand = Math.random().toString(36).slice(2);
    return rand;
}

// Show quick alert message
let timer: ReturnType<typeof setTimeout>;
function alert(message: string): void {
    const cs = Alpine.store('controls') as ControlsStore;
    if (cs.isZenMode) return;
    cs.alertMessage = message;
    cs.isAlertShown = true;
    globalThis.clearTimeout(timer);
    timer = globalThis.setTimeout(() => {
        // this will trigger fade-out animation
        cs.isAlertShown = false;
    }, 500);
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
    refreshKey: number; // dummy prop to trigger reactivity manually
    dummyResponses: string[];
    addDummyResponse: () => void;
    removeDummyResponse: () => void;
};

type ControlsStore = {
    isMenuShown: boolean;
    studentUrl: string;
    isQRCodeShown: boolean;
    isLightTheme: boolean;
    getButtonClass: (isActive: boolean) => string;
    isZenMode: boolean;
    autoHide: boolean;
    areResponsesShown: boolean;
    areCountsShown: boolean;
    mode: Mode;
    setMode: (mode: Mode) => void;
    areUpdatesPaused: boolean;
    pauseUpdates: () => void;
    resumeUpdates: () => void;
    alertMessage: string;
    isAlertShown: boolean;
};

const emojiRegex = makeEmojiRegex();

function getBadgeClass(rc: ResponseCount): string {
    const rs = Alpine.store('responses') as ResponsesStore;
    const cs = Alpine.store('controls') as ControlsStore;

    const className = 'badge m-1';
    let bgClassName = 'text-bg-secondary';
    if (cs.areResponsesShown) {
        // Choose background colour
        if (cs.mode === 'yes-no-maybe') {
            switch (rc.response) {
                case 'yes': {
                    bgClassName = 'text-bg-success';
                    break;
                }

                case 'maybe': {
                    bgClassName = 'text-bg-warning';
                    break;
                }

                case 'no': {
                    bgClassName = 'text-bg-danger';
                    break;
                }

                default:
            }
        } else if (rc.response.match(emojiRegex)?.join('') === rc.response) {
            bgClassName = cs.isLightTheme ? 'text-bg-light' : 'text-bg-dark';
        }
    }

    // Vary opacity
    let bgOpacity = '';
    if (cs.mode === 'text') {
        // Deterministically pick opacity by hashing response string
        const opacities = [30, 50, 75, 100];
        const hash = sdbm(rc.response);
        const opacityIndex = Math.abs(hash) % opacities.length;
        const opacityLevel = opacities[opacityIndex];
        bgOpacity = `bg-opacity-${opacityLevel}`;
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
            bgOpacity = ` bg-opacity-${opacityLevel}`;
        }
    }

    return `${className} ${bgClassName} ${bgOpacity}`;
}

function getBadgeStyle(rc: ResponseCount): string {
    const rs = Alpine.store('responses') as ResponsesStore;
    const c = document.createElement('span').style;
    c.fontSize = `${Math.max(0.1, (rc.count / rs.total))}em`; // min font size
    return c.cssText;
}

// Add response to a list of response counts
function addResponse(
    response: string,
    counts: ResponseCount[],
    mode: Mode,
): void {
    // Increment count if response exists
    let found = false;
    for (const rc of counts) {
        if (rc.response === response) {
            rc.count++;
            found = true;
            break;
        }
    }

    // Add new response if it doesn't exist
    if (!found) {
        const newRC = {
            response,
            count: 1,
            key: generateKey(response),
        };
        if (mode === 'number') {
            // insert in place for numeric mode
            let inserted = false;
            for (let i = 0; i < counts.length; i++) {
                // eslint-disable-next-line max-depth
                if (Number(counts[i].response) > Number(response)) { // Compare as numbers
                    counts.splice(i, 0, newRC);
                    inserted = true;
                    break;
                }
            }

            if (!inserted) {
                counts.push(newRC);
            }
        } else {
            counts.push(newRC);
        }
    }
}

// Remove response from a list of response counts
function removeResponse(response: string, counts: ResponseCount[]): void {
    // Decrement count of response
    let removeIx = null;
    for (let ix = 0; ix < counts.length; ix++) {
        const rc = counts[ix]
        if (rc.response === response) {
            rc.count--;
            if (rc.count < 1) removeIx = ix;
            break;
        }
    }

    // Remove response if count is 0
    if (removeIx !== null) {
        counts.splice(removeIx, 1);
    }
}

const _responsesStore: ResponsesStore = {
    raw: new Map(),
    counts: [],
    clear() {
        socket.emit('clear responses');
        this.counts = [];
        this.dummyResponses = [];
    },
    pick(response?: string) {
        socket.emit('pick', response);
    },
    unpick() {
        socket.emit('unpick');
    },
    get total(): number {
        return this.raw.size + this.dummyResponses.length;
    },
    get nonEmpty(): number {
        return Array.from(this.raw.values()).filter(response => response !== null && response !== '').length + this.dummyResponses.length;
    },
    getBadgeClass,
    getBadgeStyle,
    get containerStyle(): string {
        void this.refreshKey;
        const c = document.createElement('span').style;
        const area = window.innerWidth * window.innerHeight;
        const fontSize = Math.max(Math.ceil(area / 3500), 24); // 24px min font size
        c.fontSize = `${fontSize}px`;
        const navHeight = document.querySelector('nav')?.getBoundingClientRect().height;
        c.height = `calc(100vh - ${navHeight}px - 24px - 24px)`;
        return c.cssText;
    },
    refreshKey: 0,
    dummyResponses: [],
    addDummyResponse() {
        const cs = Alpine.store('controls') as ControlsStore;
        let response;
        switch (cs.mode) {
            case 'off':
                return;
            case 'text':
                switch (this.counts.length) {
                    case 0:
                    case 1:
                    case 2:
                        response = randomChoice(['foo', 'bar', 'cat', 'zoo', 'hex', 'dud']);
                        break;
                    default:
                        response = randomChoice(this.counts.map((rc) => rc.response));
                }
                break;
            case 'number':
                switch (this.counts.length) {
                    case 0:
                        response = '3.14';
                        break;
                    case 1:
                        const n = Number(this.counts[0].response);
                        response = (n * (Math.random() + 0.5)).toPrecision(3);
                        break;
                    case 2:
                    case 3:
                        const first = Number(this.counts[0].response);
                        const last = Number(this.counts[this.counts.length-1].response);
                        response = (first + (last - first) * (Math.random() + 0.5)).toPrecision(3);
                        break;
                    default:
                        response = randomChoice(this.counts.map((rc) => rc.response));
                }
                break;
            case 'yes-no-maybe':
                response = randomChoice(['yes', 'no', 'maybe']);
                break;
            case 'multi-2':
                response = randomChoice(['A', 'B']);
                break;
            case 'multi-3':
                response = randomChoice(['A', 'B', 'C']);
                break;
            case 'multi-4':
                response = randomChoice(['A', 'B', 'C', 'D']);
                break;
            case 'multi-5':
                response = randomChoice(['A', 'B', 'C', 'D', 'E']);
                break;
        }
        addResponse(response, this.counts, cs.mode);
        this.dummyResponses.push(response);
        console.debug(`added dummy: ${response}`);
    },
    removeDummyResponse() {
        if (!this.dummyResponses.length) return;
        const response = randomChoice(this.dummyResponses);
        removeResponse(response, this.counts);
        const ix = this.dummyResponses.indexOf(response);
        this.dummyResponses.splice(ix, 1);
        console.debug(`removed dummy: ${response}`);
    },
};

const _controlsStore: ControlsStore = {
    isMenuShown: false,
    studentUrl,
    isQRCodeShown: false,
    isLightTheme: false,
    getButtonClass(isActive = false) {
        const classList = ['btn'];
        if (this.isLightTheme) classList.push('btn-light');
        else classList.push('btn-dark');
        if (isActive) classList.push('active');
        return classList.join(' ');
    },
    isZenMode: false,
    autoHide: false,
    areResponsesShown: true,
    areCountsShown: false,
    mode: 'off',
    setMode(mode: Mode) {
        const rs = Alpine.store('responses') as ResponsesStore;
        rs.clear();
        socket.emit('set mode', mode);
        this.mode = mode;
        this.areUpdatesPaused = false;
        if (this.autoHide) {
            this.areResponsesShown = false;
        }
    },
    areUpdatesPaused: false,
    pauseUpdates() {
        this.areUpdatesPaused = true;
    },
    resumeUpdates() {
        this.areUpdatesPaused = false;
        socket.emit('get responses');
    },
    alertMessage: '',
    isAlertShown: false,
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
        addResponse(response, responseCounts, cs.mode);
    }

    return responseCounts;
}

socket.on('all responses', (responses: Array<[string, string]>) => {
    const rs = Alpine.store('responses') as ResponsesStore;
    rs.raw = new Map(responses);
    rs.counts = computeResponseCounts(responses);
    rs.dummyResponses = [];
});

// Redraw on window resize
window.addEventListener('resize', debounce(() => {
    const rs = Alpine.store('responses') as ResponsesStore;
    rs.refreshKey++;
}, 200));

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

    if (response) addResponse(response, rs.counts, cs.mode);
    if (oldResponse) removeResponse(oldResponse, rs.counts);
});

// Add global keyboard shortcuts
// eslint-disable-next-line complexity
document.addEventListener('keydown', event => {
    const cs = Alpine.store('controls') as ControlsStore;
    const rs = Alpine.store('responses') as ResponsesStore;

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
    }

    switch (event.key) {
        // Toggle menu
        case 'Escape': {
            cs.isMenuShown = !cs.isMenuShown;
            break;
        }

        // Toggle QR code visibility
        case 'q': {
            cs.isQRCodeShown = !cs.isQRCodeShown;
            break;
        }

        // Light/dark theme
        case 'l': {
            cs.isLightTheme = true;
            break;
        }

        case 'd': {
            cs.isLightTheme = false;
            break;
        }

        // Toggle Zen mode
        case 'z': {
            if (cs.isZenMode) {
                cs.isZenMode = false;
                alert('zen mode off');
            } else {
                alert('zen mode on');
                cs.isZenMode = true;
            }

            break;
        }

        // Toggle auto-hide
        case 'a': {
            if (cs.autoHide) {
                cs.autoHide = false;
                alert('autohide off');
            } else {
                cs.autoHide = true;
                alert('autohide on');
            }

            break;
        }

        // Hide responses
        case 'h': {
            cs.areResponsesShown = false;
            break;
        }

        // Show responses
        case 's': {
            cs.areResponsesShown = true;
            break;
        }

        // Hide/show counts
        case '/': {
            cs.areCountsShown = !cs.areCountsShown;
            break;
        }

        // Pause/resume updates (spacebar)
        case ' ': {
            if (cs.areUpdatesPaused) {
                cs.resumeUpdates();
                alert('resume');
            } else {
                cs.pauseUpdates();
                alert('pause');
            }

            break;
        }

        // Clear responses
        case 'c': {
            rs.clear();
            alert('clear');
            break;
        }

        // Pick response
        case 'p': {
            rs.pick();
            alert('pick');
            break;
        }

        // Unpick response
        case 'u': {
            rs.unpick();
            alert('unpick');
            break;
        }

        // Change mode
        case '0':
        case 'o': {
            cs.setMode('off');
            alert('off');
            break;
        }

        case 't': {
            cs.setMode('text');
            alert('text');
            break;
        }

        case 'n': {
            cs.setMode('number');
            alert('number');
            break;
        }

        case 'y': {
            cs.setMode('yes-no-maybe');
            alert('yes/no/maybe');
            break;
        }

        case '2': {
            cs.setMode('multi-2');
            alert('multi (2)');
            break;
        }

        case '3': {
            cs.setMode('multi-3');
            alert('multi (3)');
            break;
        }

        case 'm':
        case '4': {
            cs.setMode('multi-4');
            alert('multi (4)');
            break;
        }

        case '5': {
            cs.setMode('multi-5');
            alert('multi (5)');
            break;
        }

        // Add/remove dummy responses
        case '=':
        case '+': {
            rs.addDummyResponse();
            break;
        }
        case '-':
        case '_': {
            rs.removeDummyResponse();
            break;
        }

        default: {
            break;
        }
    }
});
