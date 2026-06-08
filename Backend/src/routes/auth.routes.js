const { Router } = require('express')
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middlewares/auth.middleware")

const authRouter = Router()

authRouter.post("/register", authController.registerUserController)
authRouter.post("/login", authController.loginUserController)
authRouter.get("/logout", authController.logoutUserController)
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)

// Forgot / Reset password
authRouter.post("/forgot-password", authController.forgotPasswordController)
authRouter.post("/reset-password", authController.resetPasswordController)

module.exports = authRouter
