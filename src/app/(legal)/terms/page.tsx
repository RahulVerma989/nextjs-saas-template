import { siteConfig } from '@/config/site.config';

export const metadata = {
  title: 'Terms of Service',
  description: `Terms and conditions for using ${siteConfig.name}.`,
  openGraph: {
    title: `Terms of Service | ${siteConfig.name}`,
    description: `Terms and conditions for using ${siteConfig.name}.`,
    images: [{ url: '/api/og?slug=terms', width: 1200, height: 630 }],
  },
};

export default function TermsPage() {
  return (
    <div>
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p className="mt-6 text-base text-muted-foreground leading-relaxed">
          Welcome to {siteConfig.name}. These Terms of Service (&ldquo;Terms&rdquo;) govern your
          access to and use of the {siteConfig.name} platform, website, APIs, and all related
          services (collectively, the &ldquo;Service&rdquo;). Please read these Terms carefully
          before using the Service.
        </p>
      </div>

      {/* ─── Sections ──────────────────────────────────────────── */}
      <div className="space-y-10">
        {/* 1. Acceptance of Terms */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            1. Acceptance of Terms
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              By creating an account, accessing, or using the Service, you agree to be bound by these
              Terms and our{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              . If you do not agree to these Terms, you may not use the Service. If you are using the
              Service on behalf of an organization, you represent and warrant that you have the
              authority to bind that organization to these Terms.
            </p>
          </div>
        </section>

        {/* 2. Account Registration */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            2. Account Registration
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              To use certain features of the Service, you must create an account. When registering, you
              agree to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide accurate, current, and complete information during the registration process.</li>
              <li>Maintain and promptly update your account information to keep it accurate and current.</li>
              <li>
                Maintain the security and confidentiality of your login credentials. You are responsible
                for all activity that occurs under your account.
              </li>
              <li>
                Notify us immediately at{' '}
                <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary hover:underline">
                  {siteConfig.supportEmail}
                </a>{' '}
                if you suspect any unauthorized use of your account.
              </li>
            </ul>
            <p>
              You must be at least 16 years of age to create an account and use the Service. By
              creating an account, you represent that you meet this age requirement.
            </p>
          </div>
        </section>

        {/* 3. Subscription and Billing */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            3. Subscription and Billing
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              {siteConfig.name} offers both free and paid subscription plans. By selecting a paid plan,
              you agree to the following:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Recurring Billing:</strong> Paid subscriptions are billed on a recurring basis
                (monthly or annually) depending on the plan you select. Your subscription will
                automatically renew at the end of each billing period unless you cancel before the
                renewal date.
              </li>
              <li>
                <strong className="text-foreground">Payment Method:</strong> You must provide a valid payment method. All payments
                are processed securely through our third-party payment processor (Stripe). By providing
                your payment information, you authorize us to charge your payment method for all fees
                incurred.
              </li>
              <li>
                <strong className="text-foreground">Price Changes:</strong> We reserve the right to change our pricing at any time.
                If we change the price of your subscription, we will notify you at least 30 days in
                advance. The new price will take effect at the start of your next billing cycle.
              </li>
              <li>
                <strong className="text-foreground">Cancellation:</strong> You may cancel your subscription at any time from your
                account&rsquo;s billing page. Upon cancellation, your subscription will remain active
                until the end of the current billing period. No refunds will be issued for partial
                billing periods.
              </li>
              <li>
                <strong className="text-foreground">Refunds:</strong> Payments are generally non-refundable. However, if you
                believe you have been charged in error, please contact us at{' '}
                <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary hover:underline">
                  {siteConfig.supportEmail}
                </a>{' '}
                and we will review your case on an individual basis.
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Credits and Usage */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            4. Credits and Usage
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              {siteConfig.name} uses a credit-based system for certain features and API operations.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Credit Allocation:</strong> New accounts receive a signup bonus of credits.
                Additional credits may be included with your subscription plan or purchased separately.
              </li>
              <li>
                <strong className="text-foreground">Credit Consumption:</strong> Credits are consumed when you use specific features
                or make API calls. The credit cost of each operation is documented in the Service and
                may vary by feature.
              </li>
              <li>
                <strong className="text-foreground">Expiration:</strong> Credits do not expire as long as your account remains
                active. If your account is terminated or deleted, any remaining credits are forfeited.
              </li>
              <li>
                <strong className="text-foreground">Non-Transferable:</strong> Credits are non-transferable and cannot be exchanged
                for cash or any other form of compensation.
              </li>
            </ul>
          </div>
        </section>

        {/* 5. API Usage and Rate Limits */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            5. API Usage and Rate Limits
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              If you access the Service through our API, the following terms apply:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">API Keys:</strong> You are responsible for keeping your API keys confidential.
                Do not share your API keys publicly or embed them in client-side code. Any activity
                performed with your API keys is your responsibility.
              </li>
              <li>
                <strong className="text-foreground">Rate Limits:</strong> API requests are subject to rate limits as defined in our
                documentation. Exceeding rate limits may result in temporary throttling or suspension
                of API access.
              </li>
              <li>
                <strong className="text-foreground">Fair Use:</strong> You agree to use the API in a reasonable manner consistent
                with its intended purpose. Automated or scripted abuse of the API is prohibited.
              </li>
            </ul>
          </div>
        </section>

        {/* 6. Acceptable Use Policy */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            6. Acceptable Use Policy
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Violate any applicable law, regulation, or third-party rights.</li>
              <li>
                Upload, transmit, or distribute any content that is unlawful, harmful, threatening,
                abusive, defamatory, obscene, or otherwise objectionable.
              </li>
              <li>
                Attempt to gain unauthorized access to the Service, other user accounts, or any
                computer systems or networks connected to the Service.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the Service, including
                through denial-of-service attacks or other malicious activity.
              </li>
              <li>
                Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source
                code of the Service, except to the extent permitted by applicable law.
              </li>
              <li>
                Use the Service to build a competing product or service, or to benchmark the Service
                for competitive purposes without our prior written consent.
              </li>
              <li>
                Resell, sublicense, or redistribute access to the Service without our prior written
                consent.
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate your account if we determine, in our sole
              discretion, that you have violated this Acceptable Use Policy.
            </p>
          </div>
        </section>

        {/* 7. Intellectual Property */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            7. Intellectual Property
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              The Service, including all software, designs, text, graphics, logos, and other content,
              is owned by {siteConfig.name} or its licensors and is protected by intellectual property
              laws. You retain ownership of any data and content you upload to or create through the
              Service (&ldquo;Your Content&rdquo;).
            </p>
            <p>
              By uploading Your Content to the Service, you grant us a limited, non-exclusive,
              worldwide license to use, store, and process Your Content solely for the purpose of
              providing and improving the Service. We will not use Your Content for any other purpose
              without your explicit consent.
            </p>
          </div>
        </section>

        {/* 8. Privacy */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            8. Privacy
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              Your use of the Service is also governed by our{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              , which describes how we collect, use, and protect your information. By using the
              Service, you consent to the data practices described in the Privacy Policy.
            </p>
          </div>
        </section>

        {/* 9. Disclaimers and Limitations of Liability */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            9. Disclaimers and Limitations of Liability
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">Disclaimer of Warranties:</strong> The Service is provided on an &ldquo;as
              is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of any kind, either
              express or implied, including but not limited to implied warranties of merchantability,
              fitness for a particular purpose, and non-infringement. We do not warrant that the
              Service will be uninterrupted, error-free, or secure.
            </p>
            <p>
              <strong className="text-foreground">Limitation of Liability:</strong> To the maximum extent permitted by applicable
              law, {siteConfig.name} and its officers, directors, employees, and agents shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages, or any
              loss of profits or revenue, whether incurred directly or indirectly, or any loss of data,
              use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your access to, use of, or inability to access or use the Service.</li>
              <li>Any conduct or content of any third party on the Service.</li>
              <li>Any content obtained from the Service.</li>
              <li>
                Unauthorized access, use, or alteration of your transmissions or content.
              </li>
            </ul>
            <p>
              In no event shall our total aggregate liability exceed the greater of one hundred US
              dollars (US $100) or the amount you have paid us in the twelve (12) months preceding the
              event giving rise to the claim.
            </p>
          </div>
        </section>

        {/* 10. Termination */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            10. Termination
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              We may suspend or terminate your access to the Service at any time, with or without
              cause, and with or without notice. Upon termination:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your right to access and use the Service will cease immediately.</li>
              <li>
                We may delete your account data after a reasonable retention period, except where we are
                required to retain it for legal or regulatory purposes.
              </li>
              <li>Any unused credits will be forfeited and are not eligible for a refund.</li>
            </ul>
            <p>
              You may terminate your account at any time by deleting it from your account settings or
              by contacting us at{' '}
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary hover:underline">
                {siteConfig.supportEmail}
              </a>
              .
            </p>
          </div>
        </section>

        {/* 11. Governing Law */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            11. Governing Law
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              jurisdiction in which {siteConfig.name} operates, without regard to its conflict of law
              provisions. Any disputes arising out of or in connection with these Terms shall be
              resolved through good-faith negotiation. If a resolution cannot be reached, the dispute
              shall be submitted to the exclusive jurisdiction of the courts in the applicable
              jurisdiction.
            </p>
          </div>
        </section>

        {/* 12. Changes to Terms */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            12. Changes to Terms
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              We reserve the right to modify these Terms at any time. When we make material changes, we
              will update the &ldquo;Last updated&rdquo; date at the top of this page and, where
              appropriate, notify you by email or through an in-app notification. Your continued use of
              the Service after the revised Terms become effective constitutes your acceptance of the
              changes. If you do not agree with the revised Terms, you must stop using the Service and
              delete your account.
            </p>
          </div>
        </section>

        {/* 13. Contact */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            13. Contact
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              If you have any questions or concerns about these Terms, please contact us at:
            </p>
            <p>
              <strong className="text-foreground">Email:</strong>{' '}
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary hover:underline">
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
