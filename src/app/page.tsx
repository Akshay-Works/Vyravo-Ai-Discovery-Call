import type { Metadata } from "next";
import { DiscoveryCallClient } from "./discovery-client";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Book a Free Discovery Call",
  description: "Schedule a free 30-minute AI automation consultation with Vyravo AI. Get personalized recommendations and a custom proposal.",
};

export default function BookDiscoveryCallPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative section-padding pt-32 md:pt-40 pb-12">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-medium uppercase tracking-[0.15em] text-primary mb-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            Free AI Consultation
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight font-[var(--font-heading)]">
            Let&apos;s Build Your{" "}
            <span className="gradient-text">AI Automation</span> Strategy
          </h1>
          <p className="mt-6 text-lg text-grey max-w-2xl mx-auto leading-relaxed">
            Complete the quick qualification form below. Our AI will analyze your needs and recommend the perfect automation solutions for your business.
          </p>
          
          {/* Trust Stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
            {[
              { icon: "⏱️", value: "30 min", label: "Free call" },
              { icon: "🎯", value: "Custom", label: "AI recommendations" },
              { icon: "📊", value: "48h", label: "Proposal delivery" },
              { icon: "✅", value: "Zero", label: "Obligation" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-xl">{stat.icon}</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{stat.value}</p>
                  <p className="text-xs text-grey">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <DiscoveryCallClient />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* What to Expect */}
              <div className="rounded-2xl border border-border bg-surface p-6 sticky top-24">
                <h3 className="text-lg font-semibold font-[var(--font-heading)] mb-5">What to Expect</h3>
                
                <div className="space-y-5">
                  {[
                    { icon: "📝", title: "Step 1: Complete Form", desc: "Takes about 3 minutes. Our AI analyzes your responses in real-time." },
                    { icon: "💡", title: "Step 2: Get Recommendations", desc: "See personalized AI solutions based on your industry and challenges." },
                    { icon: "📅", title: "Step 3: Schedule Call", desc: "Pick a time that works for your 30-minute consultation." },
                    { icon: "📧", title: "Step 4: Receive Prep", desc: "We'll send confirmation and meeting brief within 24 hours." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-grey mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-semibold mb-3">During the Call</h4>
                  <ul className="space-y-2">
                    {[
                      "Deep dive into your business challenges",
                      "AI automation opportunities analysis",
                      "Custom solution recommendations",
                      "Timeline and investment discussion",
                      "Q&A and next steps",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-grey">
                        <span className="text-primary">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-sm font-semibold mb-3">Questions?</h4>
                  <div className="space-y-2">
                    <a
                      href={COMPANY.phoneLink}
                      className="flex items-center gap-2 text-sm text-grey hover:text-primary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {COMPANY.phone}
                    </a>
                    <a
                      href={COMPANY.emailLink}
                      className="flex items-center gap-2 text-sm text-grey hover:text-primary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {COMPANY.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </main>
  );
}

      {/* Why Vyravo AI */}
      <section className="section-padding bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold font-[var(--font-heading)] mb-4">
            Why Businesses Choose Vyravo AI
          </h2>
          <p className="text-sm text-grey max-w-2xl mx-auto">
            We build custom AI automation systems that eliminate repetitive work, reduce costs, and help modern businesses scale. Every solution is tailored to your specific workflows with transparent pricing and dedicated support.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
            {[
              { icon: "\u26a1", value: "Custom-built", label: "Tailored to your specific workflows" },
              { icon: "\ud83c\udfaf", value: "Measurable ROI", label: "Clear KPIs tracked from day one" },
              { icon: "\ud83d\udd12", value: "Enterprise security", label: "Encryption, access controls & compliance" },
              { icon: "\ud83e\udd1d", value: "Dedicated support", label: "Direct access to your development team" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-left">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.value}</p>
                  <p className="text-xs text-grey">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

