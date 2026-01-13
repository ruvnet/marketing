# DDD: Offer Engineering & Pricing Domain - Overview

## Domain Purpose

The **Offer Engineering & Pricing Domain** optimizes the offer structure, not just the creative. It tests and evolves price anchoring, bonuses, guarantees, scarcity mechanics, and payment framing to maximize conversion value.

> *"Ads fail because offers suck — not because targeting does."* - Build.docx

## Strategic Classification

| Aspect | Classification |
|--------|----------------|
| **Domain Type** | Core Domain |
| **Business Value** | Critical - Direct revenue impact |
| **Complexity** | High - Economics + Psychology |
| **Volatility** | Medium - Offer structures stable |

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Offer** | Complete value proposition including price, bonuses, guarantees |
| **Price Anchor** | Reference price that establishes value perception |
| **Bonus Stack** | Additional value-adds bundled with core offer |
| **Risk Reversal** | Guarantee that reduces purchase risk (refund, trial) |
| **Scarcity Mechanic** | Time or quantity limitation driving urgency |
| **Payment Frame** | How price is presented (per day, installments, etc.) |
| **Elasticity** | Price sensitivity of demand |
| **Offer Genome** | DNA representation of offer components |

## Domain Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   OFFER ENGINEERING & PRICING DOMAIN MODEL                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AGGREGATES                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              Offer (Aggregate Root)                          │   │   │
│  │  │                                                              │   │   │
│  │  │  • offerId: OfferId                                         │   │   │
│  │  │  • productId: ProductId                                     │   │   │
│  │  │  • name: string                                             │   │   │
│  │  │  • status: OfferStatus                                      │   │   │
│  │  │  • genome: OfferGenome                                      │   │   │
│  │  │  • pricing: PricingStructure                                │   │   │
│  │  │  • bonuses: Bonus[]                                         │   │   │
│  │  │  • guarantee: RiskReversal                                  │   │   │
│  │  │  • scarcity: ScarcityMechanic                               │   │   │
│  │  │  • performance: OfferPerformance                            │   │   │
│  │  │                                                              │   │   │
│  │  │  + mutate(component: OfferComponent): Offer                 │   │   │
│  │  │  + calculateExpectedRevenue(): Money                        │   │   │
│  │  │  + getElasticity(): number                                  │   │   │
│  │  │  + compare(other: Offer): OfferComparison                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              OfferExperiment (Aggregate Root)                │   │   │
│  │  │                                                              │   │   │
│  │  │  • experimentId: ExperimentId                               │   │   │
│  │  │  • controlOffer: OfferId                                    │   │   │
│  │  │  • variants: OfferVariant[]                                 │   │   │
│  │  │  • hypothesis: string                                       │   │   │
│  │  │  • status: ExperimentStatus                                 │   │   │
│  │  │  • trafficAllocation: TrafficSplit                          │   │   │
│  │  │  • results: ExperimentResults                               │   │   │
│  │  │                                                              │   │   │
│  │  │  + addVariant(offer: Offer, allocation: number): void       │   │   │
│  │  │  + recordConversion(variantId, value): void                 │   │   │
│  │  │  + getStatisticalSignificance(): SignificanceResult         │   │   │
│  │  │  + declareWinner(): OfferId | null                          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              PriceElasticityModel (Aggregate Root)           │   │   │
│  │  │                                                              │   │   │
│  │  │  • modelId: ModelId                                         │   │   │
│  │  │  • productId: ProductId                                     │   │   │
│  │  │  • elasticityCurve: ElasticityCurve                         │   │   │
│  │  │  • optimalPricePoint: Money                                 │   │   │
│  │  │  • revenueMaximizingPrice: Money                            │   │   │
│  │  │  • profitMaximizingPrice: Money                             │   │   │
│  │  │                                                              │   │   │
│  │  │  + predict(price: Money): DemandPrediction                  │   │   │
│  │  │  + updateFromExperiment(experiment: OfferExperiment): void  │   │   │
│  │  │  + findOptimalPrice(objective: PricingObjective): Money     │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       VALUE OBJECTS                                  │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               OfferGenome (Value Object)                     │   │   │
│  │  │                                                              │   │   │
│  │  │  • priceAnchor: PriceAnchorGene                             │   │   │
│  │  │  • bonusStructure: BonusGene                                │   │   │
│  │  │  • riskReversal: RiskReversalGene                           │   │   │
│  │  │  • scarcity: ScarcityGene                                   │   │   │
│  │  │  • paymentFrame: PaymentFrameGene                           │   │   │
│  │  │  • embedding: Embedding                                     │   │   │
│  │  │                                                              │   │   │
│  │  │  + crossover(other: OfferGenome): OfferGenome               │   │   │
│  │  │  + mutate(rate: number): OfferGenome                        │   │   │
│  │  │  + similarity(other: OfferGenome): number                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               PricingStructure (Value Object)                │   │   │
│  │  │                                                              │   │   │
│  │  │  • basePrice: Money                                         │   │   │
│  │  │  • compareAtPrice: Money (strikethrough)                    │   │   │
│  │  │  • discount: Discount                                       │   │   │
│  │  │  • paymentOptions: PaymentOption[]                          │   │   │
│  │  │  • currency: Currency                                       │   │   │
│  │  │                                                              │   │   │
│  │  │  + displayPrice(): string                                   │   │   │
│  │  │  + perceivedSavings(): Money                                │   │   │
│  │  │  + monthlyEquivalent(): Money                               │   │   │
│  │  │  + dailyEquivalent(): Money                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               Bonus (Value Object)                           │   │   │
│  │  │                                                              │   │   │
│  │  │  • name: string                                             │   │   │
│  │  │  • value: Money                                             │   │   │
│  │  │  • type: BonusType (DIGITAL | PHYSICAL | SERVICE | ACCESS)  │   │   │
│  │  │  • exclusivity: Exclusivity                                 │   │   │
│  │  │  • deliveryTime: DeliveryWindow                             │   │   │
│  │  │                                                              │   │   │
│  │  │  + perceivedValue(): Money                                  │   │   │
│  │  │  + urgencyContribution(): number                            │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               RiskReversal (Value Object)                    │   │   │
│  │  │                                                              │   │   │
│  │  │  • type: GuaranteeType (MONEY_BACK | FREE_TRIAL | WARRANTY) │   │   │
│  │  │  • duration: Days                                           │   │   │
│  │  │  • conditions: string[]                                     │   │   │
│  │  │  • strength: number (0-1)                                   │   │   │
│  │  │                                                              │   │   │
│  │  │  + riskReductionScore(): number                             │   │   │
│  │  │  + trustImpact(): number                                    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               ScarcityMechanic (Value Object)                │   │   │
│  │  │                                                              │   │   │
│  │  │  • type: ScarcityType (TIME | QUANTITY | ACCESS)            │   │   │
│  │  │  • deadline: Timestamp | null                               │   │   │
│  │  │  • quantityRemaining: number | null                         │   │   │
│  │  │  • accessLevel: AccessLevel | null                          │   │   │
│  │  │  • authenticity: boolean (real vs artificial)               │   │   │
│  │  │                                                              │   │   │
│  │  │  + urgencyScore(): number                                   │   │   │
│  │  │  + displayMessage(): string                                 │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │               PaymentOption (Value Object)                   │   │   │
│  │  │                                                              │   │   │
│  │  │  • type: PaymentType (ONE_TIME | SUBSCRIPTION | INSTALLMENT)│   │   │
│  │  │  • amount: Money                                            │   │   │
│  │  │  • frequency: PaymentFrequency                              │   │   │
│  │  │  • terms: number                                            │   │   │
│  │  │  • downPayment: Money | null                                │   │   │
│  │  │                                                              │   │   │
│  │  │  + totalCost(): Money                                       │   │   │
│  │  │  + monthlyDisplay(): string                                 │   │   │
│  │  │  + dailyDisplay(): string                                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN SERVICES                                │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              OfferVariantGenerator                           │   │   │
│  │  │                                                              │   │   │
│  │  │  - hdcEncoder: CreativeHDC                                  │   │   │
│  │  │  - mutationEngine: GeneticMutator                           │   │   │
│  │  │                                                              │   │   │
│  │  │  + generateVariants(offer: Offer, count: number): Offer[]   │   │   │
│  │  │  + crossover(offer1: Offer, offer2: Offer): Offer           │   │   │
│  │  │  + mutateComponent(offer, component, rate): Offer           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              ElasticityModelService                          │   │   │
│  │  │                                                              │   │   │
│  │  │  - gnnModel: RuvectorGNN                                    │   │   │
│  │  │  - historicalData: PriceHistory                             │   │   │
│  │  │                                                              │   │   │
│  │  │  + estimateElasticity(product: Product): number             │   │   │
│  │  │  + predictDemand(price: Money): DemandForecast              │   │   │
│  │  │  + findOptimalPrice(objective: Objective): Money            │   │   │
│  │  │  + simulatePriceChange(from, to): ImpactPrediction          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              RiskReversalOptimizer                           │   │   │
│  │  │                                                              │   │   │
│  │  │  - conversionModel: ConversionPredictionService             │   │   │
│  │  │  - costModel: RefundCostModel                               │   │   │
│  │  │                                                              │   │   │
│  │  │  + optimizeGuarantee(product: Product): RiskReversal        │   │   │
│  │  │  + calculateRefundRisk(guarantee: RiskReversal): number     │   │   │
│  │  │  + netImpact(guarantee: RiskReversal): Money                │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │              ProfitAwareOptimizer                            │   │   │
│  │  │                                                              │   │   │
│  │  │  - elasticityModel: ElasticityModelService                  │   │   │
│  │  │  - costStructure: CostStructure                             │   │   │
│  │  │                                                              │   │   │
│  │  │  + optimizeForProfit(offer: Offer): OptimizedOffer          │   │   │
│  │  │  + optimizeForRevenue(offer: Offer): OptimizedOffer         │   │   │
│  │  │  + optimizeForVolume(offer: Offer): OptimizedOffer          │   │   │
│  │  │  + paretoOptimize(offer: Offer): ParetoFront                │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       AGENTS (4)                                     │   │
│  │                                                                      │   │
│  │  1. Offer Variant Generator Agent                                   │   │
│  │     • Generates evolutionary offer variants                         │   │
│  │     • Applies genetic crossover and mutation                        │   │
│  │     • Ensures diversity in variant pool                             │   │
│  │                                                                      │   │
│  │  2. Elasticity Model Agent                                          │   │
│  │     • Maintains price elasticity models                             │   │
│  │     • Updates from experiment results                               │   │
│  │     • Predicts demand at various price points                       │   │
│  │                                                                      │   │
│  │  3. Risk Reversal Agent                                             │   │
│  │     • Optimizes guarantee structures                                │   │
│  │     • Balances conversion lift vs refund cost                       │   │
│  │     • Monitors refund rates                                         │   │
│  │                                                                      │   │
│  │  4. Profit-Aware Optimizer Agent                                    │   │
│  │     • Optimizes for profit, not just conversions                    │   │
│  │     • Considers cost structure                                      │   │
│  │     • Finds pareto-optimal offers                                   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       DOMAIN EVENTS                                  │   │
│  │                                                                      │   │
│  │  • OfferCreated { offerId, productId, genome, timestamp }           │   │
│  │  • OfferVariantGenerated { parentId, variantId, mutations }         │   │
│  │  • ExperimentStarted { experimentId, variants, allocation }         │   │
│  │  • ExperimentConcluded { experimentId, winnerId, lift, significance}│   │
│  │  • PriceOptimized { offerId, oldPrice, newPrice, expectedImpact }   │   │
│  │  • GuaranteeUpdated { offerId, oldGuarantee, newGuarantee }         │   │
│  │  • ElasticityUpdated { productId, newElasticity, confidence }       │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Offer Genome Components

