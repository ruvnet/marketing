# ADR-API003: Platform API Integrations

## Status
**Proposed** | Date: 2026-01-13

## Context

The AI Marketing Swarms platform must integrate with multiple advertising platforms to:

1. **Read campaign data** - Performance metrics, creative status
2. **Write campaign changes** - Budget, bidding, targeting adjustments
3. **Manage creatives** - Upload, rotate, pause ads
4. **Track conversions** - Attribution, lift measurement

Each platform has different APIs, rate limits, and authentication patterns.

## Decision

We will implement a **unified Platform Adapter pattern** that abstracts platform-specific APIs behind a common interface.

### Platform Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PLATFORM INTEGRATION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     UNIFIED PLATFORM SDK                             │   │
│  │                                                                      │   │
│  │  import { PlatformClient } from '@marketing/platforms';              │   │
│  │                                                                      │   │
│  │  const client = new PlatformClient('google');                        │   │
│  │  const campaigns = await client.campaigns.list({ status: 'ACTIVE' });│   │
│  │  await client.campaigns.updateBudget(campaignId, newBudget);         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     PLATFORM ADAPTERS                                │   │
│  │                                                                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   Google    │ │    Meta     │ │   TikTok    │ │  LinkedIn   │   │   │
│  │  │   Adapter   │ │   Adapter   │ │   Adapter   │ │   Adapter   │   │   │
│  │  │             │ │             │ │             │ │             │   │   │
│  │  │• OAuth 2.0  │ │• OAuth 2.0  │ │• OAuth 2.0  │ │• OAuth 2.0  │   │   │
│  │  │• REST API   │ │• Graph API  │ │• REST API   │ │• REST API   │   │   │
│  │  │• GAQL       │ │• Batch      │ │• JSON       │ │• JSON       │   │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │   │
│  └─────────┼───────────────┼───────────────┼───────────────┼───────────┘   │
│            │               │               │               │                │
│            ▼               ▼               ▼               ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     PLATFORM APIS                                    │   │
│  │                                                                      │   │
│  │  Google Ads    Meta Marketing    TikTok Ads     LinkedIn Marketing  │   │
│  │  API v16       API v19           API v1.3       API v2              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Unified Interface

```typescript
// platforms/types.ts
export interface PlatformAdapter {
  // Authentication
  authenticate(): Promise<void>;
  refreshToken(): Promise<string>;

  // Campaigns
  campaigns: {
    list(filter?: CampaignFilter): Promise<Campaign[]>;
    get(id: string): Promise<Campaign>;
    create(campaign: CreateCampaignInput): Promise<Campaign>;
    update(id: string, updates: UpdateCampaignInput): Promise<Campaign>;
    updateBudget(id: string, budget: Budget): Promise<void>;
    updateBidding(id: string, strategy: BiddingStrategy): Promise<void>;
    pause(id: string): Promise<void>;
    enable(id: string): Promise<void>;
  };

  // Ad Sets / Ad Groups
  adSets: {
    list(campaignId: string): Promise<AdSet[]>;
    get(id: string): Promise<AdSet>;
    create(adSet: CreateAdSetInput): Promise<AdSet>;
    update(id: string, updates: UpdateAdSetInput): Promise<AdSet>;
    updateTargeting(id: string, targeting: Targeting): Promise<void>;
  };

  // Creatives / Ads
  creatives: {
    list(adSetId: string): Promise<Creative[]>;
    get(id: string): Promise<Creative>;
    create(creative: CreateCreativeInput): Promise<Creative>;
    update(id: string, updates: UpdateCreativeInput): Promise<Creative>;
    pause(id: string): Promise<void>;
    enable(id: string): Promise<void>;
  };

  // Reporting
  reporting: {
    getCampaignMetrics(id: string, dateRange: DateRange): Promise<CampaignMetrics>;
    getAdSetMetrics(id: string, dateRange: DateRange): Promise<AdSetMetrics>;
    getCreativeMetrics(id: string, dateRange: DateRange): Promise<CreativeMetrics>;
    getConversions(dateRange: DateRange): Promise<Conversion[]>;
  };

  // Audiences
  audiences: {
    list(): Promise<Audience[]>;
    get(id: string): Promise<Audience>;
    create(audience: CreateAudienceInput): Promise<Audience>;
    getInsights(id: string): Promise<AudienceInsights>;
  };
}
```

