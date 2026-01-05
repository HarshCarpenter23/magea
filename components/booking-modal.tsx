"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { X, Check, Clock, CreditCard, CheckCircle, Loader2, IndianRupee, MapPin, Navigation } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

declare global {
  interface Window {
    Razorpay: any
  }
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  serviceName: string
  preSelectedService?: string
}

interface ServiceData {
  [key: string]: {
    name: string
    subServices: { name: string }[]
  }
}

const serviceData: ServiceData = {
  "ac-services": {
    name: "AC Services",
    subServices: [
      { name: "AC Repairs" },
      { name: "AC Installations" },
      { name: "Blower Services" },
      { name: "Electrical Repair" },
      { name: "Window Installations" },
      { name: "Water Services" },
      { name: "Compressor Repair" },
      { name: "Split AC Installations" },
      { name: "Chemical Services" },
      { name: "Gas Problem" },
      { name: "PCB Repair" },
      { name: "Wiring Problem" },
      { name: "Leakages Problem" },
      { name: "Dismantling of ACs" },
      { name: "Extension of Pipes" },
      { name: "Core Cutting" },
    ],
  },
  refrigerators: {
    name: "Refrigerators",
    subServices: [
      { name: "General Servicing" },
      { name: "Electrical Problem" },
      { name: "Gas Problem" },
      { name: "Compressor Problem" },
      { name: "PCB Problem" },
      { name: "Body Repair" },
      { name: "Accessories" },
      { name: "Evaporator Problem" },
      { name: "Electronic Set (Timer, Biometal, Fuse, Heating Coil)" },
      { name: "Fan Motor Problem" },
      { name: "Door Closing Problem" },
      { name: "Water Leakage Problem" },
      { name: "Electrical Wire Problem" },
      { name: "Bulb Problem" },
      { name: "Door Switch Problem" },
    ],
  },
  "deep-freezer": {
    name: "Deep Freezer",
    subServices: [
      { name: "Complete Servicing" },
      { name: "Electrical Problem" },
      { name: "Relay" },
      { name: "Capacitors" },
      { name: "Thermostat" },
      { name: "Gas Problem" },
      { name: "Compressor Problem" },
      { name: "Condenser Fan Motor" },
      { name: "Body Repair" },
      { name: "Accessories" },
      { name: "Condenser Fan Blade Problem" },
      { name: "Electronic Thermometer" },
      { name: "Fan Motor Base Problem" },
      { name: "Door Closing Problem" },
      { name: "Water Leakage Problem" },
      { name: "Electrical Wire Problem" },
      { name: "Door Hinges & Clamp Problem" },
    ],
  },
  "bottle-cooler": {
    name: "Bottle Cooler",
    subServices: [
      { name: "Complete Servicing" },
      { name: "Electrical Problem" },
      { name: "Relay" },
      { name: "Capacitors" },
      { name: "Thermostat" },
      { name: "Gas Problem" },
      { name: "Compressor Problem" },
      { name: "Condenser Fan Motor" },
      { name: "Body Repair" },
      { name: "Accessories" },
      { name: "Condenser Fan Blade Problem" },
      { name: "Electronic Thermometer" },
      { name: "Fan Motor Base Problem" },
      { name: "Door Closing Problem" },
      { name: "Water Leakage Problem" },
      { name: "Electrical Wire Problem" },
      { name: "Door Hinges & Clamp Problem" },
    ],
  },
  "visi-coolers": {
    name: "Visi Coolers",
    subServices: [
      { name: "Complete Servicing" },
      { name: "Electrical Problem" },
      { name: "Relay" },
      { name: "Capacitors" },
      { name: "Thermostat" },
      { name: "Gas Problem" },
      { name: "Compressor Problem" },
      { name: "Condenser Fan Motor" },
      { name: "Body Repair" },
      { name: "Accessories" },
      { name: "Condenser Fan Blade Problem" },
      { name: "Electronic Thermometer" },
      { name: "Fan Motor Base Problem" },
      { name: "Door Closing Problem" },
      { name: "Water Leakage Problem" },
      { name: "Electrical Wire Problem" },
      { name: "Tube Light Problem" },
      { name: "Door Beeding Problem" },
      { name: "Front Glass Problem" },
    ],
  },
  fow: {
    name: "FOW (Freezer on Wheels)",
    subServices: [
      { name: "Complete Servicing" },
      { name: "Electrical Problem" },
      { name: "Relay" },
      { name: "Capacitors" },
      { name: "Thermostat" },
      { name: "Gas Problem" },
      { name: "Compressor Problem" },
      { name: "Condenser Fan Motor" },
      { name: "Body Repair" },
      { name: "Accessories" },
      { name: "Condenser Fan Blade Problem" },
      { name: "Electronic Thermometer" },
      { name: "Fan Motor Base Problem" },
      { name: "Door Closing Problem" },
      { name: "Water Leakage Problem" },
      { name: "Electrical Wire Problem" },
      { name: "Door Hinges & Clamp Problem" },
    ],
  },
  "water-cooler": {
    name: "Water Cooler",
    subServices: [
      { name: "Complete Servicing" },
      { name: "Electrical Problem" },
      { name: "Relay" },
      { name: "Capacitors" },
      { name: "Thermostat" },
      { name: "Gas Problem" },
      { name: "Compressor Problem" },
      { name: "Condenser Fan Motor" },
      { name: "Body Repair" },
      { name: "Accessories" },
      { name: "Condenser Fan Blade Problem" },
      { name: "Electronic Thermometer" },
      { name: "Fan Motor Base Problem" },
      { name: "Door Closing Problem" },
      { name: "Water Leakage Problem" },
      { name: "Electrical Wire Problem" },
      { name: "Tap Problem" },
      { name: "Door Beeding Problem" },
    ],
  },
  "water-dispenser": {
    name: "Water Dispenser",
    subServices: [
      { name: "Complete Servicing" },
      { name: "Electrical Problem" },
      { name: "Relay" },
      { name: "Capacitors" },
      { name: "Thermostat" },
      { name: "Gas Problem" },
      { name: "Compressor Problem" },
      { name: "Condenser Fan Motor" },
      { name: "Body Repair" },
      { name: "Accessories" },
      { name: "Heater Problem" },
      { name: "Electronic Thermometer" },
      { name: "Tap Problem" },
      { name: "Water Bottle Holder Problem" },
      { name: "Water Leakage Problem" },
      { name: "Electrical Wire Problem" },
    ],
  },
  "refrigerator-vans": {
    name: "Freezers/Refrigerator Vans",
    subServices: [{ name: "General Servicing" }, { name: "Repairs" }, { name: "Inspection Charges" }],
  },
  "cold-rooms": {
    name: "Cold Rooms",
    subServices: [
      { name: "Complete Servicing" },
      { name: "Electrical Problem" },
      { name: "Relay" },
      { name: "Capacitors" },
      { name: "Thermostat" },
      { name: "Gas Problem" },
      { name: "Compressor Problem" },
      { name: "Condenser Fan Motor" },
      { name: "Body Repair" },
      { name: "Accessories" },
      { name: "Condenser Fan Blade Problem" },
      { name: "Electronic Thermometer" },
      { name: "Fan Motor Base Problem" },
      { name: "Door Closing Problem" },
      { name: "Water Leakage Problem" },
      { name: "Electrical Wire Problem" },
      { name: "Indoor Problem" },
      { name: "Duct Problem" },
    ],
  },
}

