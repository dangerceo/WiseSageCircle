import Stripe from "stripe";

export const CREDIT_PRODUCTS = {
  "credit-50": {
    price: 500, // in cents
    credits: 50,
  },
  "credit-100": {
    price: 900,
    credits: 100,
  },
  "credit-200": {
    price: 1500,
    credits: 200,
  },
};

// Mock Stripe functionality for testing
export const stripe = {
  checkout: {
    sessions: {
      create: async ({ line_items, success_url, metadata }) => {
        // Mock a successful checkout session
        return {
          url: success_url.replace('{CHECKOUT_SESSION_ID}', 'mock_session_id'),
          id: 'mock_session_id'
        };
      }
    }
  },
  webhooks: {
    constructEvent: (payload: string, signature: string, secret: string) => {
      // Always return a mock successful event
      return {
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: {
              userId: payload, // Pass through the original payload as userId
              credits: '100'  // Default to 100 credits for testing
            }
          }
        }
      };
    }
  }
};