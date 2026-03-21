/* eslint-disable @typescript-eslint/no-explicit-any */
export function capture(event: string, properties?: Record<string, unknown>) {
  try {
    (window as any).posthog?.capture(event, properties);
  } catch { /* noop — PostHog not loaded yet */ }
}
