import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import HelpDesk from "./pages/HelpDesk";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import CustomerDashboard from "./pages/CustomerDashboard";
import Home from "./pages/Home";

import Header from "./components/Header"; // ✅ header component
import languageText from "./data/languageText";

import "./App.css";

/* ✅ Layout wrapper */
function Layout({ children, language, setLanguage }) {
  const location = useLocation();

  // ❌ Hide header ONLY on home page
  const hideHeader = location.pathname === "/";

  return (
    <>
      {!hideHeader && <Header />}

      {children}

      {/* ✅ Footer ALWAYS visible */}
      <footer className="footer">
        <p>{languageText[language].footer}</p>
      </footer>
    </>
  );
}

function App() {
  const [language, setLanguage] = useState("en");

  return (
    <Layout language={language} setLanguage={setLanguage}>
      <Routes>
        <Route
          path="/"
          element={<Home language={language} setLanguage={setLanguage} />}
        />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/helpdesk" element={<HelpDesk />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/customer-dashboard"
          element={<CustomerDashboard />}
        />
      </Routes>
    </Layout>
  );
}

export default App;