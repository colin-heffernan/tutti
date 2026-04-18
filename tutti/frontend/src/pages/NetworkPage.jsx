import { useState, useEffect, useRef } from "react";
import THEME from "../theme";
import api from "../services/api";
import GenreForceMap from "../components/GenreForceMap";
import { InstagramOAuthButton } from "../components/InstagramOAuth";
import { UserPlusIcon, UserCheckIcon, ClockIcon } from "../components/Icons";

// TODO: Placeholder discovery users replace with API data when backend endpoint exists
const PLACEHOLDER_USERS = [
  { id: 1, username: "Testman1", displayName: "TestMan1", genres: ["shoegaze", "dream pop", "indie rock"], city: "Your City", priority: "nearby-taste" },
  { id: 2, username: "Testman2", displayName: "TestMan2", genres: ["jazz", "soul", "r&b"], city: "Your City", priority: "nearby" },
  { id: 3, username: "Testman3", displayName: "TestMan3", genres: ["electronic", "synthwave", "ambient"], city: null, priority: "taste" },
];

// Demo incoming friend request so the accept flow is visible in the UI
const DEMO_INCOMING = [
  { id: 4, username: "incoming_user", displayName: "Incoming User", genres: ["post-rock", "math rock"], city: null, priority: "taste" },
];

const PRIORITY_LABELS = {
  "nearby-taste": "Nearby · Similar taste",
  "nearby": "Nearby",
  "taste": "Similar taste",
};

