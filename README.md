# Hourlane

AI Automation Agency

A project focused on building a professional AI automation agency that helps businesses automate workflows, improve efficiency, and save time.

The website and services will be developed using Codex.

## Projektstand

Stand: 14. Oktober 2026. Hourlane als Arbeitsname, SHK als erste Zielgruppe und Next.js/PostgreSQL wurden freigegeben. Die responsive Website und die lokale Lead-Erfassung sind implementiert. Die ursprüngliche README-Einleitung bleibt oben erhalten.

- [Geschäftsmodell, Zielgruppe, Angebote und offene Entscheidungen](docs/foundation-plan.md)
- [Namensauswahl und visuelle Identität](docs/brand-direction.md)
- [Technik, Lead-Erfassung und Abnahmekriterien](docs/implementation-plan.md)
- [30-Tage-Startplan](docs/launch-roadmap.md)

## Enthalten

- Deutsche Landingpage mit drei Services, interaktivem fiktivem Prozessbeispiel, Zusammenarbeit, FAQ und zugänglichem Mobilmenü.
- Formular mit gemeinsamem Client-/Serverschema, echten PostgreSQL-Transaktionen, Honeypot, atomischem Rate-Limit und Schutz vor doppelten Einträgen.
- Sichtbare Lade-, Fehler- und Erfolgszustände; Erfolg erst nach bestätigter Speicherung. Keine KI-Verarbeitung der Kontaktangaben.
- Versionierte SQL-Migrationen, getrennte Datenbankrollen, Operatorbefehle für Export, Abschluss und Löschung.
- Lokale Fonts, responsive CSS Modules, SEO-Metadaten, Sicherheitsheader und CSP mit individuellen Script-Nonces.
- Integrationstests mit echter Datenbank sowie Browsertests für Desktop und Mobilgeräte.

## Lokal starten

Voraussetzungen: Node.js 22.9 oder neuer (Node 24 empfohlen), npm und Docker mit Compose. In dieser Umgebung wurde Node 24 verwendet.

```sh
npm ci
npm run setup:local
docker compose up -d db
npm run db:migrate
npm run dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen. `setup:local` erzeugt zufällige lokale Zugangsdaten und überschreibt keine vorhandene Konfiguration. Bei bestehender `.env.local` diesen Schritt auslassen. Die lokale Datenbank ist nur an `127.0.0.1:54329` gebunden. **Ausschließlich fiktive Testdaten verwenden.** Ohne Konfiguration bleibt das Formular gesperrt.

Der lokale Schnellstart verwendet einen Datenbankbesitzer. Für Produktion getrennte Runtime-, Migrations- und Operatorrollen gemäß [Betriebsanleitung](docs/development-and-deployment.md) verwenden. Die geprüfte Arbeitsumgebung verwendet bereits getrennte lokale Rollen.

## Prüfen

Testdatenbank einmalig anlegen, danach Migrationen und Tests ausführen:

```sh
docker compose exec -T db createdb -U hourlane hourlane_test
npm run db:migrate:test
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Bei bereits vorhandener Testdatenbank `createdb` auslassen. Browsertests starten selbst eine Produktionsinstanz auf Port 3100 und leeren ausschließlich die kontrollierte lokale Testdatenbank. Bei vorhandenem Chromium kann stattdessen `PLAYWRIGHT_EXECUTABLE_PATH` gesetzt werden. `npm test` überspringt Datenbanktests ohne `TEST_DATABASE_URL`; ein solcher Lauf ist kein Persistenznachweis.

## Noch vor dem öffentlichen Start

Es wurde keine Website öffentlich bereitgestellt und kein kostenpflichtiger Dienst eingerichtet. Impressum und Datenschutz sind bewusst als Entwürfe markiert. Echte Betreiberangaben, Namensprüfung, rechtliche Texte, Hosting-/Datenbankkonten, Domain, Produktionssecrets und Betriebsverantwortung fehlen noch. Öffentliche Datenerfassung bleibt bis zur passenden Konfiguration gesperrt.

Siehe [Entwicklung und Deployment](docs/development-and-deployment.md) und [Prüfprotokoll](docs/verification.md). Zugangsdaten, Datenbankexporte und personenbezogene Daten gehören nicht in dieses öffentliche Repository.
