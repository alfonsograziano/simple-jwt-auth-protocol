const {
    getUserRoles,
    setUserRoles,
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
} = require("../index")

const secret = "evviva"

const jsonF = (json, code = 200) => {
    if (code !== 200) {
        throw new Error(JSON.stringify(json))
    }
}

const res = {
    json: jsonF,
    status: (code) => {
        return {
            json: (json) => {
                jsonF(json, code)
            }
        }
    }
}

function sleep(ms) {
    var start = new Date().getTime(), expire = start + ms;
    while (new Date().getTime() < expire) { }
    return;
}


beforeAll(() => {
    console.log(`Setting secret to ${secret}`)
    setSecret(secret)
});



test('Generate main token', () => {
    const mainToken = generateMainToken(1, ["1234"], { lallero: "Ciaoneeeee" })
    expect(mainToken).toBeDefined();
})



test('Generate session token from main token', () => {
    const mainToken = generateMainToken(1, ["1234"], { lallero: "Ciaoneeeee" })
    const session = generateSessionToken(mainToken)
    expect(session).toBeDefined();
})


test('Generate error if main token is not valid', () => {
    const mainToken = generateMainToken(1, ["1234"], { lallero: "Ciaoneeeee" })
    const session = generateSessionToken(mainToken)
    try {
        const session2 = generateSessionToken(session)
    } catch (error) {
        expect(error.message).toBe("You must provide a main token to generate a session token")
    }

})


test('Add items to blacklisted tokens', () => {
    const tokens = ["1234", "5678"]
    setBlacklistedTokens(tokens)
    expect(getBlacklistedTokens()).toBe(tokens)

})

test('Throw error when try to generate session token from blacklisted main token', () => {
    const tokens = ["1234", "5678"]
    setBlacklistedTokens(tokens)
    try {
        const session2 = generateSessionToken(tokens[0])
    } catch (error) {
        expect(error.message).toBe("Cannot use this token to generate session tokens")
    }
})

test('Can get secret', async () => {
    expect(getSecret()).toBe(secret)
})


test('Check token when token is not defined', async () => {
    const req = {
        headers: {}
    }

    const next = () => done()
    try {
        checkToken()(req, res, next)
    } catch (error) {
        expect(error.message).toBe('{"success":false,"message":"Token is not defined"}')
    }
})



test('Check token when token is defined - main token', () => {
    const req = {
        headers: {
            authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOlsiMTIzNCJdLCJsYWxsZXJvIjoiQ2lhb25lZWVlZSIsInRva2VuVHlwZSI6Im1haW4iLCJjcmVhdGVkQXQiOiIyMDIxLTEyLTE5VDA3OjU0OjExLjM2OFoiLCJpYXQiOjE2Mzk5MDA0NTF9.b3deAGNst4kSmkdfdvUJh5f6-2REzXPtvmUWEcqJY8M"
        }
    }

    const next = () => expect(req.decoded).toBeDefined()

    checkToken(tokenTypes.MAIN)(req, res, next)

})


test('Check token when token is defined - session token', () => {

    const mainToken = generateMainToken(1, ["1234"], { lallero: "Ciaoneeeee" })
    const session = generateSessionToken(mainToken)

    const req = { headers: { authorization: "Bearer " + session } }

    const next = () => expect(req.decoded).toBeDefined()


    checkToken(tokenTypes.SESSION)(req, res, next)

})


test('Check token when token is defined - session token error', () => {

    const mainToken = generateMainToken(1, ["1234"], { lallero: "Ciaoneeeee" })
    const session = generateSessionToken(mainToken)

    const req = { headers: { authorization: "Bearer " + session } }

    const next = () => expect(req.decoded).toBeDefined()



    try {
        checkToken(tokenTypes.MAIN)(req, res, next)
    } catch (error) {
        expect(error.message).toBe('{"success":false,"message":"Cannot use this token, please generate a valid token before proceed"}')
    }
})


test('Generate session token from invalid main token ', () => {

    const mainToken = generateMainToken(1, ["1234"], { lallero: "Ciaoneeeee" })
    const invalidateNow = new Date()

    setLastInvalidationDate(invalidateNow)

    try {
        const session2 = generateSessionToken(mainToken)
    } catch (error) {
        expect(error.message).toBe("This main token is expired, you cannot use it")
    }
})


test('Generate session token from valid main token ', () => {
    const invalidateNow = new Date()
    setLastInvalidationDate(invalidateNow)
    sleep(100)

    const mainToken = generateMainToken(1, ["1234"], { lallero: "Ciaoneeeee" })

    const session = generateSessionToken(mainToken)
    expect(session).toBeDefined()
})


test('Generate main token with last password change', () => {
    const lastPasswordChange = new Date(2021, 12, 18)
    const mainToken = generateMainToken(1, ["1234"], { lallero: "Ciaoneeeee" }, lastPasswordChange)

    const session = generateSessionToken(mainToken, {}, lastPasswordChange)
    expect(session).toBeDefined()
})

test('Generate main token with last password change to now', () => {
    const lastPasswordChange = new Date(2021, 11, 17)
    const mainToken = generateMainToken(1, ["1234"], { lallero: "Ciaoneeeee" }, lastPasswordChange)

    try {
        const session2 = generateSessionToken(mainToken, {}, new Date())
    } catch (error) {
        expect(error.message).toBe("This main token is expired, you cannot use it")
    }
})


test('Check session token expire period', () => {

    const mainToken = generateMainToken(1, ["1234"], { lallero: "Ciaoneeeee" })
    const session = generateSessionToken(mainToken)

    const req = { headers: { authorization: "Bearer " + session } }

    const next = () => {
        expect(req.decoded).toBeDefined()
    }

    try {
        checkToken(tokenTypes.SESSION, -100)(req, res, next)
    } catch (error) {
        expect(error.message).toBe('{"success":false,"message":"Token expired, please generate another"}')
    }
})
