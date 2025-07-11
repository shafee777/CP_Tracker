//backend/models/login.js
const mongoose = require('mongoose');


const loginSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    resetToken: String,
    resetTokenExpiry: Date,
    fullName: String,
    college: String,
    degree: String,
    department: String,
    graduationYear: String,
    leetcodeUsername: String,
    codeforcesUsername: String,
    codechefUsername: String,
    platformDetails: {
        leetcode: Object,
        codeforces: Object,
        codechef: Object
    },
    createdAt: { type: Date, default: Date.now }
})

const newUserData = mongoose.models.auth_data || mongoose.model('auth_data', loginSchema);
module.exports = newUserData;
