"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookmarkCheck,
  Archive,
  Tag,
  Zap,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { href: "/applications", icon: Briefcase,       label: "Applications" },
  { href: "/bookmarks",    icon: BookmarkCheck,   label: "Bookmarks" },
  { href: "/analytics",    icon: BarChart3,       label: "Analytics" },
  { href: "/reminders",    icon: Bell,            label: "Reminders" },
  { href: "/achievements", icon: Trophy,          label: "Achievements" },
  { href: "/archive",      icon: Archive,         label: "Archive" },
  { href: "/tags",         icon: Tag,             label: "Tags" },
];

const bottomItems = [
  { href: "/admin",    icon: ShieldCheck, label: "Admin" },
  { href: "/settings", icon: Settings,   label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 220 : 60 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar flex-shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-3 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="font-semibold text-sm tracking-tight whitespace-nowrap"
                >
                  JobFlow AI
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 scrollbar-hidden">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            isActive && "text-primary"
                          )}
                        />
                        <AnimatePresence>
                          {sidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.1 }}
                              className="whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </TooltipTrigger>
                    {!sidebarOpen && (
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    )}
                  </Tooltip>
                </li>
              );
            })}
          </ul>

          {/* AI Section */}
          <div className="mt-4 border-t border-sidebar-border pt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-all duration-150",
                    "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                  onClick={() => useAppStore.getState().setIsAISidebarOpen(true)}
                >
                  <Sparkles className="h-4 w-4 flex-shrink-0 text-violet-500" />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="whitespace-nowrap"
                      >
                        AI Assistant
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">AI Assistant</TooltipContent>
              )}
            </Tooltip>
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border py-2 px-2">
          {bottomItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-all duration-150",
                    pathname.startsWith(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">{item.label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </motion.aside>
    </TooltipProvider>
  );
}
