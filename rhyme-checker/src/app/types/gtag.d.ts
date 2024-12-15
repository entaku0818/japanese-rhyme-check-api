interface GTagEvent {
  action: string;
  category: string;
  label: string;
  value?: number;
}

interface Window {
  gtag: (
    command: 'config' | 'event',
    targetId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config?: Record<string, any> | GTagEvent
  ) => void;
  dataLayer: unknown[];
}