
# Plan: Change Free Trial Period from 7 Days to 2 Days

## Overview
This plan covers updating the trial period from 7 days to 2 days across the entire application - both in the codebase (UI text and backend logic) and in the Stripe subscription configuration.

## Files to Update

### 1. Edge Functions (Backend Logic)

#### `supabase/functions/create-checkout/index.ts`
- **Line 87**: Change `trial_period_days: 7` to `trial_period_days: 2`

#### `supabase/functions/validate-checkout/index.ts`
- **Line 79**: Change `7 * 24 * 60 * 60 * 1000` to `2 * 24 * 60 * 60 * 1000` (trial calculation)
- Update comment from "7 days from now" to "2 days from now"

#### `supabase/functions/check-subscription/index.ts`
- **Line 133**: Change fallback `7 * 24 * 60 * 60 * 1000` to `2 * 24 * 60 * 60 * 1000`

---

### 2. Frontend Pages

#### `src/pages/Subscribe.tsx`
- **Line 14**: Page title: "7 Dias Grátis" → "2 Dias Grátis"
- **Line 15**: Description: "7 dias grátis" → "2 dias grátis"
- **Line 116**: "7 dias grátis" → "2 dias grátis"
- **Line 128**: "7 dias grátis" → "2 dias grátis"
- **Line 138**: "7 dias" → "2 dias"
- **Line 139**: "7 dias" → "2 dias"
- **Line 173**: "7 dias de teste" → "2 dias de teste"

#### `src/pages/Signup.tsx`
- **Line 18**: Page title: "7 Dias Grátis" → "2 Dias Grátis"
- **Line 19**: Description: "7 dias grátis" → "2 dias grátis"
- **Line 206**: Badge text: "7 DIAS GRÁTIS" → "2 DIAS GRÁTIS"
- **Line 392**: "7 dias de acesso" → "2 dias de acesso"

#### `src/pages/Welcome.tsx`
- **Line 38**: Toast message: "7 dias grátis" → "2 dias grátis"
- **Line 101**: "7 dias grátis ativados" → "2 dias grátis ativados"

#### `src/pages/ConhecerCursos.tsx`
- **Line 492**: "7 dias grátis" → "2 dias grátis"

---

### 3. Landing Page Components

#### `src/components/landing/HeroSection.tsx`
- **Line 204**: Stats display: "7 dias" → "2 dias"

#### `src/components/landing/CTASection.tsx`
- **Line 14**: Benefits array: "7 dias grátis para testar" → "2 dias grátis para testar"
- **Line 88**: Button text: "7 Dias" → "2 Dias"

#### `src/components/PricingSection.tsx`
- **Line 95**: Badge: "7 dias grátis para testar" → "2 dias grátis para testar"
- **Line 122**: Footer text: "Cobrança após 7 dias" → "Cobrança após 2 dias"

#### `src/components/Hero.tsx`
- **Line 57**: Button title attribute: "7 dias" → "2 dias"

---

### 4. Database Migration
A new SQL migration will update the default trial period in the database schema:

```sql
ALTER TABLE user_subscriptions 
ALTER COLUMN trial_ends_at SET DEFAULT (now() + INTERVAL '2 days');
```

---

## Changes Summary

| Location | Type | Count |
|----------|------|-------|
| Edge Functions | Backend logic | 3 files |
| Frontend Pages | UI text | 4 files |
| Landing Components | UI text | 4 files |
| Database | Schema default | 1 migration |

**Total files to modify**: 11 files + 1 database migration

---

## Technical Notes

- The Stripe subscription will automatically use the new `trial_period_days: 2` setting for all **new** subscriptions
- Existing subscriptions in trial will continue with their original 7-day trial period (this is Stripe's expected behavior)
- The database default change only affects new records; existing records remain unchanged
- No Stripe product/price changes are needed - the trial period is set dynamically at checkout session creation
