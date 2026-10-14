import { Brand } from "@/components/Brand";
import LeadForm from "@/components/LeadForm";
import { SiteHeader } from "@/components/SiteHeader";
import { WorkflowDemo } from "@/components/WorkflowDemo";
import { isLeadCaptureConfigured } from "@/lib/server/config";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ServiceIcon({ type }: { type: "inbox" | "phone" | "document" }) {
  return (
    <svg
      aria-hidden="true"
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {type === "inbox" ? (
        <>
          <path d="M6 8h20v17H6zM6 18h6l2 3h4l2-3h6M11 12h10" />
        </>
      ) : type === "phone" ? (
        <>
          <path d="M10 5H6v5c0 8.8 7.2 16 16 16h4v-5l-6-2-3 3a18 18 0 0 1-7-7l3-3-3-7Z" />
          <path d="M20 6a7 7 0 0 1 6 6m-6-1a3 3 0 0 1 2 2" />
        </>
      ) : (
        <>
          <path d="M8 5h11l5 5v18H8V5Zm10 0v6h6M12 16h8m-8 5h6" />
        </>
      )}
    </svg>
  );
}

const services = [
  {
    number: "01",
    icon: "inbox" as const,
    title: "Anfragen ordnen.",
    description:
      "Aus Nachrichten werden übersichtliche Vorgänge. Anliegen, Kontaktdaten und offene Fragen stehen dort, wo Ihr Büro weiterarbeitet.",
    input: "Postfach oder Formular",
    output: "Eine klare Aufgabenübersicht",
    tags: [
      "Angaben übernehmen",
      "Lücken erkennen",
      "Zuständigkeit vorschlagen",
    ],
  },
  {
    number: "02",
    icon: "phone" as const,
    title: "Rückrufe koordinieren.",
    description:
      "Weniger Hin und Her bei der Abstimmung. Ein klarer Ablauf verbindet Rückrufwünsche mit Ihren festgelegten Zeitfenstern.",
    input: "Rückrufwunsch",
    output: "Ein abgestimmter nächster Schritt",
    tags: [
      "Zeitfenster berücksichtigen",
      "Bestätigung vorbereiten",
      "Änderungen erfassen",
    ],
  },
  {
    number: "03",
    icon: "document" as const,
    title: "Angebote nachhalten.",
    description:
      "Offene Angebote bleiben sichtbar. Ihr Team weiß, wo eine Rückmeldung fehlt und wann ein persönlicher Kontakt sinnvoll ist.",
    input: "Offenes Angebot",
    output: "Erinnerung mit Zuständigkeit",
    tags: [
      "Status im Blick behalten",
      "Intern erinnern",
      "Nachricht vorbereiten",
    ],
  },
];

const process = [
  {
    number: "01",
    title: "Verstehen",
    text: "Wir sehen uns mit Ihnen einen konkreten Ablauf an. Wo entsteht Aufwand? Was funktioniert bereits?",
  },
  {
    number: "02",
    title: "Begrenzen",
    text: "Ein klarer Umfang, ein nachvollziehbares Angebot und gemeinsam festgelegte Erfolgskriterien.",
  },
  {
    number: "03",
    title: "Umsetzen",
    text: "Wir verbinden passende Werkzeuge und testen typische Fälle, Ausnahmen und Fehler gemeinsam.",
  },
  {
    number: "04",
    title: "Übergeben",
    text: "Ihr Team erhält eine verständliche Einweisung und Dokumentation. Sie geben den Ablauf frei.",
  },
  {
    number: "05",
    title: "Betreuen",
    text: "Auf Wunsch begleiten wir den Betrieb. Umfang, Reaktionszeiten und Kosten vereinbaren wir vorher.",
  },
];

