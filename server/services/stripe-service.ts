// NOTE: This file is no longer directly used by the application.
// All payment processing has been moved to direct implementations in the routes.ts file.
// The interfaces are kept for documentation purposes only.

export interface CreatePaymentIntentOptions {
  amount: number; // amount in cents (e.g., 2000 for $20.00)
  currency: string; // e.g., 'usd'
  description: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionOptions {
  lineItems: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
      };
      unit_amount: number; // amount in cents
    };
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  mode: 'payment' | 'subscription';
}

/**
 * Mock implementation that mimics payment intent creation
 */
export async function createPaymentIntent(options: CreatePaymentIntentOptions) {
  return {
    id: `pi_${Date.now()}`,
    client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`,
    amount: options.amount,
    currency: options.currency,
    status: 'succeeded'
  };
}

/**
 * Mock implementation that mimics checkout session creation
 */
export async function createCheckoutSession(options: CreateCheckoutSessionOptions) {
  return {
    id: `cs_${Date.now()}`,
    url: options.successUrl, // Just redirect to success URL directly
    status: 'succeeded'
  };
}

/**
 * Mock implementation that mimics payment intent retrieval
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  return {
    id: paymentIntentId,
    status: 'succeeded'
  };
}

/**
 * Mock implementation that mimics checkout session retrieval
 */
export async function retrieveCheckoutSession(sessionId: string) {
  return {
    id: sessionId,
    status: 'complete',
    payment_status: 'paid'
  };
}

/**
 * Mock implementation that mimics webhook event processing
 */
export async function handleWebhookEvent(rawBody: string, signature: string, endpointSecret: string) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_${Date.now()}`,
        status: 'complete',
        payment_status: 'paid'
      }
    }
  };
}