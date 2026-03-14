import { useState } from "react";
import THEME from "../theme";
import api from "../services/api";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
// import { GoogleOAuthButton, AuthDivider } from "../components/GoogleOAuth";
import { UserIcon, EyeIcon, EyeOffIcon } from "../components/Icons";

//username and password elements
function LoginPage({ onNavigate, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


//login functionality with api calls to backend database / google open auth
  const handleLogin = async () => {
    setError("");
    if (!username || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await api.login({ username, password });
      onLogin();
      onNavigate("home");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    }
    setLoading(false);
  };


//styling
  return (
    <div style={{
      maxWidth: 440, margin: "60px auto", padding: "40px 36px",
      borderRadius: THEME.radius.xl, background: THEME.bgCard,
      border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow.md,
    }}>
      <h1 style={{
        fontFamily: THEME.fontDisplay, fontSize: 28, fontWeight: 700,
        color: THEME.textPrimary, marginBottom: 8, textAlign: "center",
      }}>
        Welcome back
      </h1>
      <p style={{
        fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary,
        textAlign: "center", marginBottom: 28,
      }}>
        Sign in to continue tracking your music
      </p>

      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: THEME.radius.md,
          background: `${THEME.error}15`, border: `1px solid ${THEME.error}40`,
          color: THEME.error, fontSize: 13, fontFamily: THEME.fontBody, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {/*<GoogleOAuthButton />
      <AuthDivider />*/}

      <FormInput label="Username" value={username} onChange={setUsername}
        placeholder="your_username" icon={UserIcon} />
      <FormInput label="Password" type={showPassword ? "text" : "password"}
        value={password} onChange={setPassword} placeholder="••••••••"
        rightElement={
          <div onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </div>
        }
      />
      <PrimaryButton onClick={handleLogin} loading={loading}>Sign In</PrimaryButton>

      <p style={{
        textAlign: "center", marginTop: 24, fontSize: 14,
        color: THEME.textSecondary, fontFamily: THEME.fontBody,
      }}>
        Don't have an account?{" "}
        <span onClick={() => onNavigate("signup")}
          style={{ color: THEME.accent, cursor: "pointer", fontWeight: 600 }}>
          Create one
        </span>
      </p>
    </div>
  );
}

export default LoginPage;
