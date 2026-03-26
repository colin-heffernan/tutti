import { useState, useEffect } from "react";
import THEME from "./theme";
import api from "./services/api";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ActivityFeed from "./pages/ActivityFeed";
import Profile from "./pages/Profile";

// Placeholder for pages you'll build later
function PlaceholderPage({ title, description }) {
  return (
    <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 32, fontWeight: 700, color: THEME.textPrimary, marginBottom: 12 }}>
        {title}
      </h1>
      <p style={{ fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSecondary, lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
}

//state of login for page access
function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const isAuthenticated = await api.checkSession();
        setIsLoggedIn(isAuthenticated);
        setCurrentPage("home");
      } catch(err) {
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => setIsLoggedIn(false);

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg }}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} isLoggedIn={isLoggedIn} />

      <main style={{ /*padding: "0 16px",*/ paddingBottom: 60 }}>
        {currentPage === "login" && <LoginPage onNavigate={setCurrentPage} onLogin={handleLogin} isLoggedIn={isLoggedIn} />}
        {currentPage === "signup" && <SignUpPage onNavigate={setCurrentPage} onLogin={handleLogin} isLoggedIn={isLoggedIn} />}
        {currentPage === "home" && <ActivityFeed onNavigate={setCurrentPage} onLogout={handleLogout} isLoggedIn={isLoggedIn} />}
        {currentPage === "discover" && <PlaceholderPage title="Discover Music" description="Music recommendations based on your profile." />}
        {currentPage === "network" && <PlaceholderPage title="Your Network" description="Find users with similar tastes and nearby listeners." />}
        {currentPage === "profile" && <Profile onNavigate={setCurrentPage} onLogout={handleLogout} isLoggedIn={isLoggedIn} />}
      </main>
    </div>
  );
}

export default App;
