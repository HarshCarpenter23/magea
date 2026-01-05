"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Shield,
  LogOut,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  GraduationCap,
  Briefcase,
  AlertCircle,
  FileText,
  Image,
  Download,
} from "lucide-react"
import { useAdminAuth } from "@/context/AdminAuthContext"

interface Application {
  id: number
  worker_code: string
  first_name: string
  last_name: string
  phone: string
  email: string
  date_of_birth: string
  gender: string
  photo_url: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  pincode: string
  account_holder_name: string
  account_number: string
  account_type: string
  bank_name: string
  ifsc_code: string
  branch_name: string
  shop_name: string
  shop_address: string
  shop_phone: string
  shop_registration_number: string
  house_type: string
  house_address: string
  marital_status: string
  experience_years: number
  previous_company: string
  reference_name: string
  reference_phone: string
  academic_qualification: string
  technical_qualification: string
  other_qualifications: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string
  blood_group: string
  id_proof_url: string
  certificates_url: string
  status: string
  created_at: string
  approved_at: string
  approved_by: number
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { admin, isAdminLoggedIn, adminLogout, loading: authLoading } = useAdminAuth()

  const [applications, setApplications] = useState<Application[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const [statusFilter, setStatusFilter] = useState("Pending Approval")
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" })

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAdminLoggedIn) {
      router.push("/admin/login")
    }
  }, [authLoading, isAdminLoggedIn, router])

  // Fetch applications
  const fetchApplications = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/applications?status=${statusFilter}&page=${pagination.page}&limit=${pagination.limit}`
      )
      const data = await response.json()

      if (data.success) {
        setApplications(data.applications)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchApplications()
    }
  }, [isAdminLoggedIn, statusFilter, pagination.page])

  const handleLogout = () => {
    adminLogout()
    router.push("/admin/login")
  }

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application)
    setShowDetailModal(true)
  }

  const handleApprove = async (application: Application) => {
    setProcessing(true)
    setActionMessage({ type: "", text: "" })

    try {
      const response = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve",
          adminId: admin?.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setActionMessage({
          type: "success",
          text: "Application approved! Login credentials sent to the applicant.",
        })
        setShowDetailModal(false)
        fetchApplications()
      } else {
        setActionMessage({ type: "error", text: data.message || "Failed to approve" })
      }
    } catch (error) {
      setActionMessage({ type: "error", text: "An error occurred" })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedApplication) return

    setProcessing(true)
    setActionMessage({ type: "", text: "" })

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          adminId: admin?.id,
          reason: rejectReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setActionMessage({ type: "success", text: "Application rejected." })
        setShowRejectModal(false)
        setShowDetailModal(false)
        setRejectReason("")
        fetchApplications()
      } else {
        setActionMessage({ type: "error", text: data.message || "Failed to reject" })
      }
    } catch (error) {
      setActionMessage({ type: "error", text: "An error occurred" })
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending Approval":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "Active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Convert /uploads/... URLs to /api/uploads/... for proper serving
  const getFileUrl = (url: string | null) => {
    if (!url) return null
    if (url.startsWith("/uploads/")) {
      return "/api" + url
    }
    return url
  }

  // Check if URL is an image
  const isImageUrl = (url: string | null) => {
    if (!url) return false
    const ext = url.toLowerCase().split(".").pop()
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    )
  }

  if (!isAdminLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <span className="font-bold text-xl">MAEGA Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                Welcome, {admin?.firstName || admin?.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:text-white hover:bg-slate-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Message */}
        {actionMessage.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              actionMessage.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {actionMessage.text}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            className={`cursor-pointer transition-all ${
              statusFilter === "Pending Approval" ? "ring-2 ring-yellow-500" : ""
            }`}
            onClick={() => {
              setStatusFilter("Pending Approval")
              setPagination((p) => ({ ...p, page: 1 }))
            }}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusFilter === "Pending Approval" ? pagination.total : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              statusFilter === "Active" ? "ring-2 ring-green-500" : ""
            }`}
            onClick={() => {
              setStatusFilter("Active")
              setPagination((p) => ({ ...p, page: 1 }))
            }}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusFilter === "Active" ? pagination.total : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              statusFilter === "all" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => {
              setStatusFilter("all")
              setPagination((p) => ({ ...p, page: 1 }))
            }}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">All Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusFilter === "all" ? pagination.total : "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">
              {statusFilter === "all"
                ? "All Applications"
                : statusFilter === "Active"
                ? "Approved Applications"
                : "Pending Applications"}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No applications found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Applicant</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Contact</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Applied On</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                                {app.photo_url ? (
                                  <img
                                    src={getFileUrl(app.photo_url) || ""}
                                    alt={app.first_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <User className="w-5 h-5 text-slate-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {app.first_name} {app.last_name}
                                </p>
                                <p className="text-sm text-gray-500">{app.worker_code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              <p className="text-gray-900">{app.phone}</p>
                              <p className="text-gray-500 truncate max-w-[200px]">{app.email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-gray-900">{app.city}</p>
                            <p className="text-sm text-gray-500">{app.state}</p>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {formatDate(app.created_at)}
                          </td>
                          <td className="py-4 px-4">{getStatusBadge(app.status)}</td>
                          <td className="py-4 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(app)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                      {pagination.total} results
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden p-0">
          {selectedApplication && (
            <div className="flex flex-col h-full max-h-[95vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-800 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                    {selectedApplication.photo_url ? (
                      <img
                        src={getFileUrl(selectedApplication.photo_url) || ""}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-7 h-7 text-white/70" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-white/70">
                      <span>{selectedApplication.worker_code}</span>
                      <span>•</span>
                      <span>Applied {formatDate(selectedApplication.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedApplication.status)}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Photo & Documents */}
                <div className="w-72 bg-gray-50 border-r p-5 overflow-y-auto hidden lg:block">
                  {/* Photo */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Photo</h4>
                    <div className="aspect-square w-full bg-white rounded-xl overflow-hidden shadow-sm border">
                      {selectedApplication.photo_url ? (
                        <a href={getFileUrl(selectedApplication.photo_url) || ""} target="_blank" rel="noopener noreferrer">
                          <img
                            src={getFileUrl(selectedApplication.photo_url) || ""}
                            alt="Applicant"
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </a>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <User className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents</h4>

                    {/* ID Proof */}
                    <div className="bg-white rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">ID Proof</span>
                        {selectedApplication.id_proof_url && (
                          <a
                            href={getFileUrl(selectedApplication.id_proof_url) || ""}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      {selectedApplication.id_proof_url ? (
                        <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                          {isImageUrl(selectedApplication.id_proof_url) ? (
                            <img
                              src={getFileUrl(selectedApplication.id_proof_url) || ""}
                              alt="ID Proof"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not uploaded</p>
                      )}
                    </div>

                    {/* Certificates */}
                    <div className="bg-white rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Certificates</span>
                        {selectedApplication.certificates_url && (
                          <a
                            href={getFileUrl(selectedApplication.certificates_url) || ""}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      {selectedApplication.certificates_url ? (
                        <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                          {isImageUrl(selectedApplication.certificates_url) ? (
                            <img
                              src={getFileUrl(selectedApplication.certificates_url) || ""}
                              alt="Certificates"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not uploaded</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Content - Details */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-4xl space-y-6">
                    {/* Quick Info Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4">
                        <Phone className="w-5 h-5 text-blue-600 mb-2" />
                        <p className="text-xs text-blue-600 font-medium">Phone</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{selectedApplication.phone || "N/A"}</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4">
                        <Mail className="w-5 h-5 text-purple-600 mb-2" />
                        <p className="text-xs text-purple-600 font-medium">Email</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{selectedApplication.email || "N/A"}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4">
                        <MapPin className="w-5 h-5 text-green-600 mb-2" />
                        <p className="text-xs text-green-600 font-medium">City</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{selectedApplication.city || "N/A"}</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-4">
                        <Briefcase className="w-5 h-5 text-orange-600 mb-2" />
                        <p className="text-xs text-orange-600 font-medium">Experience</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {selectedApplication.experience_years ? `${selectedApplication.experience_years} years` : "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Personal Details */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 border-b">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Personal Details
                        </h3>
                      </div>
                      <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Full Name</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {selectedApplication.first_name} {selectedApplication.last_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Date of Birth</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedApplication.date_of_birth)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Gender</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.gender || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Marital Status</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.marital_status || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Blood Group</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.blood_group || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 border-b">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Address
                        </h3>
                      </div>
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Home Address</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">
                            {selectedApplication.address_line1 || selectedApplication.house_address || "N/A"}
                            {selectedApplication.address_line2 && <>, {selectedApplication.address_line2}</>}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedApplication.city}{selectedApplication.state && `, ${selectedApplication.state}`} - {selectedApplication.pincode}
                          </p>
                        </div>
                        {selectedApplication.shop_address && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Shop Address</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.shop_name}</p>
                            <p className="text-sm text-gray-600">{selectedApplication.shop_address}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Qualifications */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 border-b">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          Qualifications
                        </h3>
                      </div>
                      <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Academic</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.academic_qualification || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Technical</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.technical_qualification || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Previous Company</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.previous_company || "N/A"}</p>
                        </div>
                        {selectedApplication.other_qualifications && (
                          <div className="col-span-full">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Other Details</p>
                            <p className="text-sm font-medium text-gray-900 mt-1 whitespace-pre-line">{selectedApplication.other_qualifications}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div className="bg-white border rounded-xl overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 border-b">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          Bank Details
                        </h3>
                      </div>
                      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Account Holder</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.account_holder_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Bank Name</p>
                          <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.bank_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Account Number</p>
                          <p className="text-sm font-medium text-gray-900 mt-1 font-mono">{selectedApplication.account_number || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">IFSC Code</p>
                          <p className="text-sm font-medium text-gray-900 mt-1 font-mono">{selectedApplication.ifsc_code || "N/A"}</p>
                        </div>
                        {selectedApplication.branch_name && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Branch</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.branch_name}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Emergency Contact & Reference */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white border rounded-xl overflow-hidden">
                        <div className="px-5 py-3 bg-red-50 border-b">
                          <h3 className="font-semibold text-red-900 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Emergency Contact
                          </h3>
                        </div>
                        <div className="p-5 space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Name</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.emergency_contact_name || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.emergency_contact_phone || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Relation</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.emergency_contact_relation || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border rounded-xl overflow-hidden">
                        <div className="px-5 py-3 bg-blue-50 border-b">
                          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Reference
                          </h3>
                        </div>
                        <div className="p-5 space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Name</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.reference_name || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">{selectedApplication.reference_phone || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Documents View (shown on small screens) */}
                    <div className="lg:hidden bg-white border rounded-xl overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 border-b">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Documents
                        </h3>
                      </div>
                      <div className="p-5 grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                            {selectedApplication.photo_url ? (
                              <img src={getFileUrl(selectedApplication.photo_url) || ""} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">Photo</p>
                        </div>
                        <div className="text-center">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                            {selectedApplication.id_proof_url ? (
                              isImageUrl(selectedApplication.id_proof_url) ? (
                                <img src={getFileUrl(selectedApplication.id_proof_url) || ""} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-8 h-8 text-gray-400" />
                              )
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">ID Proof</p>
                        </div>
                        <div className="text-center">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                            {selectedApplication.certificates_url ? (
                              isImageUrl(selectedApplication.certificates_url) ? (
                                <img src={getFileUrl(selectedApplication.certificates_url) || ""} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-8 h-8 text-gray-400" />
                              )
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">Certificates</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              {selectedApplication.status === "Pending Approval" && (
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedApplication)}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this application? You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
