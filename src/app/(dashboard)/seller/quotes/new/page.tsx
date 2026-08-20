import { QuoteForm } from "@/components/dashboard/quote-form";

export const metadata = {
  title: "New Quote | Ovvi Dashboard",
};

export default function NewQuotePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-stone-900">Create Payment Link</h1>
        <p className="text-stone-500 mt-2">
          Generate a custom payment link to send to a customer on WhatsApp.
        </p>
      </div>

      <QuoteForm />
    </div>
  );
}
