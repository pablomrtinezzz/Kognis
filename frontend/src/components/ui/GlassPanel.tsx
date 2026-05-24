import { CSSProperties, HTMLAttributes, forwardRef } from "react";

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "elevated";
  glow?: boolean;
  hover?: boolean;
}

const SHADOW: Record<string, string> = {
  default:
    "0 0 0 1px rgba(255,255,255,0.05) inset, 0 8px 40px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset",
  primary:
    "0 0 0 1px rgba(37,119,255,0.18) inset, 0 8px 40px rgba(37,119,255,0.10), 0 20px 60px rgba(0,0,0,0.7)",
  elevated: "0 20px 60px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.04) inset",
  hover:
    "0 0 0 1px rgba(255,255,255,0.10) inset, 0 12px 48px rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.07) inset",
};

const BG: Record<string, string> = {
  default:
    "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
  primary:
    "linear-gradient(145deg, rgba(37,119,255,0.06) 0%, rgba(37,119,255,0.02) 100%)",
  elevated:
    "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
};

const BORDER_COLOR: Record<string, string> = {
  default: "rgba(255,255,255,0.08)",
  primary: "rgba(37,119,255,0.18)",
  elevated: "rgba(255,255,255,0.08)",
};

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      className = "",
      style: externalStyle,
      variant = "default",
      glow = false,
      hover = false,
      children,
      ...props
    },
    ref,
  ) => {
    const panelStyle: CSSProperties = {
      position: "relative",
      borderRadius: "1rem",
      overflow: "hidden",
      background: BG[variant],
      boxShadow: SHADOW[variant],
      border: `1px solid ${BORDER_COLOR[variant]}`,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      transition: "box-shadow 300ms ease, border-color 300ms ease",
      ...(hover ? { cursor: "pointer" } : {}),
      ...externalStyle,
    };

    return (
      <div
        ref={ref}
        className={className}
        style={panelStyle}
        onMouseEnter={
          hover
            ? (e) => {
                e.currentTarget.style.boxShadow = SHADOW.hover;
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }
            : undefined
        }
        onMouseLeave={
          hover
            ? (e) => {
                e.currentTarget.style.boxShadow = SHADOW[variant];
                e.currentTarget.style.borderColor = BORDER_COLOR[variant];
              }
            : undefined
        }
        {...props}
      >
        {glow && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "0 0 auto 0",
              height: 1,
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}
        {children}
      </div>
    );
  },
);

GlassPanel.displayName = "GlassPanel";

export { GlassPanel };
