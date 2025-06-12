/* eslint-disable no-bitwise, unicorn/prefer-code-point */

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

export type ClientResponses = Map<string, string>;

export type Mode = 'off' | 'text' | 'number' | 'yes-no-maybe';

// SDBM non-cryptographic hash function
// Taken from: https://github.com/sindresorhus/sdbm
export function sdbm(string: string): number {
    let hash = 0;

    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
    }

    // Convert it to an unsigned 32-bit integer.
    return hash >>> 0;
}
