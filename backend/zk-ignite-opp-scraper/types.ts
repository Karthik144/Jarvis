// Merkl Related Types

interface Chain {
  id: number;
  name: string;
  icon: string;
}

interface Protocol {
  id: string;
  tags: string[];
  name: string;
  description: string;
  url: string;
  icon: string;
}

interface Record {
  id?: string;
  total: number;
  timestamp: string;
}

export interface Opportunity {
  chainId: number;
  type: string;
  identifier: string;
  name: string;
  depositUrl: string;
  status: string;
  action: string;
  tvl: number;
  apr: number;
  dailyRewards: number;
  tags: string[];
  id: string;
  tokens: any[];
  chain: Chain;
  protocol: Protocol;
  aprRecord: Record & {
    cumulated: number;
    breakdowns: any[];
  };
  tvlRecord: Record & {
    breakdowns: any[];
  };
  rewardsRecord: Record & {
    breakdowns: any[];
  };
}

export interface EnhancedOpportunity extends Opportunity {
  baseApr: number;
}

export interface ProtocolOpportunities {
  [key: string]: Opportunity[];
}
// APR Calculation Types
export interface PancakePoolData {
  feeTier: string;
  totalValueLockedUSD: string;
  feesUSD: string;
  poolDayData: {
    feesUSD: string;
  }[];
  id: string;
}

export interface PancakeSubgraphResponse {
  data: {
    pools: SyncSwapPoolData[];
  };
}

export interface KoiPoolData {
  totalValueLockedUSD: string;
  poolHourData: {
    feesUSD: string;
  }[];
  id: string;
}

export interface KoiSubgraphResponse {
  data: {
    pools: KoiPoolData[];
  };
}

export interface APRResult {
  [poolAddress: string]: number;
}
