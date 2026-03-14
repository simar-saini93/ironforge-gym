"use client";

import { useEffect, useState } from "react";

const CLASSES = [
  {
    name: "Power Lift",
    day: "Monday",
    time: "6:00 AM",
    trainer: "Alex Rivera",
    duration: "60 min",
    type: "Strength",
    tagColor: "var(--accent)",
  },
  {
    name: "Burn Circuit",
    day: "Tuesday",
    time: "7:00 AM",
    trainer: "Maya Chen",
    duration: "45 min",
    type: "HIIT",
    tagColor: "var(--accent2)",
  },
  {
    name: "Morning Flow",
    day: "Wednesday",
    time: "8:00 AM",
    trainer: "Jordan Walsh",
    duration: "60 min",
    type: "Yoga",
    tagColor: "#aa88ff",
  },
  {
    name: "Endurance Run",
    day: "Thursday",
    time: "6:30 AM",
    trainer: "Maya Chen",
    duration: "50 min",
    type: "Cardio",
    tagColor: "#00ffaa",
  },
  {
    name: "Iron Hour",
    day: "Friday",
    time: "5:30 AM",
    trainer: "Alex Rivera",
    duration: "60 min",
    type: "Strength",
    tagColor: "var(--accent)",
  },
  {
    name: "Weekend Warrior",
    day: "Saturday",
    time: "9:00 AM",
    trainer: "All Trainers",
    duration: "90 min",
    type: "HIIT",
    tagColor: "var(--accent2)",
  },
];

export default function Schedule() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <section
      id="schedule"
      style={{
        padding: isMobile ? "80px 24px" : "120px 60px",
        background: "var(--deep)",
        borderTop: "1px solid var(--border)",
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
          gap: isMobile ? 24 : 0,
          marginBottom: isMobile ? 32 : 48,
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
            This Week
          </div>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(48px, 5vw, 80px)",
              lineHeight: 0.95,
              letterSpacing: 1,
            }}
          >
            CLASS<br />
            <span className="text-outline">SCHEDULE</span>
          </h2>
        </div>

        
        <a  href="#"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 14,
            letterSpacing: 3,
            textTransform: "uppercase",
            fontWeight: 700,
            background: "transparent",
            color: "var(--white)",
            padding: "15px 36px",
            border: "1px solid var(--border)",
            textDecoration: "none",
            display: "inline-block",
            transition: "all 0.2s",
            alignSelf: isMobile ? "stretch" : "auto",
            textAlign: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--white)";
          }}
        >
          Full Schedule
        </a>
      </div>

      {/* DESKTOP — table, hidden on mobile via display */}
      <div style={{ display: isMobile ? "none" : "block" }}>
        <table
          className="reveal"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid var(--border)",
          }}
        >
          <thead>
            <tr>
              {["Class", "Day", "Time", "Trainer", "Duration", "Type"].map((h) => (
                <th
                  key={h}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 11,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    padding: "16px 24px",
                    textAlign: "left",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--card)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLASSES.map((cls, i) => (
              <tr
                key={cls.name}
                style={{ transition: "background 0.2s" }}
                onMouseEnter={(e) => {
                  Array.from(e.currentTarget.cells).forEach((td) => {
                    td.style.background = "rgba(232,255,0,0.02)";
                    td.style.color = "var(--white)";
                  });
                }}
                onMouseLeave={(e) => {
                  Array.from(e.currentTarget.cells).forEach((td) => {
                    td.style.background = "transparent";
                    td.style.color = "var(--mid)";
                  });
                }}
              >
                <td
                  style={{
                    padding: "20px 24px",
                    borderBottom: i < CLASSES.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 16,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--white)",
                    }}
                  >
                    {cls.name}
                  </div>
                </td>
                {[cls.day, cls.time, cls.trainer, cls.duration].map((val) => (
                  <td
                    key={val}
                    style={{
                      padding: "20px 24px",
                      borderBottom: i < CLASSES.length - 1 ? "1px solid var(--border)" : "none",
                      fontSize: 14,
                      color: "var(--mid)",
                      transition: "all 0.2s",
                    }}
                  >
                    {val}
                  </td>
                ))}
                <td
                  style={{
                    padding: "20px 24px",
                    borderBottom: i < CLASSES.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 10,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      padding: "3px 10px",
                      border: `1px solid ${cls.tagColor}`,
                      color: cls.tagColor,
                    }}
                  >
                    {cls.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE — cards, hidden on desktop via display */}
      <div style={{ display: isMobile ? "flex" : "none", flexDirection: "column", gap: 12 }}>
        {CLASSES.map((cls) => (
          <div
            key={cls.name}
            style={{
              border: "1px solid var(--border)",
              background: "var(--card)",
              padding: "20px",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            {/* Name + tag */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 20,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "var(--white)",
                  lineHeight: 1,
                }}
              >
                {cls.name}
              </div>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  padding: "3px 10px",
                  border: `1px solid ${cls.tagColor}`,
                  color: cls.tagColor,
                  flexShrink: 0,
                }}
              >
                {cls.type}
              </span>
            </div>

            {/* Meta */}
            <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
              {[
                { label: "Day", val: cls.day },
                { label: "Time", val: cls.time },
                { label: "Duration", val: cls.duration },
              ].map((item) => (
                <div key={item.label}>
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 9,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: 2,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 14,
                      letterSpacing: 1,
                      color: "var(--white)",
                    }}
                  >
                    {item.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Trainer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingTop: 12,
                borderTop: "1px solid var(--border)",
              }}
            >
              <div style={{ width: 6, height: 6, background: cls.tagColor, flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                {cls.trainer}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
