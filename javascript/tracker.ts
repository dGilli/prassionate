/**
 * Prassionate Tracker - Privacy-focused web analytics
 * @version 1.0.0
 * @license MIT
 */

export interface TrackerConfig {
  endpoint?: string;
  siteId?: string;
  disabled?: boolean;
}

export interface PageData {
  url: string;
  title: string;
  referrer: string;
  timestamp: number;
  sessionId: string;
  siteId: string;
  userAgent: string;
  screenResolution: string;
  language: string;
}

export interface TrackingPayload extends Partial<PageData> {
  event: string;
  trackerVersion: string;
  properties?: Record<string, unknown>;
  goalId?: string;
  value?: number | null;
  orderId?: string;
  revenue?: number;
  products?: unknown[];
}

export interface TrackerCommand {
  command: string;
  params: unknown[];
}

const TRACKER_VERSION = '1.0.0';
const DEFAULT_ENDPOINT = '/api/track';

declare global {
  interface Window {
    prassionate?: PrassionateAPI;
    _paq?: Array<[string, ...unknown[]]>;
    PrassionateTracker?: typeof PrassionateTracker;
    doNotTrack: string;
  }
  
  interface Navigator {
    doNotTrack: string;
  }
}

export interface PrassionateAPI {
  track: (event: string, props?: Record<string, unknown>) => void;
  trackGoal: (id: string, value?: number | null) => void;
  trackEcommerce: (orderId: string, revenue: number, products?: unknown[]) => void;
  push: (command: string, ...params: unknown[]) => void;
}

export class PrassionateTracker {
  private endpoint: string;
  private siteId: string;
  private disabled: boolean;
  private sessionId: string;

  constructor(config: TrackerConfig = {}) {
    this.endpoint = config.endpoint || DEFAULT_ENDPOINT;
    this.siteId = config.siteId || 'default';
    this.disabled = 
      (typeof window !== 'undefined' && window.navigator?.doNotTrack === '1') || 
      config.disabled === true;
    this.sessionId = this.generateSessionId();

    this.init();
  }

  private init(): void {
    if (this.disabled) {
      return;
    }

    this.trackPageView();
    this.attachEventListeners();
  }

  private generateSessionId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private getPageData(): PageData {
    return {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      siteId: this.siteId,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
    };
  }

  private async send(data: Partial<TrackingPayload>): Promise<void> {
    if (this.disabled) {
      console.log('[Prassionate] Tracking disabled, skipping event:', data.event);
      return;
    }

    const payload: TrackingPayload = {
      ...this.getPageData(),
      ...data,
      event: data.event || 'unknown',
      trackerVersion: TRACKER_VERSION,
    };

    console.log('[Prassionate] Sending event to:', this.endpoint, payload);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      console.log('[Prassionate] Event sent successfully:', response.status);
    } catch (error) {
      // Fail silently - tracking should not break user experience
      if (typeof console !== 'undefined' && console.error) {
        console.error('Prassionate tracking failed:', error);
      }
    }
  }

  public trackPageView(): void {
    this.send({
      event: 'pageview',
    });
  }

  private attachEventListeners(): void {
    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.send({
        event: 'pageend',
        duration: Date.now() - this.getPageData().timestamp,
      });
    });
  }

  public track(event: string, properties?: Record<string, unknown>): void {
    this.send({
      event,
      properties,
    });
  }

  public trackGoal(goalId: string, value?: number | null): void {
    this.send({
      event: 'goal',
      goalId,
      value,
    });
  }

  public trackEcommerce(orderId: string, revenue: number, products: unknown[] = []): void {
    this.send({
      event: 'ecommerce',
      orderId,
      revenue,
      products,
    });
  }

  public destroy(): void {
    this.disabled = true;
  }
}

// Queue-based API for async loading
const queue: Array<[string, ...unknown[]]> = window._paq || [];
let tracker: PrassionateTracker | null = null;

function processQueue(): void {
  queue.forEach((args) => {
    const [command, ...params] = args;
    executeCommand(command, params);
  });
}

function executeCommand(command: string, params: unknown[]): void {
  if (!tracker) {
    queue.push([command, ...params]);
    return;
  }

  switch (command) {
    case 'setTrackerUrl':
      tracker['endpoint'] = params[0] as string;
      break;
    case 'setSiteId':
      tracker['siteId'] = params[0] as string;
      break;
    case 'trackPageView':
      tracker.trackPageView();
      break;
    case 'trackEvent':
      tracker.track(params[0] as string, params[1] as Record<string, unknown>);
      break;
    case 'trackGoal':
      tracker.trackGoal(params[0] as string, params[1] as number | null);
      break;
    case 'disableTracking':
      tracker.destroy();
      break;
  }
}

// Initialize from data attributes or config
function init(): void {
  // Try to find the script - either the currently executing script or one with data attributes
  let script: HTMLScriptElement | null = null;
  
  if (document.currentScript) {
    script = document.currentScript as HTMLScriptElement;
  } else {
    // Look for script with data-prassionate or data-endpoint or containing 'tracker' in src
    script = document.querySelector('script[data-prassionate], script[data-endpoint], script[src*="tracker"]');
  }

  if (script) {
    const endpoint = script.getAttribute('data-endpoint');
    const siteId = script.getAttribute('data-site-id');
    const disabled = script.getAttribute('data-disabled') === 'true';
    
    // Debug logging in development
    if (typeof console !== 'undefined' && console.log) {
      console.log('[Prassionate] Initializing with config:', { endpoint, siteId, disabled });
    }
    
    const config: TrackerConfig = {
      endpoint: endpoint || undefined,
      siteId: siteId || undefined,
      disabled: disabled,
    };
    tracker = new PrassionateTracker(config);
  } else {
    if (typeof console !== 'undefined' && console.log) {
      console.log('[Prassionate] No config script found, using defaults');
    }
    tracker = new PrassionateTracker();
  }

  // Process any queued commands
  processQueue();

  // Expose global API
  window.prassionate = {
    track: (event, props) => tracker!.track(event, props),
    trackGoal: (id, value) => tracker!.trackGoal(id, value),
    trackEcommerce: (orderId, revenue, products) =>
      tracker!.trackEcommerce(orderId, revenue, products),
    push: executeCommand,
  };
}

// Initialize when DOM is ready
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('DOMContentLoaded', init);
}

// Expose constructor for manual initialization
window.PrassionateTracker = PrassionateTracker;
