import { useTheme } from "../../contexts/ThemeContext";

export default function ThemeSwitch() {
  const { mode, resolved, setMode, toggle } = useTheme();
  return (
    <div className="flex items-center gap-2">
      <button onClick={toggle} className="px-3 py-1 rounded border">
        Theme: {mode} → {resolved}
      </button>
      <select value={mode} onChange={e => setMode(e.target.value as 'system' | 'light' | 'dark')} className="px-2 py-1 rounded border">
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
