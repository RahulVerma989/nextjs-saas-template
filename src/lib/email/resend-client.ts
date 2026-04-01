import { Resend } from 'resend';
import { siteConfig } from '@/config/site.config';

let resend: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] API key not configured');
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const DEFAULT_FROM = () => process.env.RESEND_FROM_EMAIL || `${siteConfig.name} <hello@${new URL(siteConfig.url).hostname}>`;
const DEFAULT_REPLY_TO = () => process.env.RESEND_REPLY_TO_EMAIL || siteConfig.supportEmail;
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || siteConfig.url;

function wrapEmail(content: string, options?: { preheader?: string }): string {
  const appUrl = APP_URL();
  const preheaderHtml = options?.preheader
    ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${options.preheader}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  ${preheaderHtml}
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #f3f4f6;">
              <a href="${appUrl}" style="text-decoration: none; font-size: 18px; font-weight: 700; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${siteConfig.name}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; font-size: 14px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <a href="${appUrl}/dashboard/settings" style="color: #6366f1; text-decoration: underline;">Manage notifications</a>
                &nbsp;&middot;&nbsp;
                <a href="${appUrl}" style="color: #6366f1; text-decoration: underline;">${siteConfig.name}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background-color: #4f46e5; border-radius: 8px;">
            <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${text}
            </a>
          </td>
        </tr></table>
      </td></tr>
    </table>`;
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  text?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const client = getResendClient();
  if (!client) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await client.emails.send({
      from: options.from || DEFAULT_FROM(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || DEFAULT_REPLY_TO(),
    });

    if (result.error) {
      console.error('[Resend] Send error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('[Resend] Send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<{ success: boolean; error?: string }> {
  const appUrl = APP_URL();
  return sendEmail({
    to,
    subject: `Welcome to ${siteConfig.name}`,
    html: wrapEmail(`
      <h1 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Welcome, ${name || 'there'}!</h1>
      <p style="margin: 0 0 16px;">Thanks for signing up. Your account has been created successfully.</p>
      ${ctaButton('Go to Dashboard', `${appUrl}/dashboard`)}
      <p style="margin: 0; color: #6b7280; font-size: 13px;">Questions? Just reply to this email.</p>
    `, { preheader: `Welcome to ${siteConfig.name}` }),
  });
}

export async function sendAccountApprovedEmail(to: string, name: string): Promise<{ success: boolean; error?: string }> {
  const appUrl = APP_URL();
  return sendEmail({
    to,
    subject: `Your ${siteConfig.name} account is approved!`,
    html: wrapEmail(`
      <h1 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 12px;">You're in, ${name || 'there'}!</h1>
      <p style="margin: 0 0 16px;">Your account has been approved. You can now access all features.</p>
      ${ctaButton('Open Dashboard', `${appUrl}/dashboard`)}
    `, { preheader: 'Your account has been approved' }),
  });
}

export async function sendLowCreditWarningEmail(
  to: string,
  currentBalance: number
): Promise<{ success: boolean; error?: string }> {
  const appUrl = APP_URL();
  return sendEmail({
    to,
    subject: `Your ${siteConfig.name} credits are running low`,
    html: wrapEmail(`
      <h1 style="color: #f59e0b; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Low Credit Warning</h1>
      <p style="margin: 0 0 16px;">Your credit balance is running low.</p>
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 16px;">
        <p style="font-size: 32px; font-weight: 700; color: #f59e0b; margin: 0;">${currentBalance}</p>
        <p style="font-size: 13px; color: #92400e; margin: 4px 0 0;">credits remaining</p>
      </div>
      ${ctaButton('Manage Billing', `${appUrl}/dashboard/billing`)}
    `, { preheader: `${currentBalance} credits remaining` }),
  });
}

export async function sendFeedbackReceivedEmail(to: string, name: string, title: string) {
  return sendEmail({
    to,
    subject: `Feedback received: ${title}`,
    html: wrapEmail(`
      <p style="font-size: 16px; font-weight: 600; margin: 0 0 16px;">Hi ${name},</p>
      <p>Thank you for your feedback! We've received your report:</p>
      <div style="background: #f9fafb; border-left: 4px solid #6366f1; border-radius: 4px; padding: 16px; margin: 16px 0;">
        <p style="font-weight: 600; margin: 0 0 4px;">${title}</p>
        <p style="color: #6b7280; margin: 0; font-size: 13px;">Status: New</p>
      </div>
      <p>Our team will review this shortly.</p>
    `, { preheader: `We received your feedback: ${title}` }),
  });
}

export async function sendFeedbackStatusUpdateEmail(
  to: string,
  name: string,
  title: string,
  newStatus: string,
  adminResponse?: string
) {
  const statusLabels: Record<string, string> = {
    new: 'New', acknowledged: 'Acknowledged', in_progress: 'In Progress',
    resolved: 'Resolved', closed: 'Closed',
  };
  const statusLabel = statusLabels[newStatus] || newStatus;
  const responseSection = adminResponse
    ? `<div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px; padding: 16px; margin: 16px 0;">
        <p style="font-weight: 600; margin: 0 0 8px; font-size: 13px; color: #166534;">Team Response</p>
        <p style="margin: 0; color: #111827;">${adminResponse}</p>
      </div>` : '';

  return sendEmail({
    to,
    subject: `Feedback update: ${title} — ${statusLabel}`,
    html: wrapEmail(`
      <p style="font-size: 16px; font-weight: 600; margin: 0 0 16px;">Hi ${name},</p>
      <p>Your feedback has been updated:</p>
      <div style="background: #f9fafb; border-left: 4px solid #6366f1; border-radius: 4px; padding: 16px; margin: 16px 0;">
        <p style="font-weight: 600; margin: 0 0 4px;">${title}</p>
        <p style="color: #6b7280; margin: 0; font-size: 13px;">Status: <strong>${statusLabel}</strong></p>
      </div>
      ${responseSection}
    `, { preheader: `Your feedback "${title}" is now ${statusLabel}` }),
  });
}
