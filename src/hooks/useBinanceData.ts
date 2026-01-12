import { useState, useEffect, useRef } from 'react';
import type { ProcessedTrade, BinanceKline, ProcessedKline, Interval } from '../types/binance';
import { throttle } from 'lodash';

export const useBinanceData = (symbol: string = 'btcusdt', interval: Interval = '1m') => {
  const [klines, setKlines] = useState<ProcessedKline[]>([]);
  const [trades, setTrades] = useState<ProcessedTrade[]>([]); 
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Buffer for trades to avoid setState spam
  const tradesBuffer = useRef<ProcessedTrade[]>([]);
  const lastProcessedTradeId = useRef<number>(0);

  // 1. Fetch Historical Data
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`
        );
        const data = await response.json();
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

  // 2. Real-time Updates
  useEffect(() => {
    const streams = [
      `${symbol.toLowerCase()}@kline_${interval}`,
      `${symbol.toLowerCase()}@aggTrade`
    ].join('/');
    
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);
    
    // Throttled function to flush trades buffer to React state
    const flushTrades = throttle(() => {
      if (tradesBuffer.current.length > 0) {
        setTrades(prev => {
          // Combine buffer with previous state
          const newTrades = [...tradesBuffer.current];
          tradesBuffer.current = []; // Clear buffer
          return [...newTrades, ...prev].slice(0, 50);
        });
      }
    }, 250); // Slightly slower updates (250ms) for better reading

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const stream = message.stream;
      const data = message.data;

      // Handle Kline
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
          if (last && last.time === newKline.time) {
            return [...prev.slice(0, -1), newKline];
          }
          return [...prev.slice(1), newKline];
        });
      }

      // Handle Trade with AGGRESSIVE Aggregation
      if (stream.includes('aggTrade')) {
        if (data.a <= lastProcessedTradeId.current) return;
        lastProcessedTradeId.current = data.a;

        const newTrade: ProcessedTrade = {
          id: data.a,
          time: data.T,
          price: parseFloat(data.p),
          quantity: parseFloat(data.q),
          isBuyerMaker: data.m,
        };
        
        // Check LAST trade in buffer OR first trade in current state (if buffer empty)
        // to see if we can merge.
        const lastInBuffer = tradesBuffer.current[0];
        
        // Logic: if same price and same side (buy/sell), merge quantity
        if (lastInBuffer && 
            lastInBuffer.price === newTrade.price && 
            lastInBuffer.isBuyerMaker === newTrade.isBuyerMaker) {
            
            // Mutate the last trade in buffer (add quantity) instead of pushing new one
            lastInBuffer.quantity += newTrade.quantity;
            lastInBuffer.time = newTrade.time; // Update time to latest
            lastInBuffer.id = newTrade.id; // Update ID
        } else {
            // New distinct trade
            tradesBuffer.current.unshift(newTrade);
        }
        
        flushTrades();
      }
    };

    return () => {
      socket.close();
      flushTrades.cancel();
    };
  }, [symbol, interval]);

  return { klines, trades, isConnected, isLoadingHistory };
};
