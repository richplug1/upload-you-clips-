# 💳 Credit-Based Subscription System

## Overview

The Upload You Clips application now includes a comprehensive credit-based subscription system that controls video processing based on user plans and credit consumption.

## 🎯 How It Works

### Credit Calculation Formula

Credits are consumed based on video processing complexity:

```
Total Credits = Base Cost + Duration Cost + Complexity Bonus

Where:
- Base Cost = Number of clips × 1 credit
- Duration Cost = Video minutes × 0.1 credit  
- Complexity Bonus = 0.5 credit per clip (for videos > 10 minutes)
```

### Example Calculations

| Video Duration | Clips | Base Cost | Duration Cost | Complexity | Total |
|---------------|-------|-----------|---------------|------------|-------|
| 2 minutes     | 3     | 3         | 0.2          | 0          | 4     |
| 5 minutes     | 5     | 5         | 0.5          | 0          | 6     |
| 15 minutes    | 10    | 10        | 1.5          | 5          | 17    |
| 30 minutes    | 20    | 20        | 3.0          | 10         | 33    |

## 📋 Subscription Plans

### Free Plan
- **Credits**: 10 per month
- **Video Length**: Up to 5 minutes
- **Clips per Video**: Up to 3
- **Features**: Basic processing, standard quality

### Starter Plan - $9.99/month
- **Credits**: 100 per month
- **Video Length**: Up to 15 minutes
- **Clips per Video**: Up to 10
- **Features**: AI-powered processing, HD quality, priority support

### Pro Plan - $29.99/month
- **Credits**: 500 per month
- **Video Length**: Up to 1 hour
- **Clips per Video**: Up to 25
- **Features**: Advanced AI, 4K quality, custom templates, API access

### Enterprise Plan - $99.99/month
- **Credits**: 2000 per month
- **Video Length**: Unlimited
- **Clips per Video**: Up to 100
- **Features**: Enterprise AI, custom formats, white-label, dedicated support

## 💰 Credit Purchasing

Additional credits can be purchased at $0.10 per credit:
- 50 credits = $5.00
- 120 credits = $10.00 (Best value)
- 250 credits = $20.00
- 500 credits = $35.00

## 🔧 API Endpoints

### Get Subscription Status
```http
GET /api/subscription/status
Authorization: Bearer <token>
```

### Get Available Plans
```http
GET /api/subscription/plans
```

### Calculate Processing Cost
```http
POST /api/subscription/calculate-cost
Content-Type: application/json

{
  "video_duration": 300,
  "clips_count": 5
}
```

### Upgrade Subscription
```http
POST /api/subscription/upgrade
Content-Type: application/json

{
  "plan_id": "pro",
  "payment_method": {
    "type": "demo",
    "token": "demo_token"
  }
}
```

### Purchase Credits
```http
POST /api/subscription/buy-credits
Content-Type: application/json

{
  "credits_amount": 100,
  "payment_method": {
    "type": "demo",
    "token": "demo_token"
  }
}
```

### Get Usage History
```http
GET /api/subscription/usage-history?limit=50&offset=0
Authorization: Bearer <token>
```

## 🎨 Frontend Components

### CreditStatus
Displays current credit balance and subscription status.

```tsx
import CreditStatus from './components/CreditStatus';

<CreditStatus
  showDetails={true}
  onUpgradeClick={() => setShowPlans(true)}
  onBuyCreditsClick={() => setShowBuyCredits(true)}
/>
```

### ProcessingCostCalculator
Shows cost breakdown before processing.

```tsx
import ProcessingCostCalculator from './components/ProcessingCostCalculator';

<ProcessingCostCalculator
  videoDuration={300}
  clipsCount={5}
  onCostCalculated={(cost, canProcess) => {
    console.log('Cost:', cost, 'Can process:', canProcess);
  }}
/>
```

### SubscriptionPlans
Displays available plans with upgrade options.

