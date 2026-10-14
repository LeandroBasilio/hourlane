"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { leadFormSchema } from "@/lib/leads/schema";
import styles from "./LeadForm.module.css";

type FormValues = {
  name: string;
  email: string;
  company: string;
  industry: "" | "shk" | "handwerk" | "dienstleistung" | "sonstiges";
  challenge: string;
  website: string;
};

type FieldName = Exclude<keyof FormValues, "website">;
type FieldErrors = Partial<Record<FieldName, string>>;
type FormStatus = "idle" | "submitting" | "error" | "success";

const initialValues: FormValues = {
  name: "",
  email: "",
  company: "",
  industry: "",
  challenge: "",
  website: "",
};

const fieldOrder: FieldName[] = ["name", "email", "company", "industry", "challenge"];

function isFieldName(value: unknown): value is FieldName {
  return typeof value === "string" && fieldOrder.includes(value as FieldName);
}

function retryMessage(header: string | null): string {
  if (!header) return "Bitte warten Sie einen Moment und versuchen Sie es erneut.";
  const seconds = Number(header);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "Bitte warten Sie einen Moment und versuchen Sie es erneut.";
  }
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1
    ? "Bitte versuchen Sie es in etwa einer Minute erneut."
    : `Bitte versuchen Sie es in etwa ${minutes} Minuten erneut.`;
}

const uncertainMessage =
  "Wir konnten den Eingang Ihrer Anfrage nicht bestätigen. Möglicherweise ist sie bereits angekommen. Ihre Eingaben bleiben erhalten; Sie können die Anfrage erneut senden.";

