type DocBase = { _id: string };

// ─── Plans & Roles ──────────────────────────────────────────

export type Plan = 'free' | 'early_adopter' | 'starter' | 'pro' | 'enterprise';
export type UserRole = 'user' | 'admin';
export type AccountStatus = 'pending' | 'pending_review' | 'approved' | 'rejected' | 'waitlist';

// ─── User ───────────────────────────────────────────────────

export interface IUser extends DocBase {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  googleId: string;
  subscriptionId?: string;
  plan: Plan;
  creditBalance: number;
  walletBalance: number;
  roles: UserRole[];
  preferences: {
    emailNotifications: boolean;
    timezone: string;
  };
  lastLoginAt?: Date;
  accountStatus: AccountStatus;
  qualification?: {
    companyName?: string;
    websiteUrl?: string;
    contentVolume?: string;
    useCase?: string;
    useCaseOther?: string;
    monthlyBudget?: string;
    pricingCommitment?: string;
    howHeard?: string;
    xAccountUrl?: string;
    submittedAt?: Date;
  };
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Subscription ───────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'canceling' | 'paused';

export interface ISubscription extends DocBase {
  _id: string;
  userId: string;
  dodoSubscriptionId: string;
  dodoCustomerId: string;
  plan: Exclude<Plan, 'free'>;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelAt?: Date;
  monthlyCredits: number;
  creditsAllocatedAt?: Date;
  planHistory: {
    plan: Exclude<Plan, 'free'>;
    startDate: Date;
    endDate?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Credit Transaction ────────────────────────────────────

export type CreditTransactionType = 'credit' | 'debit';
export type CreditSource =
  | 'subscription'
  | 'purchase'
  | 'wallet_topup'
  | 'api_call'
  | 'file_upload'
  | 'export'
  | 'signup_bonus'
  | 'monthly_refresh'
  | 'refund'
  | 'admin_adjustment';

export interface ICreditTransaction extends DocBase {
  _id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  source: CreditSource;
  referenceType?: string;
  referenceId?: string;
  metadata?: {
    description?: string;
  };
  createdAt: Date;
}

// ─── API Key ───────────────────────────────────────────────

export interface IAPIKey extends DocBase {
  _id: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  enabledTools: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Notification ───────────────────────────────────────────

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'low_credits'
  | 'feedback_submitted'
  | 'feedback_status_changed';

export interface INotification extends DocBase {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Usage Log ──────────────────────────────────────────────

export interface IUsageLog extends DocBase {
  _id: string;
  userId: string;
  apiKeyId: string;
  toolId: string;
  windowDate: string;
  requestCount: number;
  lastRequestAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── OAuth ──────────────────────────────────────────────────

export interface IOAuthClient extends DocBase {
  _id: string;
  clientSecret?: string;
  clientName: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOAuthCode extends DocBase {
  _id: string;
  codeHash: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface IOAuthToken extends DocBase {
  _id: string;
  tokenHash: string;
  refreshTokenHash?: string;
  clientId: string;
  userId: string;
  scope: string;
  expiresAt: Date;
  refreshExpiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
}

// ─── Service Run (Background Services) ─────────────────────

export type ServiceRunStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ServiceTrigger = 'schedule' | 'cron' | 'api' | 'manual';

export interface IServiceRun extends DocBase {
  _id: string;
  serviceName: string;
  serviceId?: string;
  status: ServiceRunStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  result?: Record<string, unknown>;
  error?: string;
  triggeredBy: ServiceTrigger;
  workerId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── GSC Connection ─────────────────────────────────────────

export type GSCVerificationMethod = 'META' | 'FILE' | 'DNS_TXT';

export interface IGSCConnection extends DocBase {
  /** Always "singleton" — only one GSC connection per deployment. */
  _id: string;
  /** Search Console property URL (e.g. "https://example.com/" or "sc-domain:example.com"). */
  siteUrl: string;
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: Date;
  scopes: string[];
  connectedByUserId: string;
  connectedAt: Date;
  lastUsedAt?: Date;
  lastError?: string;
  /**
   * Whether the property is currently verified in Google Search Console.
   * Refreshed on every connect, every manual verify, and every sync.
   */
  verified?: boolean;
  /** Method most recently used to fetch a verification token. */
  verificationMethod?: GSCVerificationMethod;
  /** Host (e.g. "rahulverma.cc" vs "template.rahulverma.cc") the most recent verification token was issued against. */
  verificationHost?: string;
  /** Bare META content value (the part Next.js's metadata.verification.google expects). */
  verificationMetaToken?: string;
  /** Filename Google asks you to upload at the domain root for FILE verification. */
  verificationFileName?: string;
  /** Body of the file Google asks you to upload (one short string). */
  verificationFileContent?: string;
  /** TXT record value to add to DNS for DNS_TXT verification. */
  verificationDnsRecord?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Page Index ─────────────────────────────────────────────

export type PageIndexStatus =
  | 'pending'        // Not yet submitted
  | 'submitted'      // Submitted to Indexing API
  | 'indexed'        // Confirmed in Google's index
  | 'not_indexed'    // Inspected, not in index
  | 'error';         // Failed to submit / inspect

export interface IPageIndex extends DocBase {
  /** Path on your domain — used as _id (e.g. "/", "/pricing"). */
  _id: string;
  /** Hash of the page's source files at the last successful submission. */
  contentHash: string;
  status: PageIndexStatus;
  /** Last URL_UPDATED submission timestamp. */
  submittedAt?: Date;
  /** Last URL inspection timestamp. */
  inspectedAt?: Date;
  /** Coverage state from URL Inspection API (e.g. "Submitted and indexed"). */
  coverageState?: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}
