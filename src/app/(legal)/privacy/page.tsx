import { siteConfig } from '@/config/site.config';

export const metadata = {
  title: 'Privacy Policy',
  description: `Learn how ${siteConfig.name} handles your data.`,
  openGraph: {
    title: `Privacy Policy | ${siteConfig.name}`,
    description: `Learn how ${siteConfig.name} handles your data.`,
    images: [{ url: '/api/og?slug=privacy', width: 1200, height: 630 }],
  },
};

export default function PrivacyPage() {
  return (
    <div>
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
          Privacy Policy
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
          At {siteConfig.name}, we take your privacy seriously. This Privacy Policy explains how
          we collect, use, disclose, and safeguard your information when you use our software as a
          service platform, website, and related services (collectively, the &ldquo;Service&rdquo;).
          Please read this policy carefully. By accessing or using the Service, you acknowledge that
          you have read, understood, and agree to be bound by this Privacy Policy.
        </p>
      </div>

      {/* ─── Sections ──────────────────────────────────────────── */}
      <div className="space-y-10">
        {/* 1. Information We Collect */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            1. Information We Collect
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Account Information</h3>
              <p>
                When you create an account, we collect information such as your name, email address, and
                profile picture through your chosen authentication provider (e.g., Google OAuth). If you
                set up a password-based account, we store a securely hashed version of your password. We
                never store your raw password.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Usage Data</h3>
              <p>
                We automatically collect information about how you interact with the Service, including
                the pages you visit, features you use, actions you take, the time and duration of your
                sessions, and your credit or token consumption. This data helps us understand how the
                Service is used and how we can improve it.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Payment Data</h3>
              <p>
                When you subscribe to a paid plan or purchase credits, payment processing is handled by
                our third-party payment processor (Stripe). We do not store your full credit card number
                or banking details on our servers. We receive and store limited information from Stripe,
                such as the last four digits of your card, card brand, expiration date, billing address,
                and transaction history, solely for the purpose of managing your subscription and
                displaying billing information in your account.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Cookies and Similar Technologies</h3>
              <p>
                We use cookies and similar tracking technologies to maintain your session, remember your
                preferences, and understand aggregate usage patterns. Essential cookies are required for
                the Service to function. Analytics cookies help us measure performance and improve the
                user experience. You can control cookie settings through your browser, but disabling
                essential cookies may prevent you from using parts of the Service.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">Device and Log Data</h3>
              <p>
                We collect standard log information such as your IP address, browser type and version,
                operating system, referring URLs, and device identifiers. This data is used for security,
                fraud prevention, and diagnostics.
              </p>
            </div>
          </div>
        </section>

        {/* 2. How We Use Your Information */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            2. How We Use Your Information
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Providing the Service:</strong> To operate, maintain, and deliver the features
                and functionality of {siteConfig.name}, including processing transactions, managing
                your account, and tracking credit usage.
              </li>
              <li>
                <strong className="text-foreground">Improving the Service:</strong> To analyze usage trends, diagnose technical
                issues, and develop new features and enhancements.
              </li>
              <li>
                <strong className="text-foreground">Communication:</strong> To send you transactional emails (e.g., subscription
                confirmations, billing receipts, security alerts), respond to your inquiries, and
                provide customer support.
              </li>
              <li>
                <strong className="text-foreground">Security:</strong> To detect, prevent, and respond to fraud, abuse, security
                incidents, and other harmful activity.
              </li>
              <li>
                <strong className="text-foreground">Legal Compliance:</strong> To comply with applicable laws, regulations, legal
                processes, or enforceable governmental requests.
              </li>
            </ul>
            <p>
              We do not sell your personal information to third parties. We do not use your data for
              advertising purposes.
            </p>
          </div>
        </section>

        {/* 3. Information Sharing and Disclosure */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            3. Information Sharing and Disclosure
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Service Providers:</strong> We share data with trusted third-party vendors who
                perform services on our behalf, such as payment processing (Stripe), hosting
                (Vercel/AWS), email delivery, and analytics. These providers are contractually obligated
                to use your data only as necessary to provide their services to us and to maintain
                appropriate security measures.
              </li>
              <li>
                <strong className="text-foreground">Legal Requirements:</strong> We may disclose your information if required to do
                so by law, regulation, subpoena, court order, or other governmental request.
              </li>
              <li>
                <strong className="text-foreground">Business Transfers:</strong> In the event of a merger, acquisition,
                reorganization, or sale of assets, your information may be transferred as part of that
                transaction. We will notify you of any such change in ownership or control of your
                personal information.
              </li>
              <li>
                <strong className="text-foreground">With Your Consent:</strong> We may share your information for other purposes
                with your explicit consent.
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Data Security */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            4. Data Security
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              We implement industry-standard technical and organizational security measures to protect
              your personal information against unauthorized access, alteration, disclosure, or
              destruction. These measures include encryption of data in transit (TLS/SSL) and at rest,
              secure authentication mechanisms, regular security assessments, and access controls that
              limit data access to authorized personnel only.
            </p>
            <p>
              However, no method of transmission over the Internet or method of electronic storage is
              100% secure. While we strive to protect your information, we cannot guarantee its
              absolute security.
            </p>
          </div>
        </section>

        {/* 5. Data Retention */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            5. Data Retention
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              We retain your personal information for as long as your account is active or as needed to
              provide you with the Service. If you delete your account, we will delete or anonymize
              your personal data within 30 days, except where we are required to retain certain
              information for legal, tax, or regulatory purposes. Usage logs and aggregated analytics
              data that cannot be used to identify you may be retained indefinitely.
            </p>
          </div>
        </section>

        {/* 6. Your Rights */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            6. Your Rights
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              Depending on your jurisdiction, you may have the following rights regarding your personal
              information:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Access:</strong> You have the right to request a copy of the personal
                information we hold about you.
              </li>
              <li>
                <strong className="text-foreground">Correction:</strong> You have the right to request that we correct any
                inaccurate or incomplete personal information.
              </li>
              <li>
                <strong className="text-foreground">Deletion:</strong> You have the right to request that we delete your personal
                information, subject to certain legal exceptions.
              </li>
              <li>
                <strong className="text-foreground">Data Export:</strong> You have the right to request a portable copy of your
                data in a commonly used, machine-readable format.
              </li>
              <li>
                <strong className="text-foreground">Restriction:</strong> You have the right to request that we restrict the
                processing of your personal information under certain circumstances.
              </li>
              <li>
                <strong className="text-foreground">Objection:</strong> You have the right to object to the processing of your
                personal information for certain purposes.
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{' '}
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary hover:underline">
                {siteConfig.supportEmail}
              </a>
              . We will respond to your request within 30 days.
            </p>
          </div>
        </section>

        {/* 7. Cookies and Tracking */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            7. Cookies and Tracking
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              {siteConfig.name} uses the following categories of cookies:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Essential Cookies:</strong> Required for the Service to function properly.
                These include session cookies for authentication and security tokens. These cannot be
                disabled.
              </li>
              <li>
                <strong className="text-foreground">Functional Cookies:</strong> Used to remember your preferences, such as
                language, theme (light/dark mode), and display settings.
              </li>
              <li>
                <strong className="text-foreground">Analytics Cookies:</strong> Help us understand how visitors interact with the
                Service by collecting and reporting usage data anonymously. We use this information to
                improve performance and user experience.
              </li>
            </ul>
            <p>
              You can manage your cookie preferences through your browser settings. Most browsers allow
              you to refuse or delete cookies. Please note that disabling essential cookies may impair
              the functionality of the Service.
            </p>
          </div>
        </section>

        {/* 8. Children's Privacy */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            8. Children&rsquo;s Privacy
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              The Service is not intended for use by individuals under the age of 16. We do not
              knowingly collect personal information from children under 16. If we become aware that we
              have inadvertently collected personal information from a child under 16, we will take
              steps to delete that information as promptly as possible. If you believe that a child
              under 16 has provided us with personal information, please contact us at{' '}
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary hover:underline">
                {siteConfig.supportEmail}
              </a>
              .
            </p>
          </div>
        </section>

        {/* 9. Changes to This Policy */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            9. Changes to This Policy
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technologies, legal requirements, or other factors. When we make material changes, we
              will notify you by posting the updated policy on this page with a revised &ldquo;Last
              updated&rdquo; date, and where appropriate, we will notify you by email or through an
              in-app notification. We encourage you to review this policy periodically to stay informed
              about how we protect your information.
            </p>
          </div>
        </section>

        {/* 10. Contact Us */}
        <section>
          <h2 className="border-l-2 border-primary pl-4 text-xl font-semibold tracking-tight text-foreground mb-4">
            10. Contact Us
          </h2>
          <div className="text-[15px] leading-relaxed text-muted-foreground space-y-4">
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our
              data practices, please contact us at:
            </p>
            <p>
              <strong className="text-foreground">Email:</strong>{' '}
              <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary hover:underline">
                {siteConfig.supportEmail}
              </a>
            </p>
            <p>
              We will make every effort to respond to your inquiry in a timely manner.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
