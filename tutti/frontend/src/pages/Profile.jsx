import { useState, useEffect } from "react";
import THEME from "../theme";
import api from "../services/api";

function Profile({ onNavigate, onLogout, isLoggedIn }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState([]);

  if(!isLoggedIn) {
    onNavigate("login");
  }

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const userProfile = await api.getProfile();
      setProfile(userProfile);
      setError(null);
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      onLogout();
      onNavigate("login");
    } catch (err) {
      setError(err.message + "\nLogout failed.");
    }
  };

  //styling
  return (
    <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      {loading && (
        <h1>Loading feed...</h1>
      )}
      {!loading && (<>
        {error && (<>
          <h1>Uh oh!</h1>
          <p>Tutti hit an error.</p>
          <p>{error.message}</p>
        </>)}
        {!error && (<>
          {profile && (<ul style={{"listStyleType": "none"}}>
            {profile.map((entry, index) => (<li key={index}>
              {entry[0]}: {entry[1]}
            </li>))}
          </ul>)}
          {!profile && (<p>no prof</p>)}
          <button onClick={handleLogout}>Log out</button>
        </>)}
      </>)}
    </div>
  );
}

export default Profile;
