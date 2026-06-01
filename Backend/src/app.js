const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
require('dotenv').config()

const app = express()

app.use(express.json())
app.use(cookieParser())

// Dynamic CORS - reads from environment variable
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL || "https://ai-powered-interview-1nqf3ukdn.vercel.app"
]

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl requests)
        if (!origin) return callback(null, true)
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

module.exports = app