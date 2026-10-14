import Link from "next/link";
import styles from "./legal.module.css";

export default function NotFound() {
  return <main id="main" className={styles.page}><Link className={styles.brand} href="/">hourlane</Link><h1>Hier geht es nicht weiter.</h1><p>Diese Seite wurde nicht gefunden. Auf der Startseite finden Sie unsere Leistungen und den Kontaktbereich.</p><Link className={styles.back} href="/">Zur Startseite →</Link></main>;
}
