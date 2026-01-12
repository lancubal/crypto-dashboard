import { useState, useEffect, useRef } from 'react';
import type { ProcessedTrade, BinanceKline, ProcessedKline, Interval } from '../types/binance';

export const useBinanceData = (symbol: string = 'btcusdt', interval: Interval = '1m') => {
  const [klines, setKlines] = useState<ProcessedKline[]>([]);
  const [trades, setTrades] = useState<ProcessedTrade[]>([]); // Keep trades for the list
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 1. Fetch Historical Data (REST API)
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`
        );
        const data = await response.json();
        
        // Binance REST API returns array of arrays
        // [Open Time, Open, High, Low, Close, Volume, Close Time, ...]
        const formattedKlines: ProcessedKline[] = data.map((k: any) => ({
          time: k[0],
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
        }));

        setKlines(formattedKlines);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [symbol, interval]);

  // 2. Real-time Updates (WebSocket)
  useEffect(() => {
    // We need two streams: one for live chart updates (kline) and one for the trade list (aggTrade)
    // Combined stream URL
    const streams = [
      `${symbol.toLowerCase()}@kline_${interval}`,
      `${symbol.toLowerCase()}@aggTrade`
    ].join('/');
    
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const stream = message.stream;
      const data = message.data;

      // Handle Kline Update (Chart)
      if (stream.includes('kline')) {
        const klineData: BinanceKline = data.k;
        const newKline: ProcessedKline = {
          time: klineData.t,
          open: parseFloat(klineData.o),
          high: parseFloat(klineData.h),
          low: parseFloat(klineData.l),
          close: parseFloat(klineData.c),
          volume: parseFloat(klineData.v),
        };

        setKlines(prev => {
          const last = prev[prev.length - 1];
          // If update is for the same time bucket, replace the last candle
          if (last && last.time === newKline.time) {
            return [...prev.slice(0, -1), newKline];
          }
          // If it's a new time bucket, append it and remove oldest
          return [...prev.slice(1), newKline];
        });
      }

      // Handle Trade Update (List & Header Price)
      if (stream.includes('aggTrade')) {
        const newTrade: ProcessedTrade = {
          id: data.a,
          time: data.T,
          price: parseFloat(data.p),
          quantity: parseFloat(data.q),
          isBuyerMaker: data.m,
        };
        
        setTrades(prev => [newTrade, ...prev].slice(0, 50)); // Keep last 50 trades for UI list
      }
    };

    return () => {
      socket.close();
    };
  }, [symbol, interval]);

  return { klines, trades, isConnected, isLoadingHistory };
};
