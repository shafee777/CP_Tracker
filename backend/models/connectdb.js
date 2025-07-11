// backend/models/connectdb.js

const mongoose = require('mongoose');
const connectToDB = async()=>{
    try {
        const connect = await mongoose.connect("mongodb://localhost:27017/leetcode_db");
        console.log('Database Connected',connect.connection.host,connect.connection.name);
    } catch (error) {
        console.error('Error connecting to MongoDB with Mongoose:', error);
    }
}
module.exports = connectToDB