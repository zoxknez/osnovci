/**
 * Async Queue Utilities
 * For managing concurrent operations and rate limiting client-side
 */

interface QueueItem<T> {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

/**
 * Async Queue with concurrency limit
 */
export class AsyncQueue {
  private queue: QueueItem<any>[] = [];
  private running = 0;
  private readonly concurrency: number;

  constructor(concurrency = 3) {
    this.concurrency = concurrency;
  }

  /**
   * Add task to queue
   */
  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  /**
   * Process queue
   */
  private async process(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const item = this.queue.shift();

    if (!item) {
      this.running--;
      return;
    }

    try {
      const result = await item.task();
      item.resolve(result);
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.running--;
      this.process(); // Process next item
    }
  }

  /**
   * Get queue status
   */
  getStatus(): { queueLength: number; running: number } {
    return {
      queueLength: this.queue.length,
      running: this.running,
    };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue.forEach((item) => {
      item.reject(new Error("Queue cleared"));
    });
    this.queue = [];
  }
}

/**
 * Global async queue for uploads
 */
export const uploadQueue = new AsyncQueue(2); // Max 2 concurrent uploads

/**
 * Global async queue for API calls
 */
export const apiQueue = new AsyncQueue(5); // Max 5 concurrent API calls
