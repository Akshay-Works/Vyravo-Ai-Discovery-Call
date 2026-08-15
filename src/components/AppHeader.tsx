import { Logo } from "./Logo";
import { SITE_LINKS } from "@/lib/constants";

export function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-xs font-medium uppercase tracking-[0.15em] text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              Discovery Call Automation
            </span>
            <a
              href={SITE_LINKS.mainSite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-grey hover:text-white transition-colors"
            >
              ← Back to Main Site
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-grey-dark">
          © {new Date().getFullYear()} Vyravo AI. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm">
          <a
            href={SITE_LINKS.mainSite}
            target="_blank"
            rel="noopener noreferrer"
            className="text-grey hover:text-white transition-colors"
          >
            Main Website
          </a>
          <a
            href={SITE_LINKS.emailAutomation}
            target="_blank"
            rel="noopener noreferrer"
            className="text-grey hover:text-white transition-colors"
          >
            Email Automation
          </a>
          <a
            href={SITE_LINKS.crm}
            target="_blank"
            rel="noopener noreferrer"
            className="text-grey hover:text-white transition-colors"
          >
            CRM
          </a>
        </div>
      </div>
    </footer>
  );
}
