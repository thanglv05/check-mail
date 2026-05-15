import { useState, useRef, useCallback, useEffect } from 'react';
import type { Account, AccountStatus, Stats } from '../types';
import { checkEmail } from '../services/api';

export const useCheckManager = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [concurrency, setConcurrency] = useState(10);
  const stopRequested = useRef(false);
  const startTime = useRef<number | null>(null);

  const stats: Stats = {
    total: accounts.length,
    checked: accounts.filter(a => a.status === 'SUCCESS' || a.status === 'FAILED' || a.status === 'ERROR').length,
    success: accounts.filter(a => a.status === 'SUCCESS').length,
    failed: accounts.filter(a => a.status === 'FAILED').length,
    error: accounts.filter(a => a.status === 'ERROR').length,
    running: accounts.filter(a => a.status === 'RUNNING').length,
    cpm: 0
  };

  if (startTime.current && stats.checked > 0) {
    const minutes = (Date.now() - startTime.current) / 60000;
    stats.cpm = Math.round(stats.checked / (minutes > 0 ? minutes : 1));
  }

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
  }, []);

  const processAccount = async (account: Account) => {
    if (stopRequested.current) return;

    updateAccount(account.id, { status: 'RUNNING' });

    let attempt = account.retryCount;
    const maxRetries = 2;

    while (attempt <= maxRetries && !stopRequested.current) {
      try {
        const result = await checkEmail(account.email, account.app_password);
        
        // If backend gracefully handled a timeout/network error to Likepion, we still want to trigger retry
        if (result.status === 'ERROR' && (result.message.toLowerCase().includes('timeout') || result.message.toLowerCase().includes('network'))) {
           throw new Error('NETWORK_ERROR');
        }

        updateAccount(account.id, {
          status: result.status,
          message: result.message,
          responseTime: result.responseTime,
          retryCount: attempt
        });
        return; // Success or non-retriable error
      } catch (error: any) {
        if (error.message === 'NETWORK_ERROR' && attempt < maxRetries) {
          attempt++;
          updateAccount(account.id, { retryCount: attempt, message: `Retrying (${attempt}/${maxRetries})...` });
          await new Promise(res => setTimeout(res, 1000)); // short delay
        } else {
          updateAccount(account.id, {
            status: 'ERROR',
            message: 'Network error or timeout',
            retryCount: attempt
          });
          return;
        }
      }
    }
  };

  const startChecking = async () => {
    if (isChecking || accounts.length === 0) return;
    setIsChecking(true);
    stopRequested.current = false;
    startTime.current = Date.now();

    const pendingAccounts = accounts.filter(a => a.status === 'PENDING');
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < pendingAccounts.length && !stopRequested.current) {
        const account = pendingAccounts[currentIndex++];
        if (account) {
          await processAccount(account);
        }
      }
    };

    const workers = [];
    for (let i = 0; i < concurrency; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
    setIsChecking(false);
  };

  const stopChecking = () => {
    stopRequested.current = true;
    setIsChecking(false);
  };

  const [autoStart, setAutoStart] = useState(false);

  useEffect(() => {
    if (autoStart && accounts.length > 0 && accounts.some(a => a.status === 'PENDING')) {
      setAutoStart(false);
      startChecking();
    }
  }, [accounts, autoStart]);

  const loadAccounts = (newAccounts: Omit<Account, 'id' | 'status' | 'retryCount'>[], startImmediately = false, append = false) => {
    const formatted = newAccounts.map(a => ({
      ...a,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
      status: 'PENDING' as AccountStatus,
      retryCount: 0
    }));
    if (append) {
      setAccounts(prev => {
        // filter out duplicates
        const existingEmails = new Set(prev.map(p => p.email));
        const uniqueNew = formatted.filter(f => !existingEmails.has(f.email));
        return [...prev, ...uniqueNew];
      });
    } else {
      setAccounts(formatted);
      startTime.current = null;
    }
    if (startImmediately) {
      setAutoStart(true);
    }
  };

  const clearAccounts = () => {
    setAccounts([]);
    startTime.current = null;
    stopRequested.current = true;
    setIsChecking(false);
  };

  return {
    accounts,
    stats,
    isChecking,
    concurrency,
    setConcurrency,
    startChecking,
    stopChecking,
    loadAccounts,
    clearAccounts
  };
};
