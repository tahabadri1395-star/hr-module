#!/usr/bin/env node
/**
 * Records three narrated screen-capture videos (Employee, Admin, Super Admin)
 * walking through every module of the HR system, against a LOCAL throwaway
 * database — never touches production data.
 *
 * Narration: each caption is spoken via macOS `say`, and the on-screen pause
 * is sized to the actual speech duration (not a guess), so audio and visuals
 * stay in sync. The silent video Playwright records is muxed with the
 * generated narration track via ffmpeg into a final .mp4.
 *
 * Requires: macOS `say`, and `ffmpeg`/`ffprobe` on PATH (brew install ffmpeg).
 *
 * Usage: node scripts/record-demo-video.cjs
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const BASE = "http://localhost:3100";
const OUT_DIR = "/tmp/hr-video-out";
const VOICE = "Samantha";
const SITE = { latitude: 18.93680875941995, longitude: 72.8341841206532 };
const PAUSE = 900; // default silent pause between actions (not narrated)

const EMP   = { its: "90001234", password: "Demo@123" };
const ADMIN = { username: "30303943", password: "AQ@Secure99" };
const SUPER = { username: "20359529", password: "AB@Secure99" };

fs.mkdirSync(OUT_DIR, { recursive: true });

function speechDurationSec(file) {
  const out = execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]).toString().trim();
  return parseFloat(out) || 0;
}

async function pause(page, ms = PAUSE) {
  await page.waitForTimeout(ms);
}

/** Speak `text` as narration, show it as an on-screen caption, and wait for
 * the speech to finish (plus a short buffer) before returning. Records the
 * clip + its offset (relative to recording start) for later muxing. */
function makeNarrator(clips, recordingStart, clipDir) {
  let n = 0;
  return async function narrate(page, text) {
    const file = path.join(clipDir, `clip-${n++}.aiff`);
    execFileSync("say", ["-v", VOICE, "-o", file, text]);
    const dur = speechDurationSec(file);
    const offsetMs = Date.now() - recordingStart;
    clips.push({ file, offsetMs, dur });

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

    await page.waitForTimeout(dur * 1000 + 500);
  };
}

async function step(label, fn) {
  try {
    await fn();
  } catch (err) {
    console.warn(`[skip] ${label}: ${err.message.split("\n")[0]}`);
  }
}

async function muxNarration(videoPath, clips, outPath) {
  if (!clips.length) { fs.copyFileSync(videoPath, outPath); return; }
  const args = ["-y", "-i", videoPath];
  for (const c of clips) args.push("-i", c.file);

  const delayed = clips.map((c, i) => `[${i + 1}:a]adelay=${Math.round(c.offsetMs)}|${Math.round(c.offsetMs)}[a${i}]`);
  const mixInputs = clips.map((_, i) => `[a${i}]`).join("");
  const filter = `${delayed.join("; ")}; ${mixInputs}amix=inputs=${clips.length}:duration=longest:dropout_transition=0[aout]`;

  args.push(
    "-filter_complex", filter,
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast",
    "-c:a", "aac", "-b:a", "160k",
    outPath
  );
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}

