import axios from 'axios';
import type { AccountStatus } from '../types';

const API_URL = import.meta.env.PROD 
  ? '/api/v1/check-email/check' 
  : 'http://localhost:3001/api/v1/check-email/check';

export interface CheckResponse {
  email: string;
  status: AccountStatus;
  message: string;
  responseTime?: number;
}

export const checkEmail = async (email: string, app_password: string): Promise<CheckResponse> => {
  try {
    const response = await axios.post(API_URL, { email, app_password });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message.includes('Network Error') || error.message.includes('timeout')) {
        throw new Error('NETWORK_ERROR');
      }
    }
    return {
      email,
      status: 'ERROR',
      message: error.response?.data?.message || error.message || 'Unknown error'
    };
  }
};
