export interface BinanceTrade {
  e: string;      // Event type
  E: number;      // Event time
  s: string;      // Symbol
  a: number;      // Aggregate trade ID
  p: string;      // Price
  q: string;      // Quantity
  f: number;      // First trade ID
  l: number;      // Last trade ID
  T: number;      // Trade time
  m: boolean;     // Is the buyer the market maker?
  M: boolean;     // Ignore
}

export interface ProcessedTrade {
  id: number;
  time: number;
  price: number;
  quantity: number;
  isBuyerMaker: boolean;
}

export interface BinanceKline {
  t: number;      // Open time
  T: number;      // Close time
  s: string;      // Symbol
  i: string;      // Interval
  f: number;      // First trade ID
  L: number;      // Last trade ID
  o: string;      // Open price
  c: string;      // Close price
  h: string;      // High price
  l: string;      // Low price
  v: string;      // Base asset volume
  n: number;      // Number of trades
  x: boolean;     // Is this kline closed?
  q: string;      // Quote asset volume
  V: string;      // Taker buy base asset volume
  Q: string;      // Taker buy quote asset volume
  B: string;      // Ignore
}

export interface ProcessedKline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Interval = '1m' | '15m' | '1h' | '4h' | '1d';
