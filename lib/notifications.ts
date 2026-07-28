import webpush from "web-push";
import { query } from "@/lib/db";

export type NotificationType = "leave" | "attendance" | "murasalat" | "expense" | "travel";

interface NotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function sendPush(employeeId: number, input: NotificationInput) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const subs = await query(`SELECT * FROM hr_push_subscriptions WHERE employee_id=$1`, [employeeId]);
  if (subs.rows.length === 0) return;

  const payload = JSON.stringify({ title: input.title, body: input.body, link: input.link ?? "/" });

  await Promise.allSettled(
    subs.rows.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await query(`DELETE FROM hr_push_subscriptions WHERE id=$1`, [sub.id]);
        }
      }
    })
  );
}

export async function notifyEmployee(employeeId: number, input: NotificationInput) {
  await query(
    `INSERT INTO hr_notifications (employee_id, type, title, body, link) VALUES ($1,$2,$3,$4,$5)`,
    [employeeId, input.type, input.title, input.body, input.link ?? null]
  );
  await sendPush(employeeId, input);
}

export async function notifyDepartment(department: string | null, input: NotificationInput) {
  const recipients = await query(
    `SELECT id FROM hr_employees WHERE active = 1 AND ($1::text IS NULL OR department = $1)`,
    [department]
  );
  for (const row of recipients.rows) {
    await notifyEmployee(row.id, input);
  }
}
