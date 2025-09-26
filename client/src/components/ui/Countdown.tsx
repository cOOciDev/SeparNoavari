import { useEffect, useMemo, useState } from "react";

type Props = {
  targetISO: string;
  size?: "lg" | "sm"; // lg=کارت بزرگ، sm=ریز برای لیست/باکس‌ها
  showLabels?: boolean;
};

export default function Countdown({ targetISO, size = "lg", showLabels = true }: Props) {
  const target = useMemo(() => new Date(targetISO).getTime(), [targetISO]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const closed = diff <= 0;

  const isRTL = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const L = isRTL
    ? { days: "روز", hours: "ساعت", minutes: "دقیقه", seconds: "ثانیه", closed: "به پایان رسید" }
    : { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds", closed: "Closed" };

  const pad = (n: number) => String(n).padStart(2, "0");

  const box = (value: string, label: string) => (
    <div className={`cd-box cd-${size}`}>
      <div className="cd-val">{value}</div>
      {showLabels && <div className="cd-lbl">{label}</div>}
    </div>
  );

  return (
    <div className={`cd-wrap cd-${size}`} aria-live="polite">
      {closed ? (
        <span className="cd-closed">{L.closed}</span>
      ) : (
        <>
          {box(String(d), L.days)}
          {box(pad(h), L.hours)}
          {box(pad(m), L.minutes)}
          {box(pad(s), L.seconds)}
        </>
      )}

      {/* سبک داخلی: بدون نیاز به SCSS خارجی */}
      <style>{`
        .cd-wrap { display: inline-flex; gap: 10px; font-variant-numeric: tabular-nums; align-items: stretch; }
        .cd-lg .cd-val { font-size: 34px; font-weight: 800; line-height: 1; }
        .cd-sm .cd-val { font-size: 16px; font-weight: 700; line-height: 1; }

        .cd-box {
          display: grid; gap: 4px; place-items: center;
          border-radius: 14px;
          padding: 10px 12px;
          background: linear-gradient(135deg, rgba(38,198,218,.15), rgba(139,233,240,.10));
          border: 1px solid rgba(255,255,255,.14);
          min-width: 70px;
        }
        .cd-sm.cd-box { min-width: 56px; padding: 8px 10px; border-radius: 10px; }

        .cd-lbl { font-size: 11px; opacity: .85; letter-spacing: .2px; }
        .cd-closed {
          font-weight: 800; padding: 8px 12px; border-radius: 10px;
          background: rgba(255,99,71,.15); border: 1px solid rgba(255,99,71,.35);
          color: #ffb0a3;
        }

        /* هماهنگی با تم روشن */
        html[data-theme="light"] .cd-box {
          background: linear-gradient(135deg, rgba(37,99,235,.12), rgba(37,99,235,.06));
          border-color: rgba(15,23,42,.12);
        }
      `}</style>
    </div>
  );
}
