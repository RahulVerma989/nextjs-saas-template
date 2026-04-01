import { Feedback } from '@/lib/db/models/feedback.model';
import { connectDB } from '@/lib/db/connection';
import { getUserCrud } from '@/lib/db/crud/user.crud';
import { generateUUID7 } from '@/lib/utils/uuid';
import { sendFeedbackReceivedEmail } from '@/lib/email/resend-client';
import { siteConfig } from '@/config/site.config';
import type { ToolHandler } from '../index';

export const handleReportFeedback: ToolHandler = async (args, userId) => {
  await connectDB();

  const type = (args.type as string) || 'feedback';
  const title = args.title as string;
  const description = args.description as string;

  if (!title || !description) {
    throw new Error(
      'Missing required fields. Please provide: title (short summary) and description (detailed explanation).'
    );
  }

  let userEmail = '';
  let userName = '';
  try {
    const userCrud = getUserCrud();
    const user = await userCrud.findById(userId);
    if (user) {
      userEmail = user.email;
      userName = user.name;
    }
  } catch { /* non-critical */ }

  const feedbackType = ['bug', 'feedback', 'suggestion', 'error'].includes(type) ? type : 'feedback';
  const severityVal = args.severity && ['low', 'medium', 'high', 'critical'].includes(args.severity as string)
    ? (args.severity as string)
    : 'medium';

  const feedback = await Feedback.create({
    _id: generateUUID7(),
    userId,
    type: feedbackType,
    title: String(title).slice(0, 500),
    description: String(description).slice(0, 5000),
    stepsToReproduce: args.steps_to_reproduce ? String(args.steps_to_reproduce).slice(0, 3000) : undefined,
    expectedBehavior: args.expected_behavior ? String(args.expected_behavior).slice(0, 2000) : undefined,
    actualBehavior: args.actual_behavior ? String(args.actual_behavior).slice(0, 2000) : undefined,
    errorMessage: args.error_message ? String(args.error_message).slice(0, 2000) : undefined,
    toolName: args.tool_name ? String(args.tool_name) : undefined,
    severity: severityVal,
    metadata: args.metadata as Record<string, unknown> || {},
  });

  if (userEmail) {
    sendFeedbackReceivedEmail(userEmail, userName, feedback.title).catch(() => {});
  }

  return {
    success: true,
    feedback_id: feedback._id,
    message: `Thank you! Your feedback has been recorded and the ${siteConfig.name} team will review it shortly.`,
    type: feedback.type,
    title: feedback.title,
  };
};
