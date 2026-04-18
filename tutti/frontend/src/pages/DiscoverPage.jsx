  import { useState, useEffect } from "react";
  import THEME from "../theme";
  import api from "../services/api";
  import Recommendation from "../components/Recommendation";

  function DiscoverPage({ userId, onNavigate }) {
    const [profile, setProfile] = useState([]);
    const [overlaps, setOverlaps] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isLoggedIn = userId != -1;

    if (!isLoggedIn) {
      onNavigate("login");
      return;
    }

    useEffect(() => {
      const fetchProfile = async () => {
        api.getProfile(userId)
          .then((response) => {
            const userProfile = Object.entries(response.profile).sort((a, b) => {
              if(a[1] > b[1]) {
                return -1;
              } else if(a[1] < b[1]) {
                return 1;
              } else {
                return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
              }
            });
            let userOverlaps = response.overlaps;
            for(const [k, v] of Object.entries(userOverlaps)) {
              userOverlaps[k] = Object.entries(v);
            }
            const userOverlapsList = Object.entries(userOverlaps);
            setProfile(userProfile);
            setOverlaps(userOverlapsList);
          })
          .catch((err) => setError(err.message));
        setLoading(false);
      };
      fetchProfile();
    }, []);

    useEffect(() => {
      const fetchProfile = async () => {
        api.getRecommendations(userId)
          .then(setRecommendations)
          .catch((err) => setError(err.message));
      };
      fetchProfile();
    }, []);

    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <h1 style={{ fontFamily: THEME.fontDisplay, color: THEME.textPrimary }}>Loading...</h1>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 32, fontWeight: 700, color: THEME.textPrimary, marginBottom: 8 }}>
          Discover
        </h1>
        <p style={{ fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSecondary, marginBottom: 40, lineHeight: 1.6 }}>
          Music picked for you based on your listening history.
        </p>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: THEME.radius.md, marginBottom: 32,
            background: `${THEME.error}15`, border: `1px solid ${THEME.error}40`,
            color: THEME.error, fontSize: 13, fontFamily: THEME.fontBody }}>
            {error}
          </div>
        )}

        {profile.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 20, fontWeight: 700, color: THEME.textPrimary, marginBottom: 16 }}>
              Your Taste
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {profile.slice(0, 12).map(([tag, score]) => (
                <div key={tag} style={{
                  padding: "8px 16px", borderRadius: THEME.radius.pill,
                  background: THEME.accentMuted, border: `1px solid ${THEME.accent}40`,
                  fontFamily: THEME.fontBody, fontSize: 13, fontWeight: 600,
                  color: THEME.accent,
                }}>
                  {tag}
                  <span style={{ marginLeft: 8, fontSize: 11, color: THEME.textSecondary, fontWeight: 400 }}>
                    {score.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 20, fontWeight: 700, color: THEME.textPrimary, marginBottom: 16 }}>
            Recommended for You
          </h2>
          <div style={{
            padding: "48px 40px", borderRadius: THEME.radius.md, background: THEME.bgCard,
            textAlign: "center", border: `1px dashed ${THEME.border}`,
          }}>
            {!recommendations && (<p style={{ fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSecondary, lineHeight: 1.6 }}>
              Song recommendations based on your taste (need to be implemented).
            </p>)}
            {recommendations && (<ul style={{"listStyleType": "none"}}>
              {recommendations.map((recommendation) => (<li key={recommendation.id}>
                <Recommendation base_song={recommendation.base_song} recommended_song={recommendation.recommended_song} />
              </li>))}
            </ul>)}
          </div>
        </div>
      </div>
    );
  }

  export default DiscoverPage;
