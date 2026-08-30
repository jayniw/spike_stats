import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

// Demo fixture credentials (from seed-demo.ts)
const ADMIN_EMAIL = "admin@demo.club";
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "demo1234!";

test.describe("US1 — Onboarding: crear club e invitar miembros", () => {
  test("V1 flow: crear club → invitador → invitado con rol restringido", async ({
    page,
  }) => {
    // ── Step 1: Log in as admin ──────────────────────────────────────────
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
    await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    // Wait for redirect after login
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10_000,
    });

    // ── Step 2: Navigate to new club creation ────────────────────────────
    // The onboarding page should exist and be reachable
    await page.goto(`${BASE_URL}/onboarding/new-club`);

    // ── Step 3: Create a new club ────────────────────────────────────────
    // Fill club name
    const clubNameInput = page.getByLabel(/nombre del club/i);
    await expect(clubNameInput).toBeVisible({ timeout: 10_000 });
    await clubNameInput.fill("Club E2E Test");

    // Submit
    await page.getByRole("button", { name: /crear club/i }).click();

    // Wait for redirect to the club's settings or dashboard
    await page.waitForURL((url) => url.pathname.includes("/settings") || url.pathname.includes("/teams") || url.pathname.includes("/dashboards"), {
      timeout: 10_000,
    });

    // ── Step 4: Navigate to invitations ──────────────────────────────────
    await page.goto(`${BASE_URL}/settings/invitations`);

    // ── Step 5: Invite a spectator ───────────────────────────────────────
    const emailInput = page.getByLabel(/correo/i);
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    await emailInput.fill("espectador-e2e@test.local");

    // Select spectator role
    await page.getByLabel(/rol/i).selectOption("spectator");

    // Send invitation
    await page.getByRole("button", { name: /invitar/i }).click();

    // Verify success toast or message
    await expect(
      page.getByRole("status").filter({ hasText: /invitación enviada|éxito/i })
    ).toBeVisible({ timeout: 5_000 });
  });

  test("spectator sees club but cannot create teams or score matches", async ({
    page,
  }) => {
    // ── Log in as a spectator user ───────────────────────────────────────
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel("Correo electrónico").fill("spectator@demo.club");
    await page.getByLabel("Contraseña").fill(process.env.DEMO_SPECTATOR_PASSWORD ?? "demo1234!");
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10_000,
    });

    // ── Verify restricted navigation ─────────────────────────────────────
    // Spectator should see the club but NOT see "Crear equipo" or "Nuevo partido"
    const createTeamLink = page.getByRole("link", { name: /crear equipo/i });
    const newMatchLink = page.getByRole("link", { name: /nuevo partido/i });

    await expect(createTeamLink).toHaveCount(0);
    await expect(newMatchLink).toHaveCount(0);

    // ── Verify direct URL access is denied ───────────────────────────────
    // Attempting to access team creation page directly should redirect
    await page.goto(`${BASE_URL}/teams/new`);
    await expect(page).not.toHaveURL(/\/teams\/new/);

    // Attempting to access match creation should redirect
    await page.goto(`${BASE_URL}/matches/new`);
    await expect(page).not.toHaveURL(/\/matches\/new/);
  });

  test("new user without club is redirected to onboarding", async ({
    page,
  }) => {
    // ── Log in as a user without a club ──────────────────────────────────
    // This test requires a fresh user without any club membership
    // For now, we verify the redirect behavior
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel("Correo electrónico").fill("newuser@demo.club");
    await page.getByLabel("Contraseña").fill(process.env.DEMO_NEW_PASSWORD ?? "demo1234!");
    await page.getByRole("button", { name: "Entrar" }).click();

    // Should redirect to onboarding or show onboarding prompt
    await page.waitForURL(
      (url) =>
        url.pathname.includes("/onboarding") || url.pathname.includes("/new-club"),
      { timeout: 10_000 }
    );
  });
});
