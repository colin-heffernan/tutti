import THEME from "../theme";
import CONFIG from "../config";
import { GoogleIcon } from "./Icons";

//Redirects to Google's OAuth consent page
export function initiateGoogleLogin() {
  const state = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  sessionStorage.setItem("google_oauth_state", state);

  const params = new URLSearchParams({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    redirect_uri: CONFIG.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: CONFIG.GOOGLE_SCOPES,
    state: state,
    access_type: "offline",
    prompt: "select_account",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

//Continue with Google button
export function GoogleOAuthButton() {
  return (
    <button
      onClick={initiateGoogleLogin}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        gap: 12, padding: "14px 24px", borderRadius: THEME.radius.lg,
        border: `2px solid ${THEME.border}`, background: THEME.bgElevated,
        color: THEME.textPrimary, fontSize: 15, fontWeight: 600,
        fontFamily: THEME.fontBody, cursor: "pointer", transition: THEME.transition,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = THEME.bgHover; e.currentTarget.style.borderColor = THEME.textSecondary; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = THEME.bgElevated; e.currentTarget.style.borderColor = THEME.border; }}
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}

//visual divider
export function AuthDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0" }}>
      <div style={{ flex: 1, height: 1, background: THEME.border }} />
      <span style={{ fontSize: 13, color: THEME.textPlaceholder, fontFamily: THEME.fontBody }}>or</span>
      <div style={{ flex: 1, height: 1, background: THEME.border }} />
    </div>
  );
}