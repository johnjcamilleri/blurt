import Cookies from 'js-cookie';
import packageJson from '../../package.json';

const versionElem = document.querySelector('#version');
if (versionElem && packageJson.version) {
    versionElem.textContent = `v${packageJson.version}`;
}

const roomInput: HTMLInputElement = document.querySelector('#room')!;
roomInput.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        if (event.metaKey || event.ctrlKey) createButton.click();
        else joinButton.click();
    }
});

const joinButton: HTMLButtonElement = document.querySelector('#join')!;
joinButton.addEventListener('click', () => {
    if (roomInput.value) {
        globalThis.location.href = '/' + roomInput.value;
    } else {
        roomInput.focus();
    }
});

const createButton: HTMLButtonElement = document.querySelector('#create')!;
createButton.addEventListener('click', () => {
    globalThis.location.href = '/create/' + roomInput.value;
});

const messageElem = document.querySelector('#message')!;
const message = Cookies.get('message');
if (message) {
    messageElem.innerHTML = message;
    messageElem.classList.remove('d-none');
    Cookies.remove('message');
}

const room = Cookies.get('room');
if (room) {
    roomInput.value = room;
    Cookies.remove('room');
}
