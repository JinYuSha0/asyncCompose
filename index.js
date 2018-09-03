// 标记成功状态
const successSymbol = Symbol('success')

const compose = (...fns) => x => fns.reduce((p, fn) => {
    return p.then((...args) => {
        if (args[0][successSymbol] !== false) {
            return fn.execute(...args)
        }
    })
}, Promise.resolve(x))
const compose2 = (...fns) => x => {
    fns = fns.reverse()
    return fns.reduce((p, fn) => p.then(fn), Promise.resolve(x))
}
//组合函数
/*function compose(...funcs) {
    return funcs.reduce((a, b) => (...args) => {
        const nextArgs = b.execute.call(b, ...args)
        if (nextArgs[successSymbol]) {
            return a.execute.call(a, { ...nextArgs })
        }
    })
}*/

function logger (content) {
    console.log(content)
}

const foods = {
    beef: {
        num: 100,
        price: 15
    }
}

const users = {
    'sjy': {
        money: 100
    }
}

const api = {
    pay: ({ foodType, num, user }) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    users[user].money -= foods[foodType].price * num
                    resolve()
                } else {
                    reject()
                }
            }, 1000)
        })
    },
    refund: ({ foodType, num, user }) => {
        users[user].money += foods[foodType].price * num
    },
    insertDB: ({ foodType, num, user }) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.9) {
                    window.localStorage.setItem(`${user}-${foodType}-${num}`, new Date().getTime())
                    resolve()
                } else {
                    reject()
                }
            }, 1000)
        })
    }
}

// 流程一: 减少食物总量
const step1 = {
    execute: async function ({ foodType, num, user, rollbackList = [] }) {
        if (foods[foodType] && foods[foodType].num > 0) {
            foods[foodType].num -= num
            rollbackList.push(this.rollback)
            logger(`流程一: 减少食物总量执行成功,目前${foodType}总量为${foods[foodType].num}`)
            return { ...arguments[0], rollbackList, [successSymbol]: true }
        }
    },
    rollback: async function ({ foodType, num, user }) {
        if (foods[foodType]) {
            foods[foodType].num += num
            logger(`流程一: 减少食物总量回滚成功,目前${foodType}总量为${foods[foodType].num}`)
            return { ...arguments[0], [successSymbol]: true }
        }
    }
}

// 流程二: 在线支付
const step2 = {
    execute: async function ({ foodType, num, user, rollbackList = [] }) {
        try {
            await api.pay({ foodType, num, user })
            rollbackList.push(this.rollback)
            logger(`流程二: 在线支付执行成功,目前${user}余额为${users[user].money}`)
            return { ...arguments[0], rollbackList, [successSymbol]: true }
        } catch (e) {
            const { rollbackList, ...args } = arguments[0]
            logger(`流程二: 在线支付执行失败,目前${user}余额为${users[user].money}`)
            compose2(...rollbackList)({ ...args })
            return { ...arguments[0], rollbackList, [successSymbol]: false }
        }
    },
    rollback: async function ({ foodType, num, user }) {
        api.refund({ foodType, num, user, [successSymbol]: true })
        logger(`流程二: 在线支付回滚成功,目前${user}余额为${users[user].money}`)
        return { ...arguments[0], [successSymbol]: true }
    }
}

// 流程三: 插入数据库
const step3 = {
    execute: async function ({ foodType, num, user, rollbackList = [] }) {
        try {
            await api.insertDB({ foodType, num, user })
            rollbackList.push(this.rollback)
            logger(`流程三: 插入数据库执行成功`)
            return { ...arguments[0], rollbackList, [successSymbol]: true }
        } catch (e) {
            const { rollbackList, ...args } = arguments[0]
            logger(`流程三: 插入数据库执行失败`)
            compose2(...rollbackList)({ ...args })
            return { ...arguments[0], rollbackList, [successSymbol]: false }
        }
    },
    rollback: async function () {
        // 不做了
        logger(`流程三: 插入数据库回滚成功`)
        return { ...arguments[0], [successSymbol]: true }
    }
}

const order = compose(
    step1,
    step2,
    step3
)

order({ foodType: 'beef', num: 2, user: 'sjy' })

