import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Dumbbell,
  Gift,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PackageCheck,
  QrCode,
  Settings,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getSessao } from "@/lib/db";
import { iniciarDados, logout, useCachePronto, useSessao } from "@/lib/session";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

export const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/qrcode", label: "QR Code", icon: QrCode, exact: false },
  { to: "/admin/clientes", label: "Clientes", icon: Users, exact: false },
  { to: "/admin/convites", label: "Convites", icon: Link2, exact: false },
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
  const pronto = useCachePronto();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    iniciarDados();
  }, []);

  useEffect(() => {
    if (!pronto) return;
    const s = getSessao();
    if (!s) navigate({ to: "/" });
    else if (s.tipo === "cliente") navigate({ to: "/app" });
  }, [pronto, navigate]);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  if (!sessao || sessao.tipo !== "admin") return null;

  const sair = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const links = (
    <nav className="flex flex-col gap-1">
      {adminNav.map((item) => {
        const active = item.exact
          ? pathname === item.to
          : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-sidebar-accent text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent/60"
            }`}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Topo mobile com menu hambúrguer */}
      <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-sidebar-border bg-sidebar px-3 py-3 lg:hidden">
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SheetTitle className="flex items-center gap-2 px-4 py-4 text-base font-black">
              <BarChart3 className="size-5 text-primary" /> PulseFit Admin
            </SheetTitle>
            <div className="px-2">{links}</div>
            <div className="px-3 pt-4">
              <Button variant="secondary" className="w-full" onClick={sair}>
                <LogOut className="mr-2 size-4" /> Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <span className="truncate font-black">PulseFit Admin</span>
        <Button variant="ghost" size="icon" aria-label="Sair" onClick={sair}>
          <LogOut className="size-5" />
        </Button>
      </header>

      {/* Barra lateral desktop */}
      <aside className="hidden border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:block lg:h-screen lg:w-60 lg:shrink-0 lg:border-r">
        <div className="flex items-center gap-2 px-4 py-4">
          <BarChart3 className="size-5 text-primary" />
          <span className="font-black">PulseFit Admin</span>
        </div>
        <div className="px-2">{links}</div>
        <div className="px-3 pt-4">
          <Button variant="secondary" className="w-full" onClick={sair}>
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
