import { useState } from "react";
import THEME from "../theme";
import CONFIG from "../config";
import api from "../services/api";
import useGeolocation from "../hooks/useGeolocation";
import FormInput from "../components/FormInput";
import PrimaryButton from "../components/PrimaryButton";
import { InstagramOAuthButton } from "../components/InstagramOAuth";
import { SpotifyOAuthButton } from "../components/SpotifyOAuth";
import SongSearch from "../components/SongSearch";
// import { GoogleOAuthButton, AuthDivider } from "../components/GoogleOAuth";
import { UserIcon, EyeIcon, EyeOffIcon, MapPinIcon, CheckIcon } from "../components/Icons";

function SignUpPage({ onNavigate, onLogin, userId }) {
  const [step, setStep] = useState(1);

  // fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const isLoggedIn = userId != -1;

  if(isLoggedIn) {
    onNavigate("profile");
  }

  // geolocation functionality hooks call
  const geo = useGeolocation();

  // selected songs array
  const [selectedSongs, setSelectedSongs] = useState([]);

// api calls to database
  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      await api.register({ username, email, password, confirm_password: confirmPassword, display_name: displayName });
      setStep(2);
    } catch (err) {
      setErrors({ general: err.message });
    }
    setLoading(false);
  };

  const handleSaveLocation = async () => {
    if (geo.location) {
      setLoading(true);
      try {
        await api.updateLocation(userId, geo.location.city, geo.location.country);
      } catch (err) {
        console.error("Failed to save location:", err);
      }
      setLoading(false);
    }
    try {
      await api.login({ username, password });
      onLogin();
      onNavigate("home");
    } catch (err) {
      setErrors({ general: err.message });
    }
    // setStep(3);
  };

  /* const handleSaveMusicProfile = async () => {
    setLoading(true);
    try {
      await api.saveMusicProfile(selectedSongs.map((s) => s.mbid));
      onLogin();
      onNavigate("home");
    } catch (err) {
      setErrors({ general: err.message });
    }
    setLoading(false);
  }; */

  // Step progress dots for signing up i.e 1 - 2 -3
  const StepIndicator = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 32 }}>
      {[1, 2/*, 3*/].map((s) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600, fontFamily: THEME.fontBody,
            background: s <= step ? THEME.accent : THEME.bgElevated,
            color: s <= step ? "#fff" : THEME.textSecondary,
            border: `2px solid ${s <= step ? THEME.accent : THEME.border}`,
            transition: THEME.transition,
          }}>
            {s < step ? <CheckIcon /> : s}
          </div>
          {s < 2 && <div style={{ width: 40, height: 2, background: s < step ? THEME.accent : THEME.border, borderRadius: 1 }} />}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      maxWidth: step === 3 ? 560 : 440, margin: "40px auto", padding: "40px 36px",
      borderRadius: THEME.radius.xl, background: THEME.bgCard,
      border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow.md,
      transition: "max-width 0.3s ease",
    }}>
      <StepIndicator />

      {errors.general && (
        <div style={{
          padding: "12px 16px", borderRadius: THEME.radius.md,
          background: `${THEME.error}15`, border: `1px solid ${THEME.error}40`,
          color: THEME.error, fontSize: 13, fontFamily: THEME.fontBody, marginBottom: 20,
        }}>
          {errors.general}
        </div>
      )}


      {step === 1 && (
        <>
          <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 28, fontWeight: 700, color: THEME.textPrimary, marginBottom: 8, textAlign: "center" }}>
            Create your account
          </h1>
          <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, textAlign: "center", marginBottom: 28 }}>
            Join the federated music community
          </p>

          {/*<GoogleOAuthButton />
          <AuthDivider />*/}

          <FormInput label="Username" value={username} onChange={setUsername} placeholder="pick_a_username" error={errors.username} icon={UserIcon} />
          <FormInput label="Display Name (optional)" value={displayName} onChange={setDisplayName} placeholder="How others see you" />
          <FormInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} />
          <FormInput label="Password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} placeholder="At least 8 characters" error={errors.password}
            rightElement={<div onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</div>}
          />
          <FormInput label="Confirm Password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={setConfirmPassword} placeholder="Type it again" error={errors.confirmPassword} />
          <PrimaryButton onClick={handleCreateAccount} loading={loading}>Continue</PrimaryButton>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: THEME.textSecondary, fontFamily: THEME.fontBody }}>
            Already have an account?{" "}
            <span onClick={() => onNavigate("login")} style={{ color: THEME.accent, cursor: "pointer", fontWeight: 600 }}>Sign in</span>
          </p>
        </>
      )}

        
      {step === 2 && (
        <>
          <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 28, fontWeight: 700, color: THEME.textPrimary, marginBottom: 8, textAlign: "center" }}>
            Find your network
          </h1>
          <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
            Share your location to discover music lovers nearby.<br />This is optional — you can skip this step.
          </p>

          <div style={{ padding: 24, borderRadius: THEME.radius.lg, background: THEME.bgElevated, border: `1px solid ${THEME.border}`, textAlign: "center", marginBottom: 24 }}>
            {geo.location ? (
              <div>
                <div style={{ color: THEME.success, marginBottom: 12 }}><MapPinIcon /></div>
                <p style={{ fontFamily: THEME.fontBody, fontSize: 16, fontWeight: 600, color: THEME.textPrimary, marginBottom: 4 }}>
                  {geo.location.city}, {geo.location.country}
                </p>
                <p style={{ fontSize: 12, color: THEME.textSecondary, fontFamily: THEME.fontBody }}>Location detected successfully</p>
              </div>
            ) : (
              <div>
                <div style={{ color: THEME.textSecondary, marginBottom: 16 }}><MapPinIcon /></div>
                <PrimaryButton onClick={geo.requestLocation} loading={geo.loading} variant="secondary" style={{ width: "auto", display: "inline-block" }}>
                  Enable Location
                </PrimaryButton>
                {geo.error && <p style={{ marginTop: 12, fontSize: 12, color: THEME.warning, fontFamily: THEME.fontBody }}>{geo.error}</p>}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 24, padding: 24, borderRadius: THEME.radius.lg, background: THEME.bgElevated, border: `1px solid ${THEME.border}` }}>
            <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, textAlign: "center", marginBottom: 16 }}>
              Connect your socials to discover music lovers with similar taste.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <InstagramOAuthButton />
              <SpotifyOAuthButton />
            </div>
          </div>          

          <div style={{ display: "flex", gap: 12 }}>
            {/*
              <PrimaryButton onClick={() => setStep(3)} variant="secondary">Skip</PrimaryButton>
            */}
            <PrimaryButton onClick={handleSaveLocation} loading={loading}>{geo.location ? "Set Location" : "Skip for Now"}</PrimaryButton>
          </div>
        </>
      )}

      {/*step === 3 && (
        <>
          <h1 style={{ fontFamily: THEME.fontDisplay, fontSize: 28, fontWeight: 700, color: THEME.textPrimary, marginBottom: 8, textAlign: "center" }}>
            Build your profile
          </h1>
          <p style={{ fontFamily: THEME.fontBody, fontSize: 14, color: THEME.textSecondary, textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>
            Search for at least {CONFIG.MIN_SONGS_FOR_PROFILE} songs you enjoy.<br />This helps us understand your taste and find your community.
          </p>

          <SongSearch
            selectedSongs={selectedSongs}
            onSongSelect={(song) => setSelectedSongs((prev) => [...prev, song])}
            onSongRemove={(mbid) => setSelectedSongs((prev) => prev.filter((s) => s.mbid !== mbid))}
          />

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <PrimaryButton onClick={() => setStep(2)} variant="secondary">Back</PrimaryButton>
            <PrimaryButton onClick={handleSaveMusicProfile} loading={loading} disabled={selectedSongs.length < CONFIG.MIN_SONGS_FOR_PROFILE}>
              Finish Setup
            </PrimaryButton>
          </div>
        </>
      )*/}
    </div>
  );
}

export default SignUpPage;
