#!/usr/bin/env node
/**
 * Records three separate screen-capture videos (Employee, Admin, Super Admin)
 * walking through every module of the HR system, against a LOCAL throwaway
 * database — never touches production data.
 *
 * Usage: node scripts/record-demo-video.cjs
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3100";
const OUT_DIR = "/tmp/hr-video-out";
const SITE = { latitude: 18.93680875941995, longitude: 72.8341841206532 };
const PAUSE = 2200;

const EMP   = { its: "90001234", password: "Demo@123" };
const ADMIN = { username: "30303943", password: "AQ@Secure99" };
const SUPER = { username: "20359529", password: "AB@Secure99" };

fs.mkdirSync(OUT_DIR, { recursive: true });

async function caption(page, text) {
  try {
    await page.evaluate((t) => {
      let el = document.getElementById("__demo_caption__");
      if (!el) {
        el = document.createElement("div");
        el.id = "__demo_caption__";
        el.style.cssText = `
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: rgba(15,23,42,0.94); color: white; padding: 12px 26px;
          border-radius: 12px; font-family: -apple-system, "Segoe UI", sans-serif; font-size: 16px;
          font-weight: 600; z-index: 2147483647; max-width: 90vw; text-align: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4); pointer-events: none; line-height: 1.4;
        `;
        document.body.appendChild(el);
      }
      el.textContent = t;
    }, text);
  } catch { /* page may be mid-navigation; ignore */ }
}

async function pause(page, ms = PAUSE) {
  await page.waitForTimeout(ms);
}

async function step(label, fn) {
  try {
    await fn();
  } catch (err) {
    console.warn(`[skip] ${label}: ${err.message.split("\n")[0]}`);
  }
}