async function recordTour(name, fn) {
  const dir = path.join(OUT_DIR, name);
  const clipDir = path.join(dir, "clips");
  fs.mkdirSync(clipDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir, size: { width: 1440, height: 900 } },
  });
  await context.grantPermissions(["geolocation"], { origin: BASE });
  await context.setGeolocation(SITE);
  const page = await context.newPage();
  const recordingStart = Date.now();
  const clips = [];
  const narrate = makeNarrator(clips, recordingStart, clipDir);

  console.log(`\n=== Recording: ${name} ===`);
  await fn(page, narrate);

  await page.close();
  await context.close();
  await browser.close();

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".webm"));
  if (files.length) {
    const rawPath = path.join(dir, files[0]);
    const finalPath = path.join(OUT_DIR, `${name}.mp4`);
    console.log(`Muxing narration for ${name} (${clips.length} lines)...`);
    await muxNarration(rawPath, clips, finalPath);
    console.log(`Saved: ${finalPath}`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

// ---------- EMPLOYEE TOUR ----------
async function employeeTour(page, narrate) {
  await step("goto login", async () => {
    await page.goto(`${BASE}/login`);
    await narrate(page, "Welcome to the Khidmat Guzar Portal. Employees log in here using their ITS number instead of an email address.");
  });

  await step("employee login", async () => {
    await page.locator('input[type="text"]').fill(EMP.its);
    await page.locator('input[type="password"]').fill(EMP.password);
    await pause(page, 500);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await narrate(page, "This is the employee dashboard. Every module is one tap away, and the small badges show what's waiting for your attention.");
  });

  await step("scroll dashboard", async () => {
    await page.mouse.wheel(0, 500);
    await pause(page, 800);
    await page.mouse.wheel(0, -500);
  });

  await step("apply leave", async () => {
    await page.goto(`${BASE}/apply`);
    await narrate(page, "Applying for leave supports emergency or normal requests, half days, and warns you automatically about upcoming public holidays.");
    const start = new Date(); start.setDate(start.getDate() + 5);
    const end = new Date(); end.setDate(end.getDate() + 6);
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill(start.toISOString().slice(0, 10));
    await dateInputs.nth(1).fill(end.toISOString().slice(0, 10));
    await page.getByPlaceholder("Provide a detailed reason for your leave request...").fill("Family function out of town.");
    await pause(page, 500);
    await page.getByRole("button", { name: "Submit Application" }).click();
    await pause(page, 1500);
    await narrate(page, "Submitted. This request now appears immediately in the Admin's approval queue.");
  });

  await step("dashboard tasks", async () => {
    await page.goto(`${BASE}/dashboard`);
    await pause(page, 500);
    await page.locator("#tasks").scrollIntoViewIfNeeded();
    await narrate(page, "Tasks assigned by Admin show up right on the dashboard, with priority and due dates.");
  });

  await step("murasalat", async () => {
    await page.goto(`${BASE}/murasalat`);
    await narrate(page, "Murasalat holds official circulars from HR, filterable by priority and department.");
  });

  await step("arz", async () => {
    await page.goto(`${BASE}/arz`);
    await narrate(page, "Personal Arz lets an employee send a private request or grievance directly to HR.");
    await page.getByRole("button", { name: "+ New Arz" }).click();
    await pause(page, 500);
    await page.getByPlaceholder("Brief subject of your arz…").fill("Request for schedule change");
    await page.getByPlaceholder("Explain your request in detail…").fill("Requesting a shift in weekly off day due to a family commitment.");
    await pause(page, 500);
    await page.getByRole("button", { name: "Submit Arz" }).click();
    await pause(page, 1500);
  });

  await step("assets", async () => {
    await page.goto(`${BASE}/assets`);
    await narrate(page, "My Assets shows equipment currently assigned to this employee.");
  });

  await step("documents", async () => {
    await page.goto(`${BASE}/documents`);
    await narrate(page, "The Document Vault holds company policies, forms, and circulars.");
  });

  await step("lms", async () => {
    await page.goto(`${BASE}/lms`);
    await narrate(page, "Learning and Development lists training courses assigned to the employee's department.");
  });

  await step("attendance", async () => {
    await page.goto(`${BASE}/attendance`);
    await narrate(page, "Attendance uses GPS verification. Right now we're positioned exactly at the registered work site.");
    await page.getByRole("button", { name: "Clock In" }).click();
    await pause(page, 1200);
    await narrate(page, "Clocked in — the server checked our location against every registered site's radius before accepting it.");
    await page.getByRole("button", { name: "Clock Out" }).click();
    await pause(page, 1200);
    await narrate(page, "And clocking out. The monthly calendar below updates automatically.");
  });

  await step("travel & expenses", async () => {
    await page.goto(`${BASE}/travel`);
    await narrate(page, "Travel and Expenses is a merged module: site visit requests and expense claims live together here.");
    await page.getByRole("button", { name: "+ New Request" }).click();
    await pause(page, 500);
    await page.getByPlaceholder("Location / site name…").fill("Saifee Villa, Matheran");
    await page.getByPlaceholder("Purpose of visit…").fill("Quarterly maintenance inspection.");
    const travelDate = new Date(); travelDate.setDate(travelDate.getDate() + 3);
    await page.locator('input[type="date"]').first().fill(travelDate.toISOString().slice(0, 10));
    await pause(page, 500);
    await page.getByRole("button", { name: "Submit Request" }).click();
    await pause(page, 1200);

    await page.getByRole("button", { name: "Expense Claims" }).click();
    await pause(page, 800);
    await narrate(page, "Expense claims can optionally link back to an approved travel request.");
    await page.getByRole("button", { name: "+ New Claim" }).click();
    await pause(page, 500);
    await page.getByPlaceholder("e.g. Taxi to client site").fill("Taxi to Matheran site visit");
    await page.getByPlaceholder("0.00").fill("450");
    await pause(page, 500);
    await page.getByRole("button", { name: "Submit Claim" }).click();
    await pause(page, 1200);
  });

  await step("profile", async () => {
    await page.goto(`${BASE}/profile`);
    await narrate(page, "And finally, the employee's own profile — personal info, ITS number, education history, and password change, all in one place.");
  });

  await narrate(page, "That's the employee side. Next, let's look at what Admin sees.");
}

// ---------- ADMIN TOUR ----------
async function adminTour(page, narrate) {
  await step("admin login", async () => {
    await page.goto(`${BASE}/admin/login`);
    await narrate(page, "Admins log in the same way — with an ITS number instead of a separate username scheme.");
    await page.locator('input[type="text"]').fill(ADMIN.username);
    await page.locator('input[type="password"]').fill(ADMIN.password);
    await pause(page, 500);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/admin$/, { timeout: 10000 });
    await narrate(page, "This is the Operations Centre — Admin's dashboard, with live stats and every module in a grid.");
  });

  await step("leave approvals", async () => {
    await page.goto(`${BASE}/admin/leaves`);
    await narrate(page, "Leave Approvals is where Admin reviews requests. Here's the one we just submitted as an employee.");
    const approveBtn = page.getByRole("button", { name: "Approve" }).first();
    if (await approveBtn.count()) {
      await approveBtn.click();
      await pause(page, 1200);
      await narrate(page, "Approved. It now moves on to Super Admin for final sign-off.");
    }
  });

  await step("task management", async () => {
    await page.goto(`${BASE}/admin/tasks`);
    await narrate(page, "Task Management lets Admin assign and track tasks across every Khidmat Guzar.");
  });

  await step("travel & expenses admin", async () => {
    await page.goto(`${BASE}/admin/travel`);
    await narrate(page, "Travel and Expenses on the Admin side approves both site visits and expense claims from one screen.");
    const approveTravel = page.getByRole("button", { name: "Approve" }).first();
    if (await approveTravel.count()) {
      await approveTravel.click();
      await pause(page, 800);
      const modal = page.locator(".fixed.inset-0");
      const confirmApprove = modal.getByRole("button", { name: "Approve" });
      if (await confirmApprove.count()) await confirmApprove.click();
      await pause(page, 1200);
      await narrate(page, "Approving a site visit automatically marks attendance present for those dates, so field staff aren't blocked by the GPS check.");
    }
    await page.getByRole("button", { name: "Expense Claims" }).click();
    await pause(page, 800);
    const approveExpense = page.getByRole("button", { name: "Approve" }).first();
    if (await approveExpense.count()) {
      await approveExpense.click();
      await pause(page, 1200);
    }
  });

  await step("murasalat admin", async () => {
    await page.goto(`${BASE}/admin/murasalat`);
    await narrate(page, "Murasalat management — Admin posts circulars to everyone, or to a specific department.");
  });

  await step("arz admin", async () => {
    await page.goto(`${BASE}/admin/arz`);
    await narrate(page, "And here Admin responds to the personal arz request we submitted earlier.");
    const firstItem = page.locator(".cursor-pointer").first();
    if (await firstItem.count()) {
      await firstItem.click();
      await pause(page, 500);
      const respondBtn = page.getByRole("button", { name: /Respond/ }).first();
      if (await respondBtn.count()) {
        await respondBtn.click();
        await pause(page, 500);
        await page.getByPlaceholder("Write your response…").fill("Approved — updated your schedule accordingly.");
        await pause(page, 500);
        await page.getByRole("button", { name: "Save Response" }).click();
        await pause(page, 1200);
      }
    }
  });

  await step("assets admin", async () => {
    await page.goto(`${BASE}/admin/assets`);
    await narrate(page, "Asset Tracking handles assigning and returning equipment.");
  });

  await step("documents admin", async () => {
    await page.goto(`${BASE}/admin/documents`);
    await narrate(page, "Document Vault management on the Admin side.");
  });

  await step("lms admin", async () => {
    await page.goto(`${BASE}/admin/lms`);
    await narrate(page, "L&D lets Admin manage training courses and track completion.");
  });

  await step("attendance admin", async () => {
    await page.goto(`${BASE}/admin/attendance`);
    await narrate(page, "Time and Attendance shows every clock-in, including exactly which registered site each one matched.");
    const recordsToggle = page.getByRole("button", { name: "records" });
    if (await recordsToggle.count()) {
      await recordsToggle.click();
      await pause(page, 1200);
    }
  });

  await step("settings", async () => {
    await page.goto(`${BASE}/admin/settings`);
    await narrate(page, "Settings covers Khidmat Guzar accounts,");
    await page.goto(`${BASE}/admin/settings?tab=holidays`);
    await narrate(page, "public holidays,");
    await page.goto(`${BASE}/admin/settings?tab=work-locations`);
    await narrate(page, "and the GPS work locations that power attendance geofencing.");
  });

  await narrate(page, "That's the Admin side. Finally, let's see Super Admin.");
}

// ---------- SUPER ADMIN TOUR ----------
async function superAdminTour(page, narrate) {
  await step("super admin login", async () => {
    await page.goto(`${BASE}/admin/login`);
    await narrate(page, "Super Admin is the final authority — same ITS-based login.");
    await page.locator('input[type="text"]').fill(SUPER.username);
    await page.locator('input[type="password"]').fill(SUPER.password);
    await pause(page, 500);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/admin\/super/, { timeout: 10000 });
    await narrate(page, "This is the Executive Overview.");
  });

  await step("scroll stats", async () => {
    await page.mouse.wheel(0, 400);
    await pause(page, 800);
  });

  await step("final approval queue", async () => {
    await narrate(page, "The Final Approval Queue holds leaves Admin already reviewed, waiting on Super Admin's decision — like the one from our tour.");
    const finalApprove = page.getByRole("button", { name: "Final Approve" }).first();
    if (await finalApprove.count()) {
      await finalApprove.click();
      await pause(page, 1200);
      await narrate(page, "Fully approved. The Khidmat Guzar can now view their official leave slip.");
    }
  });

  await step("module grid", async () => {
    await page.mouse.wheel(0, 600);
    await narrate(page, "Super Admin has the same module access as Admin, plus this final leave authority.");
  });

  await narrate(page, "And that's the complete tour of the HR module, across all three roles. Thanks for watching.");
}

(async () => {
  await recordTour("01-Employee-Tour", employeeTour);
  await recordTour("02-Admin-Tour", adminTour);
  await recordTour("03-SuperAdmin-Tour", superAdminTour);
  console.log("\nAll recordings complete.");
})().catch(err => { console.error(err); process.exit(1); });
