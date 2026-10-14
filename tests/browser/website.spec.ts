import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { Pool } from "pg";

let database: Pool;
test.beforeAll(async () => { database = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 }); });
test.beforeEach(async () => {
  await database.query("TRUNCATE hourlane.leads, hourlane.rate_limit_buckets");
});
test.afterAll(async () => {
  await database.query("TRUNCATE hourlane.leads, hourlane.rate_limit_buckets");
  await database.end();
});

async function fillForm(page: Page) {
  await page.getByLabel("Ihr Name", { exact: true }).fill("Testperson Beispiel");
  await page.getByLabel("E-Mail-Adresse", { exact: true }).fill("browser@example.test");
  await page.getByLabel("Ihr Betrieb", { exact: true }).fill("Fiktiver Testbetrieb");
  await page.getByLabel("Branche", { exact: false }).selectOption("shk");
  await page.getByLabel("Was kostet Sie im Büro gerade Zeit?", { exact: true }).fill("Dies ist eine fiktive Testanfrage zur Bearbeitung unseres Postfachs.");
}

test("responsive page, keyboard interactions, and accessibility", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-security-policy"]).toContain("'nonce-");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Büroarbeit");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const menu = page.getByRole("button", { name: /Menü öffnen|Menü schließen/ });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
  }
  await page.getByRole("tab", { name: /Die Anfrage/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: /Der Überblick/ })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await page.getByRole("button", { name: "Freigabe im Beispiel ausprobieren" }).click();
  await expect(page.getByText("Nur demonstriert: Es wurde keine Aufgabe angelegt und keine Nachricht versendet.")).toBeVisible();
  await page.getByText("Was kostet eine Automatisierung?", { exact: true }).click();
  await expect(page.getByText(/Der Preis hängt vom Ablauf/)).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(accessibility.violations.map(issue => ({ id: issue.id, elements: issue.nodes.map(node => node.target) }))).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("page.png"), fullPage: true });
});

test("form validation and real database persistence", async ({ page }) => {
  await page.goto("/#kontakt");
  await page.getByRole("button", { name: "Unverbindlich anfragen" }).click();
  await expect(page.getByLabel("Ihr Name", { exact: true })).toBeFocused();
  await expect(page.getByText("Bitte prüfen Sie die markierten Angaben.", { exact: true })).toBeVisible();
  expect((await database.query("SELECT count(*)::int AS count FROM hourlane.leads")).rows[0].count).toBe(0);
  await fillForm(page);
  const result = page.waitForResponse(response => response.url().endsWith("/api/leads") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Unverbindlich anfragen" }).click();
  expect((await result).status()).toBe(201);
  await expect(page.getByRole("heading", { name: "Ihre Anfrage ist angekommen." })).toBeVisible();
  const saved = await database.query("SELECT name, email, company, industry FROM hourlane.leads");
  expect(saved.rows).toEqual([{ name: "Testperson Beispiel", email: "browser@example.test", company: "Fiktiver Testbetrieb", industry: "shk" }]);
});

test("ambiguous network failure preserves data and retries without duplicate leads", async ({ page }) => {
  await page.goto("/#kontakt");
  await fillForm(page);
  await page.route("**/api/leads", async route => {
    await route.fetch(); // Actual server receives and commits; only its response is lost.
    await route.abort("failed");
  }, { times: 1 });
  await page.getByRole("button", { name: "Unverbindlich anfragen" }).click();
  await expect(page.getByText(/Möglicherweise ist sie bereits angekommen/)).toBeVisible();
  await expect(page.getByLabel("Ihr Name", { exact: true })).toHaveValue("Testperson Beispiel");
  expect((await database.query("SELECT count(*)::int AS count FROM hourlane.leads")).rows[0].count).toBe(1);
  await page.getByRole("button", { name: "Unverbindlich anfragen" }).click();
  await expect(page.getByRole("heading", { name: "Ihre Anfrage ist angekommen." })).toBeVisible();
  expect((await database.query("SELECT count(*)::int AS count FROM hourlane.leads")).rows[0].count).toBe(1);
});

test("honeypot rejection and legal placeholders remain honest", async ({ page, request }) => {
  await page.goto("/#kontakt");
  await fillForm(page);
  await page.locator('input[name="website"]').evaluate((input: HTMLInputElement) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, "spam.example");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  // Submit directly as well: server protection does not depend on browser scripting.
  const rejected = await request.post("/api/leads", {
    headers: { Origin: "http://127.0.0.1:3100" },
    data: { requestId: crypto.randomUUID(), name: "Testperson", email: "test@example.test", company: "Testbetrieb", industry: "shk", challenge: "Fiktiver Test für Spamabwehr.", website: "spam.example" },
  });
  expect(rejected.status()).toBe(422);
  expect((await database.query("SELECT count(*)::int AS count FROM hourlane.leads")).rows[0].count).toBe(0);
  expect((await request.get("/api/leads")).status()).toBe(405);
  await page.goto("/datenschutz");
  await expect(page.getByText(/noch keine vollständige Datenschutzerklärung/)).toBeVisible();
  await page.goto("/impressum");
  await expect(page.getByText(/noch kein vollständiges Impressum/)).toBeVisible();
});
