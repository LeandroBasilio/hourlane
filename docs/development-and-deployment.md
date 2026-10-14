# Entwicklung und Betrieb

## Architektur und Konfiguration

Next.js 16.4.1, React 19.3.1, TypeScript, CSS Modules, Zod und PostgreSQL 17. Versionen und transitive Abhängigkeiten sind im Lockfile festgelegt. Ein Node-Server rendert Seiten und verarbeitet `POST /api/leads`. Ein reiner statischer Export kann dieses Formular nicht betreiben. Layouts werden wegen der individuellen CSP-Nonces dynamisch gerendert; Fonts und andere statische Assets bleiben cachebar.

`npm ci`, `npm run setup:local`, `docker compose up -d db`, `npm run db:migrate`, `npm run dev` starten eine frische lokale Arbeitskopie. Auf die Datenbank-Healthcheck-Bereitschaft warten, falls die erste Migration unmittelbar nach dem Containerstart fehlschlägt. `npm run setup:local` verweigert vorhandene `.env`/`.env.local`. Einen zusätzlichen Port oder andere Konfiguration ausdrücklich in den lokalen Dateien ändern, niemals Systemvariablen wie HOME umwidmen.

| Variable | Zweck |
| --- | --- |
| `DATABASE_URL` | Runtime-Verbindung, in Produktion nur notwendige Tabellen-/Spaltenrechte |
| `MIGRATION_DATABASE_URL` | Optionaler Besitzerzugang für Migrationen; nur in abgesicherter Administrationsumgebung |
| `OPERATOR_DATABASE_URL` | Separater Zugang für Export, Abschluss und Löschung |
| `TEST_DATABASE_URL` | Separate lokale Datenbank `hourlane_test`; niemals Produktionsdaten |
| `APP_ORIGIN` | Exakte Herkunft ohne abschließenden Slash, lokal `http://localhost:3000`, öffentlich HTTPS |
| `RATE_LIMIT_SECRET` | Zufälliger serverseitiger HMAC-Schlüssel, mindestens 32 Zeichen |
| `LEAD_CAPTURE_ENABLED` | Nur `true` erlaubt Datenerfassung, vollständige Konfiguration vorausgesetzt |
| `SITE_LAUNCH_READY` | Erst nach vollständiger Produktions-/Rechtsvorbereitung auf `true` setzen |
| `PRIVACY_NOTICE_VERSION` | Version der tatsächlich angezeigten Hinweise; öffentlich kein `draft`-Wert |
| `TRUST_PROXY` | Optional `vercel`, nur zusammen mit dem echten Plattformmerkmal `VERCEL=1` |
| `PLAYWRIGHT_EXECUTABLE_PATH` | Optional vorhandener Chromium-Pfad für lokale Tests |

Die Beispieldatei enthält keine realen Credentials. Keine dieser Variablen benötigt `NEXT_PUBLIC_`. Secrets in Hosting-/CI-Secretverwaltung setzen; Produktionssecrets nicht in Entwicklungsdateien kopieren. Migrationen und Operatorzugänge gehören nicht in die Runtime-Umgebung des Webservers. `SITE_LAUNCH_READY` vor dem Build setzen, damit Robots-/Sitemap-Metadaten den gewünschten Stand erhalten. Schutz vor Indexierung ist kein Zugriffsschutz.

## Datenbank und Rechte

Das Schema `hourlane` ist privat. Migrationen laufen transaktional, verwenden eine Sperre gegen parallele Ausführung und prüfen gespeicherte Checksummen. Bereits angewandte SQL-Dateien nicht verändern; eine weitere Migration anlegen.

Für Produktion zwei Rollen über die Provider-Administration anlegen: `hourlane_runtime` und `hourlane_operator`, ohne Besitzerrechte. `db/runtime-role.sql` als Administrator ausführen. Runtime darf Leads anlegen und für idempotente Wiederholungen nur Request-ID/Payload-Hash lesen. Operator darf Leads lesen, abschließen und löschen. Migrationszugang separat halten. Rollen besitzen keine Weboberfläche; Provider-Dashboard mit MFA absichern. Direkte PostgreSQL-Zugänge brauchen eigenen Schutz.

Bei Supabase `hourlane` nicht in exponierte Data-API-Schemas aufnehmen und keine Rechte an `anon` oder `authenticated` vergeben. Die Anwendung benutzt PostgreSQL direkt, keinen Browser-Supabase-Key. Geeigneten Connection-Pooler und Zertifikatsprüfung verwenden; TLS nicht deaktivieren. Region explizit `eu-central-1` auswählen, wenn dieser Anbieter freigegeben wird.

