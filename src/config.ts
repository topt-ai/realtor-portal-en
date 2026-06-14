/**
 * Per-client configuration. Edit this file when forking the template
 * for a new agent.
 */
export const AGENT_CONFIG = {
  name: 'Marcus Reid',
  tagline: 'Finding the home you deserve',
  bio: '',
  whatsapp: '50372018215',
  website: 'https://marcusreid.tuwebsv.com',
  portal: 'https://portal.tuwebsv.com',
  primaryColor: '#C9A84C',
  logo: '/logo.svg',
};

/**
 * Platform-level branding (the company operating the portal, not the
 * individual agent). Keep this stable across client deployments unless
 * you're white-labeling the platform too.
 */
export const BRAND_CONFIG = {
  name: 'TuWebSV',
  supportUrl: 'https://tuwebsv.com',
  /** Prefix for localStorage keys, so two deployments on the same
   *  origin don't clobber each other's drafts/sessions. */
  storagePrefix: 'tuwebsv',
};

export const STORAGE_KEYS = {
  auth: `${BRAND_CONFIG.storagePrefix}-auth`,
  propertyDraft: `${BRAND_CONFIG.storagePrefix}-property-draft`,
};