const faqs = [
  {
    question: "Für welche Betriebe ist Hourlane gedacht?",
    answer:
      "Unser erstes Angebot richtet sich an Sanitär-, Heizungs- und Klimabetriebe mit etwa 5 bis 25 Beschäftigten und einem eigenen Büro. Entscheidend ist, dass ein wiederkehrender Ablauf Zeit bindet und Ihre verwendeten Werkzeuge eine geeignete Anbindung erlauben. Das prüfen wir gemeinsam.",
  },
  {
    question: "Müssen wir unsere bestehende Software wechseln?",
    answer:
      "Wir beginnen mit den Werkzeugen, die Sie bereits nutzen. Zuerst prüfen wir vorhandene Funktionen und Schnittstellen. Eine Anbindung ist nicht bei jeder Software möglich oder sinnvoll. Wenn dafür ein Wechsel oder eine neue Lizenz nötig wäre, besprechen wir das vor einem Angebot.",
  },
  {
    question: "Was kostet eine Automatisierung?",
    answer:
      "Der Preis hängt vom Ablauf, den Schnittstellen und dem vereinbarten Umfang ab. Nach der Prüfung erhalten Sie ein konkretes Angebot. Einrichtung, optionale Betreuung sowie externe Software- und Verbrauchskosten werden getrennt ausgewiesen. Es entstehen keine kostenpflichtigen Buchungen ohne Ihre Zustimmung.",
  },
  {
    question: "Wie schnell kann ein erster Ablauf starten?",
    answer:
      "Das hängt von den vorhandenen Systemen, verfügbaren Zugängen und nötigen Tests ab. Wir beginnen mit einem begrenzten Pilotablauf und vereinbaren einen realistischen Zeitplan, sobald die technische Machbarkeit geklärt ist. Eine pauschale Fertigstellung innerhalb weniger Tage versprechen wir nicht.",
  },
  {
    question: "Wo kommt KI zum Einsatz?",
    answer:
      "KI kann Freitext zusammenfassen oder Vorschläge vorbereiten. Für eindeutige Aufgaben wie Statuswechsel oder Zeitfenster nutzen wir feste Regeln. Wir prüfen zuerst, ob KI überhaupt einen Nutzen bringt. Technische Beratung, Notfallbewertung und verbindliche Angebote bleiben bei Ihrem Fachteam.",
  },
  {
    question: "Wer kontrolliert die Ergebnisse?",
    answer:
      "Ihr Team behält die Entscheidung. Unklare Fälle werden zur Prüfung markiert. KI-generierte Nachrichten werden zunächst nur als Entwurf vorbereitet und benötigen eine menschliche Freigabe. Die ursprüngliche Anfrage bleibt für die Prüfung zugänglich.",
  },
  {
    question: "Wie werden Kundendaten behandelt?",
    answer:
      "Vor einer Umsetzung klären wir, welche Daten nötig sind, wer Zugriff erhält, wo die beteiligten Dienste Daten verarbeiten und welche Verträge erforderlich sind. Wir wählen den Ablauf gemeinsam mit Ihnen. Bitte senden Sie im ersten Kontakt keine echten Kundendaten oder vertraulichen Dokumente.",
  },
  {
    question: "Was passiert nach der Einrichtung?",
    answer:
      "Sie erhalten eine Einweisung, eine Dokumentation und die vereinbarte Übergabe. Eine laufende Betreuung können wir separat vereinbaren. Darin werden Überwachung, Anpassungen, Reaktionszeiten und Kosten konkret festgelegt. Zugänge, Exportmöglichkeiten und das Ende einer Zusammenarbeit regeln wir vorab.",
  },
];

