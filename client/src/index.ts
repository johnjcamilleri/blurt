import packageJson from '../../package.json';

const versionElem = document.querySelector('#version');
if (versionElem && packageJson.version) {
    versionElem.textContent = `v${packageJson.version}`;
}
