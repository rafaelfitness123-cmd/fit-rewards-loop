import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  BarChart3,
  Dumbbell,
  Gift,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PackageCheck,
  QrCode,
  Settings,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessao, seed } from "@/lib/db";
import { logout, useSessao } from "@/lib/session";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

export const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/qrcode", label: "QR Code", icon: QrCode, exact: false },
  { to: "/admin/clientes", label: "Clientes", icon: Users, exact: false },
  { to: "/admin/treinos", label: "Treinos", icon: Dumbbell, exact: false },
  { to: "/admin/pontuacao", label: "Pontuação", icon: Star, exact: false },
  { to: "/admin/missoes", label: "Missões", icon: ListChecks, exact: false },
  { to: "/admin/recompensas", label: "Recompensas", icon: Gift, exact: false },
  { to: "/admin/resgates", label: "Resgates", icon: PackageCheck, exact: false },
  { to: "/admin/ranking", label: "Ranking", icon: Trophy, exact: false },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const sessao = useSessao();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    seed();
    const s = getSessao();
    if (!s) navigate({ to: "/" });
    else if (s.tipo === "cliente") navigate({ to: "/app" });
  }, [navigate]);

  if (!sessao || sessao.tipo !== "admin") return null;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 z-10 border-b border-sidebar-border bg-sidebar lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2 px-4 py-4">
          <BarChart3 className="size-5 text-primary" />
          <span className="font-black">PulseFit Admin</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:overflow-visible">
          {adminNav.map((item) => {
            const active = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-3 pb-4 lg:block">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="mr-2 size-4" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
