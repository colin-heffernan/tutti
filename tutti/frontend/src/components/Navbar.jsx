import THEME from "../theme";
import { HomeIcon, MusicIcon, GlobeIcon, UserIcon } from "./Icons";

// Bubbly nav buttons 
function BubbleNavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 20px", borderRadius: THEME.radius.pill,
        border: "none", cursor: "pointer",
        fontFamily: THEME.fontBody, fontSize: 14, fontWeight: 600,
        color: active ? THEME.bg : THEME.textSecondary,
        background: active ? THEME.accent : THEME.bgElevated,
        transition: THEME.transition,
        boxShadow: active ? THEME.shadow.sm : "none",
      }}
      onMouseEnter={(e) => {
        if (!active) { e.currentTarget.style.background = THEME.bgHover; e.currentTarget.style.color = THEME.textPrimary; }
      }}
      onMouseLeave={(e) => {
        if (!active) { e.currentTarget.style.background = THEME.bgElevated; e.currentTarget.style.color = THEME.textSecondary; }
      }}
    >
      <Icon />
      <span>{label}</span>
    </button>
  );
}

function Navbar({ currentPage, onNavigate, userId }) {
  const isLoggedIn = userId != -1;

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px", height: 64, background: THEME.bgCard,
      borderBottom: `1px solid ${THEME.border}`,
      position: "sticky", top: 0, zIndex: 100,
    }}>

    <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
        <img src="../../static/images/webLogo.svg" alt="Tutti" style={{ height: 130 }} />
    </div>


      <div style={{ display: "flex", gap: 8 }}>
        <BubbleNavButton icon={HomeIcon} label="Home" active={currentPage === "home"} onClick={() => onNavigate("home")} />
        <BubbleNavButton icon={MusicIcon} label="Discover" active={currentPage === "discover"} onClick={() => onNavigate("discover")} />
        <BubbleNavButton icon={GlobeIcon} label="Network" active={currentPage === "network"} onClick={() => onNavigate("network")} />
        {isLoggedIn ? (
          <BubbleNavButton icon={UserIcon} label="Profile" active={currentPage === "profile"} onClick={() => onNavigate("profile")} />
        ) : (
          <BubbleNavButton icon={UserIcon} label="Sign In" active={currentPage === "login"} onClick={() => onNavigate("login")} />
        )}
      </div>
    </nav>
  );
}

export default Navbar;
