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