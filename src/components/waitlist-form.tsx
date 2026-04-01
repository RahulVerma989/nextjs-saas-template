'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || "You're on the list!");
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
        <Check className="h-4 w-4" />
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
        required
        className="flex-1"
        disabled={status === 'loading'}
      />
      <Button type="submit" disabled={status === 'loading'} className="shrink-0">
        {status === 'loading' ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</>
        ) : (
          <>Join Waitlist <ArrowRight className="ml-2 h-4 w-4" /></>
        )}
      </Button>
      {status === 'error' && (
        <p className="text-xs text-destructive mt-1 sm:absolute sm:mt-0">{message}</p>
      )}
    </form>
  );
}
