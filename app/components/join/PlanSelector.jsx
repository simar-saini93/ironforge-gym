"use client";

import { useEffect, useState } from "react";

const PLANS = [
  {
    id: "day",
    name: "Day Pass",
    cycle: "Single Day",
    price: "15",
    features: ["Full facility access", "Locker room & showers", "Group classes", "QR entry pass"],
  },
  {
    id: "monthly",
    name: "Monthly",
    cycle: "30-Day Access",
    price: "79",
    popular: true,
    features: ["Unlimited access", "Trainer assignment", "Progress tracking", "QR & app access", "Priority class booking"],
  },
  {
    id: "yearly",
    name: "Yearly",
    cycle: "365-Day Access",
    price: "699",
    note: "Save 26%",
    features: ["Everything in Monthly", "Dedicated trainer", "Nutrition guidance", "Guest passes (×4)", "Early access to events"],
  },
];

export default function PlanSelector({ selected, onSelect }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div>
      <div
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 11,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ width: 30, height: 1, background: "var(--accent)", display: "block" }} />
        Step 1 — Choose Your Plan
      </div>
      <h2
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(36px, 4vw, 56px)",
          lineHeight: 0.95,
          letterSpacing: 1,
          marginBottom: 32,
        }}
      >
        SELECT A<br />
        <span style={{ WebkitTextStroke: "1px var(--white)", color: "transparent" }}>MEMBERSHIP</span>
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PLANS.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              style={{
                border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                background: isSelected ? "rgba(232,255,0,0.04)" : "var(--card)",
                padding: isMobile ? "16px" : "24px 28px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: isMobile ? 12 : 24,
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "rgba(232,255,0,0.4)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    right: 16,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 10,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    background: "var(--accent)",
                    color: "var(--black)",
                    padding: "3px 10px",
                    fontWeight: 700,
                  }}
                >
                  Popular
                </div>
              )}

              {/* Radio */}
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "border-color 0.2s",
                }}
              >
                {isSelected && (
                  <div style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: "50%" }} />
                )}
              </div>

              {/* Name + features */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: isMobile ? 4 : 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: isMobile ? 22 : 28,
                      letterSpacing: 2,
                      color: isSelected ? "var(--accent)" : "var(--white)",
                      transition: "color 0.2s",
                    }}
                  >
                    {plan.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 10,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                    }}
                  >
                    {plan.cycle}
                  </span>
                </div>
                {/* Hide feature list on mobile to keep cards compact */}
                {!isMobile && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
                    {plan.features.slice(0, 3).map((f) => (
                      <span
                        key={f}
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ color: "var(--accent)", fontSize: 10 }}>—</span>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: isMobile ? 36 : 48,
                    color: "var(--accent)",
                    lineHeight: 1,
                  }}
                >
                  <sup
                    style={{
                      fontSize: isMobile ? 14 : 20,
                      verticalAlign: "top",
                      marginTop: isMobile ? 6 : 8,
                      display: "inline-block",
                    }}
                  >
                    $
                  </sup>
                  {plan.price}
                </div>
                {plan.note && (
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 9,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "var(--accent)",
                    }}
                  >
                    {plan.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
