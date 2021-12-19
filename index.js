const {
    generateMainToken,
    generateSessionToken,
    getBlacklistedTokens,
    setBlacklistedTokens,
    tokenTypes,
    getLastInvalidationDate,
    setLastInvalidationDate
} = require("./tokenGenerators")


const  {
    checkToken,
    restrictTo,
    setSecret,
    getSecret
  } = require("./middleware")


module.exports = {
    generateMainToken,
    generateSessionToken,
    getBlacklistedTokens,
    setBlacklistedTokens,
    checkToken,
    restrictTo,
    setSecret,
    getSecret,
    tokenTypes,
    getLastInvalidationDate,
    setLastInvalidationDate
}