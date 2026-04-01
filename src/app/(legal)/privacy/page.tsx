import { siteConfig } from '@/config/site.config';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-neutral dark:prose-invert">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>{siteConfig.name} is committed to protecting your privacy. This policy describes how we collect, use, and share your information.</p>
          <h2>Information We Collect</h2>
          <p>We collect information you provide when you create an account, including your name, email address, and profile picture from Google OAuth.</p>
          <h2>How We Use Your Information</h2>
          <p>We use your information to provide and improve our services, process payments, and communicate with you about your account.</p>
          <h2>Contact</h2>
          <p>If you have questions about this policy, contact us at {siteConfig.supportEmail}.</p>
        </div>
      </div>
    </div>
  );
}
