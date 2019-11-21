import isAsyncFunction from 'is-async-function'
import { isFunction, isPromise } from './utils'

export default function asyncCompose (...fns){
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
