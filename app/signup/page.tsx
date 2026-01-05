// app/signup/page.tsx
"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, Check, Loader2, CheckCircle2, PartyPopper, Sparkles, Phone, Mail, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Form, 2: Email OTP, 3: Phone OTP, 4: Complete

  // Separate loading states for better UX
  const [loadingStates, setLoadingStates] = useState({
    form: false,
    sendEmailOtp: false,
    verifyEmailOtp: false,
    sendPhoneOtp: false,
    verifyPhoneOtp: false,
    signup: false
  })

  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const [verification, setVerification] = useState({
    emailOtp: "",
    phoneOtp: "",
    emailVerified: false,
    phoneVerified: false,
    emailSent: false,
    phoneSent: false
  })

  const [otpCountdown, setOtpCountdown] = useState({
    email: 0,
    phone: 0
  })

  // Refs for countdown timers
  const emailTimerRef = useRef<NodeJS.Timeout | null>(null)
  const phoneTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (emailTimerRef.current) clearInterval(emailTimerRef.current)
      if (phoneTimerRef.current) clearInterval(phoneTimerRef.current)
    }
  }, [])

  const showMessage = useCallback((type: string, text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }, [])

  // Helper to set individual loading state
  const setLoading = useCallback((key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }))
  }, [])

  // Check if any loading is in progress
  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  const validateForm = useCallback(() => {
    if (!formData.firstName.trim()) {
      showMessage('error', 'First name is required')
      return false
    }
    if (!formData.lastName.trim()) {
      showMessage('error', 'Last name is required')
      return false
    }
    if (!formData.email.trim()) {
      showMessage('error', 'Email is required')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showMessage('error', 'Please enter a valid email address')
      return false
    }
    if (!formData.phone.trim()) {
      showMessage('error', 'Phone number is required')
      return false
    }
    // Validate phone number (10 digits)
    const cleanPhone = formData.phone.replace(/\D/g, '')
    const phoneWithoutCountry = cleanPhone.startsWith('91') && cleanPhone.length === 12
      ? cleanPhone.substring(2)
      : cleanPhone.startsWith('0')
        ? cleanPhone.substring(1)
        : cleanPhone
    if (phoneWithoutCountry.length !== 10) {
      showMessage('error', 'Please enter a valid 10-digit mobile number')
      return false
    }
    if (formData.password.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      showMessage('error', 'Passwords do not match')
      return false
    }
    return true
  }, [formData, showMessage])

  const startCountdown = useCallback((type: 'email' | 'phone') => {
    // Clear existing timer
    const timerRef = type === 'email' ? emailTimerRef : phoneTimerRef
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    setOtpCountdown(prev => ({ ...prev, [type]: 60 }))

    timerRef.current = setInterval(() => {
      setOtpCountdown(prev => {
        const newCount = prev[type] - 1
        if (newCount <= 0) {
          if (timerRef.current) clearInterval(timerRef.current)
          return { ...prev, [type]: 0 }
        }
        return { ...prev, [type]: newCount }
      })
    }, 1000)
  }, [])

  const sendOTP = useCallback(async (type: 'email' | 'phone') => {
    const identifier = type === 'email' ? formData.email : formData.phone
    const loadingKey = type === 'email' ? 'sendEmailOtp' : 'sendPhoneOtp'

    setLoading(loadingKey, true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, type }),
      })

      const data = await response.json()

      if (response.ok) {
        setVerification(prev => ({
          ...prev,
          [type === 'email' ? 'emailSent' : 'phoneSent']: true,
          [type === 'email' ? 'emailOtp' : 'phoneOtp']: '' // Clear previous OTP
        }))
        showMessage('success', type === 'email' ? `OTP sent to ${formData.email}` : 'OTP sent to your phone')
        startCountdown(type)
      } else {
        showMessage('error', data.message || `Failed to send ${type} OTP`)
      }
    } catch (error) {
      showMessage('error', `Error sending ${type} OTP. Please try again.`)
    } finally {
      setLoading(loadingKey, false)
    }
  }, [formData.email, formData.phone, setLoading, showMessage, startCountdown])

  const verifyOTP = useCallback(async (type: 'email' | 'phone') => {
    const identifier = type === 'email' ? formData.email : formData.phone
    const otpCode = type === 'email' ? verification.emailOtp : verification.phoneOtp
    const loadingKey = type === 'email' ? 'verifyEmailOtp' : 'verifyPhoneOtp'

    if (!otpCode || otpCode.length !== 6) {
      showMessage('error', 'Please enter the complete 6-digit OTP')
      return
    }

    setLoading(loadingKey, true)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, otpCode, type }),
      })

      const data = await response.json()

      if (response.ok) {
        setVerification(prev => ({
          ...prev,
          [type === 'email' ? 'emailVerified' : 'phoneVerified']: true
        }))
        showMessage('success', `${type === 'email' ? 'Email' : 'Phone'} verified successfully!`)

        // Move to next step or final signup
        if (type === 'email') {
          setTimeout(() => setCurrentStep(3), 500) // Small delay for better UX
        } else if (type === 'phone') {
          // Phone verified - proceed to final signup
          setLoading(loadingKey, false)
          handleFinalSignup()
          return
        }
      } else {
        showMessage('error', data.message || `${type} verification failed`)
      }
    } catch (error) {
      showMessage('error', `Error verifying OTP. Please try again.`)
    } finally {
      setLoading(loadingKey, false)
    }
  }, [formData.email, formData.phone, verification.emailOtp, verification.phoneOtp, setLoading, showMessage])

  const handleInitialSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setCurrentStep(2)
      sendOTP('email')
    }
  }, [validateForm, sendOTP])

  const handleFinalSignup = useCallback(async () => {
    setLoading('signup', true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          emailVerified: true,
          phoneVerified: true
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentStep(4)
        showMessage('success', 'Account created successfully!')
      } else {
        showMessage('error', data.message || 'Signup failed')
      }
    } catch (error) {
      showMessage('error', 'Error creating account. Please try again.')
    } finally {
      setLoading('signup', false)
    }
  }, [formData, setLoading, showMessage])

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={isAnyLoading}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={isAnyLoading}
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isAnyLoading}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                disabled={isAnyLoading}
                className="h-12"
              />
              <p className="text-xs text-gray-500">Enter 10-digit Indian mobile number</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 6 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isAnyLoading}
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  disabled={isAnyLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isAnyLoading}
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  disabled={isAnyLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <input type="checkbox" id="terms" className="mt-1" required disabled={isAnyLoading} />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              disabled={loadingStates.sendEmailOtp}
            >
              {loadingStates.sendEmailOtp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Sending OTP...
                </>
              ) : (
                'Continue to Verification'
              )}
            </Button>
          </form>
        )

      case 2:
        return (
          <div className="space-y-6">
            {/* Header with icon */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verify Email Address</h3>
              <p className="text-gray-600">We've sent a 6-digit code to:</p>
              <p className="font-semibold text-blue-600 mt-1">{formData.email}</p>
            </div>

            <div className="space-y-5">
              {/* OTP Input */}
              <div className="space-y-3">
                <Label className="text-center block">Enter verification code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verification.emailOtp}
                    onChange={(value) => setVerification(prev => ({ ...prev, emailOtp: value }))}
                    disabled={loadingStates.verifyEmailOtp || loadingStates.sendEmailOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                      <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                      <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                      <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {/* Verify Button */}
              <Button
                onClick={() => verifyOTP('email')}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                disabled={loadingStates.verifyEmailOtp || loadingStates.sendEmailOtp || verification.emailOtp.length !== 6}
              >
                {loadingStates.verifyEmailOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>

              {/* Resend Section */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">Didn't receive the code?</p>
                <Button
                  variant="ghost"
                  onClick={() => sendOTP('email')}
                  disabled={otpCountdown.email > 0 || loadingStates.sendEmailOtp || loadingStates.verifyEmailOtp}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {loadingStates.sendEmailOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : otpCountdown.email > 0 ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend in {otpCountdown.email}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>

              {/* Back button */}
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={loadingStates.verifyEmailOtp || loadingStates.sendEmailOtp}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {/* Email Verified Badge */}
            <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full mx-auto w-fit">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Email Verified</span>
            </div>

            {/* Header with icon */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Verify Phone Number</h3>
              <p className="text-gray-600">
                {verification.phoneSent ? "We've sent a 6-digit code to:" : "We'll send a verification code to:"}
              </p>
              <p className="font-semibold text-blue-600 mt-1">{formData.phone}</p>
            </div>

            <div className="space-y-5">
              {!verification.phoneSent ? (
                /* Send OTP Button - shown before OTP is sent */
                <Button
                  onClick={() => sendOTP('phone')}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                  disabled={loadingStates.sendPhoneOtp}
                >
                  {loadingStates.sendPhoneOtp ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5 mr-2" />
                      Send SMS Code
                    </>
                  )}
                </Button>
              ) : (
                /* OTP Input and Verify - shown after OTP is sent */
                <>
                  {/* OTP Input */}
                  <div className="space-y-3">
                    <Label className="text-center block">Enter verification code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={verification.phoneOtp}
                        onChange={(value) => setVerification(prev => ({ ...prev, phoneOtp: value }))}
                        disabled={loadingStates.verifyPhoneOtp || loadingStates.sendPhoneOtp || loadingStates.signup}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                          <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                          <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                          <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                          <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                          <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  {/* Verify Button */}
                  <Button
                    onClick={() => verifyOTP('phone')}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                    disabled={
                      loadingStates.verifyPhoneOtp ||
                      loadingStates.sendPhoneOtp ||
                      loadingStates.signup ||
                      verification.phoneOtp.length !== 6
                    }
                  >
                    {loadingStates.verifyPhoneOtp || loadingStates.signup ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {loadingStates.signup ? 'Creating Account...' : 'Verifying...'}
                      </>
                    ) : (
                      'Verify & Complete Signup'
                    )}
                  </Button>

                  {/* Resend Section */}
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500">Didn't receive the code?</p>
                    <Button
                      variant="ghost"
                      onClick={() => sendOTP('phone')}
                      disabled={
                        otpCountdown.phone > 0 ||
                        loadingStates.sendPhoneOtp ||
                        loadingStates.verifyPhoneOtp ||
                        loadingStates.signup
                      }
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {loadingStates.sendPhoneOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : otpCountdown.phone > 0 ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resend in {otpCountdown.phone}s
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resend Code
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Back button */}
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                disabled={loadingStates.verifyPhoneOtp || loadingStates.sendPhoneOtp || loadingStates.signup}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Email Verification
              </Button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center space-y-8 py-4">
            {/* Animated Success Icon */}
            <div className="relative">
              {/* Decorative circles */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-green-100 rounded-full animate-ping opacity-20" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 bg-green-200 rounded-full opacity-40" />
              </div>

              {/* Main success icon */}
              <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>

              {/* Decorative sparkles */}
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
              <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-yellow-500 animate-pulse delay-150" />
              <PartyPopper className="absolute top-0 -left-4 w-6 h-6 text-purple-500 animate-bounce" />
            </div>

            {/* Success Message */}
            <div className="space-y-3">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Thank You for Signing Up!
              </h3>
              <p className="text-lg text-gray-600">
                Welcome to <span className="font-semibold text-blue-600">MAEGA</span>, {formData.firstName}!
              </p>
              <p className="text-gray-500 text-sm">
                Your account has been created and verified successfully.
              </p>
            </div>

            {/* Verification badges */}
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <Check className="w-4 h-4" />
                Email Verified
              </div>
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                <Check className="w-4 h-4" />
                Phone Verified
              </div>
            </div>

            {/* What's next section */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-5 text-left space-y-3">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                What's Next?
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Login to your account and explore our services</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Browse trusted service providers in your area</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Book your first service with confidence</span>
                </li>
              </ul>
            </div>

            {/* Login Button */}
            <Button asChild className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg font-semibold shadow-lg shadow-blue-200 transition-all duration-300 hover:scale-[1.02]">
              <Link href="/login" className="flex items-center justify-center gap-2">
                Go to Login
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </Link>
            </Button>

            <p className="text-xs text-gray-400">
              Need help? Contact us at support@maega.com
            </p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            {/* <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
            </div> */}
            <CardTitle className="text-2xl font-bold text-gray-900">
              {currentStep === 4 ? '' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {currentStep === 1 && 'Join MAEGA for reliable home services'}
              {currentStep === 2 && 'Step 1 of 2: Email Verification'}
              {currentStep === 3 && 'Step 2 of 2: Phone Verification'}
              {/* {currentStep === 4 && 'Your account has been created successfully'} */}
            </CardDescription>
            
            {/* Progress indicator */}
            {currentStep < 4 && (
              <div className="flex justify-center mt-2">
                <div className="flex space-x-2">
                  <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                  <div className={`w-3 h-3 rounded-full ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {message.text && (
              <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {renderStepContent()}

            {currentStep === 1 && (
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}