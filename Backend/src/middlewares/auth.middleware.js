const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

async function authUser(req, res, next) {
    try {
        let token = null

        // Check Authorization header first (Bearer token)
        const authHeader = req.headers.authorization
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7)
        } 
        // Fallback to cookies
        else if (req.cookies.token) {
            token = req.cookies.token
        }

        if (!token) {
            return res.status(401).json({
                message: "Token not provided."
            })
        }

        // Check if token is blacklisted
        const isTokenBlacklisted = await tokenBlacklistModel.findOne({
            token
        })

        if (isTokenBlacklisted) {
            return res.status(401).json({
                message: "Token is invalid"
            })
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()

    } catch (err) {
        console.error("Auth middleware error:", err.message)
        return res.status(401).json({
            message: "Invalid token."
        })
    }
}

module.exports = { authUser }