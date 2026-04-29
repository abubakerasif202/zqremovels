interface Window {
  dataLayer?: any[];
  gtag?: (...args: any[]) => void;
  fbq?: (...args: any[]) => void;
  _fbq?: any;
  __analyticsConfig?: {
    gaMeasurementId?: string;
    gtmId?: string;
    metaPixelId?: string;
  };
}
