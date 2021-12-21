## HeadingSimple JWT Auth protocol

### Introduction
JWT is a powerfool tool but using it without simitations could lead to a security issues.
For this reason i have implemented a little protol some useful middlewares and function.

If I make a login and then someone steal my jwt, he can use my credentials indefinitely. 
We can solve this issue adding an expire time to the token, right? 
But in this case i have to make the login every time the old token expires.

With my implementation i can generate a main token. The main token is invalidated server side adding it on the blacklist or just changing your password. With the main token, you can generate a session token valid for x minutes (you can set the expiration time directly as middleware parameter).

### Before to start
Please before to run some code remember to add a secret to encrypt data :) 

    //I set the secret for the auth middlewares to check tokens
    const { setSecret } = require("simple-jwt-auth-protocol")
    const SECRET = "THIS_IS_MY_SECRET_SHHHH"
    setSecret(SECRET)

### The main token
The main token is usually generated on login. Here you can see an use example: 

    const {generateMainToken}= require("simple-jwt-auth-protocol")
    //Here you can add your server code
    //This could be an express router for example
    router.use("/login", (req, res) => {
	    const user = {} //User info from your DB
	    const password = "mypassword"
	    if(req.body.password === password){
		    const  authToken = generateMainToken(user._id, user.roles, SECRET, {}, user.lastPasswordChange)
		    res.json({ authToken })
	    }
    })

With the main auth token you can **generate session tokens**.  You can also use main token to allow access to api but this is not recommended.


### The session token
How to generate a session token?
Here you can see a full working example using express: 

    
    const {
    checkToken,
    tokenTypes,
    restrictTo,
    generateSessionToken
    } = require("simple-jwt-auth-protocol")
    
    const generateUserSessionToken = async (req, res) => {
   	    const user = await User.findOne({ _id: req.decoded.id })
   	    if (!user) res.status(404).json("User not found")

	    try {
	        const result = generateSessionToken(req.token, keys.SECRET, user.lastPasswordChange)
	        res.json({ authToken: result })
	    } catch (error) {
	        res.status(301).json(error.message)
	    }
    }
    
    router.get("/generate-session-token", checkToken(tokenTypes.MAIN), generateUserSessionToken)

### The middlewares
 You can use 2 middlewares: the checkToken and the restrictTo.
 Here you can read an example of the restrictTo middleware: 

   

    const {
        checkToken,
        tokenTypes,
            restrictTo
        } = require("simple-jwt-auth-protocol")
        
    const  UserRoles = {
	    USER:  "user",
	    ADMIN:  "admin",
	   	SHOP_MANAGER:  "shop_manager"
        }
        
    router.post("/update/categories", checkToken(), restrictTo([UserRoles.SHOP_MANAGER]), (req,res)=>{res.json("Ehi! i'm the shop manager ;)")})

### How to invalidate a main token? 
You cannot 'invalidate' a main token but you cannot use a main token directly, right? You can just use it to create a session token but... if you add the main token to the blacklist (using the `setBlacklistedTokens` function) or if you change your password, then you cannot generate a new session token using that token. 

You have to regenerate a new main token with another login (using your preferred login strategy).

### Info
This is obviously a really simple module made just for fun, please don't use it in production!