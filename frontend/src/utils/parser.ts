import type { Account } from '../types';

export const parseInput = (input: string): Omit<Account, 'id' | 'status' | 'retryCount'>[] => {
  const lines = input.split('\n');
  const accounts: Omit<Account, 'id' | 'status' | 'retryCount'>[] = [];
  const seenEmails = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split('|');
    if (parts.length >= 2) {
      const email = parts[0].trim();
      const appPassword = parts[1].trim().replace(/\s+/g, ' '); // normalize spaces

      if (email && appPassword && !seenEmails.has(email)) {
        seenEmails.add(email);
        accounts.push({
          email,
          app_password: appPassword
        });
      }
    }
  }

  return accounts;
};

export const exportData = (accounts: Account[], status: 'SUCCESS' | 'FAILED') => {
  const filtered = accounts.filter(a => a.status === status || (status === 'FAILED' && a.status === 'ERROR'));
  const content = filtered.map(a => `${a.email}|${a.app_password}`).join('\n');
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${status.toLowerCase()}_accounts_${new Date().getTime()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
