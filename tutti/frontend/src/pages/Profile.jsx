  import { useState, useEffect } from "react";
  import THEME from "../theme";
  import api from "../services/api";
  import PrimaryButton from "../components/PrimaryButton";
  import { InstagramOAuthButton } from "../components/InstagramOAuth";
  import { SpotifyOAuthButton } from "../components/SpotifyOAuth";
  import useGeolocation from "../hooks/useGeolocation";
  import { MapPinIcon, CheckIcon } from "../components/Icons";

  function SectionCard({ title, children }) {
    return (
      <div style={{
        marginBottom: 24, padding: "24px 28px",
        borderRadius: THEME.radius.md, background: THEME.bgCard,
        border: `1px solid ${THEME.border}`,
      }}>
        {title && (
          <h2 style={{
            fontFamily: THEME.fontDisplay, fontSize: 18, fontWeight: 700,
            color: THEME.textPrimary, marginBottom: 20, marginTop: 0,
          }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    );
  }

  function Profile({ onNavigate, onLogout, userId }) {
    const [error, setError] = useState(null);
    const [locationSaved, setLocationSaved] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [about, setAbout] = useState(null);
    const geo = useGeolocation(userId);
    const isLoggedIn = userId != -1;

    useEffect(() => {
      if (!isLoggedIn) {
        onNavigate("login");
        return;
      }
      const fetchAbout = async () => {
        try {
          const data = await api.getAbout(userId);
          setAbout(data);
        } catch (err) {
          setError(err.message);
        }
      };
      fetchAbout();
    }, [isLoggedIn]);

    if (!isLoggedIn) return null;

    const handleLogout = async () => {
      try {
        await api.logout();
        onLogout();
        onNavigate("login");
      } catch (err) {
        setError(err.message);
      }
    };

    const handleSaveLocation = async () => {
      if (!geo.location) return;
      setLocationLoading(true);
      try {
        await api.updateLocation(userId, geo.location.city, geo.location.country);
        setLocationSaved(true);
      } catch (err) {
        setError("Could not save location — not yet available on the server.");
      } finally {
        setLocationLoading(false);
      }
    };

    const handleDeleteAccount = () => {
      // TODO: call DELETE /api/auth/me/ when endpoint exists
      alert("Account deletion is not yet available.");
      setDeleteConfirm(false);
    };

    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px" }}>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 28, fontWeight: 700, color: THEME.textPrimary, margin: "0 0 6px" }}>
            {about?.display_name || about?.username || "Your Profile"}
          </h1>
          {about?.email && (
            <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, margin: "0 0 4px" }}>
              {about.email}
            </p>
          )}
          {about?.date_joined && (
            <p style={{ fontFamily: THEME.fontBody, fontSize: 12, color: THEME.textPlaceholder, margin: 0 }}>
              Member since {new Date(about.date_joined).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: THEME.radius.md, marginBottom: 20,
            background: `${THEME.error}15`, border: `1px solid ${THEME.error}40`,
            color: THEME.error, fontSize: 13, fontFamily: THEME.fontBody,
          }}>
            {error}
          </div>
        )}

        <SectionCard title="Connections">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <InstagramOAuthButton />
            <SpotifyOAuthButton />
          </div>
        </SectionCard>

        <SectionCard title="Location">
          <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, marginBottom: 16, lineHeight: 1.6 }}>
            Update your location to find nearby listeners.
          </p>
          <div style={{
            padding: 20, borderRadius: THEME.radius.md, background: THEME.bgElevated,
            border: `1px solid ${THEME.border}`, textAlign: "center", marginBottom: 16,
          }}>
            {locationSaved ? (
              <>
                <div style={{ color: THEME.success, marginBottom: 8 }}><CheckIcon /></div>
                <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.success, margin: 0 }}>Location saved!</p>
              </>
            ) : geo.location ? (
              <>
                <div style={{ color: THEME.success, marginBottom: 8 }}><MapPinIcon /></div>
                <p style={{ fontFamily: THEME.fontBody, fontSize: 15, fontWeight: 600, color: THEME.textPrimary, marginBottom: 4 }}>
                  {geo.location.city}, {geo.location.country}
                </p>
                <p style={{ fontSize: 12, color: THEME.textSecondary, fontFamily: THEME.fontBody, margin: 0 }}>Location detected</p>
              </>
            ) : (
              <>
                <div style={{ color: THEME.textSecondary, marginBottom: 12 }}><MapPinIcon /></div>
                <PrimaryButton onClick={geo.requestLocation} loading={geo.loading} variant="secondary" style={{ width: "auto", display: "inline-block" }}>
                  Detect Location
                </PrimaryButton>
                {geo.error && <p style={{ marginTop: 10, fontSize: 12, color: THEME.warning, fontFamily: THEME.fontBody }}>{geo.error}</p>}
              </>
            )}
          </div>
          {geo.location && !locationSaved && (
            <PrimaryButton onClick={handleSaveLocation} loading={locationLoading}>
              Save Location
            </PrimaryButton>
          )}
        </SectionCard>

        <SectionCard title="Account">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <PrimaryButton onClick={handleLogout} variant="secondary">
              Log Out
            </PrimaryButton>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{
                  width: "100%", padding: "14px 24px", borderRadius: THEME.radius.lg,
                  border: `2px solid ${THEME.error}40`, background: "transparent",
                  color: THEME.error, fontSize: 15, fontWeight: 600,
                  fontFamily: THEME.fontBody, cursor: "pointer", transition: THEME.transition,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${THEME.error}10`; e.currentTarget.style.borderColor = THEME.error; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = `${THEME.error}40`; }}
              >
                Delete Account
              </button>
            ) : (
              <div style={{
                padding: 20, borderRadius: THEME.radius.md,
                background: `${THEME.error}10`, border: `1px solid ${THEME.error}40`,
              }}>
                <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textPrimary, marginBottom: 16, lineHeight: 1.6, margin: "0 0 16px" }}>
                  Are you sure? This permanently deletes your account and all your scrobbles.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    style={{
                      flex: 1, padding: 12, borderRadius: THEME.radius.md,
                      border: `2px solid ${THEME.border}`, background: "transparent",
                      color: THEME.textPrimary, fontFamily: THEME.fontBody, fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    style={{
                      flex: 1, padding: 12, borderRadius: THEME.radius.md,
                      border: "none", background: THEME.error,
                      color: "#fff", fontFamily: THEME.fontBody, fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

      </div>
    );
  }

  export default Profile;
