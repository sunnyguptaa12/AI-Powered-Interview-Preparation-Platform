const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please provide username, email and password" })
        }

        const isUserAlreadyExists = await userModel.findOne({ $or: [{ username }, { email }] })
        if (isUserAlreadyExists) {
            return res.status(400).json({ message: "Account already exists with this email address or username" })
        }

        const hash = await bcrypt.hash(password, 10)
        const user = await userModel.create({ username, email, password: hash })

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1d" })

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        })

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        console.error("Register error:", err)
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

async function loginUserController(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1d" })

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        })

        res.status(200).json({
            message: "User loggedIn successfully.",
            token,
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        console.error("Login error:", err)
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

async function logoutUserController(req, res) {
    try {
        const token = req.cookies.token
        if (token) {
            await tokenBlacklistModel.create({ token })
        }
        res.clearCookie("token")
        res.status(200).json({ message: "User logged out successfully" })
    } catch (err) {
        console.error("Logout error:", err)
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        res.status(200).json({
            message: "User details fetched successfully",
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        console.error("GetMe error:", err)
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

/**
 * @description Send OTP to email for password reset (OTP stored in DB, no email service needed for now)
 * Returns OTP in response for development — replace with nodemailer in production
 */
async function forgotPasswordController(req, res) {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ message: "Email is required" })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            // Security: don't reveal if email exists
            return res.status(200).json({ message: "If this email exists, an OTP has been sent." })
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        user.resetPasswordOtp = await bcrypt.hash(otp, 10)
        user.resetPasswordOtpExpiry = expiry
        await user.save()

        // TODO: Send via email (nodemailer) in production
        // For now returning OTP in response (development only)
        console.log(`OTP for ${email}: ${otp}`)

        res.status(200).json({
            message: "OTP sent successfully. Check your email.",
            // Remove this line in production:
            otp: process.env.NODE_ENV !== "production" ? otp : undefined
        })
    } catch (err) {
        console.error("ForgotPassword error:", err)
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

/**
 * @description Verify OTP and reset password
 */
async function resetPasswordController(req, res) {
    try {
        const { email, otp, newPassword } = req.body

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP and new password are required" })
        }

        const user = await userModel.findOne({ email })
        if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
            return res.status(400).json({ message: "Invalid or expired OTP" })
        }

        // Check expiry
        if (new Date() > user.resetPasswordOtpExpiry) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." })
        }

        // Verify OTP
        const isOtpValid = await bcrypt.compare(otp, user.resetPasswordOtp)
        if (!isOtpValid) {
            return res.status(400).json({ message: "Invalid OTP" })
        }

        // Update password
        user.password = await bcrypt.hash(newPassword, 10)
        user.resetPasswordOtp = null
        user.resetPasswordOtpExpiry = null
        await user.save()

        res.status(200).json({ message: "Password reset successfully. Please login." })
    } catch (err) {
        console.error("ResetPassword error:", err)
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
    forgotPasswordController,
    resetPasswordController
}
