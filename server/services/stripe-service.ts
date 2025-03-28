import Stripe from 'stripe';

// Check for required environment variable
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing required Stripe secret key: STRIPE_SECRET_KEY');
}

// Initialize Stripe with API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

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
 * Create a PaymentIntent for a payment
 */
export async function createPaymentIntent(options: CreatePaymentIntentOptions) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: options.amount,
      currency: options.currency,
      description: options.description,
      metadata: options.metadata,
    });
    
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Create a Checkout Session for a payment
 */
export async function createCheckoutSession(options: CreateCheckoutSessionOptions) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: options.lineItems,
      mode: options.mode,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: options.metadata,
    });
    
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Retrieve a payment intent by ID
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
}

/**
 * Retrieve a checkout session by ID
 */
export async function retrieveCheckoutSession(sessionId: string) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    throw error;
  }
}

/**
 * Process a webhook event from Stripe
 */
export async function handleWebhookEvent(rawBody: string, signature: string, endpointSecret: string) {
  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        break;
        
      case 'checkout.session.completed':
        // Handle completed checkout session
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout completed: ${session.id}`);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return event;
  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw error;
  }
}