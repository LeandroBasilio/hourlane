# Prüfprotokoll

Stand: 14. Oktober 2026. Geprüft in der lokalen Arbeitsumgebung, mit ausschließlich fiktiven Daten. Noch kein Produktionsdeployment.

## Erfolgreich geprüft

| Prüfung | Ergebnis |
| --- | --- |
| TypeScript und Produktionsbuild | Erfolgreich mit Next.js 16.4.1 / Node 24.19.0 |
| Schema-/Konfigurationstests und PostgreSQL-Integration | **11 Tests bestanden, keiner übersprungen** |
| Browserintegration, Desktop und Mobil | **8 Tests bestanden**, Chromium |
| Finale Darstellung | 1440, 768 und 360 px ohne horizontalen Overflow |
| Automatisierte Barrierefreiheitsprüfung | Axe, WCAG-2-A/AA- und WCAG-2.1-AA-Regeln: keine gefundenen Verstöße bei den drei geprüften Größen |
| Formular | Validierung, Fokus auf Fehler, tatsächliches Speichern, ehrliche Erfolgsmeldung |
| Unsichere Netzwerkantwort | Server speichert, Antwort geht verloren, Wiederholung erzeugt keine zweite Zeile |
| Parallele Requests | Identische Requests erzeugen eine Zeile; atomisches Limit für neue Anfragen eingehalten |
| Ablehnung | Honeypot, falsche Herkunft, übergroßer Body, falsches Format und ungültige Felder erzeugen keine Leads |
| Fehlende Verbindung | 503 statt Erfolg; Eingaben bleiben bei unbestätigter Browserantwort erhalten |
| Navigation | Mobiles Menü, Escape, Demo-Tabs per Pfeiltasten/Home/End, FAQ und rechtliche Entwurfsseiten |
| App-Neustart | Über HTTP gespeicherter lokaler Datensatz bleibt nach tatsächlichem Neustart des Next-Servers vorhanden; Wiederholung ergibt 200 ohne Duplikat |
| Rollen | Runtime kann erfassen und Idempotenz prüfen; Lesen persönlicher Felder und Löschen von Leads wurden für Runtime erfolgreich verweigert |
| Operator | Export eines Testdatensatzes, Abschluss mit Löschfrist und gezielte Löschung geprüft |
| Lokales Setup | Zufällige geschützte Konfigurationsdateien; vorhandene Dateien werden nicht überschrieben |
| Secrets | Keine lokalen Verbindungswerte oder HMAC-Secrets im Quellcode/Browserbundle gefunden; Konfiguration und Laufzeitdaten durch Git ausgeschlossen |
| Abhängigkeiten | `npm audit --omit=dev --audit-level=high`: keine gemeldeten Schwachstellen zum Prüfzeitpunkt |

Die Darstellung wurde anhand echter Browser-Screenshots geprüft. Die finale Produktionsansicht enthält die Kontrastkorrekturen und SVG-Symbole. Der kleinste überprüfte Kontrast der Eingabefeldgrenze gegen die Eingabefläche beträgt 3,69:1. Automatisierte Checks sind keine vollständige Barrierefreiheitszertifizierung; ein manueller Screenreader-Test steht noch aus.

## Offen oder nicht nachgewiesen

- **Neustart des PostgreSQL-Containers sowie Backup/Wiederherstellung:** Der geplante Docker-Neustart wurde nicht ausgeführt, weil die automatische Freigabeprüfung wegen eines Nutzungslimits nicht abgeschlossen werden konnte. Das war ein technisches Prüfversagen, keine Feststellung unsicherer Ausführung. Der App-Neustart ist separat erfolgreich geprüft; er ersetzt den Datenbank-Neustarttest nicht. Sicherungs-/Wiederherstellungsanweisungen sind dokumentiert, aber noch nicht praktisch ausgeführt.
- **Produktionsbetrieb:** Keine Domain, Anbieteraccounts, produktive Datenbank oder öffentlichen Endpunkte eingerichtet. Region, Proxy-Vertrauen, TLS, Limits, Backupplan und echte Produktionsspeicherung müssen nach Anbieterfreigabe erneut geprüft werden.
- **Rechtliche/geschäftliche Freigabe:** Tatsächliche Betreiberangaben, vollständige Rechtstexte, Marken-/Domainprüfung und Anbieter-/Datenschutzverträge fehlen noch. Entwurfsseiten sind sichtbar als solche gekennzeichnet.
- **Betrieb:** Kein externer Scheduler für regelmäßiges Purge, keine automatische Lead-Benachrichtigung, keine produktive Überwachung. Sichtung und Bearbeitung brauchen eine benannte verantwortliche Person.
- **Weitere Browser und Hilfsmittel:** Safari, Firefox, echte Geräte und manuelle Screenreader-Bedienung noch nicht geprüft. Keine belastbaren Produktions-Core-Web-Vitals aus lokalen Tests ableiten.

## Reproduzieren

Siehe [README](../README.md) und [Betriebsanleitung](development-and-deployment.md). Tests leeren die ausdrücklich getrennte lokale Testdatenbank. Sie dürfen nicht gegen echte Interessentendaten laufen. Ein Testlauf ohne konfigurierte Testdatenbank überspringt Datenbanktests und genügt nicht als Speichernachweis.
