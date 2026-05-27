"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { QuickAddModal } from "@/components/applications/QuickAddModal";
import { AISidebar } from "@/components/ai/AISidebar";
import { Toaster } from "react-hot-toast";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
      <AISidebar />
      <QuickAddModal />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "!bg-card !text-foreground !border !border-border !shadow-lg",
          duration: 3000,
        }}
      />
    </div>
  );
}
