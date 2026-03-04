import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrassionateTracker, TrackerConfig } from './tracker';

describe('PrassionateTracker', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock fetch globally
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    // Clear mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should create tracker with default config', () => {
      const t = new PrassionateTracker({ disabled: true });
      expect(t).toBeDefined();
    });

    it('should respect disabled flag', () => {
      const t = new PrassionateTracker({ disabled: true });
      expect(t).toBeDefined();
    });

    it('should respect doNotTrack', () => {
      const t = new PrassionateTracker();
      expect(t).toBeDefined();
    });

    it('should create unique session IDs', () => {
      const t1 = new PrassionateTracker({ disabled: true });
      const t2 = new PrassionateTracker({ disabled: true });
      
      // Access private property for testing
      const id1 = (t1 as unknown as { sessionId: string }).sessionId;
      const id2 = (t2 as unknown as { sessionId: string }).sessionId;
      
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(20); // Should be long enough
      expect(id2.length).toBeGreaterThan(20);
    });
  });

  describe('track methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({ ok: true });
    });

    it('should track page view', async () => {
      const t = new PrassionateTracker({ endpoint: 'https://example.com/api/track', disabled: false });
      
      // Clear mocks after initialization
      mockFetch.mockClear();
      
      t.trackPageView();
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://example.com/api/track');
      expect(options.method).toBe('POST');
      expect(options.keepalive).toBe(true);
      
      const body = JSON.parse(options.body);
      expect(body.event).toBe('pageview');
    });

    it('should track custom events', async () => {
      const t = new PrassionateTracker({ endpoint: 'https://example.com/api/track', disabled: false });
      
      mockFetch.mockClear();
      
      t.track('button_click', { button: 'submit' });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.event).toBe('button_click');
      expect(body.properties).toEqual({ button: 'submit' });
    });

    it('should track goals', async () => {
      const t = new PrassionateTracker({ endpoint: 'https://example.com/api/track', disabled: false });
      
      mockFetch.mockClear();
      
      t.trackGoal('signup', 100);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.event).toBe('goal');
      expect(body.goalId).toBe('signup');
      expect(body.value).toBe(100);
    });

    it('should track ecommerce', async () => {
      const t = new PrassionateTracker({ endpoint: 'https://example.com/api/track', disabled: false });
      
      mockFetch.mockClear();
      
      const products = [{ id: '1', name: 'Widget', price: 29.99 }];
      t.trackEcommerce('order-123', 99.99, products);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.event).toBe('ecommerce');
      expect(body.orderId).toBe('order-123');
      expect(body.revenue).toBe(99.99);
      expect(body.products).toEqual(products);
    });
  });

  describe('error handling', () => {
    it('should fail silently on network errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const t = new PrassionateTracker({ endpoint: 'https://example.com/api/track', disabled: false });
      mockFetch.mockClear();
      
      t.trackPageView();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Prassionate tracking failed:',
        expect.any(Error)
      );
    });

    it('should not send when disabled', async () => {
      const t = new PrassionateTracker({ endpoint: 'https://example.com/api/track', disabled: true });
      mockFetch.mockClear();
      
      t.trackPageView();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should disable tracking', async () => {
      const t = new PrassionateTracker({ endpoint: 'https://example.com/api/track', disabled: false });
      mockFetch.mockClear();
      
      t.destroy();
      t.trackPageView();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
