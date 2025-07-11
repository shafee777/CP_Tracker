// frontend/src/components/About.jsx
import React from 'react'
import {SiReact, SiNodedotjs, SiMongodb, SiPython, SiTensorflow, SiNumpy} from "react-icons/si"
import {FaSyncAlt, FaChartBar, FaRobot, FaClock, FaBullseye, FaBrain, FaChartLine} from "react-icons/fa"
import { Target, Zap, TrendingUp } from "lucide-react"
import { useNavigate } from 'react-router-dom'




const features = [
  {
    icon: <FaSyncAlt className="w-6 h-6" />,
    title: "Real-time Contest Aggregation",
    description: "Never miss a contest across all major platforms",
  },
  {
    icon: <FaChartBar className="w-6 h-6" />,
    title: "Profile Insights Across Platforms",
    description: "Unified analytics and performance tracking",
  },
  {
    icon: <FaRobot className="w-6 h-6" />,
    title: "AI-Powered Learning Paths",
    description: "Personalized recommendations based on your progress",
  },
  {
    icon: <FaChartLine className="w-6 h-6" />,
    title: "Rating Prediction",
    description: "Predict your rating changes from past attended contests",
  },
]

const benefits = [
  {
    icon: <FaClock className="w-8 h-8" />,
    title: "Save Time",
    description: "No more switching between multiple tabs and platforms",
  },
  {
    icon: <FaBullseye className="w-8 h-8" />,
    title: "Data-Driven Focus",
    description: "Identify and target your weak areas with precision",
  },
  {
    icon: <FaBrain className="w-8 h-8" />,
    title: "Smarter Preparation",
    description: "AI-guided learning paths for efficient skill development",
  },
]

const techStack = [
  { icon: SiReact, name: "React", color: "text-blue-500" },
  { icon: SiNodedotjs, name: "Node.js", color: "text-green-600" },
  { icon: SiMongodb, name: "MongoDB", color: "text-green-500" },
  { icon: SiPython, name: "Python", color: "text-yellow-500" },
  { icon: SiTensorflow, name: "TensorFlow", color: "text-orange-500" },
  { icon: SiNumpy, name: "NumPy", color: "text-blue-600" },
]

const About = () => {
  const navigate = useNavigate()
  const handleGetStarted = () => {
    navigate('/profile')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              About UCPLP
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            An <span className="font-semibold text-blue-600">Competitive programming platform</span> that
            unifies data from <span className="font-semibold text-orange-500">LeetCode</span>,{" "}
            <span className="font-semibold text-blue-500">Codeforces</span>, and{" "}
            <span className="font-semibold text-purple-500">CodeChef</span> into a single intelligent dashboard.
          </p>
        </div>

        {/* Features & Benefits Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Features */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Key Features</h2>
            </div>
            <div className="space-y-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm text-blue-600">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Why It Matters</h2>
            </div>
            <div className="space-y-6">
              {benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm text-blue-600 mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tech Stack</h2>
            <p className="text-gray-600">Built with modern technologies for optimal performance</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {techStack.map((tech, idx) => {
              const IconComponent = tech.icon
              return (
                <div key={idx} className="group text-center">
                  <div className="p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-100">
                    <IconComponent
                      className={`text-4xl ${tech.color} mx-auto mb-3 group-hover:scale-110 transition-transform`}
                    />
                    <p className="text-sm font-medium text-gray-700">{tech.name}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Level Up Your Coding Journey?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of developers who are already using UCPLP to track their progress, discover new challenges,
              and improve their competitive programming skills.
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Get Started Today
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default About