Die lokale Compose-Konfiguration bindet den Port ausschließlich an Loopback. `docker compose stop` stoppt ohne Datenverlust. `docker compose down` entfernt Container, behält das benannte Volume. **`down -v` würde lokale Daten löschen und gehört nicht zum normalen Start-/Stoppablauf.**

## Formular und Fehlerbehandlung

Der Client sendet die Felder zusammen mit einer zufälligen Request-ID. Der Server prüft Herkunft, Content-Type, tatsächliche Bodygröße (16 KiB), Schema und Honeypot. Danach folgen eine Datenbanktransaktion, Idempotenzprüfung, atomisches Rate-Limit und Insert. Erst ein bestätigter Commit ergibt `201`; eine identische Wiederholung ergibt `200`. Gleiche ID mit anderer normalisierter Payload ergibt `409`.

Eingaben bleiben bei Netzfehlern erhalten. Solange sie unverändert sind, verwendet eine Wiederholung dieselbe Request-ID. Nach Bearbeitung entsteht eine neue Anfrage. Dieser Schutz gilt innerhalb der geöffneten Formularinstanz; nach einem vollständigen Neuladen können manuell neu eingegebene identische Inhalte einen neuen Vorgang erzeugen. Es werden bewusst keine persönlichen Entwürfe im Browser-Storage abgelegt.

Fehler: `422` für ungültige Felder/Honeypot, `403` für falsche Herkunft, `413` für Übergröße, `415` für falsches Format, `429` mit Retry-After, `503` bei fehlender Konfiguration oder nicht bestätigter Speicherung. Kein öffentlicher Lead-Lese-Endpunkt. Datenbankfehler werden als generische Kategorien protokolliert, ohne Eingaben oder Verbindungswerte.

## Missbrauchsschutz

Fünf neue Anfragen pro 15-Minuten-Fenster, atomisch in PostgreSQL. Wiederholungen eines bereits gespeicherten identischen Requests verbrauchen keinen weiteren Platz. Standardmäßig gilt ein gemeinsames Limit für die Anwendung; frei eingesandte IP-Header werden ignoriert. Das ist konservativ, kann aber bei vielen gleichzeitigen Besuchern zu Ablehnungen führen.

