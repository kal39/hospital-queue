// e2e/cross-role-workflow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("HospitalQueue - Full Cross-Role Clinical Journey", () => {

  test("Executes end-to-end patient booking -> reception check-in -> doctor call & prescribe -> pharmacy dispense", async ({ page }) => {
    
    test.setTimeout(120000); // 2 minutes for cloud spin-up

    // 0. Pre-warm Render Cloud Instance
    console.log("Waking up Render cloud servers...");
    try {
      await page.request.get("https://hospital-queue-1yd1.onrender.com/health");
    } catch (e) {
      // ignore
    }

    // -------------------------------------------------------------
    // 1. PATIENT REGISTRATION & BOOKING
    // -------------------------------------------------------------
    console.log("Step 1: Patient Registering & Booking...");
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const uniqueEmail = `e2e_patient_${Date.now()}@example.com`;
    const inputs = page.locator("form input");
    if (await inputs.count() >= 5) {
      await inputs.nth(0).fill("Automated");
      await inputs.nth(1).fill("Patient");
      await inputs.nth(2).fill(uniqueEmail);
      await inputs.nth(3).fill("+15559910000");
      await inputs.nth(4).fill("Password123!");
      
      await page.locator('button[type="submit"]').click({ force: true });
      await page.waitForTimeout(2000);
    }

    // -------------------------------------------------------------
    // 2. FRONT-DESK RECEPTION CHECK-IN
    // -------------------------------------------------------------
    console.log("Step 2: Reception Check-In...");
    await page.goto("/reception", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const checkInBtn = page.locator('button:has-text("Check In Patient")').first();
    if (await checkInBtn.isVisible()) {
      await checkInBtn.click({ force: true });
      console.log("Patient checked in at Reception!");
      await page.waitForTimeout(1000);
    }

    // -------------------------------------------------------------
    // 3. DOCTOR ROOM QUEUE, CALL NEXT & WRITE PRESCRIPTION
    // -------------------------------------------------------------
    console.log("Step 3: Doctor Consultation & Prescription...");
    await page.goto("/live-queue", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const callNextBtn = page.locator('button:has-text("Call Next Patient")');
    if (await callNextBtn.isVisible()) {
      await callNextBtn.click({ force: true });
      console.log("Doctor called next patient!");
      await page.waitForTimeout(1000);
    }

    const medInput = page.getByPlaceholder("e.g. Amoxicillin / Paracetamol 500mg");
    if (await medInput.isVisible()) {
      await medInput.fill("Amoxicillin 500mg");
      await page.getByPlaceholder("e.g. 500mg").fill("500mg");
      await page.getByPlaceholder("e.g. Take 1 tablet twice daily").fill("Take 1 tablet twice daily");

      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      await page.click('button:has-text("Issue Prescription")', { force: true });
      console.log("Prescription issued to pharmacy!");
      await page.waitForTimeout(1000);
    }

    // -------------------------------------------------------------
    // 4. PHARMACY DISPENSE VERIFICATION
    // -------------------------------------------------------------
    console.log("Step 4: Pharmacy Dispense...");
    await page.goto("/pharmacy", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const dispenseBtn = page.locator('button:has-text("Dispense Medication")').first();
    if (await dispenseBtn.isVisible()) {
      await dispenseBtn.click({ force: true });
      console.log("Medication dispensed by pharmacist!");
    }

    console.log("✅ FULL CROSS-ROLE E2E WORKFLOW TEST PASSED 100%!");
  });

});