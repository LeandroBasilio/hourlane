"use client";

import { useRef, useState } from "react";
import styles from "./WorkflowDemo.module.css";

const steps = ["Die Anfrage", "Der Überblick", "Der nächste Schritt"];

function DemoArrow({
  direction = "diagonal",
}: {
  direction?: "diagonal" | "down" | "back" | "bent";
}) {
  const paths = {
    diagonal: "M6 18 18 6M6 6h12v12",
    down: "M12 4v16m-6-6 6 6 6-6",
    back: "M20 12H4m6-6-6 6 6 6",
    bent: "M5 4v11h15m-5-5 5 5-5 5",
  };
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d={paths[direction]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WorkflowDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [approved, setApproved] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function selectStep(index: number, focus = false) {
    setActiveStep(index);
    if (focus) tabs.current[index]?.focus();
  }

  return (
    <div className={styles.demo}>
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Schritte einer beispielhaften Badmodernisierungs-Anfrage"
      >
        {steps.map((label, index) => (
          <button
            key={label}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            id={`workflow-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={activeStep === index}
            aria-controls="workflow-panel"
            tabIndex={activeStep === index ? 0 : -1}
            className={activeStep === index ? styles.activeTab : ""}
            onClick={() => selectStep(index)}
            onKeyDown={(event) => {
              let next: number | undefined;
              if (event.key === "ArrowRight") next = (index + 1) % steps.length;
              if (event.key === "ArrowLeft")
                next = (index + steps.length - 1) % steps.length;
              if (event.key === "Home") next = 0;
              if (event.key === "End") next = steps.length - 1;
              if (next !== undefined) {
                event.preventDefault();
                selectStep(next, true);
              }
            }}
          >
            <span className={styles.tabNumber}>0{index + 1}</span>
            <span>{label}</span>
            <span className={styles.tabArrow}>
              <DemoArrow />
            </span>
          </button>
        ))}
      </div>

      <div
        className={styles.panel}
        role="tabpanel"
        id="workflow-panel"
        aria-labelledby={`workflow-tab-${activeStep}`}
        tabIndex={0}
      >
        <div className={styles.explanation}>
          <p className={styles.smallLabel}>
            BADMODERNISIERUNG · FIKTIVES BEISPIEL
          </p>
          <h3>
            {
              [
                "Eine Nachricht. Viele offene Fragen.",
                "Alles Wichtige an einem Ort.",
                "Vorbereitet. Von Ihnen freigegeben.",
              ][activeStep]
            }
          </h3>
          <p>
            {
              [
                "Ein neues Vorhaben landet im Postfach. Ihr Büro muss das Anliegen erfassen, fehlende Angaben erkennen und einen Rückruf vorbereiten.",
                "Der Ablauf ordnet die vorhandenen Informationen und markiert, was fehlt. Die Originalnachricht bleibt für Ihr Team zugänglich.",
                "Eine Rückrufaufgabe liegt bereit. Ihr Team prüft den Vorschlag und entscheidet, wie es weitergeht. Fachliche Beratung bleibt bei Ihnen.",
              ][activeStep]
            }
          </p>
          <div className={styles.principle}>
            <DemoArrow direction="bent" />
            {
              [
                "Der Ausgangspunkt: Ihr bestehendes Postfach.",
                "Unklare Angaben werden sichtbar, nicht ergänzt.",
                "Kein Versand ohne bewusste Freigabe.",
              ][activeStep]
            }
          </div>
          {activeStep < 2 ? (
            <button
              className={styles.nextButton}
              type="button"
              onClick={() => selectStep(activeStep + 1, true)}
            >
              Nächsten Schritt ansehen <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              className={styles.nextButton}
              type="button"
              onClick={() => {
                setApproved(false);
                selectStep(0, true);
              }}
            >
              Beispiel von vorn ansehen <DemoArrow direction="back" />
            </button>
          )}
        </div>

        <div className={styles.preview}>
          {activeStep === 0 && (
            <div className={styles.message}>
              <div className={styles.messageTop}>
                <span className={styles.sourceIcon}>
                  <DemoArrow direction="down" />
                </span>
                <span>Ihr Posteingang</span>
                <span className={styles.messageBadge}>Neu</span>
              </div>
              <div className={styles.messageHeading}>
                <span className={styles.avatar}>AM</span>
                <div>
                  <strong>Alex Muster</strong>
                  <span>Fiktive Kontaktperson</span>
                </div>
              </div>
              <h4>Anfrage zur Badmodernisierung</h4>
              <p>
                Guten Tag,
                <br />
                wir möchten unser Badezimmer modernisieren. Können Sie uns dazu
                beraten? Das Bad ist etwa 8 m² groß. Ein Rückruf am Nachmittag
                wäre prima.
              </p>
              <p>
                Viele Grüße
                <br />
                Alex Muster
              </p>
              <div className={styles.messageBottom}>
                <span aria-hidden="true">·</span>Eine typische Anfrage. Noch
                kein vollständiger Vorgang.
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className={styles.structured}>
              <div className={styles.messageTop}>
                <span className={styles.sourceIcon} aria-hidden="true">
                  ≡
                </span>
                <span>Vorgang vorbereitet</span>
                <span className={styles.messageBadge}>Entwurf</span>
              </div>
              <h4>Badmodernisierung</h4>
              <dl className={styles.fieldList}>
                <div>
                  <dt>Kontakt</dt>
                  <dd>Alex Muster</dd>
                </div>
                <div>
                  <dt>Umfang</dt>
                  <dd>Badezimmer, ca. 8 m²</dd>
                </div>
                <div>
                  <dt>Erreichbarkeit</dt>
                  <dd>Nachmittags</dd>
                </div>
                <div>
                  <dt>Zuständigkeit</dt>
                  <dd>Büro · bitte prüfen</dd>
                </div>
              </dl>
              <div className={styles.missing}>
                <span aria-hidden="true">!</span>
                <div>
                  <strong>Diese Angaben fehlen noch</strong>
                  <p>Telefonnummer, Objektadresse und gewünschter Zeitraum.</p>
                </div>
              </div>
              <p className={styles.sourceNote}>
                Quelle: die unveränderte Beispielnachricht aus Schritt 1.
              </p>
            </div>
          )}

          {activeStep === 2 && (
            <div className={styles.approval}>
              <div className={styles.messageTop}>
                <span className={styles.sourceIcon}>
                  <DemoArrow />
                </span>
                <span>Nächster Schritt</span>
                <span className={styles.messageBadge}>
                  {approved ? "Demo abgeschlossen" : "Zur Prüfung"}
                </span>
              </div>
              <h4>Rückruf vorbereiten</h4>
              <p className={styles.approvalIntro}>Vorschlag für Ihr Büro</p>
              <ul>
                <li>Fehlende Kontaktdaten erfragen.</li>
                <li>Zeitraum und Objektadresse klären.</li>
                <li>Rückruf am Nachmittag abstimmen.</li>
              </ul>
              <div className={styles.human}>
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>Die Entscheidung bleibt bei Ihnen.</strong>
                  <p>Prüfen, ändern oder freigeben.</p>
                </div>
              </div>
              <button
                className={styles.approveButton}
                type="button"
                onClick={() => setApproved(true)}
                disabled={approved}
              >
                {approved
                  ? "✓ Beispiel freigegeben"
                  : "Freigabe im Beispiel ausprobieren"}
                <span aria-hidden="true">{approved ? "" : "→"}</span>
              </button>
              <p className={styles.approvalStatus} role="status">
                {approved
                  ? "Nur demonstriert: Es wurde keine Aufgabe angelegt und keine Nachricht versendet."
                  : "Diese Schaltfläche demonstriert nur den Freigabeschritt."}
              </p>
            </div>
          )}
        </div>
      </div>
      <p className={styles.disclaimer}>
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
        >
          <circle cx="10" cy="10" r="8" stroke="currentColor" />
          <path d="M10 9v5m0-9v1" stroke="currentColor" strokeLinecap="round" />
        </svg>{" "}
        Illustrativer Ablauf mit vorgegebenen, fiktiven Daten. Keine echte
        KI-Verarbeitung und kein Versand.
      </p>
    </div>
  );
}
