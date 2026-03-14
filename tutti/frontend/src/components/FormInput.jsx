import { useState } from "react";
import THEME from "../theme";

function FormInput({ label, type = "text", value, onChange, placeholder, error, icon: Icon, rightElement }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <label style={{
          display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600,
          fontFamily: THEME.fontBody, color: THEME.textSecondary, letterSpacing: "0.3px",
        }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {Icon && (
          <div style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: focused ? THEME.accent : THEME.textPlaceholder, transition: THEME.transition,
          }}>
            <Icon />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: `14px ${rightElement ? "44px" : "16px"} 14px ${Icon ? "44px" : "16px"}`,
            borderRadius: THEME.radius.md,
            border: `2px solid ${error ? THEME.error : focused ? THEME.borderFocus : THEME.border}`,
            background: THEME.bgElevated, color: THEME.textPrimary,
            fontSize: 15, fontFamily: THEME.fontBody, outline: "none",
            transition: THEME.transition, boxSizing: "border-box",
          }}
        />
        {rightElement && (
          <div style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            cursor: "pointer", color: THEME.textPlaceholder,
          }}>
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p style={{ marginTop: 6, fontSize: 12, color: THEME.error, fontFamily: THEME.fontBody }}>{error}</p>
      )}
    </div>
  );
}

export default FormInput;