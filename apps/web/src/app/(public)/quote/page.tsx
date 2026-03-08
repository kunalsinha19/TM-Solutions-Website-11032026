import { QuoteForm } from "../../../components/forms/quote-form";

export default function QuotePage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-accent">Quote</p>
        <h1 className="mt-4 text-4xl font-semibold">Tell us the requirement. We will handle the follow-up.</h1>
        <p className="mt-4 text-lg text-muted">
          This page is built for high-intent B2B leads with captcha validation and backend notification hooks.
        </p>
      </div>
      <QuoteForm />
    </div>
  );
}