### Google Ads Implementation

```typescript
// platforms/google/adapter.ts
import { GoogleAdsApi, enums, services } from 'google-ads-api';

export class GoogleAdsAdapter implements PlatformAdapter {
  private client: GoogleAdsApi;
  private customerId: string;

  constructor(credentials: GoogleAdsCredentials) {
    this.client = new GoogleAdsApi({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      developer_token: credentials.developerToken
    });
    this.customerId = credentials.customerId;
  }

  async authenticate(): Promise<void> {
    // OAuth flow handled by google-ads-api library
  }

  campaigns = {
    list: async (filter?: CampaignFilter): Promise<Campaign[]> => {
      const customer = this.client.Customer({
        customer_id: this.customerId,
        refresh_token: await this.getRefreshToken()
      });

      let query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign_budget.amount_micros,
          campaign.bidding_strategy_type,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_micros
        FROM campaign
        WHERE campaign.status != 'REMOVED'
      `;

      if (filter?.status) {
        query += ` AND campaign.status = '${filter.status}'`;
      }

      const results = await customer.query(query);
      return results.map(this.mapGoogleCampaign);
    },

    updateBudget: async (id: string, budget: Budget): Promise<void> => {
      const customer = this.client.Customer({
        customer_id: this.customerId,
        refresh_token: await this.getRefreshToken()
      });

      // Get campaign budget resource name
      const campaign = await this.campaigns.get(id);

      await customer.campaignBudgets.update({
        resource_name: campaign.budgetResourceName,
        amount_micros: budget.amount * 1_000_000
      });
    },

    updateBidding: async (id: string, strategy: BiddingStrategy): Promise<void> => {
      const customer = this.client.Customer({
        customer_id: this.customerId,
        refresh_token: await this.getRefreshToken()
      });

      const operations = [];

      switch (strategy.type) {
        case 'TARGET_CPA':
          operations.push({
            update: {
              resource_name: `customers/${this.customerId}/campaigns/${id}`,
              target_cpa: {
                target_cpa_micros: strategy.targetCpa! * 1_000_000
              }
            },
            update_mask: { paths: ['target_cpa'] }
          });
          break;

        case 'TARGET_ROAS':
          operations.push({
            update: {
              resource_name: `customers/${this.customerId}/campaigns/${id}`,
              target_roas: {
                target_roas: strategy.targetRoas
              }
            },
            update_mask: { paths: ['target_roas'] }
          });
          break;

        case 'MAXIMIZE_CONVERSIONS':
          operations.push({
            update: {
              resource_name: `customers/${this.customerId}/campaigns/${id}`,
              maximize_conversions: {}
            },
            update_mask: { paths: ['maximize_conversions'] }
          });
          break;
      }

      await customer.campaigns.update(operations);
    }
  };

  reporting = {
    getCampaignMetrics: async (id: string, dateRange: DateRange): Promise<CampaignMetrics> => {
      const customer = this.client.Customer({
        customer_id: this.customerId,
        refresh_token: await this.getRefreshToken()
      });

      const query = `
        SELECT
          campaign.id,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.conversions_value,
          metrics.cost_micros,
          metrics.average_cpm,
          metrics.average_cpc,
          metrics.ctr,
          metrics.cost_per_conversion
        FROM campaign
        WHERE
          campaign.id = ${id}
          AND segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
      `;

      const results = await customer.query(query);
      return this.aggregateMetrics(results);
    },

    getConversions: async (dateRange: DateRange): Promise<Conversion[]> => {
      const customer = this.client.Customer({
        customer_id: this.customerId,
        refresh_token: await this.getRefreshToken()
      });

      const query = `
        SELECT
          conversion_action.id,
          conversion_action.name,
          segments.conversion_action_category,
          segments.date,
          metrics.conversions,
          metrics.conversions_value,
          metrics.all_conversions,
          metrics.view_through_conversions
        FROM conversion_action
        WHERE segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
      `;

      const results = await customer.query(query);
      return results.map(this.mapConversion);
    }
  };

  private mapGoogleCampaign(row: any): Campaign {
    return {
      id: row.campaign.id.toString(),
      platform: 'google',
      name: row.campaign.name,
      status: row.campaign.status,
      objective: this.mapChannelType(row.campaign.advertising_channel_type),
      budget: {
        type: 'DAILY',
        amount: row.campaign_budget.amount_micros / 1_000_000,
        currency: 'USD'
      },
      metrics: {
        impressions: row.metrics.impressions,
        clicks: row.metrics.clicks,
        conversions: row.metrics.conversions,
        spend: row.metrics.cost_micros / 1_000_000
      }
    };
  }
}
```

### Meta Marketing API Implementation

```typescript
// platforms/meta/adapter.ts
import { FacebookAdsApi, Campaign, AdSet, Ad } from 'facebook-nodejs-business-sdk';

