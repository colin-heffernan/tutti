import { useState, useEffect } from "react";
import THEME from "../theme";
import api from "../services/api";
import Scrobble from "../components/Scrobble";
import Recommendation from "../components/Recommendation";
import GenreForceMap from "../components/GenreForceMap";

const EMPTY_FORM = { artist: "", album: "", title: "", date: "", track: "1", num_tracks: "1" };

function ScrobbleForm({ userId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    api.createScrobble(userId, {
      artist: form.artist,
      album: form.album.trim() || form.title,
      title: form.title,
      date: form.date,
      track: parseInt(form.track) || 1,
      num_tracks: parseInt(form.num_tracks) || 1,
    })
      .then((scrobble) => {
        onAdded(scrobble);
        setForm(EMPTY_FORM);
        setOpen(false);
      })
      .catch((err) => setError(err.message));
    setSubmitting(false);
  };

  const fieldStyle = {
    width: "100%", padding: "10px 12px", borderRadius: THEME.radius.md,
    border: `1.5px solid ${THEME.border}`, background: THEME.bgElevated,
    color: THEME.textPrimary, fontSize: 14, fontFamily: THEME.fontBody,
    outline: "none", boxSizing: "border-box", transition: THEME.transition,
  };

  return (
    <div style={{ marginTop: 24 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "10px 20px", borderRadius: THEME.radius.pill,
          border: `2px solid ${open ? THEME.accent : THEME.border}`,
          background: open ? THEME.accentMuted : "transparent",
          color: open ? THEME.accent : THEME.textSecondary,
          fontFamily: THEME.fontBody, fontSize: 14, fontWeight: 600,
          cursor: "pointer", transition: THEME.transition,
        }}
      >
        {open ? "Cancel" : "+ Log a listen"}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 16, padding: "24px 28px",
            background: THEME.bgCard, borderRadius: THEME.radius.lg,
            border: `1px solid ${THEME.border}`,
          }}
        >
          <h3 style={{ margin: "0 0 20px", fontFamily: THEME.fontDisplay, fontSize: 18, fontWeight: 700, color: THEME.textPrimary }}>
            Log a listen
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", marginBottom: 12 }}>
            {[
              { field: "artist", label: "Artist", placeholder: "e.g. Radiohead" },
              { field: "title",  label: "Song title", placeholder: "e.g. No Surprises" },
              { field: "album",  label: "Album (leave blank for singles)", placeholder: "e.g. OK Computer", required: false },
              { field: "date",   label: "Release date", placeholder: "YYYY-MM-DD", type: "date" },
            ].map(({ field, label, placeholder, type = "text", required = true }) => (
              <div key={field}>
                <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 600, fontFamily: THEME.fontBody, color: THEME.textSecondary }}>
                  {label}
                </label>
                <input
                  type={type}
                  required={required}
                  value={form[field]}
                  onChange={(e) => set(field)(e.target.value)}
                  placeholder={placeholder}
                  style={fieldStyle}
                  onFocus={(e) => { e.target.style.borderColor = THEME.borderFocus; }}
                  onBlur={(e) => { e.target.style.borderColor = THEME.border; }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", marginBottom: 20 }}>
            {[
              { field: "track",     label: "Track #", placeholder: "1" },
              { field: "num_tracks", label: "Total tracks", placeholder: "12" },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <label style={{ display: "block", marginBottom: 5, fontSize: 12, fontWeight: 600, fontFamily: THEME.fontBody, color: THEME.textSecondary }}>
                  {label}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form[field]}
                  onChange={(e) => set(field)(e.target.value)}
                  placeholder={placeholder}
                  style={fieldStyle}
                  onFocus={(e) => { e.target.style.borderColor = THEME.borderFocus; }}
                  onBlur={(e) => { e.target.style.borderColor = THEME.border; }}
                />
              </div>
            ))}
          </div>

          {error && (
            <p style={{ margin: "0 0 14px", fontFamily: THEME.fontBody, fontSize: 13, color: THEME.error }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 24px", borderRadius: THEME.radius.pill,
              border: "none", background: THEME.accent,
              color: "#fff", fontFamily: THEME.fontBody, fontSize: 14, fontWeight: 700,
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1, transition: THEME.transition,
            }}
          >
            {submitting ? "Logging…" : "Log listen"}
          </button>
        </form>
      )}
    </div>
  );
}

