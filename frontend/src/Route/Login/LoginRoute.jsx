//frontend/src/Route/Login/LoginRoute.jsx
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Register from './Regpage';
import Login from './Login';
import ForgotPassword from './forgetpass'; 
import UserDetails from './UserDetails';


function LoginRoute() {
    return (
        <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/UserDetails" element={<UserDetails />} />
        </Routes>
    )
}

export default LoginRoute;