export class MetaAdsAdapter implements PlatformAdapter {
  private api: FacebookAdsApi;
  private accountId: string;

  constructor(credentials: MetaCredentials) {
    this.api = FacebookAdsApi.init(credentials.accessToken);
    this.accountId = credentials.accountId;
  }

  campaigns = {
    list: async (filter?: CampaignFilter): Promise<Campaign[]> => {
      const account = new AdAccount(this.accountId);

      const fields = [
        'id', 'name', 'status', 'objective',
        'daily_budget', 'lifetime_budget',
        'bid_strategy', 'buying_type'
      ];

      const params: any = {
        filtering: [
          { field: 'effective_status', operator: 'NOT_IN', value: ['DELETED'] }
        ]
      };

      if (filter?.status) {
        params.filtering.push({
          field: 'effective_status',
          operator: 'IN',
          value: [filter.status]
        });
      }

      const campaigns = await account.getCampaigns(fields, params);
      return campaigns.map(this.mapMetaCampaign);
    },

    updateBudget: async (id: string, budget: Budget): Promise<void> => {
      const campaign = new Campaign(id);

      if (budget.type === 'DAILY') {
        await campaign.update({
          daily_budget: Math.round(budget.amount * 100) // Cents
        });
      } else {
        await campaign.update({
          lifetime_budget: Math.round(budget.amount * 100)
        });
      }
    },

    updateBidding: async (id: string, strategy: BiddingStrategy): Promise<void> => {
      const campaign = new Campaign(id);

      const bidStrategy = this.mapBidStrategy(strategy);
      await campaign.update({
        bid_strategy: bidStrategy.strategy,
        ...(bidStrategy.bidAmount && { bid_amount: bidStrategy.bidAmount })
      });
    }
  };

  creatives = {
    create: async (input: CreateCreativeInput): Promise<Creative> => {
      const account = new AdAccount(this.accountId);

      // Create ad creative
      const creativeParams = {
        name: input.name,
        object_story_spec: {
          page_id: input.pageId,
          link_data: {
            link: input.link,
            message: input.primaryText,
            name: input.headline,
            description: input.description,
            call_to_action: {
              type: this.mapCallToAction(input.callToAction),
              value: { link: input.link }
            },
            image_hash: input.imageHash
          }
        }
      };

      const creative = await account.createAdCreative([], creativeParams);
      return this.mapMetaCreative(creative);
    }
  };

  reporting = {
    getCampaignMetrics: async (id: string, dateRange: DateRange): Promise<CampaignMetrics> => {
      const campaign = new Campaign(id);

      const insights = await campaign.getInsights(
        ['impressions', 'clicks', 'spend', 'conversions', 'cpm', 'cpc', 'ctr'],
        {
          time_range: {
            since: dateRange.start,
            until: dateRange.end
          },
          time_increment: 1 // Daily
        }
      );

      return this.aggregateInsights(insights);
    }
  };

  private mapMetaCampaign(campaign: any): Campaign {
    return {
      id: campaign.id,
      platform: 'meta',
      name: campaign.name,
      status: campaign.effective_status,
      objective: campaign.objective,
      budget: {
        type: campaign.daily_budget ? 'DAILY' : 'LIFETIME',
        amount: (campaign.daily_budget || campaign.lifetime_budget) / 100,
        currency: 'USD'
      }
    };
  }
}
```

### TikTok Ads Implementation

```typescript
// platforms/tiktok/adapter.ts
import axios from 'axios';

export class TikTokAdsAdapter implements PlatformAdapter {
  private accessToken: string;
  private advertiserId: string;
  private baseUrl = 'https://business-api.tiktok.com/open_api/v1.3';

  constructor(credentials: TikTokCredentials) {
    this.accessToken = credentials.accessToken;
    this.advertiserId = credentials.advertiserId;
  }

