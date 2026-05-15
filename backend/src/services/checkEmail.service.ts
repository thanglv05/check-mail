import axios from 'axios';
import { CheckEmailRequest, CheckEmailResponse } from '../types';
import { logger } from '../utils/logger';

const LIKEPION_API_URL = 'https://backend.likepion.com/api/v1/check-email/check-email-appPassword';

export class CheckEmailService {
  /**
   * Proxies the check-email request to Likepion API.
   * Likepion API expects an array, but our frontend will send a single account to allow realtime updates and control concurrency.
   */
  public async checkAccount(data: CheckEmailRequest): Promise<CheckEmailResponse> {
    const startTime = Date.now();
    try {
      logger.info(`Sending request to likepion for ${data.email}`);
      
      const response = await axios.post(LIKEPION_API_URL, [data], {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      // We expect the API to return an array of results or a specific object.
      // Usually Likepion returns an array of results corresponding to the array sent.
      const resultData = response.data;
      
      let mappedStatus: 'SUCCESS' | 'FAILED' | 'ERROR' = 'ERROR';
      let message = 'Unknown result format';

      if (resultData && resultData.results && Array.isArray(resultData.results)) {
        const firstResult = resultData.results[0];
        if (firstResult) {
          if (firstResult.success) {
             mappedStatus = 'SUCCESS';
             message = firstResult.result?.message || 'App password is valid';
          } else {
             mappedStatus = 'FAILED';
             message = firstResult.error || firstResult.message || firstResult.result?.message || 'Invalid or Failed';
          }
        }
      } else if (resultData && typeof resultData.success === 'boolean') {
        mappedStatus = resultData.success ? 'SUCCESS' : 'FAILED';
        message = resultData.message || 'Checked';
      }

      return {
        email: data.email,
        status: mappedStatus,
        message: message,
        responseTime
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      logger.error(`Error checking ${data.email}`, error.message);
      
      let message = 'Unknown error';
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') message = 'Connection timeout';
        else message = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      return {
        email: data.email,
        status: 'ERROR',
        message,
        responseTime
      };
    }
  }
}

export const checkEmailService = new CheckEmailService();
