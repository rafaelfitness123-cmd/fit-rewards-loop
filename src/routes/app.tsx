import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, ListChecks, QrCode, Star, Trophy, User } from "lucide-react";
import { getSessao } from "@/lib/db";
import { iniciarDados, useCachePronto, useClienteAtual } from "@/lib/session";

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
  const pronto = useCachePronto();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    iniciarDados();
  }, []);

  useEffect(() => {
    if (!pronto) return;
    const s = getSessao();
    if (!s) navigate({ to: "/" });
    else if (s.tipo === "admin") navigate({ to: "/admin" });
  }, [pronto, navigate]);

  if (!cliente) return null;

  return (
    <div className="min-h-screen bg-background pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-lg px-4 pt-5">
        <Outlet />
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 mx-auto flex w-full max-w-lg justify-end px-4">
        <div className="pointer-events-auto flex flex-col gap-3">
          <Link
            to="/app/scan"
            aria-label="Escanear QR Code"
            className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition-transform active:scale-95"
          >
            <QrCode className="size-6" />
          </Link>
        </div>
      </div>


      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid w-full max-w-lg grid-cols-5">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <li key={item.to} className="min-w-0">
                <Link
                  to={item.to}
                  className={`flex min-w-0 flex-col items-center gap-1 px-1 py-2.5 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="size-5 shrink-0" />
                  <span className="w-full truncate text-center text-[10px] font-medium leading-tight">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
