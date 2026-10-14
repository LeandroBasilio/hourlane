import { z } from "zod";

const singleLine = (maximum: number, label: string) =>
  z.string().trim().transform((value) => value.replace(/\s+/g, " ")).pipe(
    z.string().min(2, `${label} muss mindestens 2 Zeichen enthalten.`)
      .max(maximum, `${label} darf höchstens ${maximum} Zeichen enthalten.`)
      .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Bitte keine Steuerzeichen verwenden."),
  );

export const leadFormSchema = z.object({
  name: singleLine(120, "Der Name"),
  email: z.string().trim().toLowerCase().max(254, "Die E-Mail-Adresse ist zu lang.")
    .email("Bitte eine gültige E-Mail-Adresse eingeben."),
  company: singleLine(160, "Der Unternehmensname"),
  industry: z.enum(["", "shk", "handwerk", "dienstleistung", "sonstiges"], {
    message: "Bitte eine Branche aus der Liste auswählen.",
  }).default(""),
  challenge: z.string().trim().transform((value) => value.replace(/\r\n?/g, "\n")).pipe(
    z.string().min(10, "Bitte die Herausforderung mit mindestens 10 Zeichen beschreiben.")
      .max(2000, "Bitte höchstens 2.000 Zeichen verwenden.")
      .refine((value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
        "Bitte keine Steuerzeichen verwenden."),
  ),
});

export const leadSubmissionSchema = leadFormSchema.extend({
  requestId: z.string().uuid("Bitte die Seite neu laden und die Anfrage erneut senden."),
  website: z.string().max(500).default(""),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;
