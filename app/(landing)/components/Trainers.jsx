"use client";

import { useEffect, useState } from "react";

const TRAINERS = [
  {
    initial: "A",
    name: "Alex Rivera",
    role: "Strength & Conditioning",
    spec: "Strength",
    years: "8",
    members: "120+",
    rating: "4.9",
  },
  {
    initial: "M",
    name: "Maya Chen",
    role: "HIIT & Cardio Specialist",
    spec: "HIIT",
    years: "5",
    members: "95+",
    rating: "4.8",
  },
  {
    initial: "J",
    name: "Jordan Walsh",
    role: "Yoga & Flexibility",
    spec: "Yoga",
    years: "6",
    members: "80+",
    rating: "5.0",
  },
];

export default function Trainers() {
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
    if (isTablet) return "repeat(2, 1fr)";
    return "repeat(3, 1fr)";
  };

  return (
    <section
      id="trainers"
      style={{
        padding: isMobile ? "80px 24px" : isTablet ? "100px 40px" : "120px 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="reveal" style={{ marginBottom: isMobile ? 40 : 60 }}>
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
          The Team
        </div>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(48px, 5vw, 80px)",
            lineHeight: 0.95,
            letterSpacing: 1,
          }}
        >
          MEET OUR<br />
          <span className="text-outline">TRAINERS</span>
        </h2>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: getColumns(),
          gap: isMobile ? 16 : 24,
        }}
      >
        {TRAINERS.map((trainer) => (
          <div
            key={trainer.name}
            className="reveal"
            style={{
              border: "1px solid var(--border)",
              overflow: "hidden",
              position: "relative",
              transition: "border-color 0.3s",
              // On tablet show 2 cols — last card goes full width
              ...(isTablet && trainer.name === "Jordan Walsh"
                ? { gridColumn: "1 / -1" }
                : {}),
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            {/* Visual */}
            <div
              style={{
                height: isMobile ? 200 : 280,
                position: "relative",
                overflow: "hidden",
                background: "var(--card)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: isMobile ? 80 : 120,
                  color: "rgba(232,255,0,0.05)",
                }}
              >
                {trainer.initial}
              </span>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, var(--deep) 0%, transparent 60%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  background: "var(--accent)",
                  color: "var(--black)",
                  padding: "4px 10px",
                  fontWeight: 700,
                }}
              >
                {trainer.spec}
              </div>
            </div>

            {/* Info */}
            <div
              style={{
                padding: isMobile ? 20 : 28,
                background: "var(--card)",
                // On tablet last card — show info horizontally
                ...(isTablet && trainer.name === "Jordan Walsh"
                  ? { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }
                  : {}),
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: isMobile ? 24 : 28,
                    letterSpacing: 2,
                    marginBottom: 4,
                  }}
                >
                  {trainer.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 12,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    marginBottom: isTablet && trainer.name === "Jordan Walsh" ? 0 : 16,
                  }}
                >
                  {trainer.role}
                </div>
              </div>

              <div style={{ display: "flex", gap: isMobile ? 20 : 24 }}>
                {[
                  { num: trainer.years, label: "Years Exp" },
                  { num: trainer.members, label: "Members" },
                  { num: trainer.rating, label: "Rating" },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: isMobile ? 20 : 24,
                        color: "var(--accent)",
                        lineHeight: 1,
                      }}
                    >
                      {s.num}
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 9 : 11,
                        color: "var(--muted)",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
