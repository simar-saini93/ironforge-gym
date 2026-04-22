"use client";

import { useEffect, useState } from "react";

const STATS = [
  { num: "500+", label: "Active Members" },
  { num: "24", label: "Expert Trainers" },
  { num: "50+", label: "Weekly Classes" },
  { num: "6", label: "Years Strong" },
];

export default function StatsStrip() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        position: "relative",
        zIndex: 2,
      }}
    >
      {STATS.map((stat, i) => (
        <div
          key={stat.label}
          className={`stat-anim-${i + 1}`}
          style={{
            padding: isMobile ? "28px 24px" : "40px 60px",
            borderRight: isMobile
              ? i % 2 === 0 ? "1px solid var(--border)" : "none"
              : i < 3 ? "1px solid var(--border)" : "none",
            borderBottom: isMobile && i < 2 ? "1px solid var(--border)" : "none",
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: isMobile ? 40 : 56,
              color: "var(--accent)",
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            {stat.num}
          </div>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: isMobile ? 10 : 12,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
