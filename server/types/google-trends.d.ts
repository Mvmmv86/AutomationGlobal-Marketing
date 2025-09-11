declare module 'google-trends-api' {
  interface TrendsOptions {
    trendDate?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
  }

  interface InterestOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    category?: number;
    granularTimeResolution?: boolean;
    resolution?: string;
  }

  export function dailyTrends(options: TrendsOptions): Promise<string>;
  export function interestOverTime(options: InterestOptions): Promise<string>;
  export function interestByRegion(options: InterestOptions): Promise<string>;
  export function relatedQueries(options: InterestOptions): Promise<string>;
  export function relatedTopics(options: InterestOptions): Promise<string>;
}