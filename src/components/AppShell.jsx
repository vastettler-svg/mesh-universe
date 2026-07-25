import Header from "./Header";
import BottomNav from "./BottomNav";

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}

export default AppShell;