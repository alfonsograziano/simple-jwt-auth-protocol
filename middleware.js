const jwt = require('jsonwebtoken')

const {
  getBlacklistedTokens,
  tokenTypes
} = require("./tokenGenerators")

let secret = ""
const setSecret = newSecret => secret = newSecret
const getSecret = () => secret

const MINUTES = 60
const HOURS = 24
const SECONDS = 60
const MILLISECONDS = 1000

const checkToken = (tokenType = tokenTypes.SESSION, expirePeriod = MINUTES*HOURS) => {
  return (req, res, next) => {
    let token = req.headers['authorization']
    if (typeof token === "undefined") return res.status(403).json({ success: false, message: 'Token is not defined' })

    if (token.startsWith('Bearer ')) token = token.slice(7, token.length)
    else res.status(403).json({ success: false, message: 'Token must start with Bearer' })

    if (!token) return res.status(403).json({ success: false, message: 'Auth token is not supplied' })

    if (getBlacklistedTokens().includes(token))
      return res.status(403).json({ success: false, message: 'This token is blacklisted' })

    jwt.verify(token, secret, (err, decoded) => {
      if (err) return res.status(403).json({ success: false, message: 'Token is not valid' })

      if (decoded.tokenType !== tokenType)
        return res.status(403).json({ success: false, message: 'Cannot use this token, please generate a valid token before proceed' })

      if(tokenType === tokenTypes.SESSION && expirePeriod){
        //Convert expirePeriod (Hours) in milliseconds
        const expireMs = expirePeriod*SECONDS*MILLISECONDS
        const expireDate = new Date(new Date(decoded.createdAt).getTime() + expireMs)
        const currentDate = new Date()

        if(currentDate.getTime() >= expireDate.getTime()){
          return res.status(403).json({ success: false, message: 'Token expired, please generate another' })
        }

      }

      req.token = token
      req.decoded = decoded
      next()
    })

  }
}




const intersect = (array1, array2) => array1.filter(value => array2.includes(value))
const restrictTo = users => {

  return function (req, res, next) {
    if (!(req && req.decoded && req.decoded.roles))
      return res.status(401).json("Access denied")

    const commonUsers = intersect(users, req.decoded.roles)
    if (commonUsers.length === 0)
      return res.status(401).json("Access denied, allowed users: " + users)

    next()
  }

}

module.exports = {
  checkToken,
  restrictTo,
  setSecret,
  getSecret
}