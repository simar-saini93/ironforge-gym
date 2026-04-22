"use client";

import { useEffect, useState } from "react";

export default function PlanSelector({ selected, onSelect }) {
  const [isMobile, setIsMobile] = useState(false);
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fetch plans from backend
  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(({ plans }) => {
        const formatted = (plans || []).map((p) => ({
          id:       p.id,
          name:     CYCLE_LABEL[p.billing_cycle] || p.billing_cycle,
          cycle:    CYCLE_DURATION[p.billing_cycle] || '',
          price:    String(p.price),
          popular:  p.billing_cycle === 'monthly',
          note:     p.billing_cycle === 'yearly' ? 'Best Value' : null,
          features: CYCLE_FEATURES[p.billing_cycle] || [],
          description: null,
          billing_cycle: p.billing_cycle,
        }));
        setPlans(formatted);
        // Auto-select first plan if nothing selected
        if (formatted.length > 0 && !selected) {
          const monthly = formatted.find((p) => p.billing_cycle === 'monthly');
          onSelect((monthly || formatted[0]).id);
        }
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  // Skeleton loader
  if (loading) {
    return (
      <div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "var(--accent)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 30, height: 1, background: "var(--accent)", display: "block" }} />
          Step 1 — Choose Your Plan
        </div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 4vw, 56px)", lineHeight: 0.95, letterSpacing: 1, marginBottom: 32 }}>
          SELECT A<br />
          <span style={{ WebkitTextStroke: "1px var(--white)", color: "transparent" }}>MEMBERSHIP</span>
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ height: 80, background: "var(--card)", border: "1px solid var(--border)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    );
  }

  // No plans in DB
  if (plans.length === 0) {
    return (
      <div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "var(--accent)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 30, height: 1, background: "var(--accent)", display: "block" }} />
          Step 1 — Choose Your Plan
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, fontFamily: "'Barlow', sans-serif" }}>
          Contact us for membership pricing.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "var(--accent)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 30, height: 1, background: "var(--accent)", display: "block" }} />
        Step 1 — Choose Your Plan
      </div>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 4vw, 56px)", lineHeight: 0.95, letterSpacing: 1, marginBottom: 32 }}>
        SELECT A<br />
        <span style={{ WebkitTextStroke: "1px var(--white)", color: "transparent" }}>MEMBERSHIP</span>
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {plans.map((plan) => {
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
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "rgba(232,255,0,0.4)"; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              {plan.popular && (
                <div style={{ position: "absolute", top: -1, right: 16, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", background: "var(--accent)", color: "var(--black)", padding: "3px 10px", fontWeight: 700 }}>
                  Popular
                </div>
              )}

              {/* Radio */}
              <div style={{ width: 18, height: 18, border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color 0.2s" }}>
                {isSelected && <div style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: "50%" }} />}
              </div>

              {/* Name + features */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: isMobile ? 4 : 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 22 : 28, letterSpacing: 2, color: isSelected ? "var(--accent)" : "var(--white)", transition: "color 0.2s" }}>
                    {plan.name}
                  </span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)" }}>
                    {plan.cycle}
                  </span>
                </div>
                {!isMobile && plan.features.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
                    {plan.features.slice(0, 3).map((f) => (
                      <span key={f} style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "var(--accent)", fontSize: 10 }}>—</span>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 36 : 48, color: "var(--accent)", lineHeight: 1 }}>
                  <sup style={{ fontSize: isMobile ? 14 : 20, verticalAlign: "top", marginTop: isMobile ? 6 : 8, display: "inline-block" }}>$</sup>
                  {plan.price}
                </div>
                {plan.note && (
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--accent)" }}>
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

// ── Mappings ─────────────────────────────────────────────────
const CYCLE_LABEL = {
  day_pass: 'Day Pass',
  weekly:   'Weekly',
  monthly:  'Monthly',
  yearly:   'Yearly',
};

const CYCLE_DURATION = {
  day_pass: 'Single Day',
  weekly:   '7-Day Access',
  monthly:  '30-Day Access',
  yearly:   '365-Day Access',
};

const CYCLE_FEATURES = {
  day_pass: ['Full facility access', 'Locker room & showers', 'Group classes', 'QR entry pass'],
  weekly:   ['Full facility access', 'Locker room & showers', 'Group classes', 'QR entry pass', 'Trainer consultation'],
  monthly:  ['Unlimited access', 'Trainer assignment', 'Progress tracking', 'QR & app access', 'Priority class booking'],
  yearly:   ['Everything in Monthly', 'Dedicated trainer', 'Nutrition guidance', 'Guest passes (×4)', 'Early access to events'],
};
