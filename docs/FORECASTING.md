# Forecasting Methodology (E3)

This document describes the JavaScript forecasting algorithms implemented in `backend/src/services/forecast` (and accessible via `backend/services/forecast`).

## Core Principles

1. **Estimates with Assumptions**: All forecasts are presented as scenario ranges (Low / Expected / High), not guaranteed predictions.
2. **Ad Spend Causality Disclaimer**: Influencer ad spend does **not** cause sales. Planned ad spend is strictly recorded as an input assumption for scenario estimation and is kept separate from actual spend.

---

## 1. Baseline Demand Calculation (`baseline.js`)

The baseline represents the expected daily units demanded for a product under **normal trading conditions**.

### Rules:
- **Lookback Window**: Default 60 days prior to the start of the target sale (`date < sale.startDate`).
- **Exclusion 1: Past Flash Sales**: Any day falling within `[pastSale.startDate, pastSale.endDate]` of an earlier promotion is excluded to avoid baseline inflation.
- **Exclusion 2: Stockout Days**: Any day where `unitsAvailable === 0` in stock snapshots is excluded so supply constraints do not artificially depress the baseline.
- **Minimum History Requirement**: At least **7 normal days** must be present. If fewer than 7 days exist, the product receives `status: "not_enough_data"` rather than a fabricated baseline.

$$\text{Baseline Daily Units} = \frac{\sum_{d \in \text{Normal Days}} \text{unitsSold}_d}{|\text{Normal Days}|}$$

---

## 2. Similar Past Sales & Uplift Spread (`similarSales.js`)

To project how much sales will surge above normal baseline during a flash sale:

1. **Filtering for Similarity**:
   - Must strictly precede the target sale.
   - **Duration match**: $|\text{pastDuration} - \text{targetDuration}| \le 1.5\text{ days}$.
   - **Discount match**: $|\text{pastDiscount} - \text{targetDiscount}| \le 15\%$.
   - Target product SKU must have been included in that sale.
2. **Stockout Handling in Past Sales**:
   - If a past sale had any stockout days (`unitsAvailable === 0`), it is flagged with:
     > *"Past sale had a stockout; demand possibly understated."*
   - By default (`excludeStockoutSales: true`), it is excluded from the uplift spread to prevent artificially low projections.
3. **Uplift Ratio Calculation**:
   $$\text{Uplift Ratio} = \frac{\text{Average Daily Units During Sale}}{\text{Prior Baseline Daily Units}}$$
4. **Low / Expected / High Spread**:
   - **Multiple similar sales**: Uses the observed distribution (min / median / max).
   - **Single similar sale**: Uses the observed uplift with a conservative $\pm 20-25\%$ spread.
   - **No similar sales**: Uses transparent discount-rate heuristics (e.g. $1 + 2.5 \times \text{discountPct}$) with full assumption disclosures.

---

## 3. Total Projected Demand Range (`forecaster.js`)

For a sale lasting $D$ days:

$$\text{Low} = \max(0, \text{round}(\text{Baseline} \times U_{\text{low}} \times D))$$
$$\text{Expected} = \max(\text{Low}, \text{round}(\text{Baseline} \times U_{\text{expected}} \times D))$$
$$\text{High} = \max(\text{Expected}, \text{round}(\text{Baseline} \times U_{\text{high}} \times D))$$

Strict invariant guaranteed:
$$0 \le \text{Low} \le \text{Expected} \le \text{High}$$

---

## 4. Optional Influencer Spend Scenario Testing (`spendAdjustment.js`)

- Controlled by the config flag `enableSpendAdjustment: false` (OFF by default).
- When **OFF** (default): Planned influencer spend is stated in the assumptions card as an input scenario but does **not** inflate unit demand.
- When **ON** (experimental opt-in): Evaluates diminishing marginal returns using logarithmic elasticity against past benchmarks, accompanied by clear disclaimers that spend does not guarantee sales.

