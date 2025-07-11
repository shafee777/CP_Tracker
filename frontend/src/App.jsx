import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import "./App.css";
import AppRoute from "./Route/AppRoute";
import { ToastContainer } from 'react-toastify';
import Footer from "./components/Footer";


const App = () => {
  return (
    <div className="App">
      <Header /> 
      <AppRoute />
      <ToastContainer />
      <div className="mt-60">
        <Footer />
      </div>
    </div>
  );
};

export default App;
