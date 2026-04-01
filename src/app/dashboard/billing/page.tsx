'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { PLANS } from '@/config/plans.config';

const plansList = Object.entries(PLANS).map(([id, plan]) => ({ id, ...plan }));

export default function BillingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: string) => {
    setLoading(plan);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Billing</h1>
      <p className="text-muted-foreground mb-8">
        Current plan: <span className="font-medium text-foreground capitalize">{session?.user?.plan || 'free'}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plansList.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border bg-card p-6 ${plan.popular ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
          >
            {plan.popular && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Popular</span>
            )}
            <h3 className="text-lg font-semibold mt-2">{plan.name}</h3>
            <p className="text-3xl font-bold mt-2">${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>

            <ul className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading !== null || session?.user?.plan === plan.id}
              className={`w-full mt-6 px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 ${
                plan.popular
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              {session?.user?.plan === plan.id
                ? 'Current Plan'
                : loading === plan.id
                  ? 'Loading...'
                  : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
