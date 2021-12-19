const jwt = require('jsonwebtoken')

const tokenTypes = {
    MAIN: "main",
    SESSION: "session"
}

let blacklistedTokens = []
let lastInvalidationDate = null

const generateMainToken = (id, roles, secret, customParams = {}, lastPasswordChange) => {

    return jwt.sign({
        id,
        roles,
        ...customParams,
        tokenType: tokenTypes.MAIN,
        createdAt: new Date(),
        lastPasswordChange
    }, secret)

}


const generateSessionToken = (mainToken, secret, customParams = {}, lastPasswordChange) => {

    if (blacklistedTokens.includes(mainToken))
        throw new Error("Cannot use this token to generate session tokens")


    const decoded = jwt.verify(mainToken, secret)
    if (decoded.tokenType !== tokenTypes.MAIN)
        throw new Error("You must provide a main token to generate a session token")


    if (lastInvalidationDate !== null) {
        const mainCreatedAt = new Date(decoded.createdAt)
        if (mainCreatedAt.getTime() <= lastInvalidationDate.getTime()) {
            throw new Error("This main token is expired, you cannot use it")
        }
    }

    if (lastPasswordChange) {
        const date = new Date(lastPasswordChange)
        const mainTokenLastPasswordChange = new Date(decoded.lastPasswordChange)
        if (date.getTime() > mainTokenLastPasswordChange.getTime()) {
            throw new Error("This main token is expired, you cannot use it")
        }
    }

    return jwt.sign({
        id: decoded.id,
        roles: decoded.roles,
        ...customParams,
        tokenType: tokenTypes.SESSION,
        createdAt: new Date()
    }, secret)

}

const getBlacklistedTokens = () => blacklistedTokens
const setBlacklistedTokens = tokens => {
    if (Array.isArray(tokens))
        blacklistedTokens = tokens
    else
        throw new Error("You must provide an array of tokens")
}

const getLastInvalidationDate = () => lastInvalidationDate
const setLastInvalidationDate = date => {
    if (date instanceof Date)
        lastInvalidationDate = date
    else
        throw new Error("You must provide a valid Date object")
}


module.exports = {
    generateMainToken,
    generateSessionToken,
    getBlacklistedTokens,
    setBlacklistedTokens,
    tokenTypes,
    getLastInvalidationDate,
    setLastInvalidationDate
}