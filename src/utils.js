export function isPromise(o) {
    return o && Object.getPrototypeOf(o) === Promise.prototype
}

export function isFunction(o) {
    return o && Object.getPrototypeOf(o) === Function.prototype
}