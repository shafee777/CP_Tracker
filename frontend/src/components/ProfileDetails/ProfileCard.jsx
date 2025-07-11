// frontend/src/components/ProfileDetails/ProfileCard.jsx
import React from 'react';
import { useState } from "react"
import { MapPin, GraduationCap, User, ExternalLink, Edit3, Save, X, Camera } from "lucide-react"
import { SiLeetcode, SiCodeforces, SiCodechef } from "react-icons/si"

export default function ProfileCard({ user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState({
    name: user.name || "",
    username: user.username || "",
    location: user.location || "",
    college: user.college || "",
    avatar: user.avatar || "",
    leetcodeUsername: user.leetcodeUsername || "",
    codeforcesUsername: user.codeforcesUsername || "",
    codechefUsername: user.codechefUsername || "",
  })

  const platforms = [
    {
      name: "LeetCode",
      icon: SiLeetcode,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      field: "leetcodeUsername",
      url: `https://leetcode.com/u/${editData.leetcodeUsername || ""}`,
    },
    {
      name: "Codeforces",
      icon: SiCodeforces,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      field: "codeforcesUsername",
      url: `https://codeforces.com/profile/${editData.codeforcesUsername || ""}`,
    },
    {
      name: "CodeChef",
      icon: SiCodechef,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      field: "codechefUsername",
      url: `https://www.codechef.com/users/${editData.codechefUsername || ""}`,
    },
  ]

  const handleEdit = () => {
    setIsEditing(true)
    setEditData({
      name: user.name || "",
      username: user.username || "",
      location: user.location || "",
      college: user.college || "",
      avatar: user.avatar || "",
      leetcodeUsername: user.leetcodeUsername || "",
      codeforcesUsername: user.codeforcesUsername || "",
      codechefUsername: user.codechefUsername || "",
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({
      name: user.name || "",
      username: user.username || "",
      location: user.location || "",
      college: user.college || "",
      avatar: user.avatar || "",
      leetcodeUsername: user.leetcodeUsername || "",
      codeforcesUsername: user.codeforcesUsername || "",
      codechefUsername: user.codechefUsername || "",
    })
  }

const handleSave = async () => {
  setLoading(true);
  console.log("Updating user with:", editData);

  try {

    // Proceed with saving the profile
    const response = await fetch(`http://localhost:3000/api/users/${user._id || user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editData),
    });

    const updatedUser = await response.json();

    if (!response.ok) {
      console.error("Server response:", updatedUser);
      throw new Error(updatedUser?.error || `Failed to update profile (${response.status})`);
    }


    // Fetch new platform details
    const combinedRes = await fetch("http://localhost:3000/all/combined", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user._id || user.id,
        leetcodeUsername: editData.leetcodeUsername,
        codeforcesUsername: editData.codeforcesUsername,
        codechefUsername: editData.codechefUsername,
      }),
    });

    if (!combinedRes.ok) throw new Error("Failed to fetch new platform data");

    const combinedData = await combinedRes.json();

    // Pass updated data to parent
    if (onUpdate) {
      onUpdate({
        ...updatedUser,
        leetcodeUsername: editData.leetcodeUsername,
        codeforcesUsername: editData.codeforcesUsername,
        codechefUsername: editData.codechefUsername,
        platformDetails: {
          leetcode: combinedData.leetcode,
          codeforces: combinedData.codeforces,
          codechef: combinedData.codechef,
        },
      });
    }

    setIsEditing(false);
    window.location.reload();

  } catch (error) {
    console.error("Error updating profile:", error);
    alert(error.message || "Failed to update profile. Please try again.");
  } finally {
    setLoading(false);
  }
};






  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("avatar", file)
    formData.append("userId", user._id || user.id)

    try {
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload avatar")
      }

      const { avatarUrl } = await response.json()
      handleInputChange("avatar", avatarUrl)
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Failed to upload avatar. Please try again.")
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full h-full hover:shadow-xl transition-shadow duration-300 relative">
      {/* Edit Button */}
      {!isEditing && (
        <button
          onClick={handleEdit}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      )}

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleCancel}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-4">
          <img
            src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${user.username}`}
            onError={(e) => (e.target.src = "/default-avatar.png")}
            alt="User Avatar"
            className="w-24 h-24 rounded-full border-4 border-gray-100 shadow-md object-cover mb-4"
          />
        

          {isEditing && (
            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* User Info */}
        <div className="mb-4 w-full">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Full Name"
                className="w-full text-xl font-bold text-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={editData.username}
                readOnly
                className="w-full text-center bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 cursor-not-allowed"
              />

            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{editData.name}</h2>
              <p className="text-gray-600 font-medium">@{editData.username}</p>
            </>
          )}
        </div>

        {/* Location & College */}
        <div className="space-y-2 mb-6 w-full">
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Location"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={editData.college}
                  onChange={(e) => handleInputChange("college", e.target.value)}
                  placeholder="College/University"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            <>
              {editData.location && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{editData.location}</span>
                </div>
              )}
              {editData.college && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-sm">{editData.college}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-6"></div>

        {/* Connected Platforms */}
        <div className="w-full">
          <div className="flex items-center justify-center gap-2 mb-4">
            <User className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Connected Platforms</h3>
          </div>

          <div className="space-y-3">
            {platforms.map((platform) => {
              const IconComponent = platform.icon
              const username = editData[platform.field]

              return (
                <div
                  key={platform.name}
                  className={`flex items-center justify-between p-3 ${platform.bgColor} rounded-xl border border-gray-100 hover:shadow-sm transition-all duration-200`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 bg-white rounded-lg shadow-sm ${platform.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900 text-sm">{platform.name}</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => handleInputChange(platform.field, e.target.value)}
                          placeholder={`${platform.name} username`}
                          className="w-full mt-1 text-xs bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        username && <p className="text-xs text-gray-500">@{username}</p>
                      )}
                    </div>
                  </div>

                  {!isEditing && username && (
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-white rounded-lg transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 w-full">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-blue-600">{user.totalSolved || 0}</p>
              <p className="text-xs text-gray-500">Problems</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{user.contests || 0}</p>
              <p className="text-xs text-gray-500">Contests</p>
            </div>
            <div>
              <p className="text-lg font-bold text-purple-600">{user.rating || 0}</p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
