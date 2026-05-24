"use client";

import { CSSProperties, HTMLAttributes, forwardRef, useState } from "react";

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "elevated";
  glow?: boolean;
  hover?: boolean;
}

const BASE_SHADOW =
  "0 25px 50px -12px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.08) inset";

const GLOW_SHADOW =
  "0 25px 50px -12px rgba(0,0,0,1), 0 1px 0 rgba(255,255,255,0.2) inset, 0 0 0 1px rgba(255,255,255,0.05) inset";

const HOVER_SHADOW =
  "0 25px 50px -12px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.14) inset, 0 1px 0 rgba(255,255,255,0.18) inset";

const VARIANT_SHADOW: Record<string, string> = {
  default: BASE_SHADOW,
  primary:
    "0 25px 50px -12px rgba(0,0,0,1), 0 0 0 1px rgba(37,119,255,0.22) inset, 0 8px 32px rgba(37,119,255,0.08)",
  elevated:
    "0 30px 60px -12px rgba(0,0,0,1), 0 0 0 1px rgba(255,255,255,0.10) inset",
};

const VARIANT_BG: Record<string, string> = {
  default:
    "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
  primary:
    "linear-gradient(145deg, rgba(37,119,255,0.07) 0%, rgba(37,119,255,0.02) 100%)",
  elevated:
    "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
};

const VARIANT_BORDER: Record<string, string> = {
  default: "rgba(255,255,255,0.08)",
  primary: "rgba(37,119,255,0.20)",
  elevated: "rgba(255,255,255,0.09)",
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
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = useState(false);

    const resolvedShadow = isHovered
      ? HOVER_SHADOW
      : glow
        ? GLOW_SHADOW
        : VARIANT_SHADOW[variant];

    const panelStyle: CSSProperties = {
      position: "relative",
      borderRadius: "1rem",
      overflow: "hidden",
      background: VARIANT_BG[variant],
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      boxShadow: resolvedShadow,
      border: `1px solid ${isHovered ? "rgba(255,255,255,0.12)" : VARIANT_BORDER[variant]}`,
      transition: "box-shadow 280ms ease, border-color 280ms ease",
      ...(hover ? { cursor: "pointer" } : {}),
      ...externalStyle,
    };

    return (
      <div
        ref={ref}
        className={className}
        style={panelStyle}
        onMouseEnter={(e) => {
          if (hover) setIsHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (hover) setIsHovered(false);
          onMouseLeave?.(e);
        }}
        {...props}
      >
        {glow && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background:
                "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
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
