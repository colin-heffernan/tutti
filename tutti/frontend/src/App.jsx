import { useState, useEffect } from "react";
import THEME from "./theme";
import api from "./services/api";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ActivityFeed from "./pages/ActivityFeed";

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
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState("");

  // Check for existing session
  useEffect(() => {
    const token = localStorage.getItem("tutti_access_token");
    if (token) setIsLoggedIn(true);
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const storedState = sessionStorage.getItem("google_oauth_state");

    if (code && state) {
      window.history.replaceState({}, "", window.location.pathname);
      sessionStorage.removeItem("google_oauth_state");

      if (state !== storedState) {
        setOauthError("Security check failed. Please try again.");
        return;
      }

      setOauthLoading(true);
      api.googleAuth(code)
        .then((data) => {
          setIsLoggedIn(true);
          setCurrentPage(data.is_new_user ? "signup" : "home");
        })
        .catch((err) => {
          setOauthError(err.message || "Google sign-in failed. Please try again.");
          setCurrentPage("login");
        })
        .finally(() => setOauthLoading(false));
    }
  }, []);

  const handleLogin = () => setIsLoggedIn(true);

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg }}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} isLoggedIn={isLoggedIn} />

      <main style={{ padding: "0 16px", paddingBottom: 60 }}>
        {oauthLoading && (
          <div style={{ maxWidth: 440, margin: "100px auto", textAlign: "center" }}>
            <p style={{ fontSize: 18, color: THEME.textPrimary, fontFamily: THEME.fontDisplay }}>
              Signing you in with Google...
            </p>
          </div>
        )}

        {oauthError && !oauthLoading && (
          <div style={{
            maxWidth: 440, margin: "20px auto", padding: "12px 16px",
            borderRadius: THEME.radius.md, background: `${THEME.error}15`,
            border: `1px solid ${THEME.error}40`, color: THEME.error,
            fontSize: 13, fontFamily: THEME.fontBody,
          }}>
            {oauthError}
          </div>
        )}

        {!oauthLoading && (
          <>
            {currentPage === "login" && <LoginPage onNavigate={setCurrentPage} onLogin={handleLogin} />}
            {currentPage === "signup" && <SignUpPage onNavigate={setCurrentPage} onLogin={handleLogin} />}
            {currentPage === "home" && <ActivityFeed onNavigate={setCurrentPage} />}
            {currentPage === "discover" && <PlaceholderPage title="Discover Music" description="Music recommendations based on your profile." />}
            {currentPage === "network" && <PlaceholderPage title="Your Network" description="Find users with similar tastes and nearby listeners." />}
            {currentPage === "profile" && <PlaceholderPage title="Your Profile" description="Listening stats, visualizations, and account settings." />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
