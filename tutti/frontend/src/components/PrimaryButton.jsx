import THEME from "../theme";

function PrimaryButton({ children, onClick, loading, disabled, variant = "primary", style: customStyle }) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: "100%", padding: "14px 24px", borderRadius: THEME.radius.lg,
        border: isPrimary ? "none" : `2px solid ${THEME.border}`,
        background: isPrimary ? (disabled ? THEME.bgHover : THEME.accent) : "transparent",
        color: isPrimary ? (disabled ? THEME.textSecondary : "#fff") : THEME.textPrimary,
        fontSize: 15, fontWeight: 600, fontFamily: THEME.fontBody,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: THEME.transition, opacity: loading ? 0.7 : 1,
        ...customStyle,
      }}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

export default PrimaryButton;
