import { apiRequest } from './queryClient';

/**
 * Initiates a checkout session for either a one-time purchase or subscription
 */
export async function initCheckout(planId: string, isSubscription: boolean = false) {
  try {
    const response = await apiRequest('POST', '/api/checkout', {
      planId,
      isSubscription
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // If it's a free plan, no payment needed
    if (data.free) {
      return { success: true, free: true };
    }
    
    // Check if payment was processed directly (temporary solution)
    if (data.paymentProcessed) {
      return { success: true, paymentProcessed: true };
    }
    
    // For paid plans, redirect to Stripe checkout
    if (data.url) {
      window.location.assign(data.url);
      return { success: true, redirected: true };
    }
    
    return { success: false, error: 'No checkout URL provided' };
  } catch (error) {
    console.error('Checkout error:', error);
    return { success: false, error: `Failed to create checkout session: ${error.message}` };
  }
}

/**
 * Processes a property chat request and handles payment if needed
 */
export async function processReportRequest(formData: any, planId: string) {
  // Convert plan name to ID format
  const planIdMap: Record<string, string> = {
    'Basic Report': 'basic',
    'Detailed Analysis': 'detailed',
    'Comprehensive': 'comprehensive',
    'Expert Review': 'expert',
    'Pro Subscription': 'pro',
    'Unlimited': 'unlimited'
  };
  
  // Determine if it's a subscription based on plan name
  const isSubscription = planId.includes('Subscription') || planId === 'Unlimited';
  
  // Save the property details for the chat session
  sessionStorage.setItem('projectDetails', JSON.stringify({
    propertyAddress: formData.propertyAddress || formData.address,
    projectDescription: formData.projectDescription,
    budgetRange: formData.budgetRange || formData.budget,
    timeframe: formData.timeframe,
    planId: planIdMap[planId] || 'basic'
  }));
  
  // Store selected plan for chat features
  sessionStorage.setItem('selectedPlan', planIdMap[planId] || 'basic');
  
  // For free Basic plan, redirect directly to chat
  if (planId === 'Basic Report') {
    window.location.assign('/chat');
    return { success: true, free: true };
  }
  
  // For paid plans, initiate checkout
  return await initCheckout(planIdMap[planId] || 'basic', isSubscription);
}
