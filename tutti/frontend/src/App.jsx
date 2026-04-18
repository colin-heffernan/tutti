import { useState, useEffect } from "react";
import THEME from "./theme";
import api from "./services/api";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ActivityFeed from "./pages/ActivityFeed";
import Profile from "./pages/Profile";
import DiscoverPage from "./pages/DiscoverPage";
import NetworkPage from "./pages/NetworkPage";

//state of login for page access
function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [userId, setUserId] = useState(-1);
  const [loading, setLoading] = useState(true);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      api.checkSession()
        .then((response) => {
          setUserId(response.user_id);
          setCurrentPage("home");
        })
        .catch((err) => setUserId(-1));
      setLoading(false);
    };
    checkSession();
  }, []);

  const handleLogin = (newUserId) => setUserId(newUserId);

  const handleLogout = () => setUserId(-1);

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg }}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} userId={userId} />

      <main style={{ /*padding: "0 16px",*/ paddingBottom: 60 }}>
        {loading && <>
          <h1>Loading...</h1>
        </>}
        {!loading && <>
          {currentPage === "login" && <LoginPage onNavigate={setCurrentPage} onLogin={handleLogin} userId={userId} />}
          {currentPage === "signup" && <SignUpPage onNavigate={setCurrentPage} onLogin={handleLogin} userId={userId} />}
          {currentPage === "home" && <ActivityFeed onNavigate={setCurrentPage} userId={userId} />}
          {currentPage === "discover" && <DiscoverPage onNavigate={setCurrentPage} userId={userId} />}
          {currentPage === "network" && <NetworkPage onNavigate={setCurrentPage} userId={userId} />}
          {currentPage === "profile" && <Profile onNavigate={setCurrentPage} onLogout={handleLogout} userId={userId} />}
        </>}
      </main>
    </div>
  );
}

export default App;
