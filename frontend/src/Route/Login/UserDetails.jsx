//frontend/src/Route/Login/UserDetails.jsx

import React from 'react';
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  User,
  GraduationCap,
  Building2,
  Calendar,
  Code2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react"
import { SiLeetcode, SiCodeforces, SiCodechef } from "react-icons/si"

const UserDetails = () => {
  const [fullName, setFullName] = useState("")
  const [college, setCollege] = useState("")
  const [degree, setDegree] = useState("")
  const [department, setDepartment] = useState("")
  const [graduationYear, setGraduationYear] = useState("")
  const [leetcodeUsername, setLeetcodeUsername] = useState("")
  const [codeforcesUsername, setCodeforcesUsername] = useState("")
  const [codechefUsername, setCodechefUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const colleges = [
    "IIT Madras",
    "NIT Trichy",
    "CIT Chennai",
    "Anna University",
    "SRM Institute",
    "VIT University",
    "Other",
  ]

  const degrees = ["B.E.", "B.Tech", "M.E.", "M.Tech", "B.Sc", "M.Sc", "Other"]

  const departments = [
    "Computer Science",
    "Electronics",
    "Electrical",
    "Mechanical",
    "Information Technology",
    "Civil",
    "Other",
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const userId = localStorage.getItem("userId")

    try {
      // Update profile
      const updateRes = await fetch(`http://localhost:3000/api/auth/update-profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          college,
          degree,
          department,
          graduationYear,
          leetcodeUsername,
          codeforcesUsername,
          codechefUsername,
          userId,
        }),
      })

      const updateData = await updateRes.json()
      if (!updateRes.ok) {
        throw new Error(updateData.error || "Failed to update profile")
      }

      // Fetch combined CP data
      const combinedRes = await fetch(`http://localhost:3000/all/combined`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leetcodeUsername,
          codeforcesUsername,
          codechefUsername,
          userId,
        }),
      })

      const combinedData = await combinedRes.json()
      if (!combinedRes.ok) {
        throw new Error(combinedData.error || "Failed to fetch CP data")
      }

      console.log("Full CP Profile:", combinedData)
      setSuccess("Profile created successfully! Redirecting to login...")

      setTimeout(() => {
        navigate("/auth/login")
      }, 2000)
    } catch (error) {
      console.error("❌ Error submitting profile:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (fullName && college && degree && department && graduationYear) {
      setStep(2)
    }
  }

  const prevStep = () => {
    setStep(1)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl mb-4">
            {step === 1 ? <User className="w-8 h-8 text-white" /> : <Code2 className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            {step === 1 ? "Personal Details" : "Platform Details"}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 1 ? "Tell us about your academic background" : "Connect your competitive programming profiles"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? "bg-violet-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? "bg-violet-500" : "bg-gray-200"}`}></div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? "bg-violet-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-xl">
              <div className="flex items-center gap-2 text-violet-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Processing your details...</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <>
                {/* Full Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* College */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4" />
                    College/University
                  </label>
                  <select
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required
                    disabled={loading}
                  >
                    <option value="">Select your college</option>
                    {colleges.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Degree */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <GraduationCap className="w-4 h-4" />
                    Degree
                  </label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required
                    disabled={loading}
                  >
                    <option value="">Select your degree</option>
                    {degrees.map((deg) => (
                      <option key={deg} value={deg}>
                        {deg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Code2 className="w-4 h-4" />
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required
                    disabled={loading}
                  >
                    <option value="">Select your department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Graduation Year */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Year of Graduation
                  </label>
                  <select
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    required
                    disabled={loading}
                  >
                    <option value="">Select graduation year</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Continue to Platform Details
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Step 2: Platform Details */}
            {step === 2 && (
              <>
                {/* LeetCode */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <SiLeetcode className="w-4 h-4 text-orange-500" />
                    LeetCode Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your LeetCode username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Codeforces */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <SiCodeforces className="w-4 h-4 text-blue-500" />
                    Codeforces Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your Codeforces username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    value={codeforcesUsername}
                    onChange={(e) => setCodeforcesUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* CodeChef */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <SiCodechef className="w-4 h-4 text-purple-500" />
                    CodeChef Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your CodeChef username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    value={codechefUsername}
                    onChange={(e) => setCodechefUsername(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Complete Setup
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Step {step} of 2 • Your information is secure and will only be used to enhance your experience
          </p>
        </div>
      </div>
    </div>
  )
}

// Demo component
export function UserDetailsDemo() {
  return <UserDetails />
}

export default UserDetails
