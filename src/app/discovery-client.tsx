"use client";

import { useState } from "react";
import { QualificationForm, ServiceRecommendations, BookingSuccess } from "@/components/discovery";
import type { LeadFormData, ServiceRecommendation } from "@/lib/discovery/types";

interface QualificationResult {
  score: number;
  category: string;
  type: string;
  recommendedServices: ServiceRecommendation[];
  summary: string;
}

interface BookingResponse {
  calendlyUrl: string | null;
  integrations?: {
    hubspot: { ok: boolean; detail?: string };
    emailConfirmation: { ok: boolean; detail?: string };
  };
}

type Stage = "form" | "recommendations" | "booking" | "success";

export function DiscoveryCallClient() {
  const [stage, setStage] = useState<Stage>("form");
  const [formData, setFormData] = useState<LeadFormData | null>(null);
  const [qualification, setQualification] = useState<QualificationResult | null>(null);
  const [bookingResponse, setBookingResponse] = useState<BookingResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFormComplete = (data: LeadFormData, qual: QualificationResult) => {
    setFormData(data);
    setQualification(qual);
    setStage("recommendations");
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProceedToBooking = async () => {
    if (!formData || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Submit the lead for real — success state is only shown after the
      // server confirms the submission.
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Something went wrong. Please try again.");
      }

      setBookingResponse({
        calendlyUrl: json.calendlyUrl || null,
        integrations: json.integrations,
      });
      setStage("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Form Stage
  if (stage === "form") {
    return <QualificationForm onComplete={handleFormComplete} />;
  }

  // Recommendations Stage
  if (stage === "recommendations" && qualification) {
    return (
      <div className="space-y-6 animate-fade-in">
        <ServiceRecommendations
          recommendations={qualification.recommendedServices}
          score={qualification.score}
          category={qualification.category}
        />
        
        {/* Calendly Integration Placeholder */}
        <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
          <h3 className="text-xl font-semibold font-[var(--font-heading)] mb-4">
            Schedule Your Discovery Call
          </h3>
          <p className="text-sm text-grey mb-6">
            Choose a time that works best for your free 30-minute consultation.
          </p>
          
          <div className="rounded-xl border-2 border-dashed border-border bg-bg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="font-semibold mb-2">Calendar Integration</h4>
            <p className="text-sm text-grey mb-4">
              Submit your details and pick a time with our scheduler to confirm your free discovery call.
            </p>
            <p className="text-xs text-grey-dark mb-6">
              Your call is only confirmed once you complete the scheduling step.
            </p>
            
            <button
              onClick={handleProceedToBooking}
              disabled={submitting}
              className="btn-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Request Call Scheduling →"}
            </button>

            {submitError && (
              <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {submitError}
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-grey">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              30-minute call
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Free & no obligation
            </span>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => setStage("form")}
          className="text-sm text-grey hover:text-white transition-colors"
        >
          ← Edit my information
        </button>
      </div>
    );
  }

  // Success Stage
  if (stage === "success" && formData && qualification) {
    return (
      <div className="animate-fade-in">
        <BookingSuccess
          leadName={formData.fullName}
          leadEmail={formData.email}
          recommendations={qualification.recommendedServices}
          score={qualification.score}
          calendlyUrl={bookingResponse?.calendlyUrl || null}
        />
      </div>
    );
  }

  return null;
}
