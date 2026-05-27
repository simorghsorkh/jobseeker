import Link from "next/link";
import { Zap, BarChart3, Sparkles, KanbanSquare, Shield, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">JobFlow AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Claude AI
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">
          Your job search,{" "}
          <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            supercharged
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Track every application, get AI-powered match scores, generate personalized cover
          letters, and prepare for interviews — all in one beautiful workspace.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/auth/signup"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            Start tracking for free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-6 text-sm font-medium hover:bg-accent transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: KanbanSquare,
              title: "Kanban Pipeline",
              desc: "Drag-and-drop your applications through every stage from Saved to Accepted.",
              color: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-950/30",
            },
            {
              icon: Sparkles,
              title: "AI Match Scoring",
              desc: "Instantly see how well your CV matches any job description with AI-powered analysis.",
              color: "text-violet-500",
              bg: "bg-violet-50 dark:bg-violet-950/30",
            },
            {
              icon: BarChart3,
              title: "Analytics",
              desc: "Track your response rate, interview conversion, and identify patterns in your search.",
              color: "text-emerald-500",
              bg: "bg-emerald-50 dark:bg-emerald-950/30",
            },
            {
              icon: Shield,
              title: "Never Miss a Follow-up",
              desc: "Smart reminders keep you on top of every application, deadline, and interview.",
              color: "text-amber-500",
              bg: "bg-amber-50 dark:bg-amber-950/30",
            },
            {
              icon: Zap,
              title: "AI Cover Letters",
              desc: "Generate personalized, compelling cover letters for any role in seconds.",
              color: "text-rose-500",
              bg: "bg-rose-50 dark:bg-rose-950/30",
            },
            {
              icon: KanbanSquare,
              title: "Interview Prep",
              desc: "Get tailored interview questions and preparation guides for each specific role.",
              color: "text-sky-500",
              bg: "bg-sky-50 dark:bg-sky-950/30",
            },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.bg} mb-4`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent border border-primary/20 p-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to land your dream job?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of job seekers who use JobFlow AI to stay organized and get hired faster.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-8 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            Get started — it&apos;s free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
            <Zap className="h-3 w-3 text-primary" />
          </div>
          JobFlow AI © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