| Gene | Variants | Example Values |
|------|----------|----------------|
| **Price Anchor** | Original, Competitor, Value-Based | $997 (was $2,997) |
| **Bonus Structure** | None, Single, Stack, Time-Limited | 5 bonuses worth $3,000 |
| **Risk Reversal** | None, 30-day, 60-day, Lifetime | 60-day no-questions |
| **Scarcity** | None, Time, Quantity, Access | Only 100 spots |
| **Payment Frame** | One-time, Monthly, Per-day | Just $3.27/day |

## Implementation Example

```typescript
// services/offer-optimizer.service.ts
import { GNNLayer, MinCut } from '@ruvector/core';

export class OfferOptimizer {
  private gnn: GNNLayer;
  private mincut: MinCut;

  async generateVariants(
    baseOffer: Offer,
    count: number
  ): Promise<Offer[]> {
    const variants: Offer[] = [];

    // 1. Generate mutations
    for (let i = 0; i < count; i++) {
      const mutationType = this.selectMutationType();
      const mutated = this.mutateOffer(baseOffer, mutationType);
      variants.push(mutated);
    }

    // 2. Ensure diversity using MinCut
    const diverseVariants = this.ensureDiversity(variants);

    // 3. Predict performance using GNN
    const scoredVariants = await Promise.all(
      diverseVariants.map(async v => ({
        offer: v,
        predictedConversion: await this.predictConversion(v),
        predictedRevenue: await this.predictRevenue(v)
      }))
    );

    // 4. Return top performers
    return scoredVariants
      .sort((a, b) => b.predictedRevenue - a.predictedRevenue)
      .slice(0, count)
      .map(sv => sv.offer);
  }

  private mutateOffer(offer: Offer, type: MutationType): Offer {
    const genome = { ...offer.genome };

    switch (type) {
      case 'PRICE_ANCHOR':
        genome.priceAnchor = this.mutatePriceAnchor(genome.priceAnchor);
        break;

      case 'BONUS_STACK':
        genome.bonusStructure = this.mutateBonusStack(genome.bonusStructure);
        break;

      case 'RISK_REVERSAL':
        genome.riskReversal = this.mutateRiskReversal(genome.riskReversal);
        break;

      case 'SCARCITY':
        genome.scarcity = this.mutateScarcity(genome.scarcity);
        break;

      case 'PAYMENT_FRAME':
        genome.paymentFrame = this.mutatePaymentFrame(genome.paymentFrame);
        break;
    }

    return { ...offer, genome, offerId: generateId() };
  }

  private mutatePriceAnchor(anchor: PriceAnchorGene): PriceAnchorGene {
    const mutations = [
      // Increase perceived discount
      { compareAt: anchor.compareAt * 1.5, discount: anchor.discount },
      // Add competitor comparison
      { compareAt: anchor.compareAt, competitorPrice: anchor.compareAt * 1.2 },
      // Value framing
      { compareAt: anchor.compareAt, valueJustification: true }
    ];

    return mutations[Math.floor(Math.random() * mutations.length)];
  }

  async runExperiment(
    experiment: OfferExperiment
  ): Promise<ExperimentResult> {
    // Monitor until statistical significance
    while (!experiment.hasSignificance()) {
      await this.wait(3600000); // 1 hour

      const results = await this.collectResults(experiment);
      experiment.updateResults(results);

      // Early stopping if clear winner
      if (experiment.hasClearWinner(0.99)) {
        break;
      }
    }

    const winner = experiment.declareWinner();

    // Update elasticity model with learnings
    await this.updateElasticityModel(experiment);

    return {
      experimentId: experiment.experimentId,
      winner,
      lift: experiment.getLiftOverControl(),
      significance: experiment.getSignificance(),
      insights: experiment.extractInsights()
    };
  }
}
```

## Related Documents
- [DDD: Dynamic Persona Domain](../persona-psychology/001-domain-overview.md)
- [DDD: Creative Evolution Domain](../creative-evolution/001-domain-overview.md)
- [ADR-RV001: Ruvector Integration](../../adr/ruvector-integration/001-integration-strategy.md)
