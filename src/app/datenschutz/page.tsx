import type { Metadata } from "next";
import Link from "next/link";
import styles from "../legal.module.css";

export const metadata: Metadata = { title: "Datenschutzhinweise — Entwurf", robots: { index: false, follow: false } };
export default function Datenschutz() {
  return <main id="main" className={styles.page}>
    <Link className={styles.brand} href="/">hourlane</Link><br />
    <span className={styles.label}>Entwurf · 14. Oktober 2026</span>
    <h1>Datenschutzhinweise</h1>
    <p className={styles.notice}>Diese Hinweise beschreiben die Vorbereitung der Website. Sie sind noch keine vollständige Datenschutzerklärung. Für die lokale Vorschau bitte ausschließlich fiktive Testdaten verwenden. Vor dem öffentlichen Start müssen Verantwortlicher, Dienstleister, Rechtsgrundlagen und Fristen feststehen.</p>
    <h2>Ihre Anfrage</h2>
    <p>Das Formular ist dafür vorgesehen, Name, geschäftlich genutzte E-Mail-Adresse, Unternehmen, optional die Branche und eine kurze Beschreibung des Anliegens zu erfassen. Die Angaben sollen die persönliche Bearbeitung einer angefragten Automatisierungsberatung ermöglichen. Bitte keine Daten Ihrer Kunden oder vertrauliche Dokumentinhalte eintragen.</p>
    <h2>Verarbeitung und Schutz</h2>
    <p>In der lokalen Entwicklung werden Testanfragen in einer lokalen Datenbank gespeichert. Das Kontaktformular überträgt keine Angaben an ein KI-Modell. Der Missbrauchsschutz verwendet zeitlich begrenzte, pseudonymisierte Kennungen getrennt von Anfragen. Hosting, Empfänger, Auftragsverarbeitung und gegebenenfalls internationale Übermittlungen müssen für den Produktionsbetrieb noch konkret festgelegt werden.</p>
    <h2>Rechtsgrundlage und Aufbewahrung</h2>
    <p>Die passende Rechtsgrundlage ist abhängig von der konkreten Anfrage und der Rolle der anfragenden Person zu bestimmen. Eine Anfrage meldet Sie nicht zu einem Newsletter an. Löschfristen, mögliche Aufbewahrungspflichten und der Umgang mit Sicherungskopien sind vor dem Start zu prüfen und hier vollständig zu beschreiben.</p>
    <h2>Technisch notwendige Verarbeitung</h2>
    <p>Die Website lädt Schriftdateien lokal. Es sind keine Werbepixel, externen Terminbuchungsfenster oder Besucheranalysedienste eingebunden. Umfang und Dauer technischer Hostingprotokolle sind nach Auswahl des Anbieters zu ergänzen.</p>
    <h2>Verantwortlicher und Rechte</h2>
    <p>Die Kontaktdaten des Verantwortlichen sowie konkrete Informationen über Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, gegebenenfalls Datenübertragbarkeit und die Beschwerde bei einer Aufsichtsbehörde fehlen noch. Diese Angaben müssen vor der öffentlichen Erhebung personenbezogener Daten ergänzt werden.</p>
    <Link className={styles.back} href="/">← Zurück zur Startseite</Link>
  </main>;
}
