"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import {
  LayoutDashboard,
  ContactRound,
  Building2,
  Handshake,
  CheckSquare,
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
  { href: "/contacts", label: "Persons", icon: ContactRound },
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
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-center border-b border-primary bg-primary px-3">
        <Link href="/" className="flex items-center justify-center min-w-0">
          <Image
            src="/logo.png"
            alt="The Bell"
            width={160}
            height={44}
            className="h-11 w-auto max-w-[180px] object-contain object-center"
            priority
          />
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
