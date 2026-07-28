"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SESSION_KEY = "push-prompt-dismissed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function getPushState(): Promise<"unsupported" | "denied" | "subscribed" | "unsubscribed"> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/m/" });
  const sub = await reg.pushManager.getSubscription();
  return sub ? "subscribed" : "unsubscribed";
}

async function subscribeToPush(vapidKey: string) {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permission denied");

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
}

export default function PushRegistration() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let timer: ReturnType<typeof setTimeout>;
    getPushState().then(state => {
      if (state === "unsubscribed") {
        timer = setTimeout(() => setVisible(true), 1200);
      }
    }).catch(() => {});

    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  }

  async function enable() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) { dismiss(); return; }
    setLoading(true);
    try {
      await subscribeToPush(vapidKey);
      setDone(true);
      setTimeout(dismiss, 1400);
    } catch {
      dismiss();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(10,18,35,0.55)", backdropFilter: "blur(6px)" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed z-50 left-1/2 -translate-x-1/2 rounded-3xl bg-white"
            style={{
              bottom: "max(calc(env(safe-area-inset-bottom) + 80px), 80px)",
              width: "min(92vw, 380px)",
              padding: "28px 24px 24px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.28), 0 2px 12px rgba(0,0,0,0.12)",
            }}
          >
            <div
              className="w-[60px] h-[60px] rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "linear-gradient(145deg, #4F46E5, #7C3AED)", boxShadow: "0 6px 20px rgba(124,58,237,0.35)" }}
            >
              {done ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="0.5"/></svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </div>

            <p className="text-center font-bold text-[17px] mb-1.5" style={{ color: "#0F172A" }}>
              {done ? "Notifications enabled!" : "Stay in the loop"}
            </p>
            <p className="text-center text-[13.5px] leading-relaxed mb-6" style={{ color: "#64748B" }}>
              {done
                ? "You'll get instant alerts for leave, tasks, and circulars."
                : "Get instant alerts for leave approvals, new circulars, and clock-in reminders."}
            </p>

            {!done && (
              <>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={enable}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2"
                  style={{
                    background: loading ? "rgba(79,70,229,0.6)" : "linear-gradient(145deg, #4F46E5, #7C3AED)",
                    boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
                  }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full inline-block animate-spin" style={{ border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white" }} />
                      Enabling…
                    </>
                  ) : "Enable Notifications"}
                </motion.button>
                <button onClick={dismiss} className="w-full mt-2.5 py-2.5 text-[13.5px] font-semibold" style={{ color: "#94A3B8" }}>
                  Not now
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
