// client/src/app/ui/Footer.tsx
export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,.12)", marginTop: 40, padding: "24px 0 40px" }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <small>© {new Date().getFullYear()} cOOciDev , مرکز رشد نوشهر , دانشگاه علوم دریایی امام خمینی (ره)</small>
        <a href="/sample.docx" style={{ opacity: .85, textDecoration: "none" }}>Download Template (word)</a>
      </div>
    </footer>
  )
}