Nur auf einer tatsächlichen Vercel-Bereitstellung kann `TRUST_PROXY=vercel` aktiviert werden. Dann wird die validierte IP aus `x-vercel-forwarded-for` verwendet; fehlende oder mehrdeutige Werte fallen auf das gemeinsame Limit zurück. [Vercels Header-Dokumentation](https://vercel.com/docs/headers/request-headers). Bei anderen Hostern die tatsächliche vertrauenswürdige Proxykette prüfen und eine passende Strategie implementieren, statt beliebige Weiterleitungsheader freizuschalten.

Es werden nur fensterabhängige HMAC-Kennungen gespeichert. Abgelaufene Kennungen werden beim nächsten gültigen Request und beim Purge entfernt. Bei Inaktivität erfolgt keine automatische Entfernung ohne geplanten Purge-Lauf. Das Rate-Limit schützt den Formularfluss, ersetzt aber keinen vorgeschalteten DDoS-/Requestschutz des Hosters.

## Anfragen bearbeiten

Neue Leads müssen regelmäßig über einen abgesicherten Operatorzugang gesichtet werden. Es gibt derzeit keine automatische E-Mail-Benachrichtigung oder CRM-Anbindung. Keine festen Antwortzeiten auf der Website versprechen, die organisatorisch nicht abgedeckt sind.

```sh
npm run leads -- export --id UUID --confirm-pii
npm run leads -- export --all --confirm-pii
npm run leads -- close --id UUID --confirm
npm run leads -- delete --id UUID --confirm
npm run leads -- purge --confirm
```

`UUID` durch eine vorhandene Lead-ID ersetzen. Export schreibt personenbezogene Angaben nach stdout: nur in einer geschützten Operatorumgebung ausführen, nicht in öffentlichen CI-Logs oder Chats. Für reines JSON beim Umleiten `npm run --silent leads -- export --all --confirm-pii` verwenden. Dateien verschlüsselt und nur mit nötigen Berechtigungen aufbewahren; nicht committen.

`close` setzt Abschlusszeitpunkt und eine vorgeschlagene Löschfrist von 90 Tagen. Das ist eine technische Betriebsregel, keine gesetzliche Standardfrist. Vor Produktion die passende Frist prüfen und gegebenenfalls per Migration/Code ändern. Offene Leads werden nicht automatisch gelöscht; die verantwortliche Person muss sie sichten und schließen. `delete` löscht genau eine ID; `purge` löscht fällige geschlossene Leads und abgelaufene Rate-Limit-Kennungen.

Vor Produktion einen täglichen abgesicherten Scheduler für Purge einrichten; derzeit ist kein externer Scheduler eingerichtet. Keine öffentliche Löschroute anlegen. Auch Backups brauchen begrenzte Aufbewahrung und ein Verfahren, damit bei Wiederherstellung bereits erledigte Löschungen erneut berücksichtigt werden.

## Testen und Wiederherstellen

`npm run db:migrate:test` erwartet eine separate lokale Datenbank mit geeignetem `_test`-Namen. `npm test` prüft Schema, Freigabekonfiguration und die echte Datenbank. Ohne Testverbindung werden Integrationstests ausdrücklich übersprungen. `npm run test:e2e` erfordert eine Testverbindung und einen vorhandenen Produktionsbuild; es startet und stoppt den Server auf 3100 selbst. Nicht parallel zu anderen Tests derselben Datenbank ausführen.

Für eine lokale Sicherungsprüfung ausschließlich fiktive Daten verwenden. Beispiel für die eigene Entwicklungsdatenbank:

```sh
mkdir -p .local
docker compose exec -T db pg_dump -U hourlane -d hourlane -n hourlane --no-owner --no-privileges > .local/local-test-backup.sql
docker compose exec -T db createdb -U hourlane hourlane_restore_test
docker compose exec -T db psql -U hourlane -d hourlane_restore_test -v ON_ERROR_STOP=1 < .local/local-test-backup.sql
```

Die Wiederherstellung erfolgt ausschließlich in eine neue Datenbank, nie über die aktive. Inhalt, Schema und Migrationen danach prüfen. Ein Backup ohne Rechte ersetzt keine erneute Rollen-/Berechtigungseinrichtung. Für Produktion einen providergeeigneten verschlüsselten Sicherungs- und Wiederherstellungsplan festlegen; lokale Tests belegen keine Produktions-Wiederherstellungszeit.

## Veröffentlichung nach separater Anbieterfreigabe

1. Name auf Nutzbarkeit prüfen; tatsächliche Betreiberangaben sowie vollständige Impressums-/Datenschutztexte einsetzen. Entwurfsseiten entfernen bzw. ersetzen. Datenverarbeitung, Fristen, Auftragsverarbeitung und mögliche Transfers konkret prüfen.
2. Hosting, Datenbanktarif, Domain und Gesamtkosten bestätigen. Es sind keine externen Accounts oder Abonnements eingerichtet.
3. Projekt aus diesem Repository bereitstellen. Build `npm run build`, Start bei einem Node-Host `next start` mit dessen Host-/Portkonfiguration; Vercel erkennt Next.js selbst. Die lokalen npm-Skripte binden aus Vorsicht an `127.0.0.1`.
4. Datenbank und Rollen anlegen; Migrationen mit separat gesichertem Besitzerzugang durchführen; Runtime nur den eingeschränkten Zugang geben. TLS, Region, Limits und Backups prüfen.
5. Exakte HTTPS-Domain in `APP_ORIGIN`, neue produktive Secrets und nicht vorläufige Datenschutzhinweis-Version setzen. `SITE_LAUNCH_READY=true` und `LEAD_CAPTURE_ENABLED=true` erst nach tatsächlicher Vorbereitung. Neu bauen und ausrollen.
6. Vorschau schützen, Domain/HTTPS prüfen, eine kontrollierte Produktionsanfrage über den Browser senden und Speicherung unabhängig verifizieren. Danach Testdaten entfernen. Wiederholungen, Fehlerfälle und Proxy-Limit auf dem echten Anbieter erneut prüfen.
7. Verantwortung für Anfragen, Fehlermeldungen, Updates, täglichen Purge und regelmäßige Wiederherstellungsprüfungen festlegen.

Rückweg: vorherige App-Version bereithalten. Datenbankmigrationen möglichst kompatibel halten; ein App-Rollback setzt Datenbankänderungen nicht automatisch zurück. Datenändernde Wiederherstellung nur nach geprüftem Sicherungsplan.
