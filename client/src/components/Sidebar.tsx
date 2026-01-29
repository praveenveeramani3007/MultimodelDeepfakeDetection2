import { Link, useLocation } from "wouter";
import { LayoutDashboard, History, LogOut, ShieldCheck, PieChart, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/history", icon: History, label: "History" },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-card/50 backdrop-blur-xl border-r border-border fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight">VeriSight</h1>
            <p className="text-xs text-muted-foreground">AI Forensic Tool</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-2">
        <div className="mb-6 px-2">
          <Link href="/upload">
             <button className={cn(
               "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm shadow-lg",
               location === "/upload" 
                 ? "bg-primary text-primary-foreground shadow-primary/25"
                 : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
             )}>
              <UploadCloud className="w-4 h-4" />
              New Analysis
            </button>
          </Link>
        </div>

        <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Menu
        </p>
        
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.firstName?.[0] || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.firstName || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button 
            onClick={() => logout()}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
