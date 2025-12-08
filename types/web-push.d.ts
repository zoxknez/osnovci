// Type declarations for web-push module
// This ensures TypeScript recognizes the module even if @types/web-push isn't resolved

declare module "web-push" {
  export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  export class WebPushError extends Error {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    endpoint: string;
    constructor(
      message: string,
      statusCode: number,
      headers: Record<string, string>,
      body: string,
      endpoint: string
    );
  }

  export interface RequestOptions {
    headers?: Record<string, string>;
    timeout?: number;
    proxy?: string;
    agent?: unknown;
  }

  export interface VapidDetails {
    subject: string;
    publicKey: string;
    privateKey: string;
  }

  export interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  export function setGCMAPIKey(apiKey: string): void;

  export function generateVAPIDKeys(): {
    publicKey: string;
    privateKey: string;
  };

  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions
  ): Promise<SendResult>;

  export function generateRequestDetails(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions
  ): {
    method: string;
    headers: Record<string, string>;
    body: Buffer;
    endpoint: string;
  };

  const webpush: {
    setVapidDetails: typeof setVapidDetails;
    setGCMAPIKey: typeof setGCMAPIKey;
    generateVAPIDKeys: typeof generateVAPIDKeys;
    sendNotification: typeof sendNotification;
    generateRequestDetails: typeof generateRequestDetails;
  };

  export default webpush;
}