export default function Home() {
  const leadCaptureEnabled = isLeadCaptureConfigured();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section
          className={`${styles.hero} ${styles.container}`}
          id="start"
          aria-labelledby="hero-heading"
        >
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.smallDot} />
              KI-AUTOMATISIERUNG FÜR SHK-BETRIEBE
            </p>
            <h1 id="hero-heading">
              Weniger
              <br />
              Büroarbeit.
              <br />
              <span>Mehr Betrieb.</span>
            </h1>
            <p className={styles.heroDescription}>
              Anfragen ordnen. Rückrufe koordinieren. Angebote nachhalten. Wir
              machen aus wiederkehrender Büroarbeit klare Abläufe – mit Ihrem
              Team am Steuer.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="#kontakt">
                Automatisierung besprechen <Arrow diagonal />
              </a>
              <a className={styles.textLink} href="#beispiel">
                Beispiel ansehen <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className={styles.heroNote}>
              <Arrow /> Für Sanitär-, Heizungs- und Klimabetriebe.
            </p>
          </div>
          <figure
            className={styles.heroVisual}
            aria-label="Beispielhafter Ablauf: Eine neue Anfrage wird geordnet und Ihrem Team zur Prüfung vorgelegt."
          >
            <div className={styles.visualHeader}>
              <span>VOM POSTEINGANG ZUM NÄCHSTEN SCHRITT</span>
              <Arrow diagonal />
            </div>
            <div className={styles.visualGrid} aria-hidden="true" />
            <div className={styles.visualFlow}>
              <div className={styles.incomingCard}>
                <span className={styles.incomingIcon}>
                  <ServiceIcon type="inbox" />
                </span>
                <div>
                  <small>01 / DER EINGANG</small>
                  <strong>Eine neue Anfrage.</strong>
                  <span>„Wir möchten unser Bad modernisieren.“</span>
                </div>
                <span className={styles.unreadDot} aria-hidden="true" />
              </div>
              <div className={styles.connector}>
                <span />
                <span aria-hidden="true">↓</span>
                <small>Informationen ordnen</small>
              </div>
              <div className={styles.organizedCard}>
                <div className={styles.organizedHeading}>
                  <span className={styles.organizedIcon} aria-hidden="true">
                    ≡
                  </span>
                  <div>
                    <small>02 / DER ÜBERBLICK</small>
                    <strong>Alles an seinem Platz.</strong>
                  </div>
                  <span className={styles.draftBadge}>Entwurf</span>
                </div>
                <div className={styles.organizedRow}>
                  <span>Anliegen</span>
                  <strong>Badmodernisierung</strong>
                </div>
                <div className={styles.organizedRow}>
                  <span>Rückrufwunsch</span>
                  <strong>Nachmittags</strong>
                </div>
                <div className={styles.organizedMissing}>
                  <span aria-hidden="true">＋</span> Fehlende Angaben sichtbar
                  machen
                </div>
              </div>
              <div className={styles.connector}>
                <span />
                <span aria-hidden="true">↓</span>
                <small>Nächsten Schritt vorbereiten</small>
              </div>
              <div className={styles.approvalCard}>
                <span className={styles.approvalIcon} aria-hidden="true">
                  ✓
                </span>
                <div>
                  <small>03 / IHRE ENTSCHEIDUNG</small>
                  <strong>Bereit für Ihr Team.</strong>
                </div>
                <Arrow diagonal />
              </div>
            </div>
            <figcaption className={styles.visualCaption}>
              <span className={styles.captionDot} /> Ein möglicher Ablauf. Sie
              behalten die Kontrolle.
            </figcaption>
          </figure>
        </section>

        <div className={styles.principlesBar}>
          <div className={styles.container}>
            <p>WENIGER REIBUNG IM BÜRO.</p>
            <span>
              <Arrow diagonal /> Mit vorhandenen Werkzeugen
            </span>
            <span>
              <span aria-hidden="true">✓</span> Mit menschlicher Freigabe
            </span>
            <span>
              <span aria-hidden="true">⊞</span> Mit klar begrenztem Umfang
            </span>
          </div>
        </div>

        <section
          className={`${styles.problem} ${styles.container}`}
          aria-labelledby="problem-heading"
        >
          <div className={styles.sectionLabel}>
            <span>01 / DER ALLTAG</span>
            <span className={styles.sectionLine} />
          </div>
          <div className={styles.problemGrid}>
            <h2 id="problem-heading">
              Ihr Handwerk ist komplex.
              <br />
              Ihr Büroalltag muss
              <br />
              <span>es nicht auch sein.</span>
            </h2>
            <div className={styles.problemText}>
              <p>
                Zwischen Baustelle, Telefon und Postfach bleibt oft wenig Zeit
                für das, was liegen geblieben ist.
              </p>
              <p>
                Eine Anfrage wird mehrfach übertragen. Ein Rückruf gerät aus dem
                Blick. Ein Angebot wartet ohne nächsten Schritt.
              </p>
              <p className={styles.problemResolution}>
                Genau dort setzen wir an: bei einem konkreten Ablauf, der Ihrem
                Büro jeden Tag Arbeit macht.
              </p>
            </div>
          </div>
          <div className={styles.everyday}>
            <div>
              <span className={styles.everydayNumber}>01</span>
              <span>
                Weniger Informationen
                <br />
                <strong>von Hand übertragen.</strong>
              </span>
            </div>
            <div>
              <span className={styles.everydayNumber}>02</span>
              <span>
                Weniger offene Vorgänge
                <br />
                <strong>im Kopf behalten.</strong>
              </span>
            </div>
            <div>
              <span className={styles.everydayNumber}>03</span>
              <span>
                Mehr Klarheit darüber,
                <br />
                <strong>wer als Nächstes dran ist.</strong>
              </span>
            </div>
          </div>
        </section>

        <section
          className={styles.servicesSection}
          id="leistungen"
          aria-labelledby="services-heading"
        >
          <div className={styles.container}>
            <div className={styles.sectionLabel}>
              <span>02 / WAS WIR VEREINFACHEN</span>
              <span className={styles.sectionLine} />
            </div>
            <div className={styles.sectionHeading}>
              <h2 id="services-heading">
                Drei gute
                <br />
                <span>Ausgangspunkte.</span>
              </h2>
              <p>
                Wir starten dort, wo der Aufwand konkret ist.
                <br />
                Mit einem überschaubaren Ablauf und einem klaren Ziel.
              </p>
            </div>
            <div className={styles.services}>
              {services.map((service) => (
                <article className={styles.service} key={service.number}>
                  <div className={styles.serviceNumber}>{service.number}</div>
                  <div className={styles.serviceDescription}>
                    <span className={styles.serviceIcon}>
                      <ServiceIcon type={service.icon} />
                    </span>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                  <div className={styles.serviceDetails}>
                    <div className={styles.miniFlow}>
                      <span>{service.input}</span>
                      <span aria-hidden="true">↓</span>
                      <strong>{service.output}</strong>
                    </div>
                    <ul>
                      {service.tags.map((tag) => (
                        <li key={tag}>
                          <span aria-hidden="true">✓</span>
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <a
                    className={styles.serviceLink}
                    href="#kontakt"
                    aria-label={`${service.title.replace(".", "")} – Automatisierung besprechen`}
                  >
                    <Arrow diagonal />
                  </a>
                </article>
              ))}
            </div>
            <div className={styles.serviceFootnote}>
              <p>
                <strong>Ein Ablauf zuerst.</strong> Wir prüfen Machbarkeit und
                Umfang, bevor wir ein konkretes Angebot erstellen.
              </p>
              <a className={styles.textLink} href="#kontakt">
                Ihren Ablauf besprechen <Arrow diagonal />
              </a>
            </div>
          </div>
        </section>

        <section
          className={styles.demoSection}
          id="beispiel"
          aria-labelledby="demo-heading"
        >
          <div className={styles.container}>
            <div className={`${styles.sectionLabel} ${styles.lightLabel}`}>
              <span>03 / SO KANN ES AUSSEHEN</span>
              <span className={styles.sectionLine} />
              <span className={styles.exampleLabel}>
                ILLUSTRATIVES BEISPIEL
              </span>
            </div>
            <div className={`${styles.sectionHeading} ${styles.demoHeading}`}>
              <h2 id="demo-heading">
                Aus einer Nachricht
                <br />
                <span>wird ein nächster Schritt.</span>
              </h2>
              <p>
                Sehen Sie sich an, wie ein geordneter Ablauf eine typische
                Anfrage vorbereiten kann.
              </p>
            </div>
            <WorkflowDemo />
          </div>
        </section>

        <section
          className={`${styles.processSection} ${styles.container}`}
          id="ablauf"
          aria-labelledby="process-heading"
        >
          <div className={styles.sectionLabel}>
            <span>04 / UNSERE ZUSAMMENARBEIT</span>
            <span className={styles.sectionLine} />
          </div>
          <div className={styles.sectionHeading}>
            <h2 id="process-heading">
              Klein anfangen.
              <br />
              <span>Sauber umsetzen.</span>
            </h2>
            <p>
              Eine gute Automatisierung beginnt mit Verständnis für Ihren
              Alltag. Und endet mit einem Ablauf, den Ihr Team bedienen kann.
            </p>
          </div>
          <ol className={styles.process}>
            {process.map((step) => (
              <li key={step.number}>
                <div className={styles.processTop}>
                  <span>{step.number}</span>
                  <span className={styles.processLine} />
                  <Arrow />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <div className={styles.controlBox}>
            <div className={styles.controlMark} aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 4 6 10v10c0 9 14 16 14 16s14-7 14-16V10L20 4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="m13 20 5 5 9-10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>
              Automatisierung hilft.
              <br />
              Ihr Team entscheidet.
            </h3>
            <p>
              KI kann Informationen ordnen und Texte vorbereiten. Fachliche
              Beratung, verbindliche Angebote und Freigaben bleiben in
              menschlicher Hand.
            </p>
          </div>
        </section>

        <section
          className={styles.approachSection}
          aria-labelledby="approach-heading"
        >
          <div className={`${styles.container} ${styles.approachGrid}`}>
            <div>
              <p className={styles.eyebrow}>UNSER ANSPRUCH</p>
              <h2 id="approach-heading">
                Keine große KI-Show.
                <br />
                <span>Gute Arbeit im Alltag.</span>
              </h2>
              <p className={styles.approachIntro}>
                Hourlane steht für verständliche Abläufe, bewusste
                Entscheidungen und eine Zusammenarbeit auf Augenhöhe.
              </p>
              <a className={styles.textLink} href="#kontakt">
                Lernen wir Ihren Alltag kennen <Arrow diagonal />
              </a>
            </div>
            <div className={styles.approachList}>
              <article>
                <span aria-hidden="true">01</span>
                <div>
                  <h3>Die passende Lösung.</h3>
                  <p>
                    Wenn eine vorhandene Softwarefunktion ausreicht, beginnen
                    wir dort. KI kommt zum Einsatz, wenn sie dem Ablauf hilft.
                  </p>
                </div>
              </article>
              <article>
                <span aria-hidden="true">02</span>
                <div>
                  <h3>Ein nachvollziehbarer Umfang.</h3>
                  <p>
                    Was wird eingerichtet? Wer prüft? Was kostet der Betrieb?
                    Diese Fragen klären wir vor der Umsetzung.
                  </p>
                </div>
              </article>
              <article>
                <span aria-hidden="true">03</span>
                <div>
                  <h3>Ein Ergebnis, das sich prüfen lässt.</h3>
                  <p>
                    Wir vereinbaren Erfolgskriterien und testen reale Abläufe.
                    Ihren Nutzen bewerten wir gemeinsam mit Ihrem Team.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          className={`${styles.faqSection} ${styles.container}`}
          aria-labelledby="faq-heading"
        >
          <div className={styles.faqIntro}>
            <p className={styles.eyebrow}>GUT ZU WISSEN</p>
            <h2 id="faq-heading">
              Noch Fragen?
              <br />
              <span>Verständlich.</span>
            </h2>
            <p>Eine neue Zusammenarbeit verdient klare Antworten.</p>
            <a className={styles.textLink} href="#kontakt">
              Ihre Frage besprechen <Arrow diagonal />
            </a>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq) => (
              <details key={faq.question} className={styles.faq}>
                <summary>
                  {faq.question}
                  <span className={styles.faqPlus} aria-hidden="true" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          className={styles.contactSection}
          id="kontakt"
          aria-labelledby="contact-heading"
        >
          <div className={`${styles.container} ${styles.contactGrid}`}>
            <div className={styles.contactCopy}>
              <p className={styles.eyebrow}>
                <span className={styles.smallDot} />
                DER ERSTE SCHRITT
              </p>
              <h2 id="contact-heading">
                Was hält Ihr
                <br />
                Büro gerade
                <br />
                <span>am meisten auf?</span>
              </h2>
              <p>
                Erzählen Sie uns von einem Ablauf, den Sie gern vereinfachen
                würden. Gemeinsam sehen wir, ob und wie eine Automatisierung
                helfen kann.
              </p>
              <div className={styles.contactExpectations}>
                <h3>So geht es danach weiter</h3>
                <p>
                  <span>01</span> Wir sehen uns Ihr Anliegen an.
                </p>
                <p>
                  <span>02</span> Wir melden uns per E-Mail und klären offene
                  Fragen.
                </p>
                <p>
                  <span>03</span> Passt es für beide Seiten, besprechen wir den
                  Ablauf.
                </p>
              </div>
              <div className={styles.contactNote}>
                <Arrow diagonal /> Eine Anfrage verpflichtet Sie zu keinem
                Auftrag.
              </div>
            </div>
            <div className={styles.contactForm}>
              <LeadForm enabled={leadCaptureEnabled} />
            </div>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div>
              <a
                href="#start"
                className={styles.footerBrandLink}
                aria-label="Hourlane – nach oben"
              >
                <Brand className={styles.footerBrand} />
              </a>
              <p>
                Weniger Routine.
                <br />
                Mehr Zeit fürs Wesentliche.
              </p>
            </div>
            <div className={styles.footerDescription}>
              KI-Automatisierung für
              <br />
              Sanitär-, Heizungs- und Klimabetriebe.
            </div>
            <a
              className={styles.backToTop}
              href="#start"
              aria-label="Zum Seitenanfang"
            >
              <span aria-hidden="true">↑</span>
            </a>
          </div>
          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} Hourlane</span>
            <span>Klare Abläufe. Menschliche Entscheidungen.</span>
            <nav aria-label="Rechtliche Informationen">
              <a href="/impressum">Impressum</a>
              <a href="/datenschutz">Datenschutz</a>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