function SubmitArrow() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function LeadForm({ enabled }: { enabled: boolean }) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const attemptRef = useRef<{ requestId: string; payload: string } | null>(null);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const submitting = status === "submitting";

  const fieldId = (field: FieldName) => `${id}-${field}`;
  const errorId = (field: FieldName) => `${id}-${field}-error`;

  function describedBy(field: FieldName, hint?: string) {
    return [hint, errors[field] ? errorId(field) : undefined].filter(Boolean).join(" ") || undefined;
  }

  function updateValue<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    if (submittingRef.current) return;
    if (values[field] !== value) attemptRef.current = null;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status === "error") {
      setStatus("idle");
      setMessage("");
    }
  }

  function focusFirstError(fieldErrors: FieldErrors) {
    const field = fieldOrder.find((name) => fieldErrors[name]);
    if (!field) return;
    requestAnimationFrame(() => {
      const control = formRef.current?.elements.namedItem(field);
      if (control instanceof HTMLElement) control.focus();
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || submittingRef.current || status === "success") return;

    const form = event.currentTarget;
    const serializedPayload = JSON.stringify(values);
    const requestId =
      attemptRef.current?.payload === serializedPayload
        ? attemptRef.current.requestId
        : crypto.randomUUID();
    const result = leadFormSchema.safeParse({ ...values, requestId });
    const nextErrors: FieldErrors = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (isFieldName(field) && !nextErrors[field]) nextErrors[field] = issue.message;
      }
    }

    // Keep browser constraints alongside the shared server validation.
    for (const field of fieldOrder) {
      const control = form.elements.namedItem(field);
      if (
        (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) &&
        !control.validity.valid &&
        !nextErrors[field]
      ) {
        nextErrors[field] = control.validity.valueMissing
          ? "Bitte füllen Sie dieses Feld aus."
          : field === "email"
            ? "Bitte geben Sie eine gültige E-Mail-Adresse ein."
            : "Bitte prüfen Sie Ihre Eingabe.";
      }
    }

    if (!result.success || Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      setMessage("Bitte prüfen Sie die markierten Angaben.");
      focusFirstError(nextErrors);
      return;
    }

    attemptRef.current = { requestId, payload: serializedPayload };
    submittingRef.current = true;
    setErrors({});
    setStatus("submitting");
    setMessage("Ihre Anfrage wird gesendet …");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, requestId, website: values.website }),
        signal: controller.signal,
      });
      const body: unknown = await response.json().catch(() => null);
      const data = body && typeof body === "object" ? (body as Record<string, unknown>) : null;

      if ((response.status === 200 || response.status === 201) && data?.ok === true) {
        setStatus("success");
        setMessage("Ihre Anfrage ist angekommen.");
        return;
      }

      const serverErrors: FieldErrors = {};
      if (data?.errors && typeof data.errors === "object") {
        for (const [field, value] of Object.entries(data.errors)) {
          if (isFieldName(field) && typeof value === "string") serverErrors[field] = value;
        }
      }
      setErrors(serverErrors);
      setStatus("error");
      setMessage(
        response.status === 429
          ? `Es wurden gerade mehrere Anfragen gesendet. ${retryMessage(response.headers.get("Retry-After"))}`
          : typeof data?.message === "string" && data.ok === false
            ? data.message
            : uncertainMessage,
      );
      focusFirstError(serverErrors);
    } catch {
      setStatus("error");
      setMessage(uncertainMessage);
    } finally {
      window.clearTimeout(timeout);
      submittingRef.current = false;
    }
  }

  function startAnotherRequest() {
    attemptRef.current = null;
    setValues(initialValues);
    setErrors({});
    setMessage("");
    setStatus("idle");
    requestAnimationFrame(() => {
      const control = formRef.current?.elements.namedItem("name");
      if (control instanceof HTMLElement) control.focus();
    });
  }

  function fieldError(field: FieldName) {
    return errors[field] ? (
      <span className={styles.fieldError} id={errorId(field)}>
        {errors[field]}
      </span>
    ) : null;
  }

  return (
    <div className={styles.shell}>
      <div className={styles.announcement} role="status" aria-live="polite" aria-atomic="true">
        {status === "success" ? message : ""}
      </div>
      {status === "success" ? (
        <div className={styles.success}>
          <span className={styles.successIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
              <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className={styles.eyebrow}>Der erste Schritt ist gemacht</p>
          <h3>Ihre Anfrage ist angekommen.</h3>
          <p>Danke für den Einblick in Ihren Betriebsalltag. Wir sehen uns Ihre Angaben an und melden uns über die angegebene E-Mail-Adresse bei Ihnen.</p>
          <button className={styles.secondaryButton} type="button" onClick={startAnotherRequest}>
            Weitere Anfrage
            <SubmitArrow />
          </button>
        </div>
      ) : (
        <form ref={formRef} action="/api/leads" method="post" onSubmit={handleSubmit} noValidate aria-label="Unverbindliche Anfrage" aria-busy={submitting}>
          {!enabled && (
            <div className={styles.unavailable}>
              <strong>Das Anfrageformular ist noch nicht freigeschaltet.</strong>
              <p>Aktuell können hier noch keine Anfragen gesendet werden.</p>
            </div>
          )}
          <p className={styles.formNote}>Alle Felder sind Pflichtfelder, außer „Branche“.</p>
          <fieldset className={styles.fieldset} disabled={!enabled || submitting}>
            <legend className={styles.announcement}>Ihre Kontaktdaten und Ihr Anliegen</legend>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor={fieldId("name")}>Ihr Name</label>
                <input id={fieldId("name")} name="name" type="text" autoComplete="name" required minLength={2} maxLength={120} value={values.name} onChange={(event) => updateValue("name", event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy("name")} placeholder="Vor- und Nachname" />
                {fieldError("name")}
              </div>
              <div className={styles.field}>
                <label htmlFor={fieldId("email")}>E-Mail-Adresse</label>
                <input id={fieldId("email")} name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={values.email} onChange={(event) => updateValue("email", event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy("email")} placeholder="name@betrieb.de" />
                {fieldError("email")}
              </div>
              <div className={styles.field}>
                <label htmlFor={fieldId("company")}>Ihr Betrieb</label>
                <input id={fieldId("company")} name="company" type="text" autoComplete="organization" required minLength={2} maxLength={160} value={values.company} onChange={(event) => updateValue("company", event.target.value)} aria-invalid={Boolean(errors.company)} aria-describedby={describedBy("company")} placeholder="Name Ihres Betriebs" />
                {fieldError("company")}
              </div>
              <div className={styles.field}>
                <label htmlFor={fieldId("industry")}>Branche <span className={styles.optional}>(optional)</span></label>
                <select id={fieldId("industry")} name="industry" value={values.industry} onChange={(event) => updateValue("industry", event.target.value as FormValues["industry"])} aria-invalid={Boolean(errors.industry)} aria-describedby={describedBy("industry")}>
                  <option value="">Bitte auswählen</option>
                  <option value="shk">Sanitär, Heizung & Klima</option>
                  <option value="handwerk">Anderes Handwerk</option>
                  <option value="dienstleistung">Dienstleistung</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
                {fieldError("industry")}
              </div>
              <div className={`${styles.field} ${styles.fullWidth}`}>
                <label htmlFor={fieldId("challenge")}>Was kostet Sie im Büro gerade Zeit?</label>
                <textarea id={fieldId("challenge")} name="challenge" rows={5} required minLength={10} maxLength={2000} value={values.challenge} onChange={(event) => updateValue("challenge", event.target.value)} aria-invalid={Boolean(errors.challenge)} aria-describedby={describedBy("challenge", `${id}-challenge-hint`)} placeholder="Zum Beispiel: Wir verlieren den Überblick, welche Angebote wir noch nachfassen sollten …" />
                <div className={styles.hintRow}>
                  <span className={styles.hint} id={`${id}-challenge-hint`}>Ein paar Sätze reichen. Bitte keine vertraulichen Kundendaten eintragen.</span>
                  <span className={styles.counter} aria-hidden="true">{values.challenge.length}/2000</span>
                </div>
                {fieldError("challenge")}
              </div>
            </div>
            <div className={styles.honeypot} aria-hidden="true">
              <label htmlFor={`${id}-website`}>Website</label>
              <input id={`${id}-website`} name="website" type="text" autoComplete="off" tabIndex={-1} value={values.website} onChange={(event) => updateValue("website", event.target.value)} />
            </div>
          </fieldset>
          <p className={styles.privacy}>Wir verwenden Ihre Angaben, um Ihre Anfrage zu bearbeiten. Mehr dazu in unseren <Link href="/datenschutz">Datenschutzhinweisen</Link>.</p>
          <div className={styles.feedback} role="status" aria-live="polite" aria-atomic="true">
            {message && <p className={status === "error" ? styles.errorMessage : styles.progressMessage}>{message}</p>}
          </div>
          <button className={styles.submitButton} type="submit" disabled={!enabled || submitting}>
            {submitting ? "Anfrage wird gesendet …" : "Unverbindlich anfragen"}
            {submitting ? <span className={styles.spinner} aria-hidden="true" /> : <SubmitArrow />}
          </button>
          <p className={styles.commitment}>Unverbindlich. Persönlich. Ohne Verkaufsskript.</p>
          <noscript><p className={styles.noScript}>Bitte aktivieren Sie JavaScript in Ihrem Browser, um das Anfrageformular zu nutzen.</p></noscript>
        </form>
      )}
    </div>
  );
}
