import { siteConfig } from '@/config/site.config';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-neutral dark:prose-invert">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>By using {siteConfig.name}, you agree to these terms of service.</p>
          <h2>Use of Service</h2>
          <p>You must be at least 18 years old to use this service. You are responsible for maintaining the security of your account.</p>
          <h2>Payment Terms</h2>
          <p>Paid plans are billed on a recurring basis. You can cancel your subscription at any time from the billing page.</p>
          <h2>Contact</h2>
          <p>Contact us at {siteConfig.supportEmail} with any questions.</p>
        </div>
      </div>
    </div>
  );
}
