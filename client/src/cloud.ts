import {type ClientResponses} from './common.js';

const responsesDiv: HTMLElement = document.querySelector('#responses')!;
responsesDiv.style.fontSize = '240px';
responsesDiv.style.lineHeight = '0';

function computeSize(count: number, total: number): string {
    // TODO: consider height of div
    // TODO: max size should relate to number of distinct answers: more different answers = bigger (max) font size
    return `${Math.max(0.1, (count / total))}em`;
}

function addBadge(response: string, total: number) {
    if (!response) return;
    const responseElement = document.createElement('span');
    responseElement.textContent = response;
    responseElement.dataset.count = '1';
    responseElement.style.fontSize = `${computeSize(1, total)}`;
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

    responsesDiv.append(responseElement);
}

function incrementBadge(child: HTMLElement, total: number) {
    const count = Number.parseInt(child.dataset.count ?? '1', 10);
    const newCount = count + 1;
    child.dataset.count = newCount.toString();
    child.style.fontSize = `${computeSize(newCount, total)}`;
}

// Render the response cloud from scratch with all responses
const render = (responses: ClientResponses) => {
    responsesDiv.innerHTML = '';
    for (const response of responses.values()) {
        if (!response) continue;

        let found = false;
        for (const child of responsesDiv.children) {
            if (child instanceof HTMLElement && child.textContent === response) {
                incrementBadge(child, responses.size);
                found = true;
                break;
            }
        }

        if (!found) {
            addBadge(response, responses.size);
        }
    }
};

// Update response cloud with a single response
const update = (
    oldResponse: string | undefined,
    newResponse: string,
    responses: ClientResponses,
) => {
    console.log(`udpate "${oldResponse}" with "${newResponse}"`);
    let foundOld = false;
    let foundNew = false;
    if (oldResponse === undefined) foundOld = true;
    for (const child of responsesDiv.children) {
        if (!(child instanceof HTMLElement)) continue;
        if (!foundOld && child.textContent === oldResponse) {
            const count = Number.parseInt(child.dataset.count ?? '1', 10);
            const newCount = count - 1;
            if (newCount > 0) {
                child.dataset.count = newCount.toString();
                child.style.fontSize = `${computeSize(newCount, responses.size)}`;
            } else {
                // child.remove();
                child.style.display = 'none';
            }

            foundOld = true;
        }

        if (!foundNew && child.textContent === newResponse) {
            incrementBadge(child, responses.size);
            foundNew = true;
        }

        if (foundOld && foundNew) {
            break;
        }
    }

    // we might exit the loop without finding new
    if (!foundNew) {
        addBadge(newResponse, responses.size);
    }

    for (const child of responsesDiv.children) {
        if (!(child instanceof HTMLElement)) continue;
        if (child.style.display === 'none') child.remove();
    }
};

// Clear the response cloud
const clear = () => {
    responsesDiv.innerHTML = '';
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    render,
    update,
    clear,
};
