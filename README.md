# AI Search Optimizer Pro

A SaaS web app that analyzes websites for AI search readiness and provides actionable recommendations to improve visibility in LLM-powered search engines like ChatGPT, Perplexity, and Claude.

## Features

### Free Tier
- 3 URL scans per month
- Basic report with overall score and grade
- Top 3 recommendations preview
- Category breakdown

### Pro Tier (£19/month)
- Unlimited URL scans
- Full detailed reports with all recommendations
- Code examples for every fix
- PDF export
- Competitor comparison (coming soon)
- Priority support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **PDF**: jsPDF
- **Deployment**: Netlify

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd ai-search-optimizer-pro
npm install
```

### 2. Set Up Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your API keys from the dashboard

### 3. Set Up Stripe (Payments)

1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your API keys from Developers → API keys
3. Create a product:
   - Go to Products → Add product
   - Name: "Pro Plan"
   - Price: £19/month (recurring)
   - Copy the Price ID (starts with `price_`)

4. Set up webhooks:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
   - Copy the webhook signing secret

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your values:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Test Stripe Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use test card: `4242 4242 4242 4242`

## Deployment to Netlify

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ai-search-optimizer-pro.git
git push -u origin main
```

### 2. Deploy on Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Select your GitHub repo
4. Netlify auto-detects Next.js settings
5. Add environment variables in Site settings → Environment variables
6. Deploy!

### 3. Update Stripe Webhook

After deployment, update your Stripe webhook endpoint to your Netlify URL:
`https://your-site.netlify.app/api/webhooks/stripe`

## Project Structure

```
ai-search-optimizer-pro/
├── app/
│   ├── api/
│   │   ├── analyze/          # URL analysis endpoint
│   │   ├── checkout/         # Stripe checkout
│   │   └── webhooks/stripe/  # Stripe webhooks
│   ├── dashboard/            # Main app (protected)
│   ├── pricing/              # Pricing page
│   ├── sign-in/              # Clerk sign in
│   ├── sign-up/              # Clerk sign up
│   ├── page.tsx              # Landing page
│   └── layout.tsx            # Root layout
├── lib/
│   ├── analyzer.ts           # Page analysis logic
│   ├── stripe.ts             # Stripe utilities
│   ├── user.ts               # User management
│   ├── pdf.ts                # PDF generation
│   └── utils.ts              # Helper functions
├── middleware.ts             # Clerk auth middleware
└── .env.example              # Environment template
```

## What Gets Analyzed

The analyzer checks 50+ factors across 5 categories:

| Category | Checks |
|----------|--------|
| **Content Structure** | Heading hierarchy, H1 usage, subheadings, FAQ sections, definitions, content length, lists |
| **Citation Readiness** | Statistics, quotable statements, specific claims, sentence clarity, dates |
| **Technical SEO** | Schema.org markup, meta title/description, Open Graph, canonical URL, page speed, mobile viewport, alt text |
| **Credibility Signals** | Author info, publish date, about section, source citations, external links |
| **AI-Specific** | Upfront answers, table of contents, summary section, no paywall, accessibility |

## Customization

### Adding New Checks

Edit `lib/analyzer.ts`:

```typescript
function checkYourNewFeature(document: Document): Check {
  // Your logic here
  return {
    id: 'your-new-feature',
    category: 'contentStructure', // or other category
    name: 'Your New Feature',
    passed: true,
    score: 10,
    maxScore: 10,
    details: 'Description of result',
  };
}
```

Add to `runAllChecks()` function.

### Changing Pricing

1. Update price in Stripe dashboard
2. Update price ID in `.env.local`
3. Update displayed price in `app/pricing/page.tsx` and `app/dashboard/page.tsx`

### Adding Features

Common next steps:
- Competitor comparison (analyze multiple URLs)
- Historical tracking (save reports over time)
- Email notifications (scan complete, subscription events)
- API access for integrations
- Team/agency accounts

## Troubleshooting

### "Authentication required" error
- Make sure Clerk keys are set correctly
- Check middleware.ts is protecting the right routes

### Stripe checkout not working
- Verify STRIPE_PRO_PRICE_ID is a valid price ID
- Check Stripe dashboard for errors
- Ensure webhook secret matches

### Analysis timing out
- Some pages take longer to load
- Try increasing timeout in analyzer
- Check if target site blocks bots

## License

MIT - use for any purpose.

---

Built to help websites get discovered by AI. 🚀