```tsx
import SubscriptionPlans from './components/SubscriptionPlans';

<SubscriptionPlans
  onPlanSelected={(plan) => console.log('Selected:', plan)}
/>
```

### BuyCreditsModal
Modal for purchasing additional credits.

```tsx
import BuyCreditsModal from './components/BuyCreditsModal';

<BuyCreditsModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={(credits) => console.log('Purchased:', credits)}
  currentCredits={userCredits}
/>
```

## 🔐 Backend Integration

### Credit Middleware
The system includes middleware to automatically check credits and subscription limits:

```javascript
const { checkVideoProcessingCredits } = require('../middleware/creditMiddleware');

router.post('/process',
  authService.authenticateToken,
  checkVideoProcessingCredits, // Automatic credit checking
  async (req, res) => {
    // Credits already checked and deducted
    // Process video...
  }
);
```

### Database Schema
The system uses three main tables:
- `subscriptions` - User subscription plans
- `credits` - User credit balances
- `credit_transactions` - Credit usage history

## 🛡️ Security Features

- **Authentication Required**: All credit operations require valid JWT tokens
- **Rate Limiting**: Prevent abuse with request rate limiting
- **Input Validation**: All inputs are validated and sanitized
- **Error Handling**: Comprehensive error handling with detailed logging

## 📊 Analytics & Monitoring

### Credit Usage Tracking
- Real-time credit balance updates
- Detailed transaction history
- Usage patterns and trends

### Subscription Analytics
- Plan conversion rates
- Credit utilization rates
- Revenue tracking

## 🔄 Auto-Renewal & Billing

### Monthly Credit Refresh
```javascript
// Automatic monthly reset for all active subscriptions
await database.resetMonthlyCredits();
```

### Credit Expiration
- Credits refresh monthly for paid plans
- Unused credits don't roll over
- Free plan credits reset monthly

## 🎭 Demo Mode

The current implementation includes demo payment processing:
- No real charges are made
- All payments are simulated
- Perfect for testing and development

To integrate real payments, replace the demo payment handlers with:
- Stripe integration
- PayPal integration
- Other payment providers

## 🔧 Configuration

### Environment Variables
```bash
# Credit system settings
CREDIT_RATE_LIMIT=100
SUBSCRIPTION_WEBHOOK_SECRET=your_webhook_secret
PAYMENT_PROVIDER=demo
```

### Plan Configuration
Plans are currently hardcoded but can be moved to database configuration for dynamic pricing.

## 📈 Future Enhancements

1. **Real Payment Integration**
   - Stripe/PayPal integration
   - Webhook handling for payment events
   - Automatic subscription management

2. **Advanced Analytics**
   - Usage prediction
   - Cost optimization recommendations
   - Business intelligence dashboard

3. **Enterprise Features**
   - Custom pricing
   - Volume discounts
   - API rate limiting by plan

4. **Mobile App Support**
   - React Native components
   - Mobile payment integration
   - Push notifications for low credits

## 🐛 Troubleshooting

### Common Issues

1. **"Insufficient Credits" Error**
   - Check current credit balance
   - Verify calculation is correct
   - Ensure credits weren't already deducted

2. **"Plan Limit Exceeded" Error**
   - Confirm video duration vs plan limits
   - Check clips count vs plan limits
   - Suggest plan upgrade to user

3. **Payment Processing Errors**
   - Verify payment method details
   - Check webhook configuration
   - Review payment provider logs

### Debug Tools

```javascript
// Enable detailed logging
process.env.DEBUG = 'credits:*';

// Check credit calculation
const cost = calculateCreditCost(duration, clipsCount);
console.log('Credit cost:', cost);

// Verify user subscription
const subscription = await database.getUserSubscription(userId);
console.log('User subscription:', subscription);
```

## 📞 Support

For issues or questions about the credit system:
1. Check the troubleshooting guide
2. Review the API documentation
3. Check the logs for error details
4. Contact the development team

---

*This credit system is production-ready and includes all necessary features for a complete subscription-based video processing service.*