  private async request(method: string, path: string, data?: any): Promise<any> {
    const response = await axios({
      method,
      url: `${this.baseUrl}${path}`,
      headers: {
        'Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      },
      data
    });

    if (response.data.code !== 0) {
      throw new Error(`TikTok API Error: ${response.data.message}`);
    }

    return response.data.data;
  }

  campaigns = {
    list: async (filter?: CampaignFilter): Promise<Campaign[]> => {
      const data = await this.request('GET', '/campaign/get/', {
        advertiser_id: this.advertiserId,
        filtering: filter ? { status: filter.status } : undefined,
        page_size: 100
      });

      return data.list.map(this.mapTikTokCampaign);
    },

    updateBudget: async (id: string, budget: Budget): Promise<void> => {
      await this.request('POST', '/campaign/update/', {
        advertiser_id: this.advertiserId,
        campaign_id: id,
        budget: budget.amount,
        budget_mode: budget.type === 'DAILY' ? 'BUDGET_MODE_DAY' : 'BUDGET_MODE_TOTAL'
      });
    }
  };

  reporting = {
    getCampaignMetrics: async (id: string, dateRange: DateRange): Promise<CampaignMetrics> => {
      const data = await this.request('GET', '/report/integrated/get/', {
        advertiser_id: this.advertiserId,
        report_type: 'BASIC',
        dimensions: ['campaign_id'],
        metrics: [
          'spend', 'impressions', 'clicks', 'conversion',
          'cpm', 'cpc', 'ctr', 'cost_per_conversion'
        ],
        filters: [{ field_name: 'campaign_id', filter_type: 'IN', filter_value: [id] }],
        start_date: dateRange.start,
        end_date: dateRange.end
      });

      return this.aggregateMetrics(data.list);
    }
  };

  private mapTikTokCampaign(campaign: any): Campaign {
    return {
      id: campaign.campaign_id,
      platform: 'tiktok',
      name: campaign.campaign_name,
      status: campaign.operation_status,
      objective: campaign.objective_type,
      budget: {
        type: campaign.budget_mode === 'BUDGET_MODE_DAY' ? 'DAILY' : 'LIFETIME',
        amount: campaign.budget,
        currency: 'USD'
      }
    };
  }
}
```

### Rate Limiting

| Platform | Rate Limit | Strategy |
|----------|------------|----------|
| Google Ads | 15,000 ops/day | Queue + batch |
| Meta | 200 calls/hour/user | Token bucket |
| TikTok | 600 calls/minute | Sliding window |
| LinkedIn | 100 calls/day/user | Priority queue |

```typescript
// platforms/rate-limiter.ts
import Bottleneck from 'bottleneck';

export const rateLimiters: Record<string, Bottleneck> = {
  google: new Bottleneck({
    maxConcurrent: 10,
    minTime: 100, // 10 requests per second
    reservoir: 15000,
    reservoirRefreshAmount: 15000,
    reservoirRefreshInterval: 24 * 60 * 60 * 1000 // Daily
  }),

  meta: new Bottleneck({
    maxConcurrent: 5,
    minTime: 200, // 5 requests per second
    reservoir: 200,
    reservoirRefreshAmount: 200,
    reservoirRefreshInterval: 60 * 60 * 1000 // Hourly
  }),

  tiktok: new Bottleneck({
    maxConcurrent: 10,
    minTime: 100, // 10 requests per second
    reservoir: 600,
    reservoirRefreshAmount: 600,
    reservoirRefreshInterval: 60 * 1000 // Per minute
  }),

  linkedin: new Bottleneck({
    maxConcurrent: 2,
    minTime: 1000, // 1 request per second
    reservoir: 100,
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 24 * 60 * 60 * 1000 // Daily
  })
};
```

## Consequences

### Positive
1. **Unified interface** - Single API for all platforms
2. **Abstraction** - Platform changes don't break core logic
3. **Testability** - Easy to mock platform adapters
4. **Rate limiting** - Built-in throttling prevents API bans

### Negative
1. **Complexity** - Maintaining 4+ adapters
2. **Feature parity** - Not all features available on all platforms
3. **API changes** - Platforms may change APIs

### Mitigations
1. Automated integration tests per platform
2. Feature flags for platform-specific capabilities
3. Weekly API documentation reviews

## Related Documents
- [ADR-API001: API Design](./001-api-design.md)
- [ADR-API002: Google Secrets](./002-google-secrets.md)
