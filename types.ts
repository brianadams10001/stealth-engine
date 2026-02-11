
export type NavItem = 'dashboard' | 'master-domain' | 'safe-site' | 'multi-master' | 'settings';

export interface DomainConfig {
  id: string;
  domainName: string;
  status: 'active' | 'inactive' | 'pending';
  syncStatus?: 'synced' | 'deploying' | 'error' | 'pending';
  lastSyncError?: string;
  moneyUrl: string;
  safeUrl: string;
  botThreshold: number;
  ghostReferrer: string;
  isGhostReferrerEnabled: boolean;
  isDeepStealth: boolean;
  isHoneyToken: boolean;
  isRadixProtection: boolean;
  isNoReferrer: boolean;
}

export interface AnalyticsRecord {
  totalHits: number;
  botsBlocked: number;
  safeProxies: number;
  moneyLandings: number;
  history: { date: string; hits: number; bots: number }[];
}

export interface CloudflareSettings {
  apiKey: string;
  email: string;
  accountId: string;
  apiGatewayUrl: string;
}
