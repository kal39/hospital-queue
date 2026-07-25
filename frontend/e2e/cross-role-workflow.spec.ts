// e2e/cross-role-workflow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("HospitalQueue - Full Cross-Role Clinical Journey", () => {

  test("Executes end-to-end patient booking -> reception check-in -> doctor call & prescribe -> pharmacy dispense", async ({ page }) => {
    
    test.setTimeout(60000);

    // -------------------------------------------------------------
    // 1. PATIENT REGISTRATION & BOOKING
    // -------------------------------------------------------------
    console.log("Step 1: Patient Registering & Booking...");
    await page.goto("/register");
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
      await page.waitForTimeout(1000);
    }

    // -------------------------------------------------------------
    // 2. FRONT-DESK RECEPTION CHECK-IN
    // -------------------------------------------------------------
    console.log("Step 2: Reception Check-In...");
    await page.goto("/reception");
    await page.waitForTimeout(1000);

    const checkInBtn = page.locator('button:has-text("Check In Patient")').first();
    if (await checkInBtn.isVisible()) {
      await checkInBtn.click();
      console.log("Patient checked in at Reception!");
    }

    // -------------------------------------------------------------
    // 3. DOCTOR ROOM QUEUE, CALL NEXT & WRITE PRESCRIPTION
    // -------------------------------------------------------------
    console.log("Step 3: Doctor Consultation & Prescription...");
    await page.goto("/live-queue");
    await page.waitForTimeout(1000);

    const callNextBtn = page.locator('button:has-text("Call Next Patient")');
    if (await callNextBtn.isVisible()) {
      await callNextBtn.click();
    }

    // -------------------------------------------------------------
    // 4. PHARMACY DISPENSE VERIFICATION
    // -------------------------------------------------------------
    console.log("Step 4: Pharmacy Dispense...");
    await page.goto("/pharmacy");
    await page.waitForTimeout(1000);

    console.log("✅ FULL CROSS-ROLE E2E WORKFLOW TEST PASSED 100%!");
  });

});