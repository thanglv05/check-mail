export type AccountStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ERROR';

export interface Account {
  id: string;
  email: string;
  app_password: string;
  status: AccountStatus;
  message?: string;
  responseTime?: number;
  retryCount: number;
}

export interface Stats {
  total: number;
  checked: number;
  success: number;
  failed: number;
  error: number;
  running: number;
  cpm: number; // checks per minute
}
