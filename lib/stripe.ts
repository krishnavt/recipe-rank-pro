import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_1Rtfv8EO13XPTry1woljqaJ7',
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_1RtfvWEO13XPTry1BmTMrZTQ',
  agency: process.env.STRIPE_AGENCY_PRICE_ID || 'price_1RtfvoEO13XPTry1JGPqWb34',
}

export const PLAN_LIMITS = {
  starter: { analyses: 10, features: ['basic_seo', 'schema_generator', 'email_support'] },
  pro: { analyses: 50, features: ['advanced_keywords', 'competitor_analysis', 'content_decay', 'priority_support'] },
  agency: { analyses: -1, features: ['unlimited', 'white_label', 'team_collaboration', 'custom_integrations', 'phone_support'] }
}
