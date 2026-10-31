import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { env } from '../config/env.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const ANALYTICS_EVENTS = ['contact_form_submit', 'cv_download'];

export interface AnalyticsOverview {
  status: 'connected' | 'not_configured' | 'unavailable';
  range: string;
  generatedAt: string;
  totals: { pageViews: number; activeUsers: number; sessions: number };
  daily: Array<{ date: string; pageViews: number; activeUsers: number; sessions: number }>;
  topPages: Array<{ page: string; pageViews: number; activeUsers: number }>;
  sources: Array<{ channel: string; sessions: number; activeUsers: number }>;
  events: Array<{ name: string; count: number }>;
}

function emptyOverview(status: AnalyticsOverview['status']): AnalyticsOverview {
  return {
    status,
    range: 'last 30 days',
    generatedAt: new Date().toISOString(),
    totals: { pageViews: 0, activeUsers: 0, sessions: 0 },
    daily: [],
    topPages: [],
    sources: [],
    events: [],
  };
}

function metric(row: { metricValues?: Array<{ value?: string | null } | null> | null }, index: number): number {
  const value = Number(row.metricValues?.[index]?.value ?? 0);
  return Number.isFinite(value) ? value : 0;
}

class AnalyticsService {
  private client = env.GA4_PROPERTY_ID && env.GA4_CLIENT_EMAIL && env.GA4_PRIVATE_KEY
    ? new BetaAnalyticsDataClient({
        credentials: {
          client_email: env.GA4_CLIENT_EMAIL,
          private_key: env.GA4_PRIVATE_KEY,
        },
      })
    : null;

  private cached: { expiresAt: number; value: AnalyticsOverview } | null = null;
  private inFlight: Promise<AnalyticsOverview> | null = null;

  async getOverview(log: { warn: (obj: object, message: string) => void }): Promise<AnalyticsOverview> {
    if (!this.client || !env.GA4_PROPERTY_ID) return emptyOverview('not_configured');
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.value;

    if (this.inFlight) return this.inFlight;

    this.inFlight = this.loadOverview(log);
    try {
      return await this.inFlight;
    } finally {
      this.inFlight = null;
    }
  }

  private async loadOverview(log: { warn: (obj: object, message: string) => void }): Promise<AnalyticsOverview> {
    const client = this.client;
    if (!client || !env.GA4_PROPERTY_ID) return emptyOverview('not_configured');

    const property = `properties/${env.GA4_PROPERTY_ID}`;
    const dateRanges = [{ startDate: '29daysAgo', endDate: 'today' }];

    try {
      const [totalsReport, dailyReport, pagesReport, sourcesReport, eventsReport] = await Promise.all([
        client.runReport({
          property,
          dateRanges,
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'sessions' }],
        }),
        client.runReport({
          property,
          dateRanges,
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'sessions' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        }),
        client.runReport({
          property,
          dateRanges,
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 8,
        }),
        client.runReport({
          property,
          dateRanges,
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 8,
        }),
        client.runReport({
          property,
          dateRanges,
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: { values: ANALYTICS_EVENTS, caseSensitive: true },
            },
          },
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        }),
      ]);

      const totalRow = totalsReport[0].rows?.[0];
      const daily = (dailyReport[0].rows ?? []).map((row) => {
        const rawDate = row.dimensionValues?.[0]?.value ?? '';
        const date = rawDate.length === 8
          ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
          : rawDate;
        return {
          date,
          pageViews: metric(row, 0),
          activeUsers: metric(row, 1),
          sessions: metric(row, 2),
        };
      });

      const value: AnalyticsOverview = {
        status: 'connected',
        range: 'last 30 days',
        generatedAt: new Date().toISOString(),
        totals: {
          pageViews: metric(totalRow ?? {}, 0),
          activeUsers: metric(totalRow ?? {}, 1),
          sessions: metric(totalRow ?? {}, 2),
        },
        daily,
        topPages: (pagesReport[0].rows ?? []).map((row) => ({
          page: row.dimensionValues?.[0]?.value || '(unknown)',
          pageViews: metric(row, 0),
          activeUsers: metric(row, 1),
        })),
        sources: (sourcesReport[0].rows ?? []).map((row) => ({
          channel: row.dimensionValues?.[0]?.value || '(unknown)',
          sessions: metric(row, 0),
          activeUsers: metric(row, 1),
        })),
        events: (eventsReport[0].rows ?? []).map((row) => ({
          name: row.dimensionValues?.[0]?.value || '(unknown)',
          count: metric(row, 0),
        })),
      };

      this.cached = { expiresAt: Date.now() + CACHE_TTL_MS, value };
      return value;
    } catch (error) {
      log.warn({ err: error }, 'Google Analytics report request failed');
      return emptyOverview('unavailable');
    }
  }
}

export const analyticsService = new AnalyticsService();
