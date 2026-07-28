"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface TodayRecord {
  clock_in: string | null;
  clock_out: string | null;
  status: "present" | "late";
  clock_in_location_name: string | null;
  marked_by: string;
}

function fmtTime(t: string | null) {
  if (!t) return "—";
  return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location isn't available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(new Error(err.code === err.PERMISSION_DENIED ? "Location access denied." : "Couldn't get your location.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export default function ClockInOutCard() {
  const [today, setToday] = useState<TodayRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/attendance");
    if (res.ok) {
      const d = await res.json();
      setToday(d.today);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(action: "clock_in" | "clock_out") {
    setActing(true);
    setMsg("");
    try {
      const { lat, lng } = await getLocation();
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, lat, lng }),
      });
      const d = await res.json();
      if (res.ok) await load();
      else setMsg(d.error || "Something went wrong.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return <div className="rounded-2xl h-28 animate-pulse" style={{ backgroundColor: "#F1F5F9" }} />;
  }

  const clockedIn = !!today?.clock_in;
  const clockedOut = !!today?.clock_out;

  return (
    <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", boxShadow: "0 10px 30px rgba(79,70,229,0.25)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>Today's Attendance</p>
          <p className="text-white text-sm font-semibold mt-0.5">
            {clockedIn ? `In ${fmtTime(today!.clock_in)}` : "Not clocked in"}
            {clockedOut ? ` · Out ${fmtTime(today!.clock_out)}` : ""}
          </p>
        </div>
        {clockedIn && (
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide"
            style={{ backgroundColor: today?.status === "late" ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.2)", color: "white" }}
          >
            {today?.status}
          </span>
        )}
      </div>

      {msg && <p className="text-xs mb-2" style={{ color: "#FCA5A5" }}>{msg}</p>}

      {!clockedOut && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          disabled={acting}
          onClick={() => act(clockedIn ? "clock_out" : "clock_in")}
          className="w-full py-3 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "white", color: "#4F46E5", opacity: acting ? 0.7 : 1 }}
        >
          {acting ? "Please wait…" : clockedIn ? "Clock Out" : "Clock In"}
        </motion.button>
      )}
      {clockedOut && (
        <div className="w-full py-3 rounded-xl text-sm font-semibold text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>
          Day complete ✓
        </div>
      )}
    </div>
  );
}
