# Technischer Umsetzungsplan

Stand: 14. Oktober 2026. Vorschlag vor Architekturfreigabe. **Noch keine Anwendung implementiert.**

## Architekturentscheidung

Empfehlung: **Next.js App Router, React, TypeScript, CSS Modules mit zentralen Design-Tokens, Zod und PostgreSQL**. Eine Anwendung enthält Website und serverseitigen Formulareingang. Überwiegend serverseitig gerenderte Inhalte, JavaScript nur für notwendige Interaktionen. Keine zusätzliche Animationsbibliothek im ersten Umfang.

Next.js passt zu der gewünschten späteren Erweiterung um interaktive Beispiele und zusätzliche Seiten. Für eine dauerhaft reine Unternehmenswebsite wäre Astro mit einem Formular-Endpunkt ebenfalls ausreichend und könnte weniger Browser-JavaScript benötigen. Ein statisches HTML-Frontend allein erfüllt serverseitige Validierung und Speicherung nicht. Sites mit Worker und D1 wäre eine weitere Hostingarchitektur; sie wird nicht parallel als zweite Quelle neben diesem GitHub-Projekt eingerichtet.

Eine PostgreSQL-Datenbank für Entwicklung und Produktion verhindert unterschiedliche Speichermodelle. Lokal: Docker mit dauerhaftem Volume, nur Testdaten. Produktion: verwaltetes PostgreSQL als Vorschlag. Kein SQLite auf flüchtigem Serverless-Dateisystem. SQL-Migrationen und serverseitige parametrisierte Abfragen halten den Datenbestand übertragbar. Kein unnötiges CMS, Login, Kundenportal, eigenes CRM oder KI-Modell für dieses Formular.

