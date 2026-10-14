import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Impressum — Entwurf", robots: { index: false, follow: false } };
export default function Impressum() {
  return <main id="main" className={styles.page}>
    <Link className={styles.brand} href="/">hourlane</Link><br />
    <span className={styles.label}>In Vorbereitung</span>
    <h1>Impressum</h1>
    <p className={styles.notice}>Hourlane befindet sich im Aufbau. Diese Seite ist ein Platzhalter und noch kein vollständiges Impressum. Die erforderlichen Betreiberangaben müssen vor dem öffentlichen Start ergänzt und geprüft werden.</p>
    <h2>Angaben zum Betreiber</h2>
    <p>Noch zu ergänzen: vollständiger Name beziehungsweise Unternehmensname, Rechtsform, ladungsfähige Anschrift und geschäftliche Kontaktmöglichkeiten. Register-, Vertretungs- und Umsatzsteuerangaben sind aufzunehmen, soweit sie tatsächlich zutreffen.</p>
    <h2>Öffentlicher Start</h2>
    <p>Die Veröffentlichung erfolgt erst mit vollständigen und geprüften Angaben. Aus dem Arbeitsnamen Hourlane ergibt sich keine Aussage über eine eingetragene Gesellschaft oder Marke.</p>
    <Link className={styles.back} href="/">← Zurück zur Startseite</Link>
  </main>;
}
