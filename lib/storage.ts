const SUPABASE_URL = "https://wnegcxgwqiwbaqiiuvtv.supabase.co";
const BUCKET = "avatars";

export async function uploadAvatar(employeeId: number, file: File): Promise<string> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Photo uploads aren't configured yet.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${employeeId}-${Date.now()}.${ext}`;

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: await file.arrayBuffer(),
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
