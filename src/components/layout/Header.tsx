"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Plus,
  Moon,
  Sun,
  Command,
  User as UserIcon,
  LogOut,
  CreditCard,
  Settings,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setIsQuickAddOpen, globalSearch, setGlobalSearch } = useAppStore();
  const [user, setUser] = useState<User | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setIsQuickAddOpen(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setIsQuickAddOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const userMeta = user?.user_metadata;
  const displayName = userMeta?.full_name || userMeta?.name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const avatarUrl = userMeta?.avatar_url;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4">
      {title && (
        <h1 className="text-sm font-semibold text-foreground hidden sm:block">
          {title}
        </h1>
      )}

      {/* Global Search */}
      <div className="flex-1 max-w-sm">
        <AnimatePresence>
          {showSearch ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.1 }}
            >
              <Input
                autoFocus
                placeholder="Search applications, companies..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onBlur={() => !globalSearch && setShowSearch(false)}
                icon={<Search className="h-3.5 w-3.5" />}
                className="h-8 text-xs"
              />
            </motion.div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="flex h-8 w-full items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium opacity-60">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Quick Add */}
        <Button
          size="sm"
          onClick={() => setIsQuickAddOpen(true)}
          className="h-8 gap-1.5 px-3 text-xs hidden sm:flex"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Job
          <kbd className="hidden lg:inline-flex h-4 select-none items-center gap-0.5 rounded border border-primary/40 bg-primary/10 px-1 font-mono text-[9px] opacity-70">
            <Command className="h-2 w-2" />N
          </kbd>
        </Button>

        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setIsQuickAddOpen(true)}
          className="sm:hidden h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-8 w-8 relative"
          onClick={() => router.push("/reminders")}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* Theme Toggle */}
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden border border-border hover:ring-2 hover:ring-primary/20 transition-all">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(displayName)}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
