"use client";

import { useEffect, useState } from "react";

const CYCLE_LABEL = {
  day_pass: 'Day Pass',
  weekly:   'Weekly',
  monthly:  'Monthly',
  yearly:   'Yearly',
};

const CYCLE_DURATION = {
  day_pass: 'Single Day Access',
  weekly:   '7-Day Access',
  monthly:  '30-Day Access',
  yearly:   '365-Day Access',
};

const PRICE_NOTE = {
  day_pass: 'per visit',
  weekly:   'per week',
  monthly:  'per month',
  yearly:   'per year — best value',
};

const CYCLE_FEATURES = {
  day_pass: ['Full facility access', 'Locker room & showers', 'Group classes', 'QR entry pass'],
  weekly:   ['Full facility access', 'Locker room & showers', 'Group classes', 'QR entry pass', 'Trainer consultation'],
  monthly:  ['Unlimited access', 'Trainer assignment', 'Progress tracking', 'QR & app access', 'Priority class booking'],
  yearly:   ['Everything in Monthly', 'Dedicated trainer', 'Nutrition guidance', 'Guest passes (×4)', 'Early access to events'],
};

const CYCLE_CTA = {
  day_pass: 'Get Pass',
  weekly:   'Get Weekly',
  monthly:  'Join Monthly',
  yearly:   'Go Annual',
};

export default function Membership() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(({ plans }) => {
        const formatted = (plans || []).map((p) => ({
          id:        p.id,
          name:      CYCLE_LABEL[p.billing_cycle]    || p.billing_cycle,
          cycle:     CYCLE_DURATION[p.billing_cycle] || '',
          price:     String(Math.round(Number(p.price))),
          priceNote: PRICE_NOTE[p.billing_cycle]     || '',
          featured:  p.billing_cycle === 'monthly',
          badge:     p.billing_cycle === 'monthly' ? 'Most Popular' : null,
          features:  CYCLE_FEATURES[p.billing_cycle] || [],
          cta:       CYCLE_CTA[p.billing_cycle]      || 'Join Now',
        }));
        setPlans(formatted);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Responsive columns ───────────────────────────────────
  // Mobile: 1 col | Tablet: 2 col | Desktop: 4 col (all in one row)
  const getColumns = () => {
    if (isMobile) return "1fr";
    if (isTablet) return "1fr 1fr";
    return "repeat(4, 1fr)";
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
      {/* Header — unchanged */}
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
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "var(--accent)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 30, height: 1, background: "var(--accent)", display: "block" }} />
            Pricing
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px, 5vw, 80px)", lineHeight: 0.95, letterSpacing: 1 }}>
            MEMBERSHIP<br />
            <span className="text-outline">PLANS</span>
          </h2>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: isMobile ? "100%" : 300, lineHeight: 1.7, fontWeight: 300 }}>
          No hidden fees. Cancel anytime. Choose the plan that fits your schedule.
        </p>
      </div>

      {/* Plans grid */}
      {loading ? (
        <div className="reveal" style={{ display: "grid", gridTemplateColumns: getColumns(), gap: 1, background: "var(--border)", border: "1px solid var(--border)" }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ background: "var(--card)", padding: isMobile ? "36px 24px" : "48px 32px", minHeight: 400, animation: "pulse 1.5s infinite" }}>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
              {[40, 60, 80, 14, 14, 14].map((w, i) => (
                <div key={i} style={{ height: i === 2 ? 64 : 14, width: `${w}%`, background: "var(--border)", marginBottom: 16, borderRadius: 2 }} />
              ))}
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="reveal" style={{ textAlign: "center", padding: "60px 0", border: "1px solid var(--border)", background: "var(--card)" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)" }}>
            Contact us for membership pricing
          </p>
        </div>
      ) : (
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
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${plan.featured ? "plan-card-featured" : ""}`}
              style={{
                background: plan.featured ? "#0f0f0f" : "var(--card)",
                padding: isMobile ? "36px 24px" : "48px 32px",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s",
              }}
            >
              {plan.badge && (
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", background: "var(--accent)", color: "var(--black)", padding: "4px 12px", display: "inline-block", marginBottom: 24, fontWeight: 700 }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 36 : 38, letterSpacing: 2, marginBottom: 8, marginTop: plan.badge ? 0 : 34 }}>
                {plan.name}
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "var(--muted)", marginBottom: 24 }}>
                {plan.cycle}
              </div>

              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isMobile ? 56 : 64, lineHeight: 1, color: "var(--accent)", marginBottom: 4 }}>
                <sup style={{ fontSize: isMobile ? 22 : 24, verticalAlign: "top", marginTop: isMobile ? 8 : 10, display: "inline-block" }}>$</sup>
                {plan.price}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>
                {plan.priceNote}
              </div>

              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 32, padding: 0 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--mid)" }}>
                    <span style={{ color: "var(--accent)", fontFamily: "'Barlow Condensed', sans-serif", flexShrink: 0 }}>—</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="/join"
                style={{
                  display: "block", textAlign: "center", width: "100%",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 13, letterSpacing: 3, textTransform: "uppercase",
                  fontWeight: 700, textDecoration: "none", transition: "all 0.2s",
                  ...(plan.featured
                    ? { background: "var(--accent)", color: "var(--black)", padding: "16px 24px", border: "none" }
                    : { background: "transparent", color: "var(--white)", padding: "15px 24px", border: "1px solid var(--border)" }),
                }}
                onMouseEnter={(e) => {
                  if (plan.featured) { e.currentTarget.style.background = "var(--white)"; }
                  else { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }
                }}
                onMouseLeave={(e) => {
                  if (plan.featured) { e.currentTarget.style.background = "var(--accent)"; }
                  else { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--white)"; }
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
