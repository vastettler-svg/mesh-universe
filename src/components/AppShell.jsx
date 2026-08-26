import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import Header from "./Header";
import BottomNav from "./BottomNav";

const PRIMARY_ROUTES = new Set([
  "/",
  "/scores",
  "/standings",
  "/league",
  "/stats",
  "/more",
]);

function getBackFallback(pathname) {
  if (/^\/scores\/[^/]+/.test(pathname)) {
    return "/scores";
  }

  if (/^\/league\/franchises\/[^/]+/.test(pathname)) {
    return "/league/franchises";
  }

  if (pathname === "/league/franchises") {
    return "/league";
  }

  if (/^\/league\/coaches\/[^/]+/.test(pathname)) {
    return "/league/coaches";
  }

  if (pathname === "/league/coaches") {
    return "/league";
  }

  if (
    pathname === "/history" ||
    pathname === "/rules" ||
    pathname === "/league-links"
  ) {
    return "/more";
  }

  return "/";
}

function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const showUniversalBack = !PRIMARY_ROUTES.has(location.pathname);

  const handleUniversalBack = () => {
    /*
     * React Router's browser history stores an internal `idx`.
     * If idx > 0, this route was reached from another route in the
     * current browser/app history, so go back to that exact page,
     * including its query string and filter state.
     *
     * A directly opened/bookmarked deep link normally has idx === 0.
     * In that case use the logical MESH section fallback instead of
     * sending the user out of the app.
     */
    const historyIndex = window.history.state?.idx;

    if (Number.isFinite(historyIndex) && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate(getBackFallback(location.pathname), { replace: true });
  };

  return (
    <div
      className={`app-shell ${
        showUniversalBack ? "app-shell-has-universal-back" : ""
      }`}
    >
      <Header />

      <main className="app-main">
        <div className="app-content">
          {showUniversalBack ? (
            <div className="universal-back-row">
              <button
                type="button"
                className="universal-back-button"
                onClick={handleUniversalBack}
                aria-label="Go back to previous page"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            </div>
          ) : null}

          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default AppShell;
