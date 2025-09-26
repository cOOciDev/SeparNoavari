import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import { useEffect } from "react";
// import { useAuth } from "../contexts/AuthContext";

export default function DefaultLayout() {
  const loc = useLocation();
  // const { isAuthenticated } = useAuth();

  // Optional: keep your instant scroll-to-top on route change
  useEffect(() => {
    // guard for SSR / non-browser
    // if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    //   // "instant" isn't standard across TS types, cast for safety
    //   window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    // }

    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [loc.pathname]);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100dvh" }}>
      <Header
        loginHref="/login"
        signupHref="/signup"
        accountHref="/account"
      />
      {/* React Router handles scroll restoration between entries */}
      <ScrollRestoration />
      <Outlet />
      <Footer />
    </div>
  );
}
