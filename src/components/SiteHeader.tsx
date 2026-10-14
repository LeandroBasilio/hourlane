"use client";

import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/Brand";
import styles from "./SiteHeader.module.css";

const links = [
  { href: "#leistungen", label: "Leistungen" },
  { href: "#beispiel", label: "Ein Beispiel" },
  { href: "#ablauf", label: "Zusammenarbeit" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    }
    function handleOutside(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handleOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handleOutside);
    };
  }, [open]);

  return (
    <header className={styles.header} ref={header}>
      <div className={styles.inner}>
        <a
          className={styles.brandLink}
          href="#start"
          aria-label="Hourlane – zur Startseite"
          onClick={() => setOpen(false)}
        >
          <Brand className={styles.brand} />
        </a>
        <button
          ref={toggle}
          className={styles.menuToggle}
          type="button"
          aria-expanded={open}
          aria-controls="main-navigation"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          onClick={() => setOpen(!open)}
        >
          <span>{open ? "Schließen" : "Menü"}</span>
          <span
            className={`${styles.menuIcon} ${open ? styles.menuIconOpen : ""}`}
            aria-hidden="true"
          >
            <span />
            <span />
          </span>
        </button>
        <nav
          id="main-navigation"
          className={`${styles.navigation} ${open ? styles.navigationOpen : ""}`}
          aria-label="Hauptnavigation"
        >
          {links.map((link) => (
            <a href={link.href} key={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <a
            className={styles.contactLink}
            href="#kontakt"
            onClick={() => setOpen(false)}
          >
            Sprechen wir darüber{" "}
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 18 18 6M6 6h12v12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  );
}
