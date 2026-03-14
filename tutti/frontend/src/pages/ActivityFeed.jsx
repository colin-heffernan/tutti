import { useState, useEffect } from "react";
import THEME from "../theme";

function ActivityFeed({ onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  // Fetch the users from the REST API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/users");
        if(!response.ok) {
          throw new Error(`HTTP response not OK. Status: ${response.status}`);
        }
        const result = await response.json();
        setUsers(result);
        setError(null);
      } catch(err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

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
          {!users && (<>
            <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 32, fontWeight: 700, color: THEME.textPrimary, marginBottom: 12 }}>
              Your Feed
            </h1>
            <p style={{ fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSecondary, lineHeight: 1.6 }}>
              Listening activity and friends' updates will appear here.
            </p>
          </>)}
          {users && (<>
            {users.map((user) => (<>
              <h1>Username: {user.username}</h1>
              <p>Password: {user.password}</p>
            </>))}
          </>)}
        </>)}
      </>)}
    </div>
  );
}

export default ActivityFeed;
