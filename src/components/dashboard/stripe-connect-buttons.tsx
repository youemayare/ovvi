"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createStripeConnectAccount, createStripeLoginLink } from "@/actions/stripe-connect.actions";
import { ExternalLink, CreditCard, Loader2 } from "lucide-react";

export function StripeOnboardingButton() {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const { url } = await createStripeConnectAccount();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Failed to connect to Stripe");
      setLoading(false);
    }
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={loading}
      className="bg-primary-600 hover:bg-primary-700 text-white"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      Link Bank Account
    </Button>
  );
}

export function StripeDashboardButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const { url } = await createStripeLoginLink();
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      alert("Failed to open Stripe dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      onClick={handleLogin} 
      disabled={loading}
      variant="outline"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-stone-500" />
      ) : (
        <ExternalLink className="w-4 h-4 mr-2 text-stone-500" />
      )}
      View Stripe Dashboard
    </Button>
  );
}