function Avatar({ user, size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: THEME.accentMuted, border: `2px solid ${THEME.accent}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: THEME.fontDisplay, fontSize: size * 0.38, fontWeight: 700, color: THEME.accent,
    }}>
      {(user.displayName || user.username)[0].toUpperCase()}
    </div>
  );
}

function FriendSidebar({ friends, incomingRequests, highlightedId, onSelectFriend, onAccept, onDecline }) {
  return (
    <div style={{ width: 220, flexShrink: 0, position: "sticky", top: 24, alignSelf: "flex-start" }}>
      <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 16, fontWeight: 700, color: THEME.textPrimary, margin: "0 0 14px" }}>
        Friends
      </h2>

      {friends.length === 0 && incomingRequests.length === 0 && (
        <p style={{ fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textSecondary, lineHeight: 1.6, margin: 0 }}>
          No friends yet — send a friend request from the network list.
        </p>
      )}

      {friends.map((friend) => (
        <button
          key={friend.id}
          onClick={() => onSelectFriend(friend.id)}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "8px 10px", borderRadius: THEME.radius.md, border: "none",
            background: highlightedId === friend.id ? THEME.accentMuted : "transparent",
            cursor: "pointer", transition: THEME.transition, marginBottom: 4,
            outline: highlightedId === friend.id ? `1px solid ${THEME.accent}40` : "none",
          }}
          onMouseEnter={(e) => { if (highlightedId !== friend.id) e.currentTarget.style.background = THEME.bgElevated; }}
          onMouseLeave={(e) => { if (highlightedId !== friend.id) e.currentTarget.style.background = "transparent"; }}
        >
          <Avatar user={friend} size={32} />
          <div style={{ textAlign: "left", minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: THEME.fontBody, fontSize: 13, fontWeight: 700, color: highlightedId === friend.id ? THEME.accent : THEME.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {friend.displayName || friend.username}
            </p>
            <p style={{ margin: 0, fontFamily: THEME.fontBody, fontSize: 11, color: THEME.textSecondary }}>
              @{friend.username}
            </p>
          </div>
        </button>
      ))}

      {incomingRequests.length > 0 && (
        <>
          <div style={{ margin: "16px 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
            <h3 style={{ fontFamily: THEME.fontDisplay, fontSize: 13, fontWeight: 700, color: THEME.textSecondary, margin: 0 }}>
              Requests
            </h3>
            <span style={{
              padding: "1px 7px", borderRadius: THEME.radius.pill,
              background: THEME.accent, color: "#fff",
              fontFamily: THEME.fontBody, fontSize: 11, fontWeight: 700,
            }}>
              {incomingRequests.length}
            </span>
          </div>
          {incomingRequests.map((req) => (
            <div key={req.id} style={{
              padding: "10px", borderRadius: THEME.radius.md,
              background: THEME.bgCard, border: `1px solid ${THEME.border}`,
              marginBottom: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Avatar user={req} size={28} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontFamily: THEME.fontBody, fontSize: 12, fontWeight: 700, color: THEME.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {req.displayName || req.username}
                  </p>
                  <p style={{ margin: 0, fontFamily: THEME.fontBody, fontSize: 11, color: THEME.textSecondary }}>
                    @{req.username}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => onAccept(req)}
                  style={{
                    flex: 1, padding: "5px 0", borderRadius: THEME.radius.pill,
                    border: "none", background: THEME.accent, color: "#fff",
                    fontFamily: THEME.fontBody, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Accept
                </button>
                <button
                  onClick={() => onDecline(req)}
                  style={{
                    flex: 1, padding: "5px 0", borderRadius: THEME.radius.pill,
                    border: `1px solid ${THEME.border}`, background: "transparent",
                    color: THEME.textSecondary,
                    fontFamily: THEME.fontBody, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// Fetches and renders another user's genre map when a card expands.
// Falls back to a placeholder if the profile is private or unavailable.
function UserGenreMap({ userId }) {
  const [profile, setProfile] = useState(null);
  const [overlaps, setOverlaps] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProfile(userId)
      .then((data) => {
        const sorted = Object.entries(data.profile).sort((a, b) => b[1] - a[1]);
        setProfile(sorted);
        setOverlaps(data.overlaps);
      })
      .catch(() => setProfile([]))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textSecondary }}>Loading genre map…</p>
      </div>
    );
  }

  if (!profile || profile.length === 0) {
    return (
      <div style={{
        padding: "20px", borderRadius: THEME.radius.md,
        background: THEME.bgElevated, border: `1px dashed ${THEME.border}`,
        textAlign: "center", marginBottom: 16,
      }}>
        <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, lineHeight: 1.6, margin: 0 }}>
          This user's genre map isn't available.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <GenreForceMap profile={profile} overlaps={overlaps} title="Their Genre Map" height={280} />
    </div>
  );
}

function UserCard({ user, friendStatus, isExpanded, onToggleExpand, highlighted, onAddFriend, cardRef }) {
  const isFriend = friendStatus === "friends";
  const isPending = friendStatus === "pending";

  // Auto-expand when brought to top via sidebar click
  useEffect(() => {
    if (highlighted && !isExpanded) onToggleExpand();
  }, [highlighted]);

  const friendBtnStyle = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 16px", borderRadius: THEME.radius.pill, flexShrink: 0,
    fontFamily: THEME.fontBody, fontSize: 13, fontWeight: 600,
    cursor: isFriend || isPending ? "default" : "pointer",
    transition: THEME.transition,
    ...(isFriend
      ? { border: `2px solid ${THEME.success}40`, background: `${THEME.success}15`, color: THEME.success }
      : isPending
      ? { border: `2px solid ${THEME.border}`, background: "transparent", color: THEME.textSecondary, opacity: 0.7 }
      : { border: `2px solid ${THEME.border}`, background: "transparent", color: THEME.textSecondary }),
  };

  return (
    <div
      ref={cardRef}
      style={{
        padding: "24px 28px", marginBottom: 20,
        borderRadius: THEME.radius.md, background: THEME.bgCard,
        border: `1px solid ${highlighted ? THEME.accent : THEME.border}`,
        transition: THEME.transition,
        boxShadow: highlighted ? `0 0 0 2px ${THEME.accent}30` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar user={user} size={52} />

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

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            style={friendBtnStyle}
            onClick={!isFriend && !isPending ? () => onAddFriend(user) : undefined}
            onMouseEnter={(e) => { if (!isFriend && !isPending) { e.currentTarget.style.borderColor = THEME.accent; e.currentTarget.style.color = THEME.accent; }}}
            onMouseLeave={(e) => { if (!isFriend && !isPending) { e.currentTarget.style.borderColor = THEME.border; e.currentTarget.style.color = THEME.textSecondary; }}}
          >
            {isFriend ? <><UserCheckIcon size={14} /> Friends</> : isPending ? <><ClockIcon size={14} /> Pending</> : <><UserPlusIcon size={14} /> Friend</>}
          </button>

          <button
            onClick={onToggleExpand}
            style={{
              padding: "8px 16px", borderRadius: THEME.radius.pill,
              border: `2px solid ${isExpanded ? THEME.accent : THEME.border}`,
              background: "transparent",
              color: isExpanded ? THEME.accent : THEME.textSecondary,
              fontFamily: THEME.fontBody, fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: THEME.transition,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.accent; e.currentTarget.style.color = THEME.accent; }}
            onMouseLeave={(e) => { if (!isExpanded) { e.currentTarget.style.borderColor = THEME.border; e.currentTarget.style.color = THEME.textSecondary; }}}
          >
            {isExpanded ? "Close" : "View"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${THEME.border}` }}>
          {/* Other user's genre map fetches from backend, placeholder for now */}
          <UserGenreMap userId={user.id} />

          <h3 style={{ fontFamily: THEME.fontDisplay, fontSize: 15, fontWeight: 700, color: THEME.textPrimary, margin: "0 0 12px" }}>
            Shared taste with {user.displayName || user.username}
          </h3>
          <div style={{
            padding: "20px", borderRadius: THEME.radius.md,
            background: THEME.bgElevated, border: `1px dashed ${THEME.border}`,
            textAlign: "center", marginBottom: 16,
          }}>
            <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, lineHeight: 1.6, margin: 0 }}>
              Shared taste profile coming soon — your genre overlap will appear here.
            </p>
          </div>

          {/* Instagram only visible to friends */}
          {isFriend ? (
            <InstagramOAuthButton />
          ) : (
            <p style={{ fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textSecondary, margin: 0 }}>
              Friend {user.displayName || user.username} to connect on Instagram.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CityTasteSection({ about }) {
  if (!about) return null;

  const hasLocation = about.city && about.city !== "Unknown";

  if (!hasLocation) {
    return (
      <div style={{
        padding: "28px 32px", marginBottom: 32,
        borderRadius: THEME.radius.md, background: THEME.bgCard,
        border: `1px solid ${THEME.border}`,
      }}>
        <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 20, fontWeight: 700, color: THEME.textPrimary, margin: "0 0 8px" }}>
          Music in Your City
        </h2>
        <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, lineHeight: 1.6, margin: 0 }}>
          Share your location in{" "}
          <span style={{ color: THEME.accent, fontWeight: 600 }}>Profile → Location</span>
          {" "}to see what your city is listening to.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: "28px 32px", marginBottom: 32,
      borderRadius: THEME.radius.md, background: THEME.bgCard,
      border: `1px solid ${THEME.border}`,
    }}>
      <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 20, fontWeight: 700, color: THEME.textPrimary, margin: "0 0 4px" }}>
        Music in {about.city}
      </h2>
      <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, margin: "0 0 20px" }}>
        {about.country}
      </p>
      {/* Placeholder city-wide genre profile endpoint not yet implemented */}
      <div style={{
        height: 180, borderRadius: THEME.radius.md,
        background: THEME.bgElevated, border: `1px dashed ${THEME.border}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <p style={{ fontFamily: THEME.fontDisplay, fontSize: 16, fontWeight: 700, color: THEME.textPrimary, margin: 0 }}>
          Coming soon
        </p>
        <p style={{ fontFamily: THEME.fontBody, fontSize: 13, color: THEME.textSecondary, margin: 0 }}>
          Collective genre map for {about.city} will appear here.
        </p>
      </div>
    </div>
  );
}

function NetworkPage({ userId, onNavigate }) {
  const isLoggedIn = userId != -1;

  const [about, setAbout] = useState(null);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState(DEMO_INCOMING);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [highlightedId, setHighlightedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const cardRefs = useRef({});

  useEffect(() => {
    if (!isLoggedIn) { onNavigate("login"); return; }
    api.getAbout(userId).then(setAbout).catch(() => {});
    // TODO: fetch friends list from api.getFriends(userId) when endpoint exists
    // TODO: fetch incoming requests from api.getFriendRequests(userId) when endpoint exists
    api.getInboundFriendRequests(userId).then(setIncomingRequests).catch(() => {});
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const getFriendStatus = (id) => {
    if (friends.some((f) => f.id === id)) return "friends";
    if (sentRequests.has(id)) return "pending";
    return null;
  };

  const handleAddFriend = (user) => {
    // TODO: call api.sendFriendRequest(userId, user.id) when endpoint exists
    setSentRequests((prev) => new Set([...prev, user.id]));
  };

  const handleAccept = (user) => {
    // TODO: call api.acceptFriendRequest(requestId) when endpoint exists
    setFriends((prev) => [...prev, user]);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== user.id));
  };

  const handleDecline = (user) => {
    // TODO: call api.declineFriendRequest(requestId) when endpoint exists
    setIncomingRequests((prev) => prev.filter((r) => r.id !== user.id));
  };

  const handleSelectFriend = (id) => {
    setHighlightedId(id);
    setExpandedId(id);
    setTimeout(() => {
      const el = cardRefs.current[id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleToggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
    if (expandedId !== id) setHighlightedId(null);
  };

  // Friends that aren't already in PLACEHOLDER_USERS go at the top
  const allUsers = [
    ...friends.filter((f) => !PLACEHOLDER_USERS.some((u) => u.id === f.id)),
    ...PLACEHOLDER_USERS,
  ];
  // Highlighted user floats to the top of the list
  const sortedUsers = highlightedId
    ? [allUsers.find((u) => u.id === highlightedId), ...allUsers.filter((u) => u.id !== highlightedId)].filter(Boolean)
    : allUsers;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px", display: "flex", gap: 32, alignItems: "flex-start" }}>
      <FriendSidebar
        friends={friends}
        incomingRequests={incomingRequests}
        highlightedId={highlightedId}
        onSelectFriend={handleSelectFriend}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 32, fontWeight: 700, color: THEME.textPrimary, marginBottom: 8 }}>
          Your Network
        </h1>
        <p style={{ fontFamily: THEME.fontBody, fontSize: 16, color: THEME.textSecondary, marginBottom: 32, lineHeight: 1.6 }}>
          Listeners near you and people who share your taste.
        </p>

        <CityTasteSection about={about} />

        {sortedUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            friendStatus={getFriendStatus(user.id)}
            isExpanded={expandedId === user.id}
            onToggleExpand={() => handleToggleExpand(user.id)}
            highlighted={highlightedId === user.id}
            onAddFriend={handleAddFriend}
            cardRef={(el) => { cardRefs.current[user.id] = el; }}
          />
        ))}
      </div>
    </div>
  );
}

export default NetworkPage;
