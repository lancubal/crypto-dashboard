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

  // Reset state when symbol or interval changes
  useEffect(() => {
    setKlines([]);
    setTrades([]);
    tradesBuffer.current = [];
    lastProcessedTradeId.current = 0;
    setIsConnected(false);
  }, [symbol, interval]);

  // 1. Fetch Historical Data
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`
        );
        const data = await response.json();
        
        // Check if data is array (valid response)
        if (Array.isArray(data)) {
            const formattedKlines: ProcessedKline[] = data.map((k: any) => ({
              time: k[0],
              open: parseFloat(k[1]),
              high: parseFloat(k[2]),
              low: parseFloat(k[3]),
              close: parseFloat(k[4]),
              volume: parseFloat(k[5]),
            }));
            setKlines(formattedKlines);
        } else {
            console.error("Binance API returned unexpected data:", data);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    // Only fetch if symbol is valid
    if (symbol) fetchHistory();
  }, [symbol, interval]);

  // 2. Real-time Updates
  useEffect(() => {
    if (!symbol) return;

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
    }, 250); 

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      // Safety check: ensure message belongs to current stream/symbol if possible,
      // though WebSocket connection is exclusive per effect.
      
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
            if (prev.length === 0) return [newKline];
            
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
        
        const lastInBuffer = tradesBuffer.current[0];
        
        if (lastInBuffer && 
            lastInBuffer.price === newTrade.price && 
            lastInBuffer.isBuyerMaker === newTrade.isBuyerMaker) {
            
            lastInBuffer.quantity += newTrade.quantity;
            lastInBuffer.time = newTrade.time;
            lastInBuffer.id = newTrade.id;
        } else {
            tradesBuffer.current.unshift(newTrade);
        }
        
        flushTrades();
      }
    };

    return () => {
      socket.close();
      flushTrades.cancel();
      // Don't clear state here, let the next effect run handle it via the separate reset effect
      // to avoid flashing empty state if not needed, but in this case we want clean slate.
    };
  }, [symbol, interval]);

  return { klines, trades, isConnected, isLoadingHistory };
};