import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import "../auth.form.scss"
import { forgotPassword, resetPassword } from '../services/auth.api'

const ForgotPassword = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState(1) // 1: email, 2: otp+new password
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [devOtp, setDevOtp] = useState("") // development only

    const handleSendOtp = async (e) => {
        e.preventDefault()
        setError("")
        if (!email) return setError("Email is required")
        setSubmitting(true)
        try {
            const data = await forgotPassword({ email })
            setSuccess("OTP sent! Check your email.")
            if (data.otp) setDevOtp(data.otp) // dev mode only
            setStep(2)
        } catch (err) {
            setError(err?.response?.data?.message || "Something went wrong.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        setError("")
        if (!otp) return setError("OTP is required")
        if (!newPassword) return setError("New password is required")
        if (newPassword !== confirmPassword) return setError("Passwords do not match")
        setSubmitting(true)
        try {
            await resetPassword({ email, otp, newPassword })
            setSuccess("Password reset successfully!")
            setTimeout(() => navigate("/login"), 1500)
        } catch (err) {
            setError(err?.response?.data?.message || "Invalid or expired OTP.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main>
            <div className="form-container">
                <h1>Forgot Password</h1>
                <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
                    {step === 1 ? "Enter your email to receive an OTP." : `Enter the OTP sent to ${email}`}
                </p>

                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: '#4caf50' }}>{success}</p>}
                {devOtp && (
                    <p style={{ background: '#1e2535', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#ff2d78' }}>
                        Dev OTP: <strong>{devOtp}</strong>
                    </p>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSendOtp}>
                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email" id="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={submitting} />
                        </div>
                        <button className="button primary-button" disabled={submitting}>
                            {submitting ? "Sending..." : "Send OTP"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className="input-group">
                            <label htmlFor="otp">OTP</label>
                            <input
                                type="text" id="otp"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                disabled={submitting}
                                maxLength={6} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password" id="newPassword"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                disabled={submitting} />
                        </div>
                        <div className="input-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password" id="confirmPassword"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                disabled={submitting} />
                        </div>
                        <button className="button primary-button" disabled={submitting}>
                            {submitting ? "Resetting..." : "Reset Password"}
                        </button>
                        <button type="button" onClick={() => { setStep(1); setError(""); setSuccess("") }}
                            style={{ background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                            ← Change email
                        </button>
                    </form>
                )}

                <p><Link to="/login">← Back to Login</Link></p>
            </div>
        </main>
    )
}

export default ForgotPassword
