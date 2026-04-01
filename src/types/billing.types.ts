export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export interface BillingPortal {
  url: string;
}

export interface CreditBalance {
  creditBalance: number;
  walletBalance: number;
  plan: string;
}
