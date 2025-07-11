//frontend/src/components/Footer.jsx
import React from "react"
import { useState } from "react"
import { Link } from "react-router-dom";
import {Mail,Phone,MapPin,ExternalLink,Zap,ArrowUp,} from "lucide-react"
import { SiLeetcode, SiCodeforces, SiCodechef } from "react-icons/si"

const Footer = () => {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail("")
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const resources = [
    { name: "Documentation", href: "https://docs.google.com/document/d/1q87wRvwpUAovoWiUZoXSi60-2dPv7cPl/edit?usp=sharing&ouid=102719141055030222264&rtpof=true&sd=true" },
    { name: "API Reference", href: "/api-reference" },
  ]

  const platforms = [
    {
      name: "LeetCode",
      icon: SiLeetcode,
      href: "https://leetcode.com",
      color: "text-orange-500",
    },
    {
      name: "Codeforces",
      icon: SiCodeforces,
      href: "https://codeforces.com",
      color: "text-blue-500",
    },
    {
      name: "CodeChef",
      icon: SiCodechef,
      href: "https://codechef.com",
      color: "text-purple-500",
    },
  ]



  return (
    <footer className="bg-white text-gray-900 relative border-t border-gray-200">
      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="absolute -top-6 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">UCPLP</h3>
                <p className="text-sm text-gray-500">Unified Coding Platform</p>
              </div>
            </div>
            <p className="text-lg font-semibold mb-6 text-gray-900">
              Contact Details
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>ucplp@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-indigo-600" />
                <span>+91 9361987642 </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Chennai, India</span>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-gray-900">Resources</h4>
            <ul className="space-y-3">
              {resources.map((resource) => (
                <li key={resource.name}>
                  <Link
                    to={resource.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm flex items-center gap-2 group"
                  >
                    <span>{resource.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>


            {/* Supported Platforms */}
            <div className="mt-8">
              <h5 className="text-sm font-medium text-gray-700 mb-4">Supported Platforms</h5>
              <div className="flex gap-4">
                {platforms.map((platform) => {
                  const IconComponent = platform.icon
                  return (
                    <a
                      key={platform.name}
                      href={platform.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${platform.color} hover:scale-110 transition-transform duration-200`}
                      title={platform.name}
                    >
                      <IconComponent className="w-6 h-6" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-gray-900">Stay Updated</h4>
            <p className="text-gray-600 text-sm mb-4">
              Get the latest updates on new features and platform integrations.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={subscribed}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                {subscribed ? "Subscribed!" : "Subscribe"}
              </button>
            </form>

            {/* Social Links */}
            
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>© All right Reserved 2025 UCPLP </span>
            </div>

          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
