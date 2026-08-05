import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, ListChecks, QrCode, Star, Trophy, User } from "lucide-react";
import { getSessao, seed } from "@/lib/db";
import { useClienteAtual } from "@/lib/session";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const nav = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/missoes", label: "Missões", icon: ListChecks, exact: false },
  { to: "/app/pontos", label: "Pontos", icon: Star, exact: false },
  { to: "/app/ranking", label: "Ranking", icon: Trophy, exact: false },
  { to: "/app/perfil", label: "Perfil", icon: User, exact: false },
] as const;

function AppLayout() {
  const navigate = useNavigate();
  const cliente = useClienteAtual();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    finishHydration();
    seed();
    const s = getSessao();
    if (!s) navigate({ to: "/" });
    else if (s.tipo === "admin") navigate({ to: "/admin" });
  }, [navigate]);

  if (!cliente) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto w-full max-w-lg px-4 pt-5">
        <Outlet />
      </div>

      <Link
        to="/app/scan"
        aria-label="Escanear QR Code"
        className="fixed bottom-20 left-1/2 z-20 flex size-16 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition-transform active:scale-95"
      >
        <QrCode className="size-7" />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur">
        <ul className="mx-auto flex w-full max-w-lg items-stretch">
          {nav.map((item, i) => {
            const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <li key={item.to} className={`flex-1 ${i === 2 ? "mr-8" : ""} ${i === 3 ? "ml-8" : ""}`}>
                <Link
                  to={item.to}
                  className={`flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
