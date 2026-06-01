"use client";

import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, ShoppingBag, Coffee, Users, Grid, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
  const { profile } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { href: "/admin/tables", icon: Grid, label: "Tables" },
    { href: "/admin/menu", icon: Coffee, label: "Menu" }
  ];

  return (
    <>
      {/* Desktop Sidebar (Hidden on mobile) */}
      <aside className="hidden md:flex w-64 fixed inset-y-0 left-0 border-r border-white/10 glass-md flex-col z-40">
        <div className="p-8 pb-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
            <Coffee size={20} />
          </div>
          <div>
            <h1 className="font-semibold tracking-widest text-sm">AURA</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Operating System</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 flex flex-col gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className={`sidebar-link ${isActive ? "active" : ""}`}>
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="glass p-4 rounded-2xl border-white/5 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center uppercase font-mono text-xs">
              {profile?.full_name?.substring(0, 2) || profile?.email?.substring(0, 2) || "AD"}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium truncate">{profile?.full_name || "Administrator"}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest">{profile?.role || "Full Access"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Premium Glass Mobile Bottom Navigation Bar (Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#080808]/90 backdrop-blur-lg border-t border-white/10 z-50 flex items-center justify-around px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-1 text-[9px] uppercase tracking-wider font-bold transition-all ${
                isActive ? 'text-amber-200 scale-105' : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-amber-200' : 'text-white/40'} />
              <span className="text-[8px] tracking-wide font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
