import { siteConfig } from '@/config/site.config';
import { Mail } from 'lucide-react';

export const metadata = {
  title: 'Contact Us',
  description: `Get in touch with the ${siteConfig.name} team.`,
  openGraph: {
    title: `Contact Us | ${siteConfig.name}`,
    description: `Get in touch with the ${siteConfig.name} team.`,
    images: [{ url: '/api/og?slug=contact', width: 1200, height: 630 }],
  },
};

export default function ContactPage() {
  return (
    <div>
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
          Contact Us
        </h1>
        <p className="mt-6 text-base text-muted-foreground leading-relaxed">
          Have a question, feedback, or need help? We&rsquo;d love to hear from you.
          We typically respond within 24 hours on business days.
        </p>
      </div>

      {/* ─── Contact Info ──────────────────────────────────────── */}
      <section>
        <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
          Get in Touch
        </h2>
        <div className="text-[15px] leading-relaxed text-muted-foreground space-y-6">
          <p>
            For general inquiries, billing questions, or technical support, reach out to us via email.
          </p>

          <div className="rounded-lg border border-border bg-muted/30 p-6 flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Email</p>
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="text-primary hover:underline"
              >
                {siteConfig.supportEmail}
              </a>
            </div>
          </div>

          <p>
            For urgent matters, please include &ldquo;Urgent&rdquo; in your subject line and we
            will prioritize your request.
          </p>
        </div>
      </section>
    </div>
  );
}
