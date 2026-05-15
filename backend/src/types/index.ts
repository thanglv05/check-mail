export interface CheckEmailRequest {
  email: string;
  app_password: string;
}

export interface CheckEmailResponse {
  email: string;
  status: 'SUCCESS' | 'FAILED' | 'ERROR';
  message: string;
  responseTime?: number;
}