const allServices = [
  { id: "ac-services", name: "AC Services" },
  { id: "refrigerators", name: "Refrigerators" },
  { id: "deep-freezer", name: "Deep Freezer" },
  { id: "bottle-cooler", name: "Bottle Cooler" },
  { id: "visi-coolers", name: "Visi Coolers" },
  { id: "fow", name: "FOW (Freezer on Wheels)" },
  { id: "water-cooler", name: "Water Cooler" },
  { id: "water-dispenser", name: "Water Dispenser" },
  { id: "refrigerator-vans", name: "Freezers/Refrigerator Vans" },
  { id: "cold-rooms", name: "Cold Rooms" },
]

const timeSlots = [
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
  "5:00 PM - 6:00 PM",
]

export default function BookingModal({ isOpen, onClose, serviceName, preSelectedService }: BookingModalProps) {
  const { user, isLoggedIn } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState(preSelectedService || "")
  const [selectedSubService, setSelectedSubService] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("")
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  })
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [bookingId, setBookingId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [assignedWorker, setAssignedWorker] = useState<{name: string, phone: string, eta: string} | null>(null)

  // Location state
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState("")

  // Pre-fill customer details if user is logged in
  useEffect(() => {
    console.log('BookingModal useEffect - isOpen:', isOpen, 'isLoggedIn:', isLoggedIn, 'user:', user)
    if (isOpen && isLoggedIn && user) {
      // Handle both camelCase (from API) and snake_case field names
      const firstName = (user as any).firstName || (user as any).first_name || ''
      const lastName = (user as any).lastName || (user as any).last_name || ''
      console.log('Setting customer details - firstName:', firstName, 'lastName:', lastName, 'email:', user.email, 'phone:', user.phone)
      setCustomerDetails({
        name: `${firstName} ${lastName}`.trim(),
        email: user.email || '',
        phone: user.phone || '',
        address: '',
        notes: ''
      })
    }
  }, [isOpen, isLoggedIn, user])

  // Get user's current location
  const getCurrentLocation = () => {
    setLocationLoading(true)
    setLocationError("")

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocationLoading(false)
      },
      (error) => {
        let errorMessage = "Unable to get your location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }
        setLocationError(errorMessage)
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    setSelectedSubService("")
  }

  const handleSubServiceSelect = (subService: string) => {
    setSelectedSubService(subService)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot)
  }

  const handleSendOTP = () => {
    setOtpSent(true)
  }

  const handleVerifyOTP = () => {
    if (otp === "123456") {
      handleNext()
    }
  }

  const INSPECTION_FEE = 99 // Inspection fee in INR

  const handleRazorpayPayment = async () => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      // Generate a temporary receipt ID for the order
      const tempReceiptId = 'TEMP' + Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 5).toUpperCase()

      // Create Razorpay order first (without saving booking)
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: INSPECTION_FEE,
          currency: 'INR',
          receipt: tempReceiptId,
          notes: {
            service: selectedService,
            subService: selectedSubService,
          },
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        setSubmitError('Failed to create payment order')
        setIsSubmitting(false)
        return
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'MAEGA Services',
        description: `${getSelectedServiceData().name} - ${selectedSubService}`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          // Payment successful - now create the booking with payment details
          const bookingResponse = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              service: selectedService,
              subService: selectedSubService,
              date: selectedDate?.toISOString().split('T')[0],
              time: selectedTimeSlot,
              customerName: customerDetails.name,
              customerPhone: customerDetails.phone,
              customerEmail: customerDetails.email,
              customerAddress: customerDetails.address,
              notes: customerDetails.notes,
              userId: user?.id || null,
              paymentMethod: 'razorpay',
              amount: INSPECTION_FEE,
              latitude: location?.lat || null,
              longitude: location?.lng || null,
              // Payment details
              paymentStatus: 'paid',
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })

          const bookingData = await bookingResponse.json()

          if (bookingData.success) {
            if (bookingData.assignedWorker) {
              setAssignedWorker(bookingData.assignedWorker)
            }
            setBookingId(bookingData.bookingCode)
            setBookingConfirmed(true)
          } else {
            setSubmitError('Payment successful but booking failed. Please contact support with payment ID: ' + response.razorpay_payment_id)
          }
          setIsSubmitting(false)
        },
        prefill: {
          name: customerDetails.name,
          email: customerDetails.email,
          contact: customerDetails.phone,
        },
        notes: {
          address: customerDetails.address,
        },
        theme: {
          color: '#2563EB',
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false)
            setSubmitError('Payment was cancelled.')
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      setSubmitError('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }


  const handleClose = () => {
    // Reset all states
    setCurrentStep(1)
    setSelectedService(preSelectedService || "")
    setSelectedSubService("")
    setSelectedDate(undefined)
    setSelectedTimeSlot("")
    setCustomerDetails({ name: "", phone: "", email: "", address: "", notes: "" })
    setOtpSent(false)
    setOtp("")
    setPaymentMethod("")
    setBookingConfirmed(false)
    setBookingId("")
    setLocation(null)
    setLocationError("")
    setAssignedWorker(null)
    onClose()
  }

  const getSelectedServiceData = () => {
    return serviceData[selectedService] || { name: selectedService, subServices: [] }
  }

  if (bookingConfirmed) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-md mx-auto p-0">
          <div className="text-center space-y-4 p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Booking Confirmed</h2>
              <p className="text-sm sm:text-base text-gray-600">Your service has been successfully booked</p>
            </div>

            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Booking ID</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 break-all">{bookingId}</p>
            </div>

            <div className="bg-white border rounded-lg p-3 sm:p-4 text-left space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Booking Details</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-600 flex-shrink-0">Service:</span>
                  <span className="font-medium text-right">{getSelectedServiceData().name}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-600 flex-shrink-0">Sub-Service:</span>
                  <span className="font-medium text-right">{selectedSubService}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-600 flex-shrink-0">Date:</span>
                  <span className="font-medium text-right">{selectedDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-600 flex-shrink-0">Time:</span>
                  <span className="font-medium text-right">{selectedTimeSlot}</span>
                </div>
              </div>
            </div>

            {assignedWorker ? (
              <div className="bg-green-50 border border-green-200 p-3 sm:p-4 rounded-lg text-left">
                <h4 className="font-semibold text-green-900 mb-3 text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Technician Assigned
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Technician:</span>
                    <span className="font-medium text-green-900">{assignedWorker.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Contact:</span>
                    <span className="font-medium text-green-900">{assignedWorker.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Estimated Arrival:</span>
                    <span className="font-medium text-green-900">{assignedWorker.eta}</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-3">
                  The technician will call you 30 minutes before arrival.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">What's Next?</h4>
                <ul className="text-xs sm:text-sm text-blue-800 space-y-1 text-left">
                  <li>• A technician will be assigned shortly</li>
                  <li>• You'll receive an email with technician details</li>
                  <li>• Service charges will be discussed during the visit</li>
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1 text-sm" asChild>
                <a href="/track">Track Booking</a>
              </Button>
              <Button variant="outline" onClick={handleClose} className="text-sm bg-transparent">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="border-b pb-3 px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="flex items-center justify-between text-lg sm:text-xl font-semibold">
            Book Your Service
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2 min-w-max">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : step}
                </div>
                {index < 4 && (
                  <div
                    className={`w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 ${step < currentStep ? "bg-blue-600" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-4 sm:px-6 sm:pb-6" style={{ maxHeight: "calc(95vh - 140px)" }}>
          {/* Step 1: Select Service */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Select Service</h3>
                <p className="text-sm sm:text-base text-gray-600">Choose the main service category</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allServices.map((service) => (
                  <button
                    key={service.id}
                    className={`p-3 sm:p-4 text-left border-2 rounded-lg transition-colors ${
                      selectedService === service.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleServiceSelect(service.id)}
                  >
                    <div className="font-medium text-sm sm:text-base">{service.name}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext} disabled={!selectedService} className="px-6 text-sm sm:text-base">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Select Sub-Service */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Select Sub-Service</h3>
                <p className="text-sm sm:text-base text-gray-600">Choose the specific service you need</p>
              </div>

              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
                  {getSelectedServiceData().name}
                </span>
              </div>

              <div className="space-y-2 max-h-60 sm:max-h-64 overflow-y-auto">
                {getSelectedServiceData().subServices.map((subService, index) => (
                  <button
                    key={index}
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${
                      selectedSubService === subService.name
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleSubServiceSelect(subService.name)}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-medium text-sm sm:text-base flex-1 text-left">{subService.name}</span>
                      {selectedSubService === subService.name && (
                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4 gap-3">
                <Button variant="outline" onClick={handlePrevious} className="text-sm sm:text-base bg-transparent">
                  Previous
                </Button>
                <Button onClick={handleNext} disabled={!selectedSubService} className="text-sm sm:text-base">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Select Date & Time</h3>
                <p className="text-sm sm:text-base text-gray-600">Choose your preferred schedule</p>
              </div>

              <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                <div className="space-y-3">
                  <Label className="font-medium text-sm sm:text-base">Select Date</Label>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date()}
                      className="rounded-lg border w-fit text-sm"
                    />
                  </div>
                </div>

                {selectedDate && (
                  <div className="space-y-3">
                    <Label className="font-medium text-sm sm:text-base">Select Time</Label>
                    <div className="space-y-2 max-h-60 sm:max-h-64 overflow-y-auto">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          className={`w-full p-3 text-left border rounded-lg transition-colors ${
                            selectedTimeSlot === slot
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleTimeSlotSelect(slot)}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm sm:text-base font-medium">{slot}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 gap-3">
                <Button variant="outline" onClick={handlePrevious} className="text-sm sm:text-base bg-transparent">
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedDate || !selectedTimeSlot}
                  className="text-sm sm:text-base"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Customer Details */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {isLoggedIn ? "Confirm Your Details" : "Customer Details"}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {isLoggedIn ? "Please confirm your information and provide the service address" : "Provide your contact information"}
                </p>
              </div>

              <div className="space-y-4">
                {isLoggedIn ? (
                  <>
                    {/* Read-only fields for logged in users */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Name</span>
                        <span className="text-sm font-medium text-gray-900">{customerDetails.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Phone</span>
                        <span className="text-sm font-medium text-gray-900">{customerDetails.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Email</span>
                        <span className="text-sm font-medium text-gray-900">{customerDetails.email}</span>
                      </div>
                    </div>

                    {/* Editable address for logged in users */}
                    <div className="space-y-1">
                      <Label htmlFor="address" className="text-sm sm:text-base">
                        Service Address *
                      </Label>
                      <Textarea
                        id="address"
                        placeholder="Enter the address where service is needed"
                        value={customerDetails.address}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                        className="min-h-[80px] text-sm sm:text-base resize-none"
                      />
                    </div>

                    {/* Location capture - MANDATORY */}
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Precise Location *
                      </Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={locationLoading}
                          className="flex-1 text-sm"
                        >
                          {locationLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Getting Location...
                            </>
                          ) : location ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Location Captured
                            </>
                          ) : (
                            <>
                              <Navigation className="w-4 h-4 mr-2" />
                              Use My Current Location
                            </>
                          )}
                        </Button>
                      </div>
                      {locationError && (
                        <p className="text-xs text-red-600">{locationError}</p>
                      )}
                      {location && (
                        <p className="text-xs text-green-600">
                          Location captured successfully. This helps us assign the nearest technician.
                        </p>
                      )}
                      {!location && !locationLoading && !locationError && (
                        <p className="text-xs text-amber-600">
                          Please capture your location to proceed with the booking.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="notes" className="text-sm sm:text-base">
                        Additional Notes (Optional)
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Any specific requirements"
                        value={customerDetails.notes}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, notes: e.target.value })}
                        className="min-h-[60px] text-sm sm:text-base resize-none"
                      />
                    </div>

                    {/* Skip OTP for logged in users - go directly to next step */}
                    <Button
                      onClick={handleNext}
                      disabled={!customerDetails.address || !location}
                      className="w-full text-sm sm:text-base"
                    >
                      Continue to Payment
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Full form for non-logged in users */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="name" className="text-sm sm:text-base">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          placeholder="Enter your name"
                          value={customerDetails.name}
                          onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="phone" className="text-sm sm:text-base">
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          placeholder="+91 12345 67890"
                          value={customerDetails.phone}
                          onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                          className="text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-sm sm:text-base">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={customerDetails.email}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                        className="text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="address" className="text-sm sm:text-base">
                        Address *
                      </Label>
                      <Textarea
                        id="address"
                        placeholder="Enter your complete address"
                        value={customerDetails.address}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                        className="min-h-[80px] text-sm sm:text-base resize-none"
                      />
                    </div>

                    {/* Location capture for non-logged in users - MANDATORY */}
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Precise Location *
                      </Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={locationLoading}
                          className="flex-1 text-sm"
                        >
                          {locationLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Getting Location...
                            </>
                          ) : location ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Location Captured
                            </>
                          ) : (
                            <>
                              <Navigation className="w-4 h-4 mr-2" />
                              Use My Current Location
                            </>
                          )}
                        </Button>
                      </div>
                      {locationError && (
                        <p className="text-xs text-red-600">{locationError}</p>
                      )}
                      {location && (
                        <p className="text-xs text-green-600">
                          Location captured successfully. This helps us assign the nearest technician.
                        </p>
                      )}
                      {!location && !locationLoading && !locationError && (
                        <p className="text-xs text-amber-600">
                          Please capture your location to proceed with the booking.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="notes" className="text-sm sm:text-base">
                        Additional Notes (Optional)
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Any specific requirements"
                        value={customerDetails.notes}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, notes: e.target.value })}
                        className="min-h-[60px] text-sm sm:text-base resize-none"
                      />
                    </div>

                    {!otpSent ? (
                      <Button
                        onClick={handleSendOTP}
                        disabled={
                          !customerDetails.name ||
                          !customerDetails.phone ||
                          !customerDetails.email ||
                          !customerDetails.address ||
                          !location
                        }
                        className="w-full text-sm sm:text-base"
                      >
                        Send OTP
                      </Button>
                    ) : (
                      <div className="space-y-3 bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="otp" className="text-sm sm:text-base">
                            Enter OTP
                          </Label>
                          <Input
                            id="otp"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            className="text-center font-mono text-sm sm:text-base"
                          />
                          <p className="text-xs sm:text-sm text-gray-600 break-words">
                            OTP sent to {customerDetails.phone} and {customerDetails.email}
                          </p>
                          <p className="text-xs sm:text-sm text-blue-600 font-medium">Demo OTP: 123456</p>
                        </div>
                        <Button
                          onClick={handleVerifyOTP}
                          disabled={otp.length !== 6}
                          className="w-full text-sm sm:text-base"
                        >
                          Verify & Continue
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-between pt-4 gap-3">
                <Button variant="outline" onClick={handlePrevious} className="text-sm sm:text-base bg-transparent">
                  Previous
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Payment */}
          {currentStep === 5 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Payment</h3>
                <p className="text-sm sm:text-base text-gray-600">Pay inspection fee to confirm your booking</p>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Booking Summary</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-600 flex-shrink-0">Service:</span>
                    <span className="font-medium text-right">{getSelectedServiceData().name}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-600 flex-shrink-0">Sub-Service:</span>
                    <span className="font-medium text-right">{selectedSubService}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-600 flex-shrink-0">Date:</span>
                    <span className="font-medium text-right">{selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-600 flex-shrink-0">Time:</span>
                    <span className="font-medium text-right">{selectedTimeSlot}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-600 flex-shrink-0">Inspection Fee:</span>
                      <span className="font-bold text-blue-600 text-right flex items-center">
                        <IndianRupee className="h-3 w-3" />{INSPECTION_FEE}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">*Final service cost will be discussed on-site after inspection</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-medium text-sm sm:text-base">Payment Method</Label>
                <div className="space-y-2">
                  <button
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${
                      paymentMethod === 'razorpay'
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setPaymentMethod('razorpay')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 flex-shrink-0 text-blue-600" />
                        <div>
                          <span className="font-medium text-sm sm:text-base block">Pay Now</span>
                          <span className="text-xs text-gray-500">UPI, Cards, Net Banking, Wallets</span>
                        </div>
                      </div>
                      <div className="flex items-center text-blue-600 font-semibold">
                        <IndianRupee className="h-3 w-3" />{INSPECTION_FEE}
                      </div>
                    </div>
                  </button>

                </div>
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              <div className="flex justify-between pt-4 gap-3">
                <Button variant="outline" onClick={handlePrevious} className="text-sm sm:text-base bg-transparent" disabled={isSubmitting}>
                  Previous
                </Button>
                <Button onClick={handleRazorpayPayment} disabled={!paymentMethod || isSubmitting} className="text-sm sm:text-base">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>Pay <IndianRupee className="h-3 w-3 mx-0.5" />{INSPECTION_FEE}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
