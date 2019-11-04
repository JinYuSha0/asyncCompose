function asyncCompose (...fns){
    return function (...args) {
        return fns.reduce((a, b) => {
            if (isPromise(a)) {
            return a.then((...p) => b(...p))
        } else if (isAsyncFunction(a)) {
            return a(...args).then((...p) => b(...p))
        } else if (isFunction(a)) {
            return b(a(...args))
        } else {
            return b(a)
        }
    })
    }
}
function isPromise(o) {
    if (o == null) return false
    return Object.getPrototypeOf(o) === Promise.prototype
}
function isFunction(o) {
    if (o == null) return false
    return Object.getPrototypeOf(o) === Function.prototype
}
function isAsyncFunction(o) {
    if (o == null) return false
    return o.constructor.name === 'AsyncFunction'
}

/* DEMO */
function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => { resolve() }, ms)
})
}

asyncCompose(
    (ms) => { console('start'); return ms * 2 },
    async (ms) => { await delay(ms); return ms},
    (ms) => console(`delay ${ms/1000}s`),
    async () => await delay(1000),
    () => console('Hello'),
    async () => await delay(500),
    async () => await delay(600),
    async () => await delay(700),
    () => console('world'),
)(1000)

function console(c) {
    let p = document.createElement('p')
    p.innerText = c
    document.body.appendChild(p)
}
