"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  ContactRound,
  Building2,
  Handshake,
  CheckSquare,
  Briefcase,
  Megaphone,
  Filter,
  BarChart3,
  Zap,
  Settings,
  FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";

// One "Contacts" for all people (use stage tabs on the page: All, Awareness, Interest, Desire, Action).
// Companies = organizations. Leads/Customers are just Contacts filtered by stage (no separate nav).
const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/funnel", label: "Funnel", icon: Filter },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/deals", label: "Deals", icon: Handshake },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/forms", label: "Forms", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/automation", label: "Automation", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Briefcase className="h-6 w-6 text-primary" />
          <span>The Bell CRM</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="border-t border-border p-2 flex items-center gap-2">
          <span className="truncate flex-1 text-xs text-muted-foreground">
            {user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Account"}
          </span>
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      )}
    </aside>
  );
}
