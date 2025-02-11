import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing Stripe secret key");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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