Die konkrete unterstützte stabile Next.js-Version wird bei Einrichtung überprüft und im Lockfile festgelegt. Hier steht Node 24.19.0 bereit. [Offizielle Next.js-Installation](https://nextjs.org/docs/app/getting-started/installation).

## Geplante Struktur

```text
src/app/                    Seiten, Layout, Metadaten
src/app/api/leads/route.ts   POST-Endpunkt, Node-Runtime
src/components/             Navigation, Formular, Service- und Prozessansichten
src/content/                Deutsche Texte und deklarierte Beispieldaten
src/lib/leads/              Schema, Normalisierung und Speicherschnittstelle
src/lib/server/             DB-Verbindung, Rate-Limit, Konfiguration
src/styles/                 Design-Tokens und globale Basisregeln
db/migrations/              Versionierte SQL-Migrationen
tests/                      Relevante Integrations- und Browserprüfungen
docs/                       Betrieb, Architektur, Datenschutzvorbereitung
```

Konfigurationsbeispiele folgen mit der Implementierung: `DATABASE_URL`, `APP_ORIGIN`, `RATE_LIMIT_SECRET` ausschließlich als leere bzw. eindeutig fiktive Beispiele; keine echten Zugangsdaten. Keine Datenbankberechtigung über `NEXT_PUBLIC_*` oder im Browser. Runtime-Rolle mit minimalen Rechten, separate Migration-Rolle. Für Serverless eine geeignete gepoolte Verbindung benutzen; TLS und Zertifikatsprüfung beibehalten.

## Websiteumfang

1. Navigation, verständliche Hero-Botschaft und CTA zum Formular.
2. Konkrete Büroprobleme: verteilte Anfragen, fehlende Informationen, langsame Rückmeldungen und manuelles Übertragen.
3. Drei Services mit Umfang, menschlicher Kontrolle und sichtbaren Leistungsgrenzen.
4. Fiktives Ablaufbeispiel; keine Darstellung als vorhandenes Kundenprojekt.
5. Prozess: Erstgespräch → Analyse → begrenzter Plan → Umsetzung → Test und Abnahme → Einführung → Betreuung.
6. Arbeitsweise: vorhandene Werkzeuge, nachvollziehbare Zuständigkeiten, klare Fehlerbehandlung und Dokumentation.
7. Beratung anfragen mit vollständiger Fehler-, Lade- und Erfolgskommunikation.
8. FAQ zu Eignung, vorhandener Software, Kostenmodell, Umsetzung, Wartung, Datenverarbeitung, menschlicher Kontrolle und Ausstieg.
9. Kontakt und Footer. Echte Kontaktdaten erst nach Bereitstellung; keine erfundene E-Mail oder Telefonnummer.
10. Impressums- und Datenschutzentwürfe als unfertige Platzhalter in der Entwicklung. Keine Veröffentlichung mit angeblicher rechtlicher Freigabe.

Deutsch zuerst, Inhalt von Darstellung trennen. Englische Seiten erst bei tatsächlichem Bedarf. Seitentitel, Beschreibung, semantische Überschriften, lokale Fonts, passende Bildgrößen und Social-Metadaten vorsehen. Canonical-URLs und Sitemap erst mit echter Domain konfigurieren. Vorschauzugänge schützen; `noindex` ist kein Zugriffsschutz.

## Lead-Erfassung und echte Persistenz

Das Formular bietet alle gewünschten Felder: vollständiger Name, geschäftlich genutzte E-Mail, Unternehmen, Branche und wichtigste Automatisierungsherausforderung. Vorschlag: Name, E-Mail, Unternehmen und kurze Herausforderung erforderlich; Branche optional, da die Seite bereits SHK fokussiert. Pflichtfelder im Kundentest auf tatsächliche Notwendigkeit prüfen. Geschäftliche Nutzung bedeutet nicht, dass Freemail-Adressen von Einzelunternehmen pauschal abgewiesen werden.

Kein Telefon, Umsatz, Dateiupload oder Newsletter-Abonnement im ersten Formular. Hinweis, keine Kundendaten oder vertraulichen Dokumentinhalte einzutragen. Freitext begrenzen.

```text
Browser → POST /api/leads → Herkunft und Größenlimit
        → Schema und Spamprüfung → DB-Transaktion
        → bestätigter Commit → Erfolg im Browser
```

- Client- und Servervalidierung teilen ein Schema. Server prüft unabhängig von JavaScript: Typen, Länge, E-Mailformat, erlaubte Werte, normalisierte Leerzeichen. Keine starre Zweiwort-Regel für Namen. Unbekannte Felder verwerfen.
- Maximal beispielsweise 16 KiB pro Request, 120 Zeichen für Name, 254 für E-Mail, 160 für Firma und 2.000 für Herausforderung. Genaue Grenzen bei Implementierung testen.
- Parametrisierte SQL-Abfragen; Inhalte niemals ungefiltert als HTML darstellen.
- Persistente Tabelle mit ID, Request-ID, Formularfeldern, Erstellzeit und Version des angezeigten Datenschutzhinweises. Bearbeitungsstatus, Abschlusszeitpunkt und daraus abgeleitetes `delete_after` unterstützen die Löschregel. Keine rohe IP-Adresse im Lead-Datensatz.
- **HTTP 201 erst nach bestätigter Speicherung.** Bei DB-Ausfall 503 und ehrliche Wiederholoption; keine simulierten Erfolge. Nach unklarer Netzwerkantwort nicht behaupten, dass sicher nichts gespeichert wurde.
- Eindeutige Request-ID verhindert doppelte Zeilen bei Wiederholung. Payload-Bindung verhindert, dass dieselbe ID für veränderte Daten einen falschen Erfolg erzeugt.
- Keine öffentliche Liste, kein öffentlicher Lese-Endpunkt. Bei Supabase zusätzlich die Data API absichern: Lead-Tabelle in einem nicht exponierten Schema halten oder öffentliche Rechte entziehen und passende RLS-Regeln prüfen; anonyme Lese- und Schreibversuche testen. Zugriff zunächst über eine Provider-Adminoberfläche mit MFA und minimalen Teamrechten. Direkte PostgreSQL-Zugänge separat absichern; sie erhalten durch Dashboard-MFA keinen zweiten Faktor. Verantwortung und regelmäßige Sichtung vor Start festlegen.
- Optional spätere Benachrichtigung nach Speicherung. Ein Versandfehler darf einen gespeicherten Lead nicht verlieren; vor einem E-Mail-Dienst Anbieter und Kosten separat klären.

## Spam- und Zugriffsschutz

Herkunftsprüfung, Honeypot, Größenlimits und ein atomisches instanzübergreifendes Rate-Limit. Herkunftsprüfung allein stoppt keine Bots. Für Rate-Limits PostgreSQL verwenden, damit zunächst kein weiteres externes System nötig ist. Proxy-IP nur aus der dokumentierten vertrauenswürdigen Hostingkette übernehmen; kein beliebiges `X-Forwarded-For` vertrauen.

Kurzlebige HMAC-Kennungen für Missbrauchsschutz getrennt von Leads, mit automatischer Löschung. Sie sind weiterhin datenschutzrelevant. Honeypot barrierefrei aus regulärer Bedienung herausnehmen; ein Treffer erzeugt eine ehrliche Ablehnung, keinen angeblichen Speichererfolg. `429` mit Retry-After; unerreichbarer Schutzmechanismus darf nicht stillschweigend umgangen werden. CAPTCHA erst bei belegtem Bedarf und nach Anbieter-/Datenschutzprüfung.

TLS, sichere Header und eine zur Anwendung passende Content Security Policy. Keine personenbezogenen Formulardaten oder Secrets in normalen Logs. Diagnose nur mit technischen IDs und Fehlerkategorien. Abhängigkeiten und Produktionsbuild prüfen.

## Anbieter und Kosten – noch nicht gebucht

| Baustein | Vorschlag / Status | Geprüfter Preisstand am 14.10.2026 |
| --- | --- | --- |
| Entwicklung | Lokale Anwendung und lokale PostgreSQL-Testdatenbank | Keine neue Anbieterbuchung erforderlich |
| Websitehosting | Vercel Pro als einfach zu betreibende Option | Ab 20 USD/Monat; Nutzung und weitere Sitze können Mehrkosten verursachen |
| Produktionsdatenbank | Supabase Pro, explizit `eu-central-1` Frankfurt | Ab 25 USD/Monat; zusätzliche Ressourcen/Projekte können Mehrkosten verursachen |
| Domain/Geschäftspostfach | Nach Markenentscheidung auswählen | Noch nicht gewählt oder preislich geprüft |
| KI- oder Automationsanbieter | Für diese Website nicht nötig | Für Kundenpiloten separat entscheiden |

Zusammen sind die genannten Grundtarife etwa **45 USD/Monat**, vor möglichen Steuern, Wechselkurseffekten und Zusatzverbrauch. Kein garantierter Gesamtpreis und keine Freigabe zum Abschluss eines Abonnements. Tarifdetails beim tatsächlichen Start erneut prüfen. [Vercel Preise](https://vercel.com/pricing), [Supabase Preise](https://supabase.com/pricing).

Vercel Hobby ist laut [Tarifbedingungen](https://vercel.com/docs/plans/hobby) auf nicht kommerzielle persönliche Nutzung beschränkt. Supabase Free pausiert nach einer Woche Inaktivität und enthält laut Preisseite keine automatischen Backups; damit ist es keine verlässliche Standardannahme für eine dauerhaft erreichbare Agenturwebsite.

Supabase: konkrete Region Frankfurt auswählen. Die [Regionen-Dokumentation](https://supabase.com/docs/guides/platform/regions) und [Data Residency FAQ](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq) machen deutlich, dass eine Region keine vollständige Rechtskonformität oder ausschließlich deutsche Verarbeitung garantiert. Auftragsverarbeitung, Unterauftragnehmer, Support-/Metadaten und mögliche Transfers separat prüfen. Gleiches gilt für den Websitehoster. Keine Aussage „alle Daten bleiben in Deutschland“.

## Datenschutz und Betreiberangaben

Vor öffentlicher Erfassung: echter Verantwortlicher, Kontakt, Verarbeitungszweck, passende Rechtsgrundlage, Empfänger, Speicherfrist und Betroffenenrechte. Datenminimierung und Verträge mit Auftragsverarbeitern prüfen. Eine regionale Datenbank ersetzt diese Arbeit nicht. [DSGVO, insbesondere Art. 5, 6, 13 und 28](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679).

Eine eigene vorvertragliche Anfrage kann unter Art. 6 Abs. 1 lit. b fallen; bei Mitarbeitenden eines Unternehmens kommt nach Prüfung lit. f in Betracht. Keine pauschale Pflichtcheckbox „Ich stimme der Datenschutzerklärung zu“. Transparenter Hinweis am Formular; etwaige spätere Werbeeinwilligung getrennt und freiwillig.

Vorgeschlagene Betriebsregel zur Prüfung: erfolglose Anfragen 90 Tage nach Abschluss löschen, sofern keine andere begründete Notwendigkeit besteht. Das ist keine gesetzlich vorgegebene Standardfrist. Löschauftrag, Backup-Aufbewahrung und Wiederherstellung miteinander abstimmen. Backups nicht unbegrenzt behalten.

Lokale Fonts, zunächst keine Tracking-Pixel, keine fremden Termin-Embeds. Ein Banner richtet sich nach tatsächlich eingesetzten Speicher-/Zugriffstechniken und deren rechtlicher Einordnung: [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html). Impressum anhand echter Betreiberangaben und [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html) erstellen. Diese Vorlage ist keine abschließende Rechtsprüfung.

## Abnahme vor Veröffentlichung

| Bereich | Erforderlicher Nachweis |
| --- | --- |
| Funktion | Gültiges Browserformular speichert; unabhängige SQL-Abfrage findet genau den Datensatz |
| Dauerhaftigkeit | App und DB neu starten; Testdatensatz bleibt erhalten |
| Fehlerfälle | DB aus, ungültiges JSON, zu großer Body und falsche Eingaben: kein erfundener Erfolg, verständliche Rückmeldung |
| Spam | Honeypot, Rate-Limit und parallele Requests geprüft; verworfene Anfragen erzeugen keine Leads |
| Wiederholungen | Gleiche Request-ID speichert nicht doppelt; veränderte Payload wird korrekt behandelt |
| Zugriff | Anonyme Lesezugriffe scheitern; Browserbundle und Logs enthalten keine Secrets oder Formularinhalte |
| Datenbetrieb | Testdatensatz exportieren und löschen; Backup wiederherstellen; verantwortliche Person und Löschablauf dokumentieren |
| Bedienung | Tastatur, Fokus, Fehlermeldungen, Screenreader-Status, Zoom, reduzierte Bewegung und Kontrast prüfen |
| Responsive | Mindestens 360, 768 und 1440 px; keine abgeschnittenen Formulare oder horizontales Scrollen |
| Qualität | Typecheck, relevante Integrations-/Browsertests, Produktionsbuild und Performanceprüfung |
| Veröffentlichung | Domain, HTTPS, echter Produktionsdatensatz-Test, rechtliche Informationen und Rückweg zur letzten Version geprüft |

Noch nicht durchführbare Tests werden ausdrücklich als offen dokumentiert. Fehlende Produktionszugänge bedeuten: lokal nachweisbare Persistenz, aber keine Behauptung bereits gespeicherter Produktionsleads. Ohne Speicherverbindung wird das Formular entsprechend gekennzeichnet bzw. gesperrt.
