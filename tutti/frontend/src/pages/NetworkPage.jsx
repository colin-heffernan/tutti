  import { useState, useEffect } from "react";
  import THEME from "../theme";
  import { InstagramOAuthButton } from "../components/InstagramOAuth";

  // Placeholder users replace with real API calls
  // a user listing endpoint i think should have location + profile similarity scoring.
  const PLACEHOLDER_USERS = [
    { id: 1, username: "Testman1", displayName: "TestMan1", genres: ["shoegaze", "dream pop", "indie rock"], city: "Your City", priority: "nearby-taste" },
    { id: 2, username: "Testman2", displayName: "TestMan2", genres: ["jazz", "soul", "r&b"], city: "Your City", priority: "nearby" },
    { id: 3, username: "Testman3", displayName: "TestMan3", genres: ["electronic", "synthwave", "ambient"], city: null, priority: "taste" },
  ];

  const PRIORITY_LABELS = {
    "nearby-taste": "Nearby · Similar taste",
    "nearby": "Nearby",
    "taste": "Similar taste",
  };

  function UserCard({ user }) {
    const [expanded, setExpanded] = useState(false);

    return (
      <div style={{
        padding: "28px 32px", marginBottom: "24px",
        borderRadius: THEME.radius.md, background: THEME.bgCard,
        border: `1px solid ${THEME.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
            background: THEME.accentMuted, border: `2px solid ${THEME.accent}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: THEME.fontDisplay, fontSize: 22, fontWeight: 700, color: THEME.accent,
          }}>
            {(user.displayName || user.username)[0].toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: THEME.fontDisplay, fontSize: 17, fontWeight: 700, color: THEME.textPrimary }}>
                {user.displayName || user.username}
              </span>
              <span style={{ fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textSecondary }}>
                @{user.username}
              </span>
              {PRIORITY_LABELS[user.priority] && (
                <span style={{
                  padding: "2px 8px", borderRadius: THEME.radius.pill,
                  background: THEME.accentMuted, border: `1px solid ${THEME.accent}30`,
                  fontFamily: THEME.fontBody, fontSize: 11, fontWeight: 600, color: THEME.accent,
                }}>
                  {PRIORITY_LABELS[user.priority]}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {user.genres.map((g) => (
                <span key={g} style={{
                  padding: "3px 10px", borderRadius: THEME.radius.pill,
                  background: THEME.bgElevated, border: `1px solid ${THEME.border}`,
                  fontFamily: THEME.fontBody, fontSize: 12, color: THEME.textSecondary,
                }}>
                  {g}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: "8px 18px", borderRadius: THEME.radius.pill, flexShrink: 0,
              border: `2px solid ${expanded ? THEME.accent : THEME.border}`,
              background: "transparent",
              color: expanded ? THEME.accent : THEME.textSecondary,
              fontFamily: THEME.fontBody, fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: THEME.transition,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.accent; e.currentTarget.style.color = THEME.accent; }}
            onMouseLeave={(e) => {
              if (!expanded) {
                e.currentTarget.style.borderColor = THEME.border;
                e.currentTarget.style.color = THEME.textSecondary;
              }
            }}
          >
            {expanded ? "Close" : "Connect"}
          </button>
        </div>

        {expanded && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${THEME.border}` }}>
            <h3 style={{ fontFamily: THEME.fontDisplay, fontSize: 16, fontWeight: 700, color: THEME.textPrimary, marginBottom: 12 }}>
              Your shared taste with {user.displayName || user.username}
            </h3>
            <div style={{
              padding: "24px", borderRadius: THEME.radius.md,
              background: THEME.bgElevated, border: `1px dashed ${THEME.border}`,
              textAlign: "center", marginBottom: 20,
            }}>
              <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, lineHeight: 1.6 }}>
                Shared taste profile coming soon — your genre overlap will appear here.
              </p>
            </div>
            <InstagramOAuthButton />
          </div>
        )}
      </div>
    );
  }

  function NetworkPage({ userId, onNavigate }) {
    const isLoggedIn = userId != -1;

    useEffect(() => {
      if (!isLoggedIn) {
        onNavigate("login");
      }
    }, [isLoggedIn]);

    if (!isLoggedIn) return null;

    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 32, fontWeight: 700, color: THEME.textPrimary, marginBottom: 8 }}>
          Your Network
        </h1>
        <p style={{ fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSecondary, marginBottom: 40, lineHeight: 1.6 }}>
          Listeners near you and people who share your taste.
        </p>
        {PLACEHOLDER_USERS.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    );
  }

  export default NetworkPage;
