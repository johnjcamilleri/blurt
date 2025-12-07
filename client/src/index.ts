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
    }
});

const createButton: HTMLButtonElement = document.querySelector('#create')!;
createButton.addEventListener('click', () => {
    globalThis.location.href = '/create/' + roomInput.value;
});

