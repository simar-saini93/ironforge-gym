"use client";

import { useEffect, useState } from "react";

const FEATURES = [
  { icon: "⚡", text: "State-of-the-art equipment" },
  { icon: "🔒", text: "Smart QR & biometric access" },
  { icon: "📊", text: "Personal progress tracking" },
  { icon: "🏆", text: "Certified expert trainers" },
];

export default function About() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section
      id="about"
      style={{
        padding: isMobile ? "80px 24px" : "120px 60px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 48 : 100,
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* LEFT */}
      <div className="reveal">
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
          Who We Are
        </div>

        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(48px, 5vw, 80px)",
            lineHeight: 0.95,
            letterSpacing: 1,
            marginBottom: 24,
          }}
        >
          MORE THAN A<br />
          <span className="text-outline">GYM</span>
        </h2>

        <p
          style={{
            fontSize: isMobile ? 15 : 16,
            lineHeight: 1.8,
            color: "var(--mid)",
            marginBottom: 40,
            fontWeight: 300,
          }}
        >
          IronForge is a premium fitness destination built for those who take
          their health seriously. We combine cutting-edge equipment,
          science-backed programming, and an elite trainer team to deliver
          results that last.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FEATURES.map((f) => (
            <div
              key={f.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: isMobile ? "14px 16px" : "16px 20px",
                border: "1px solid var(--border)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.background = "rgba(232,255,0,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: 18, width: 36, textAlign: "center", flexShrink: 0 }}>
                {f.icon}
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: isMobile ? 13 : 15,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "var(--white)",
                }}
              >
                {f.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div
        className="reveal"
        style={{
          position: "relative",
          // Extra bottom margin on mobile to make room for the badge overflow
          marginBottom: isMobile ? 60 : 0,
        }}
      >
        <div className="about-visual-card">
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: isMobile ? 56 : 80,
              lineHeight: 1,
              color: "var(--accent)",
              marginBottom: 16,
              opacity: 0.3,
            }}
          >
            &ldquo;
          </div>
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: isMobile ? 17 : 22,
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.5,
              color: "var(--white)",
              marginBottom: 24,
            }}
          >
            The body achieves what the mind believes. Every rep, every set,
            every drop of sweat brings you closer to the person you were meant
            to be.
          </p>
          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 12,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            — IronForge Philosophy
          </p>
        </div>

        {/* Badge */}
        <div
          style={{
            position: "absolute",
            bottom: isMobile ? -50 : -30,
            right: isMobile ? 16 : -30,
            width: isMobile ? 96 : 120,
            height: isMobile ? 96 : 120,
            background: "var(--accent)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: isMobile ? 32 : 42,
              color: "var(--black)",
              lineHeight: 1,
            }}
          >
            5★
          </div>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--black)",
              textAlign: "center",
            }}
          >
            Rated
          </div>
        </div>
      </div>
    </section>
  );
}
