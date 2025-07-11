//frontend/src/Route/AppRoute.jsx

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import About from '../components/About';
import ContestsPage from '../components/Contest/ContestPath';
import RatingPredictor from '../components/RatingPredictor';
import LoginRoute from './Login/LoginRoute';
import Profile from '../components/ProfileDetails/Profile'; 
import { Navigate } from 'react-router-dom';
import ProtectedRoute from './Login/ProtectedRoute'; 
import Recom from '../components/Recom_model';
import APIReference from '../components/FooterComponents/APIReference';

function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/about" replace />} />
      <Route path="/about" element={<About />} />
      <Route path="/contests" element={<ContestsPage />} />
      <Route path="/predict" element={<RatingPredictor />} />
      <Route path="/auth/*" element={<LoginRoute />} />
      <Route path="/recom" element={<Recom />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/api-reference" element={<APIReference />} />
    </Routes>
  );
}

export default AppRoute;
