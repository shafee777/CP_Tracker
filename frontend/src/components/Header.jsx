// frontend/src/components/Header.jsx
import React from "react";
import axios from "axios";
import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {User,LogOut,Menu,X,Trophy,Target,BarChart3,UserCircle,Code2,Sparkles,ChevronDown,Bell,Search, LucideMapPinCheckInside, ChartNoAxesColumnDecreasingIcon, LucideListTodo,} from "lucide-react"

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [btn, setBtn] = useState("Login")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user,setUser] =useState(null);


  useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setUser(res.data))
        .catch(err => {
          console.error("Failed to fetch user profile", err);
          setUser(null);
        });
      }
    }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    setBtn(isLoggedIn ? "Logout" : "Login")
  }, [location])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleClick = () => {
    if (btn === "Login") {
      navigate("/auth/login")
    } else {
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("token")
      setBtn("Login")
      window.location.href = "/auth/login"
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const navItems = [
    {
      name: "About",
      path: "/about",
      icon: <Target className="w-4 h-4" />,
      description: "Learn about UCPLP",
    },
    {
      name: "Contests",
      path: "/contests",
      icon: <Trophy className="w-4 h-4" />,
      description: "Upcoming competitions",
    },
    {
      name: "Rating Predictions",
      path: "/predict",
      icon: <BarChart3 className="w-4 h-4" />,
      description: "Rating predictions",
    },
    {
      name:"Problem Recommendations",
      path: "/recom",
      icon: <LucideListTodo className="w-4 h-4" />,

    },
    {
      name: "Dashboard",
      path: "/profile",
      icon: <UserCircle className="w-4 h-4" />,
      description: "Your coding profile",
    },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50" : "bg-white shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left Side - Logo */}
            <div className="flex items-center">
              <Link to="/" className="group flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative p-3 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl">
                    <Code2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-gray-900">
                    UCPLP
                  </span>
                  <span className="text-xs text-gray-500 font-medium -mt-1">Unified Coding Platform</span>
                </div>
              </Link>
            </div>

            {/* Right Side - Navigation + Actions */}
            <div className="flex items-center gap-8">
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center">
                <div className="flex items-center gap-1">
                  {navItems.map((item, index) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive(item.path)
                          ? "bg-violet-50 text-violet-700 shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`p-1 rounded-lg transition-colors ${
                          isActive(item.path) ? "bg-violet-100" : "group-hover:bg-gray-100"
                        }`}
                      >
                        {item.icon}
                      </div>
                      {item.name}
                      {isActive(item.path) && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-violet-500 rounded-full"></div>
                      )}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center gap-3">

                {/* Auth Button */}
                {btn === "Login" ? (
                  <button
                    onClick={handleClick}
                    className="group relative flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl font-medium transition-all duration-200 hover:from-violet-600 hover:to-indigo-600 hover:shadow-lg hover:shadow-violet-500/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <User className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Sign In</span>
                    <Sparkles className="w-4 h-4 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200 py-2">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {user?.fullName || user?.username || "Unknown User"}
                          </p>
                          <p className="text-xs text-gray-500">{user?.email || "No email"}</p>

                        </div>
                        <button
                          onClick={handleClick}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden flex items-center gap-2">
                <button
                  onClick={handleClick}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    btn === "Login"
                      ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {btn === "Login" ? <User className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                  {btn}
                </button>
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden transition-all duration-300 overflow-hidden ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white/95 backdrop-blur-md border-t border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-violet-50 text-violet-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl transition-colors ${
                        isActive(item.path) ? "bg-violet-100" : "bg-gray-100 group-hover:bg-gray-200"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200">
                <button className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                <button className="relative p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-20"></div>
    </>
  )
}

// Demo component
export function HeaderDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Perfect Layout Structure</h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">
            Now the header has the perfect layout with the logo positioned on the left side and all navigation, actions,
            and auth buttons organized on the right side for optimal user experience.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl">
              <h3 className="font-semibold text-violet-900 mb-3">Left Side</h3>
              <ul className="text-sm text-violet-700 space-y-2">
                <li>• UCPLP Logo with gradient</li>
                <li>• Tagline "Unified Coding Platform"</li>
                <li>• Hover effects and animations</li>
                <li>• Clean, focused branding</li>
              </ul>
            </div>
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl">
              <h3 className="font-semibold text-emerald-900 mb-3">Right Side</h3>
              <ul className="text-sm text-emerald-700 space-y-2">
                <li>• Navigation menu</li>
                <li>• Search & notifications</li>
                <li>• Login/Profile dropdown</li>
                <li>• Mobile hamburger menu</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
            <h3 className="font-semibold text-gray-900 mb-2">Layout Benefits</h3>
            <p className="text-gray-600 text-sm">
              This layout follows modern web design principles with clear visual hierarchy, logical grouping of
              elements, and optimal use of space for both desktop and mobile experiences.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
