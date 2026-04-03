

# Phase 1: Pricing Overhaul + Stripe Fix

## Summary
Remove the free trial, update pricing to R$99.90/month with semester (20% off) and annual (30% off) options. Create new Stripe prices and update all related code.

## Current State
- One Stripe product: `prod_TaRynDavvi9T2h` ("Aula Click Premium")
- One price: `price_1SdH50K2ADuy4IKKXoAmsCSI` (R$59.90/month)
- 2-day free trial configured in `create-checkout` edge function
- UI references "2 dias gratis" and "R$59,90" in multiple places

## Step 1: Create New Stripe Prices

Using Stripe tools, create 3 new prices on the existing product `prod_TaRynDavvi9T2h`:

| Plan | Price | Interval | Discount | Monthly equivalent |
|------|-------|----------|----------|--------------------|
| Monthly | R$99.90/mo | month | - | R$99.90 |
| Semester | R$479.52/6mo | 6 months | 20% off | R$79.92 |
| Annual | R$838.44/yr | year | 30% off | R$69.87 |

## Step 2: Update `create-checkout` Edge Function

**File:** `supabase/functions/create-checkout/index.ts`
- Accept a `plan` parameter in request body (`monthly`, `semester`, `annual`)
- Map plan to the corresponding price ID
- Remove `trial_period_days: 2` from `subscription_data`
- Remove trial-related metadata
- Update success URL to `/dashboard` instead of `/welcome?session_id=...`

## Step 3: Update `check-subscription` Edge Function

**File:** `supabase/functions/check-subscription/index.ts`
- Remove trial-specific logic (no more free trial)
- Keep trialing status check from Stripe (for any legacy users)

## Step 4: Update `validate-checkout` Edge Function

**File:** `supabase/functions/validate-checkout/index.ts`
- Remove `trial_ends_at` calculation
- Set `subscription_status` to `'active'` instead of `'trialing'`

## Step 5: Update `PricingSection` Component

**File:** `src/components/PricingSection.tsx`
- Show 3 plan cards (Monthly, Semester, Annual) instead of 1
- Remove "2 dias gratis" badge and trial references
- Update prices: R$99.90/mo, R$479.52/6mo, R$838.44/yr
- Show savings percentage on semester and annual
- Pass selected plan to `create-checkout`

## Step 6: Update Subscribe Page

**File:** `src/pages/Subscribe.tsx`
- Remove all trial references ("2 dias gratis", "Sem cobrança agora", etc.)
- Add plan selection (monthly/semester/annual)
- Update prices and descriptions
- Pass selected plan to checkout function

## Step 7: Update Landing Page Text

**Files:** `src/components/landing/HeroSection.tsx`, `src/components/landing/CTASection.tsx`
- Remove "teste grátis" / "free trial" references
- Update CTA to "Assinar Agora" or similar

## Step 8: Update `handle_new_user` DB Function

**Migration:** Update the `handle_new_user()` function
- Remove `trial_ends_at` default assignment
- Set `subscription_status` to `'inactive'` for all new users (no trial)

## Step 9: Update ProtectedRoute

**File:** `src/components/ProtectedRoute.tsx`
- Remove `in_trial` logic since there's no more trial
- Simplify to just check `subscribed` status

## Step 10: Deploy and Test

- Deploy updated edge functions
- Test checkout flow for each plan tier
- Verify subscription status checks work

---

## Technical Notes

- The old price `price_1SdH50K2ADuy4IKKXoAmsCSI` (R$59.90) will remain in Stripe for existing subscribers but won't be offered to new users
- Existing trial users will continue their trial until it expires (Stripe handles this automatically)
- Semester = `interval: "month", interval_count: 6`; Annual = `interval: "year"`
- ~10 files modified, 3 new Stripe prices created