function ActivityFeed({ onNavigate, userId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrobbles, setScrobbles] = useState([]);
  const [profile, setProfile] = useState([]);
  const [overlaps, setOverlaps] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const isLoggedIn = userId != -1;

  // Fetch user scrobbles, genre profile, and recommendations in parallel
  const fetchScrobbles = async () => {
    try {
      const [userScrobbles, profileData, recs] = await Promise.all([
        api.getScrobbles(userId),
        api.getProfile(userId),
        api.getRecommendations(userId).catch(() => []),
      ]);
      setScrobbles(userScrobbles);
      // Sort genres descending by score so slice(0, 25) gives top 25
      const sortedProfile = Object.entries(profileData.profile).sort((a, b) => b[1] - a[1]);
      setProfile(sortedProfile);
      setOverlaps(profileData.overlaps);
      setRecommendations(Array.isArray(recs) ? recs : []);
      setError(null);
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    api.getProfile(userId)
      .then((profileData) => {
        const sortedProfile = Object.entries(profileData.profile).sort((a, b) => b[1] - a[1]);
        setProfile(sortedProfile);
        setOverlaps(profileData.overlaps);
      })
      .catch(() => {});
  };

  // Fetch the scrobbles from the REST API
  useEffect(() => {
    if(isLoggedIn) {
      fetchScrobbles();
    }
  }, []);

  const handleLogout = async () => {
    api.logout()
      .then(() => {
        onLogout();
        onNavigate("login");
      })
      .catch((err) => setError(err.message + "\nLogout failed."));
    setLoading(false);
  };


  const handleScrobbleAdded = (scrobble) => {
    setScrobbles((prev) => [...prev, scrobble]);
    refreshProfile();
  };

  //styling
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
      {!isLoggedIn && (<>
        <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 32, fontWeight: 700, color: THEME.textPrimary, marginBottom: 12 }}>
          Your Feed
        </h1>
        <p style={{ fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSecondary, lineHeight: 1.6 }}>
          Make an account to track your listens!
        </p>
      </>)}
      {isLoggedIn && (<>
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
            {profile.length > 0 && (
              <GenreForceMap profile={profile} overlaps={overlaps} />
            )}
            {(!scrobbles || scrobbles.length == 0) && (<>
              <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 32, fontWeight: 700, color: THEME.textPrimary, marginBottom: 12 }}>
                Your Feed
              </h1>
              <p style={{ fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSecondary, lineHeight: 1.6 }}>
                Listening activity and friends' updates will appear here.
              </p>
            </>)}
            {scrobbles && (<ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
              {scrobbles.map((scrobble) => (<li key={scrobble.id}>
                <Scrobble song_id={scrobble.song_id} scrobble_id={scrobble.id} initialRating={scrobble.rating} onRatingChange={refreshProfile} />
              </li>))}
            </ul>)}

            {recommendations.length > 0 && (
              <div style={{ marginTop: 40 }}>
                <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 22, fontWeight: 700, color: THEME.textPrimary, marginBottom: 16 }}>
                  Recommended for you
                </h2>
                <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                  {recommendations.slice(0, 10).map((rec) => (
                    <li key={rec.id}>
                      <Recommendation base_song={rec.base_song} recommended_song={rec.recommended_song} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ScrobbleForm userId={userId} onAdded={handleScrobbleAdded} />
          </>)}
        </>)}
      </>)}
    </div>
  );
}

export default ActivityFeed;
