"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function scrollToHash() {
  const hash = window.location.hash;
  if (!hash) return;

  const el = document.querySelector(hash);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

export default function HashScroll() {
  const pathname = usePathname();

  // Fires on every route change (e.g. /contact → /)
  useEffect(() => {
    const timer = setTimeout(scrollToHash, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Fires on hash-only changes on the same page (e.g. / → /#about)
  useEffect(() => {
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return null;
}
