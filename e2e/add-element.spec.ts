import { test, expect } from "@playwright/test";

test.describe("Design tab — adding a street element", () => {
  test("adds a sidewalk and it appears in the design list", async ({ page }) => {
    // ── ARRANGE: open the app and clear the onboarding modal ──────────────
    await page.goto("/");

    // The welcome modal is a dialog labelled by its "Street Generator" heading.
    // Scoping to it avoids clashing with the language buttons in the top bar.
    const welcome = page.getByRole("dialog", { name: /street generator/i });
    // exact: true — otherwise "EN" substring-matches "StartEN" and "überspringEN".
    await welcome.getByRole("button", { name: "EN", exact: true }).click();
    await welcome.getByRole("button", { name: /skip tour/i }).click();

    // The MCP announcement modal appears once after the welcome; dismiss it so
    // its backdrop doesn't intercept clicks.
    await page
      .getByRole("dialog", { name: /Street Generator MCP/i })
      .getByRole("button", { name: "Got it" })
      .click();

    // The design tab is active by default. A default street is pre-loaded,
    // so some element cards already exist — count them first.
    const cards = page.getByTestId("element-card");
    const before = await cards.count();

    // ── ACT: click "Sidewalk" in the element palette ─────────────────────
    await page.getByRole("button", { name: "Sidewalk" }).click();

    // ── ASSERT: exactly one more card is present ─────────────────────────
    // toHaveCount auto-retries until the UI updates — no manual waiting.
    await expect(cards).toHaveCount(before + 1);
  });
});
