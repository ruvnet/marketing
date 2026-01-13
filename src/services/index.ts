/**
 * Domain Services Exports
 */

export {
  CampaignService,
  CampaignCreateInput,
  OptimizationResult,
  OptimizationRecommendation,
  getCampaignService,
} from './campaign-service';

export {
  CreativeService,
  CreativeCreateInput,
  CreativePerformance,
  CreativeVariant,
  getCreativeService,
} from './creative-service';

export {
  AttributionService,
  AttributionModel,
  ConversionPath,
  AttributionResult,
  IncrementalityResult,
  CausalEffect,
  getAttributionService,
} from './attribution-service';

export {
  AnalyticsService,
  MetricSnapshot,
  PerformanceReport,
  TrendAnalysis,
  Insight,
  Benchmark,
  getAnalyticsService,
} from './analytics-service';
