import { useEffect, useMemo, useState } from "react";

type CountdownProps = {
  targetISO: string;
  size?: "sm" | "lg";
  showLabels?: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");

const diffToParts = (diffMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

export default function Countdown({
  targetISO,
  size = "sm",
  showLabels = true,
}: CountdownProps) {
  const target = useMemo(() => new Date(targetISO).getTime(), [targetISO]);
  const [diff, setDiff] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    const tick = () => setDiff(Math.max(0, target - Date.now()));
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const { days, hours, minutes, seconds } = diffToParts(diff);

  return (
    <div className={`cd cd-${size}`} aria-live="polite">
      <span>
        {days}
        {showLabels ? "d " : ":"}
      </span>
      <span>
        {pad(hours)}
        {showLabels ? "h " : ":"}
      </span>
      <span>
        {pad(minutes)}
        {showLabels ? "m " : ":"}
      </span>
      <span>
        {pad(seconds)}
        {showLabels ? "s" : ""}
      </span>
    </div>
  );
}
