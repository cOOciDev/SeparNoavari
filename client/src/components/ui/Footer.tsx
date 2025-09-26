// client/src/app/ui/Footer.tsx
export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,.12)", marginTop: 40, padding: "24px 0 40px" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <small>© {new Date().getFullYear()} Spear Innovation Event</small>
        <a href="#call" style={{ opacity: .85, textDecoration: "none" }}>Download Call (PDF)</a>
      </div>
    </footer>
  )
}
