"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, CheckCircle, Clock, Shield, Star } from "lucide-react"
import Link from "next/link"
import BookingModal from "@/components/booking-modal" // Import BookingModal component

interface SubService {
  id: string
  name: string
  description: string
  image: string
  issues: string[]
}

interface ServiceCategory {
  title: string
  services: SubService[]
}

interface ServicePageProps {
  serviceName: string
  serviceDescription: string
  heroImage: string
  categories: ServiceCategory[]
  testimonials?: {
    name: string
    rating: number
    comment: string
    service: string
  }[]
}

export function ServicePageTemplate({
  serviceName,
  serviceDescription,
  heroImage,
  categories,
  testimonials = [],
}: ServicePageProps) {
  const [selectedService, setSelectedService] = useState<string>("")
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)

  const handleBookService = (serviceId: string, serviceName: string) => {
    setSelectedService(`${serviceName} - ${serviceId}`)
    setIsBookingModalOpen(true)
  }

  const getServiceRouteId = (serviceName: string) => {
    const serviceMap: { [key: string]: string } = {
      "AC Services": "ac-services",
      "AC Repair": "ac-services",
      "AC Installation": "ac-services",
      Refrigerator: "refrigerators",
      "Refrigerator Repair": "refrigerators",
      "Washing Machine": "washing-machine",
      "Washing Machine Repair": "washing-machine",
      Microwave: "microwave",
      "Microwave Repair": "microwave",
      Geyser: "geyser",
      "RO/Water Purifier": "ro-water-purifier",
      "Electrical Services": "electrical",
      "Plumbing Services": "plumbing",
      Carpentry: "carpentry",
      "House Cleaning": "house-cleaning",
    }

    // Find matching service ID or default to a generic one
    for (const [name, id] of Object.entries(serviceMap)) {
      if (
        serviceName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(serviceName.toLowerCase())
      ) {
        return id
      }
    }

    // Fallback: convert service name to kebab-case
    return serviceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const handleMainBookNow = () => {
    setIsBookingModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background to-card py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-3 md:space-y-4">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Back to Services
                </Link>
                <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight">
                  {serviceName}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{serviceDescription}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-base md:text-lg px-6 md:px-8" onClick={handleMainBookNow}>
                  Book Now
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-2 sm:space-y-0 pt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                  <span className="text-xs md:text-sm text-muted-foreground">Same Day Service</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                  <span className="text-xs md:text-sm text-muted-foreground">Verified Technicians</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                  <span className="text-xs md:text-sm text-muted-foreground">Fair Pricing</span>
                </div>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <img
                src={heroImage || "/placeholder.svg"}
                alt={`${serviceName} professional service`}
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-background p-3 md:p-4 rounded-xl shadow-lg border border-border">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-accent rounded-full flex items-center justify-center">
                    <Star className="h-5 w-5 md:h-6 md:w-6 text-accent-foreground fill-current" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base text-foreground">4.9/5 Rating</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Trusted Service</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12 md:mb-16">
              <div className="text-center space-y-4 mb-8 md:mb-12">
                <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground">{category.title}</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {category.services.map((service) => (
                  <Card
                    key={service.id}
                    className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md"
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
                      <img
                        src={service.image || "/placeholder.svg"}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardHeader className="pb-4">
                      <CardTitle className="font-heading text-lg md:text-xl">{service.name}</CardTitle>
                      <CardDescription className="text-sm">{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-3 text-foreground">Common Issues We Fix:</h4>
                        <div className="space-y-2">
                          {service.issues.slice(0, 4).map((issue, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Checkbox id={`${service.id}-issue-${index}`} className="h-4 w-4" />
                              <label
                                htmlFor={`${service.id}-issue-${index}`}
                                className="text-sm text-muted-foreground cursor-pointer"
                              >
                                {issue}
                              </label>
                            </div>
                          ))}
                          {service.issues.length > 4 && (
                            <p className="text-xs text-muted-foreground">+ {service.issues.length - 4} more issues</p>
                          )}
                        </div>
                      </div>
                      <div className="bg-card p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          <strong>Inspection Charges Apply</strong> - Final service cost determined after inspection
                        </p>
                      </div>
                      <Button className="w-full" onClick={() => handleBookService(service.id, service.name)}>
                        Book Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 md:py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">Fast Response</h3>
              <p className="text-sm text-muted-foreground">Same day service available</p>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">Verified Technicians</h3>
              <p className="text-sm text-muted-foreground">Background checked professionals</p>
            </div>
            <div className="flex flex-col items-center space-y-3 sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">Quality Guarantee</h3>
              <p className="text-sm text-muted-foreground">Satisfaction guaranteed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-12 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center space-y-4 mb-12 md:mb-16">
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground">Customer Reviews</h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-accent fill-current" />
                      ))}
                    </div>
                    <CardTitle className="font-heading text-base md:text-lg">{testimonial.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {testimonial.service}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm md:text-base text-muted-foreground italic">"{testimonial.comment}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="space-y-4 sm:col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center space-x-3">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hzPhiTcquwE6NDH7GuUV1CBffal9ao.png"
                  alt="MAEGA logo"
                  className="h-11 md:h-12 w-auto bg-background rounded"
                />
                <span className="sr-only">MAEGA - On-Demand Services</span>
              </Link>
              <p className="text-sm opacity-80">Professional home and appliance services at your doorstep.</p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>
                  <Link href="/services/ac-services" className="hover:opacity-100 transition-opacity">
                    AC Services
                  </Link>
                </li>
                <li>
                  <Link href="/services/refrigerators" className="hover:opacity-100 transition-opacity">
                    Refrigerators
                  </Link>
                </li>
                <li>
                  <Link href="/services/deep-freezers" className="hover:opacity-100 transition-opacity">
                    Deep Freezers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>
                  <Link href="/about" className="hover:opacity-100 transition-opacity">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:opacity-100 transition-opacity">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>
                  <Link href="/dashboard" className="hover:opacity-100 transition-opacity">
                    My Account
                  </Link>
                </li>
                <li className="flex items-center space-x-2">
                  <span>WhatsApp:</span>
                  <a href="https://wa.me/918096557573" className="hover:opacity-100 transition-opacity">
                    +91 80965 57573
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 mt-8 md:mt-12 pt-6 md:pt-8 text-center">
            <p className="text-sm opacity-80">© 2024 MAEGA. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Chat Button */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
        <Button
          size="lg"
          className="rounded-full w-12 h-12 md:w-14 md:h-14 bg-accent hover:bg-accent/90 shadow-lg"
          asChild
        >
          <a href="https://wa.me/918096557573" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
          </a>
        </Button>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        serviceName={serviceName}
        preSelectedService={getServiceRouteId(serviceName)}
      />
    </div>
  )
}
