"use client";

import { useEffect, useState } from "react";

const PLANS = [
  {
    name: "Day Pass",
    cycle: "Single Day Access",
    price: "15",
    priceNote: "per visit",
    featured: false,
    badge: null,
    features: [
      "Full facility access",
      "Locker room & showers",
      "Group classes",
      "QR entry pass",
    ],
    cta: "Get Pass",
  },
  {
    name: "Monthly",
    cycle: "30-Day Access",
    price: "79",
    priceNote: "per month",
    featured: true,
    badge: "Most Popular",
    features: [
      "Unlimited access",
      "Trainer assignment",
      "Progress tracking",
      "QR & app access",
      "Priority class booking",
    ],
    cta: "Join Monthly",
  },
  {
    name: "Yearly",
    cycle: "365-Day Access",
    price: "699",
    priceNote: "per year — save 26%",
    featured: false,
    badge: null,
    features: [
      "Everything in Monthly",
      "Dedicated trainer",
      "Nutrition guidance",
      "Guest passes (×4)",
      "Early access to events",
    ],
    cta: "Go Annual",
  },
];

export default function Membership() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getColumns = () => {
    if (isMobile) return "1fr";
    if (isTablet) return "1fr 1fr";
    return "repeat(3, 1fr)";
  };

  return (
    <section
      id="membership"
      style={{
        padding: isMobile ? "80px 24px" : isTablet ? "100px 40px" : "120px 60px",
        background: "var(--deep)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="reveal"
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "flex-end",
          gap: isMobile ? 16 : 0,
          marginBottom: isMobile ? 40 : 60,
        }}
      >
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
            Pricing
          </div>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(48px, 5vw, 80px)",
              lineHeight: 0.95,
              letterSpacing: 1,
            }}
          >
            MEMBERSHIP<br />
            <span className="text-outline">PLANS</span>
          </h2>
        </div>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 14,
            maxWidth: isMobile ? "100%" : 300,
            lineHeight: 1.7,
            fontWeight: 300,
          }}
        >
          No hidden fees. Cancel anytime. Choose the plan that fits your schedule.
        </p>
      </div>

      {/* Plans grid */}
      <div
        className="reveal"
        style={{
          display: "grid",
          gridTemplateColumns: getColumns(),
          gap: 1,
          background: "var(--border)",
          border: "1px solid var(--border)",
        }}
      >
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`plan-card ${plan.featured ? "plan-card-featured" : ""}`}
            style={{
              background: plan.featured ? "#0f0f0f" : "var(--card)",
              padding: isMobile ? "36px 24px" : "48px 40px",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s",
            }}
          >
            {plan.badge && (
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  background: "var(--accent)",
                  color: "var(--black)",
                  padding: "4px 12px",
                  display: "inline-block",
                  marginBottom: 24,
                  fontWeight: 700,
                }}
              >
                {plan.badge}
              </div>
            )}

            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: isMobile ? 36 : 42,
                letterSpacing: 2,
                marginBottom: 8,
                marginTop: plan.badge ? 0 : 34,
              }}
            >
              {plan.name}
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 12,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 24,
              }}
            >
              {plan.cycle}
            </div>

            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: isMobile ? 56 : 72,
                lineHeight: 1,
                color: "var(--accent)",
                marginBottom: 4,
              }}
            >
              <sup
                style={{
                  fontSize: isMobile ? 22 : 28,
                  verticalAlign: "top",
                  marginTop: isMobile ? 8 : 12,
                  display: "inline-block",
                }}
              >
                $
              </sup>
              {plan.price}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>
              {plan.priceNote}
            </div>

            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 32,
                padding: 0,
              }}
            >
              {plan.features.map((f) => (
                <li
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: isMobile ? 13 : 14,
                    color: "var(--mid)",
                  }}
                >
                  <span style={{ color: "var(--accent)", fontFamily: "'Barlow Condensed', sans-serif", flexShrink: 0 }}>
                    —
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            
             <a href="/join"
              style={{
                display: "block",
                textAlign: "center",
                width: "100%",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 14,
                letterSpacing: 3,
                textTransform: "uppercase",
                fontWeight: 700,
                textDecoration: "none",
                transition: "all 0.2s",
                ...(plan.featured
                  ? {
                      background: "var(--accent)",
                      color: "var(--black)",
                      padding: "16px 36px",
                      border: "none",
                    }
                  : {
                      background: "transparent",
                      color: "var(--white)",
                      padding: "15px 36px",
                      border: "1px solid var(--border)",
                    }),
              }}
              onMouseEnter={(e) => {
                if (plan.featured) {
                  e.currentTarget.style.background = "var(--white)";
                } else {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }
              }}
              onMouseLeave={(e) => {
                if (plan.featured) {
                  e.currentTarget.style.background = "var(--accent)";
                } else {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--white)";
                }
              }}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
