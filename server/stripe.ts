import Stripe from 'stripe';
import { storage } from './storage';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { db } from './db';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY. Stripe payments will not work.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null;

export interface PricePlan {
  id: string;
  name: string;
  amount: number;
  interval?: 'month' | 'year';
  currency: string;
  metadata?: Record<string, string>;
}

// Use Stripe payment links for direct checkout
export const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  'basic': 'https://buy.stripe.com/test_3cIbJ3cqG3F7grL8T51ZS02',
  'standard': 'https://buy.stripe.com/test_3cIbJ3cqG3F7grL8T51ZS02',
  'premium': 'https://buy.stripe.com/test_3cIbJ3cqG3F7grL8T51ZS02',
  'expert': 'https://buy.stripe.com/test_3cIbJ3cqG3F7grL8T51ZS02',
  'pro': 'https://buy.stripe.com/test_3cIbJ3cqG3F7grL8T51ZS02',
  'unlimited': 'https://buy.stripe.com/test_3cIbJ3cqG3F7grL8T51ZS02',
};

// Price plans - these would ideally be stored in the database
export const ONE_TIME_PLANS: Record<string, PricePlan> = {
  'basic': { id: 'basic', name: 'Basic Chat', amount: 0, currency: 'nzd' },
  'standard': { id: 'standard', name: 'Detailed Analysis', amount: 99, currency: 'nzd' },
  'premium': { id: 'premium', name: 'Comprehensive', amount: 100, currency: 'nzd' },
  'expert': { id: 'expert', name: 'Expert Review', amount: 101, currency: 'nzd' },
};

export const SUBSCRIPTION_PLANS: Record<string, PricePlan> = {
  'pro': { id: 'pro', name: 'Pro Subscription', amount: 9900, interval: 'month', currency: 'nzd' },
  'unlimited': { id: 'unlimited', name: 'Unlimited', amount: 19500, interval: 'month', currency: 'nzd' },
};

export async function createCheckoutSession(
  planId: string, 
  isSubscription: boolean,
  userId: string,
  email: string,
  successUrl: string,
  cancelUrl: string
) {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }

  const plan = isSubscription ? SUBSCRIPTION_PLANS[planId] : ONE_TIME_PLANS[planId];
  
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  // For free plans, no payment is needed
  if (plan.amount === 0) {
    return { freeAccess: true };
  }

  const user = await storage.getUser(userId);
  let customer;

  if (user?.stripeCustomerId) {
    customer = user.stripeCustomerId;
  } else {
    // Create a new customer if one doesn't exist
    const newCustomer = await stripe.customers.create({
      email,
      metadata: { userId }
    });
    customer = newCustomer.id;
    await storage.updateUserSubscription(userId, { stripeCustomerId: customer });
  }

  // For one-time payments
  if (!isSubscription) {
    // Use actual Stripe price ID if available, otherwise create price on the fly
    const priceId = STRIPE_PRICE_IDS[planId];
    
    let lineItems;
    if (priceId) {
      // Use actual Stripe product
      lineItems = [{
        price: priceId,
        quantity: 1,
      }];
    } else {
      // Fall back to creating price on the fly for plans without Stripe products
      lineItems = [{
        price_data: {
          currency: plan.currency,
          product_data: {
            name: plan.name,
            description: `One-time payment for ${plan.name}`,
          },
          unit_amount: plan.amount,
        },
        quantity: 1,
      }];
    }
    
    const session = await stripe.checkout.sessions.create({
      customer,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl.replace('/report-success', '/chat'),
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
        planType: 'one-time'
      }
    });

    return {
      sessionId: session.id,
      url: session.url
    };
  }
  
  // For subscriptions
  const priceId = STRIPE_PRICE_IDS[planId];
  
  let lineItems;
  if (priceId) {
    // Use actual Stripe product
    lineItems = [{
      price: priceId,
      quantity: 1,
    }];
  } else {
    // Fall back to creating price on the fly for plans without Stripe products
    lineItems = [{
      price_data: {
        currency: plan.currency,
        product_data: {
          name: plan.name,
          description: plan.interval === 'month' 
            ? `Monthly subscription to ${plan.name}` 
            : `Annual subscription to ${plan.name}`,
        },
        unit_amount: plan.amount,
        recurring: {
          interval: plan.interval,
        },
      },
      quantity: 1,
    }];
  }
  
  const session = await stripe.checkout.sessions.create({
    customer,
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'subscription',
    success_url: successUrl.replace('/report-success', '/chat'),
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planId,
      planType: 'subscription'
    }
  });

  return {
    sessionId: session.id,
    url: session.url
  };
}

// Handle a completed checkout session
export async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { userId, planId, planType } = session.metadata || {};
  
  if (!userId || !planId) {
    throw new Error('Missing user ID or plan ID in session metadata');
  }

  const isSubscription = planType === 'subscription';
  const plan = isSubscription ? SUBSCRIPTION_PLANS[planId] : ONE_TIME_PLANS[planId];
  
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  // For subscription plans, update the subscription ID
  if (isSubscription && session.subscription) {
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription.id;
      
    const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
    
    // Calculate expiration date (billing cycle end)
    const expiresAt = new Date(subscription.current_period_end * 1000);
    
    await storage.updateUserSubscription(userId, {
      stripeSubscriptionId: subscriptionId,
      subscriptionTier: planId,
      subscriptionStatus: subscription.status,
      subscriptionExpiresAt: expiresAt
    });
  } 
  // For one-time plans, set an expiration date (e.g., 30 days for reports)
  else if (!isSubscription) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days access
    
    await storage.updateUserSubscription(userId, {
      subscriptionTier: planId,
      subscriptionStatus: 'active',
      subscriptionExpiresAt: expiresAt
    });
  }
}

// Cancel a subscription
export async function cancelSubscription(userId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }
  
  const user = await storage.getUser(userId);
  
  if (!user?.stripeSubscriptionId) {
    throw new Error('User has no active subscription');
  }
  
  await stripe.subscriptions.cancel(user.stripeSubscriptionId);
  
  await storage.updateUserSubscription(userId, {
    subscriptionStatus: 'canceled'
  });
}

// Create a Stripe webhook handler
export async function handleStripeWebhook(signature: string, rawBody: Buffer) {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  
  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
    
    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the user with this subscription
        const userIds = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscription.id));
        
        if (userIds.length > 0) {
          const userId = userIds[0].id;
          const expiresAt = new Date(subscription.current_period_end * 1000);
          
          await storage.updateUserSubscription(userId, {
            subscriptionStatus: subscription.status,
            subscriptionExpiresAt: expiresAt
          });
        }
        
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the user with this subscription
        const userIds = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscription.id));
        
        if (userIds.length > 0) {
          const userId = userIds[0].id;
          
          await storage.updateUserSubscription(userId, {
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: ''
          });
        }
        
        break;
      }
    }
    
    return { success: true };
  } catch (err: any) {
    console.error('Error processing Stripe webhook:', err);
    throw new Error(`Webhook error: ${err.message}`);
  }
}