async function recordTour(name, fn) {
  const dir = path.join(OUT_DIR, name);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir, size: { width: 1440, height: 900 } },
  });
  await context.grantPermissions(["geolocation"], { origin: BASE });
  await context.setGeolocation(SITE);
  const page = await context.newPage();

  console.log(`\n=== Recording: ${name} ===`);
  await fn(page, context);

  await page.close();
  await context.close();
  await browser.close();

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".webm"));
  if (files.length) {
    const finalPath = path.join(OUT_DIR, `${name}.webm`);
    fs.renameSync(path.join(dir, files[0]), finalPath);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Saved: ${finalPath}`);
  }
}

// ---------- EMPLOYEE TOUR ----------
async function employeeTour(page) {
  await step("goto login", async () => {
    await page.goto(`${BASE}/login`);
    await caption(page, "Khidmat Guzar Portal — employees log in with their ITS number");
    await pause(page);
  });

  await step("employee login", async () => {
    await page.locator('input[type="text"]').fill(EMP.its);
    await page.locator('input[type="password"]').fill(EMP.password);
    await pause(page, 600);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await caption(page, "Employee Dashboard — every module in one place, with live badges for pending items");
    await pause(page, 3000);
  });

  await step("scroll dashboard", async () => {
    await page.mouse.wheel(0, 500);
    await pause(page);
    await page.mouse.wheel(0, -500);
  });

  await step("apply leave", async () => {
    await page.goto(`${BASE}/apply`);
    await caption(page, "Apply for Leave — emergency or normal, with half-day support and holiday warnings");
    await pause(page, 2600);
    const start = new Date(); start.setDate(start.getDate() + 5);
    const end = new Date(); end.setDate(end.getDate() + 6);
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill(start.toISOString().slice(0, 10));
    await dateInputs.nth(1).fill(end.toISOString().slice(0, 10));
    await page.getByPlaceholder("Provide a detailed reason for your leave request...").fill("Family function out of town.");
    await pause(page, 800);
    await page.getByRole("button", { name: "Submit Application" }).click();
    await pause(page, 2600);
    await caption(page, "Submitted — this now appears instantly in Admin's approval queue");
    await pause(page, 2200);
  });

  await step("dashboard tasks", async () => {
    await page.goto(`${BASE}/dashboard`);
    await pause(page, 800);
    await caption(page, "Tasks assigned by Admin — with priority and due dates");
    await page.locator("#tasks").scrollIntoViewIfNeeded();
    await pause(page, 2600);
  });

  await step("murasalat", async () => {
    await page.goto(`${BASE}/murasalat`);
    await caption(page, "Murasalat — official circulars from HR, filterable by priority/department");
    await pause(page, 2800);
  });

  await step("arz", async () => {
    await page.goto(`${BASE}/arz`);
    await caption(page, "Personal Arz — private requests or grievances sent directly to HR");
    await pause(page, 2200);
    await page.getByRole("button", { name: "+ New Arz" }).click();
    await pause(page, 600);
    await page.getByPlaceholder("Brief subject of your arz…").fill("Request for schedule change");
    await page.getByPlaceholder("Explain your request in detail…").fill("Requesting a shift in weekly off day due to a family commitment.");
    await pause(page, 800);
    await page.getByRole("button", { name: "Submit Arz" }).click();
    await pause(page, 2200);
  });

  await step("assets", async () => {
    await page.goto(`${BASE}/assets`);
    await caption(page, "My Assets — equipment currently assigned to you");
    await pause(page, 2400);
  });

  await step("documents", async () => {
    await page.goto(`${BASE}/documents`);
    await caption(page, "Document Vault — policies, forms, and circulars");
    await pause(page, 2400);
  });

  await step("lms", async () => {
    await page.goto(`${BASE}/lms`);
    await caption(page, "Learning & Development — training courses assigned to your department");
    await pause(page, 2400);
  });

  await step("attendance", async () => {
    await page.goto(`${BASE}/attendance`);
    await caption(page, "Attendance — GPS-verified clock in/out. We're positioned at the registered work site.");
    await pause(page, 2600);
    await page.getByRole("button", { name: "Clock In" }).click();
    await pause(page, 2000);
    await caption(page, "Clocked in — location matched against the registered site radius");
    await pause(page, 2400);
    await page.getByRole("button", { name: "Clock Out" }).click();
    await pause(page, 2000);
    await caption(page, "Clocked out — the monthly calendar updates automatically");
    await pause(page, 2600);
  });

  await step("travel & expenses", async () => {
    await page.goto(`${BASE}/travel`);
    await caption(page, "Travel & Expenses — merged module: site visits and expense claims together");
    await pause(page, 2600);
    await page.getByRole("button", { name: "+ New Request" }).click();
    await pause(page, 600);
    await page.getByPlaceholder("Location / site name…").fill("Saifee Villa, Matheran");
    await page.getByPlaceholder("Purpose of visit…").fill("Quarterly maintenance inspection.");
    const travelDate = new Date(); travelDate.setDate(travelDate.getDate() + 3);
    await page.locator('input[type="date"]').first().fill(travelDate.toISOString().slice(0, 10));
    await pause(page, 800);
    await page.getByRole("button", { name: "Submit Request" }).click();
    await pause(page, 2200);

    await caption(page, "Expense Claims tab — with optional linking to an approved travel request");
    await page.getByRole("button", { name: "Expense Claims" }).click();
    await pause(page, 1200);
    await page.getByRole("button", { name: "+ New Claim" }).click();
    await pause(page, 600);
    await page.getByPlaceholder("e.g. Taxi to client site").fill("Taxi to Matheran site visit");
    await page.getByPlaceholder("0.00").fill("450");
    await pause(page, 800);
    await page.getByRole("button", { name: "Submit Claim" }).click();
    await pause(page, 2400);
  });

  await step("profile", async () => {
    await page.goto(`${BASE}/profile`);
    await caption(page, "Employee Profile — personal info, ITS number, education, and password change");
    await pause(page, 3000);
  });

  await caption(page, "End of Employee Tour");
  await pause(page, 2000);
}

// ---------- ADMIN TOUR ----------
async function adminTour(page) {
  await step("admin login", async () => {
    await page.goto(`${BASE}/admin/login`);
    await caption(page, "Admin Login — authenticate with ITS number, same as employees");
    await pause(page, 2200);
    await page.locator('input[type="text"]').fill(ADMIN.username);
    await page.locator('input[type="password"]').fill(ADMIN.password);
    await pause(page, 600);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/admin$/, { timeout: 10000 });
    await caption(page, "Admin Dashboard — Operations Centre, live stats and module grid");
    await pause(page, 3000);
  });

  await step("leave approvals", async () => {
    await page.goto(`${BASE}/admin/leaves`);
    await caption(page, "Leave Approvals — review and approve/reject employee requests");
    await pause(page, 2400);
    const approveBtn = page.getByRole("button", { name: "Approve" }).first();
    if (await approveBtn.count()) {
      await approveBtn.click();
      await pause(page, 1500);
    }
    await pause(page, 1500);
  });

  await step("task management", async () => {
    await page.goto(`${BASE}/admin/tasks`);
    await caption(page, "Task Management — assign and track tasks across all Khidmat Guzars");
    await pause(page, 2800);
  });

  await step("travel & expenses admin", async () => {
    await page.goto(`${BASE}/admin/travel`);
    await caption(page, "Travel & Expenses — approve site visits/travel and expense claims in one screen");
    await pause(page, 2600);
    const approveTravel = page.getByRole("button", { name: "Approve" }).first();
    if (await approveTravel.count()) {
      await approveTravel.click();
      await pause(page, 1200);
      const modal = page.locator(".fixed.inset-0");
      const confirmApprove = modal.getByRole("button", { name: "Approve" });
      if (await confirmApprove.count()) await confirmApprove.click();
      await pause(page, 1800);
      await caption(page, "Approving a site visit auto-marks attendance present for those dates");
      await pause(page, 2400);
    }
    await page.getByRole("button", { name: "Expense Claims" }).click();
    await pause(page, 1500);
    const approveExpense = page.getByRole("button", { name: "Approve" }).first();
    if (await approveExpense.count()) {
      await approveExpense.click();
      await pause(page, 1800);
    }
  });

  await step("murasalat admin", async () => {
    await page.goto(`${BASE}/admin/murasalat`);
    await caption(page, "Murasalat — post circulars to all Khidmat Guzars or a specific department");
    await pause(page, 2600);
  });

  await step("arz admin", async () => {
    await page.goto(`${BASE}/admin/arz`);
    await caption(page, "Personal Arz — respond to employee requests and grievances");
    await pause(page, 2200);
    const firstItem = page.locator(".cursor-pointer").first();
    if (await firstItem.count()) {
      await firstItem.click();
      await pause(page, 800);
      const respondBtn = page.getByRole("button", { name: /Respond/ }).first();
      if (await respondBtn.count()) {
        await respondBtn.click();
        await pause(page, 600);
        await page.getByPlaceholder("Write your response…").fill("Approved — updated your schedule accordingly.");
        await pause(page, 800);
        await page.getByRole("button", { name: "Save Response" }).click();
        await pause(page, 1800);
      }
    }
  });

  await step("assets admin", async () => {
    await page.goto(`${BASE}/admin/assets`);
    await caption(page, "Asset Tracking — assign and return equipment");
    await pause(page, 2400);
  });

  await step("documents admin", async () => {
    await page.goto(`${BASE}/admin/documents`);
    await caption(page, "Document Vault management");
    await pause(page, 2200);
  });

  await step("lms admin", async () => {
    await page.goto(`${BASE}/admin/lms`);
    await caption(page, "L&D — manage training courses and track completion");
    await pause(page, 2400);
  });

  await step("attendance admin", async () => {
    await page.goto(`${BASE}/admin/attendance`);
    await caption(page, "Time & Attendance — monitor clock-ins, see which registered site each punch matched");
    await pause(page, 2600);
    const recordsToggle = page.getByRole("button", { name: "records" });
    if (await recordsToggle.count()) {
      await recordsToggle.click();
      await pause(page, 2400);
    }
  });

  await step("settings", async () => {
    await page.goto(`${BASE}/admin/settings`);
    await caption(page, "Settings — manage Khidmat Guzars");
    await pause(page, 2400);
    await page.goto(`${BASE}/admin/settings?tab=holidays`);
    await caption(page, "Settings — Public Holidays");
    await pause(page, 2200);
    await page.goto(`${BASE}/admin/settings?tab=work-locations`);
    await caption(page, "Settings — GPS Work Locations for attendance geofencing");
    await pause(page, 2600);
  });

  await caption(page, "End of Admin Tour");
  await pause(page, 2000);
}

// ---------- SUPER ADMIN TOUR ----------
async function superAdminTour(page) {
  await step("super admin login", async () => {
    await page.goto(`${BASE}/admin/login`);
    await caption(page, "Super Admin Login — final authority over leave approvals");
    await pause(page, 2200);
    await page.locator('input[type="text"]').fill(SUPER.username);
    await page.locator('input[type="password"]').fill(SUPER.password);
    await pause(page, 600);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/admin\/super/, { timeout: 10000 });
    await caption(page, "Executive Overview — Super Admin dashboard");
    await pause(page, 3000);
  });

  await step("scroll stats", async () => {
    await page.mouse.wheel(0, 400);
    await pause(page, 1800);
  });

  await step("final approval queue", async () => {
    await caption(page, "Final Approval Queue — leaves Admin already reviewed await final sign-off here");
    await pause(page, 2600);
    const finalApprove = page.getByRole("button", { name: "Final Approve" }).first();
    if (await finalApprove.count()) {
      await finalApprove.click();
      await pause(page, 1800);
      await caption(page, "Fully approved — the Khidmat Guzar can now view their leave slip");
      await pause(page, 2400);
    }
  });

  await step("module grid", async () => {
    await page.mouse.wheel(0, 600);
    await caption(page, "Same module access as Admin, plus final leave authority");
    await pause(page, 2800);
  });

  await caption(page, "End of Super Admin Tour");
  await pause(page, 2000);
}

(async () => {
  await recordTour("01-Employee-Tour", employeeTour);
  await recordTour("02-Admin-Tour", adminTour);
  await recordTour("03-SuperAdmin-Tour", superAdminTour);
  console.log("\nAll recordings complete.");
})().catch(err => { console.error(err); process.exit(1); });
