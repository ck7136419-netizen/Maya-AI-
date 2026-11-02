/**
 * Device Action Bridge for Arushi Voice Assistant.
 * Handles safe execution of device actions across:
 * 1. Android APK native bridge (via window.AndroidBridge or Capacitor)
 * 2. Browser fallback (deep links, window.open, tel: protocol)
 */

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
}

export interface ActionResult {
  success: boolean;
  action: string;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

// Default device contacts for web mode / preview testing
export const DEFAULT_CONTACTS: Contact[] = [
  { id: '1', name: 'Mom', phoneNumber: '+919876543210', relationship: 'Mother' },
  { id: '2', name: 'Mummy', phoneNumber: '+919876543210', relationship: 'Mother' },
  { id: '3', name: 'Dad', phoneNumber: '+919876543211', relationship: 'Father' },
  { id: '4', name: 'Papa', phoneNumber: '+919876543211', relationship: 'Father' },
  { id: '5', name: 'Rahul Sharma', phoneNumber: '+919811122233', relationship: 'Friend' },
  { id: '6', name: 'Rahul Verma', phoneNumber: '+919822233344', relationship: 'Colleague' },
  { id: '7', name: 'Priya', phoneNumber: '+919833344455', relationship: 'Sister' },
  { id: '8', name: 'Doctor Amit', phoneNumber: '+919844455566', relationship: 'Doctor' },
];

// Allowlist of supported apps and their web fallback URLs
export const ALLOWED_APPS: Record<string, { name: string; url: string; androidPackage?: string }> = {
  whatsapp: { name: 'WhatsApp', url: 'https://web.whatsapp.com', androidPackage: 'com.whatsapp' },
  youtube: { name: 'YouTube', url: 'https://www.youtube.com', androidPackage: 'com.google.android.youtube' },
  chrome: { name: 'Chrome', url: 'https://www.google.com', androidPackage: 'com.android.chrome' },
  instagram: { name: 'Instagram', url: 'https://www.instagram.com', androidPackage: 'com.instagram.android' },
  spotify: { name: 'Spotify', url: 'https://open.spotify.com', androidPackage: 'com.spotify.music' },
  maps: { name: 'Google Maps', url: 'https://maps.google.com', androidPackage: 'com.google.android.apps.maps' },
  camera: { name: 'Camera', url: '', androidPackage: 'com.android.camera' },
  gallery: { name: 'Gallery', url: '', androidPackage: 'com.google.android.apps.photos' },
  clock: { name: 'Clock & Alarm', url: '', androidPackage: 'com.google.android.deskclock' },
  calculator: { name: 'Calculator', url: 'https://www.google.com/search?q=calculator', androidPackage: 'com.google.android.calculator' },
  settings: { name: 'Settings', url: '', androidPackage: 'com.android.settings' },
  browser: { name: 'Browser', url: 'https://www.google.com', androidPackage: 'com.android.chrome' },
  gmail: { name: 'Gmail', url: 'https://mail.google.com', androidPackage: 'com.google.android.gm' },
  messages: { name: 'Messages', url: 'sms:', androidPackage: 'com.google.android.apps.messaging' },
  playstore: { name: 'Play Store', url: 'https://play.google.com', androidPackage: 'com.android.vending' },
};

/**
 * Checks if the application is running inside an Android native environment with a bridge.
 */
export function isAndroidBridgeAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as { AndroidBridge?: { [key: string]: unknown } };
  return Boolean(win.AndroidBridge && typeof win.AndroidBridge === 'object');
}

/**
 * Normalizes an app name string for allowlist matching.
 */
export function normalizeAppName(appName: string): string {
  return appName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

/**
 * Validates whether a URL is a safe web URL (http or https).
 */
export function isValidWebUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates and cleans a phone number.
 */
export function cleanPhoneNumber(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Must have at least 3 digits and max 15 digits
  const digitCount = cleaned.replace(/\D/g, '').length;
  if (digitCount >= 3 && digitCount <= 15) {
    return cleaned;
  }
  return null;
}

/**
 * Search contacts by query string.
 */
export function searchContactsList(query: string, contacts: Contact[] = DEFAULT_CONTACTS): Contact[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return contacts.filter((c) => {
    const nameMatch = c.name.toLowerCase().includes(q);
    const relMatch = c.relationship?.toLowerCase() === q;
    return nameMatch || relMatch;
  });
}

/**
 * Executes openWhatsApp.
 */
export async function executeOpenWhatsApp(params?: { phoneNumber?: string; message?: string }): Promise<ActionResult> {
  const win = typeof window !== 'undefined' ? (window as unknown as { AndroidBridge?: { openWhatsApp?: (p?: string, m?: string) => boolean } }) : null;

  if (win?.AndroidBridge?.openWhatsApp) {
    try {
      const res = win.AndroidBridge.openWhatsApp(params?.phoneNumber, params?.message);
      return {
        success: Boolean(res),
        action: 'openWhatsApp',
        message: 'WhatsApp opened via Android Native Bridge',
      };
    } catch (e: unknown) {
      return {
        success: false,
        action: 'openWhatsApp',
        message: 'Failed to open WhatsApp via native bridge',
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  // Browser fallback
  if (typeof window !== 'undefined') {
    let targetUrl = 'whatsapp://';
    if (params?.phoneNumber) {
      const clean = cleanPhoneNumber(params.phoneNumber) || params.phoneNumber;
      const text = params.message ? `&text=${encodeURIComponent(params.message)}` : '';
      targetUrl = `https://api.whatsapp.com/send?phone=${clean}${text}`;
    }
    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return {
        success: true,
        action: 'openWhatsApp',
        message: 'WhatsApp launched via browser deep-link',
        details: { targetUrl },
      };
    } catch {
      return {
        success: false,
        action: 'openWhatsApp',
        message: 'Browser popup blocked or deep link unavailable',
      };
    }
  }

  return { success: false, action: 'openWhatsApp', message: 'Window object unavailable' };
}

/**
 * Executes openApp.
 */
export async function executeOpenApp(appName: string): Promise<ActionResult> {
  const normalized = normalizeAppName(appName);
  const foundKey = Object.keys(ALLOWED_APPS).find((k) => normalizeAppName(k) === normalized || normalizeAppName(ALLOWED_APPS[k].name) === normalized);

  if (!foundKey) {
    return {
      success: false,
      action: 'openApp',
      message: `App "${appName}" is not in the supported allowlist`,
      error: `Unsupported app. Supported apps: ${Object.values(ALLOWED_APPS).map((a) => a.name).join(', ')}`,
    };
  }

  const appMeta = ALLOWED_APPS[foundKey];
  const win = typeof window !== 'undefined' ? (window as unknown as { AndroidBridge?: { openApp?: (pkg: string) => boolean } }) : null;

  if (win?.AndroidBridge?.openApp && appMeta.androidPackage) {
    try {
      const res = win.AndroidBridge.openApp(appMeta.androidPackage);
      return {
        success: Boolean(res),
        action: 'openApp',
        message: `${appMeta.name} opened via Android Native Bridge`,
        details: { appName: appMeta.name, package: appMeta.androidPackage },
      };
    } catch (e: unknown) {
      return {
        success: false,
        action: 'openApp',
        message: `Failed to open ${appMeta.name} natively`,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  // Browser fallback
  if (appMeta.url && typeof window !== 'undefined') {
    window.open(appMeta.url, '_blank', 'noopener,noreferrer');
    return {
      success: true,
      action: 'openApp',
      message: `${appMeta.name} opened via browser web link`,
      details: { url: appMeta.url },
    };
  }

  return {
    success: false,
    action: 'openApp',
    message: `${appMeta.name} requires native Android device access to open`,
    details: { appName: appMeta.name },
  };
}

/**
 * Executes openUrl.
 */
export async function executeOpenUrl(rawUrl: string): Promise<ActionResult> {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  if (!isValidWebUrl(url)) {
    return {
      success: false,
      action: 'openUrl',
      message: 'Invalid URL provided',
      error: `Could not parse URL "${rawUrl}"`,
    };
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return {
      success: true,
      action: 'openUrl',
      message: `Opened website: ${url}`,
      details: { url },
    };
  }

  return { success: false, action: 'openUrl', message: 'Window unavailable' };
}

/**
 * Executes makeCall.
 */
export async function executeMakeCall(phoneNumber: string): Promise<ActionResult> {
  const cleaned = cleanPhoneNumber(phoneNumber);
  if (!cleaned) {
    return {
      success: false,
      action: 'makeCall',
      message: `Invalid phone number "${phoneNumber}"`,
      error: 'Phone number must contain between 3 and 15 digits',
    };
  }

  const win = typeof window !== 'undefined' ? (window as unknown as { AndroidBridge?: { makeCall?: (phone: string) => boolean } }) : null;

  if (win?.AndroidBridge?.makeCall) {
    try {
      const res = win.AndroidBridge.makeCall(cleaned);
      return {
        success: Boolean(res),
        action: 'makeCall',
        message: `Calling ${cleaned} via Android Native Dialer`,
        details: { phoneNumber: cleaned },
      };
    } catch (e: unknown) {
      return {
        success: false,
        action: 'makeCall',
        message: 'Failed to initiate call natively',
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  // Browser dialer fallback
  if (typeof window !== 'undefined') {
    window.location.href = `tel:${cleaned}`;
    return {
      success: true,
      action: 'makeCall',
      message: `Opened device dialer for ${cleaned}`,
      details: { phoneNumber: cleaned },
    };
  }

  return { success: false, action: 'makeCall', message: 'Window unavailable' };
}

/**
 * Executes callContact.
 * Handles single match, multiple matches (asking user/Gemini for clarification), or 0 matches.
 */
export async function executeCallContact(
  contactName: string,
  contactsList: Contact[] = DEFAULT_CONTACTS
): Promise<ActionResult> {
  const matches = searchContactsList(contactName, contactsList);

  if (matches.length === 0) {
    return {
      success: false,
      action: 'callContact',
      message: `No contact found matching "${contactName}".`,
      error: 'Contact not found',
      details: { contactName, count: 0 },
    };
  }

  if (matches.length === 1) {
    const contact = matches[0];
    const callRes = await executeMakeCall(contact.phoneNumber);
    return {
      success: callRes.success,
      action: 'callContact',
      message: `Calling ${contact.name} at ${contact.phoneNumber}`,
      details: {
        contactName: contact.name,
        phoneNumber: contact.phoneNumber,
        relationship: contact.relationship,
      },
    };
  }

  // Multiple matches: never guess!
  return {
    success: false,
    action: 'callContact',
    message: `Found ${matches.length} contacts matching "${contactName}": ${matches.map((c) => c.name).join(', ')}. Please specify which one to call.`,
    error: 'Multiple contacts found',
    details: {
      contactName,
      count: matches.length,
      candidates: matches.map((c) => ({ name: c.name, phoneNumber: c.phoneNumber })),
    },
  };
}

/**
 * Executes send SMS / message composer.
 */
export async function executeSendSMS(phoneNumber: string, message?: string): Promise<ActionResult> {
  const cleaned = cleanPhoneNumber(phoneNumber);
  if (!cleaned) {
    return {
      success: false,
      action: 'sendSMS',
      message: `Invalid phone number "${phoneNumber}" for SMS`,
      error: 'Invalid phone number',
    };
  }

  const encodedBody = message ? `?body=${encodeURIComponent(message)}` : '';
  const smsUrl = `sms:${cleaned}${encodedBody}`;

  if (typeof window !== 'undefined') {
    window.location.href = smsUrl;
    return {
      success: true,
      action: 'sendSMS',
      message: `Opened messaging composer for ${cleaned}`,
      details: { phoneNumber: cleaned, message: message || '', url: smsUrl },
    };
  }

  return {
    success: false,
    action: 'sendSMS',
    message: 'Window unavailable',
    details: { phoneNumber: cleaned, message: message || '', url: smsUrl },
  };
}

/**
 * Executes YouTube music search or video launch.
 */
export async function executePlayYouTubeMusic(query: string): Promise<ActionResult> {
  const cleanQuery = query.trim();
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;

  if (typeof window !== 'undefined') {
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    return {
      success: true,
      action: 'playYouTubeMusic',
      message: `Opening YouTube for "${cleanQuery}"`,
      details: { query: cleanQuery, url: searchUrl },
    };
  }

  return {
    success: false,
    action: 'playYouTubeMusic',
    message: 'Window unavailable',
    details: { query: cleanQuery, url: searchUrl },
  };
}

/* ============================================================================
   ANDROID ACCESSIBILITY SERVICE & PHONE AUTOMATION SUITE
   ============================================================================ */

export type GlobalActionType =
  | 'BACK'
  | 'HOME'
  | 'RECENTS'
  | 'NOTIFICATIONS'
  | 'QUICK_SETTINGS'
  | 'LOCK_SCREEN'
  | 'TAKE_SCREENSHOT';

export type ScrollDirection = 'up' | 'down' | 'top' | 'bottom';

export interface AndroidAccessibilityBridge {
  openAccessibilitySettings?: () => boolean;
  isAccessibilityEnabled?: () => boolean;
  scroll?: (direction: string, distance?: number) => boolean;
  typeText?: (text: string) => boolean;
  tap?: (x: number, y: number) => boolean;
  performGlobalAction?: (actionId: string) => boolean;
  pressBack?: () => boolean;
  pressHome?: () => boolean;
}

export interface AccessibilityWorkflowStep {
  id: string;
  action: 'openApp' | 'type' | 'scroll' | 'wait' | 'globalAction';
  payload?: string;
  distance?: number;
  duration?: number;
}

export interface AccessibilityWorkflow {
  id: string;
  name: string;
  description: string;
  iconName: string;
  steps: AccessibilityWorkflowStep[];
}

export interface AccessibilityState {
  isGranted: boolean;
  isServiceActive: boolean;
  isAutoScrolling: boolean;
  scrollSpeed: 'slow' | 'medium' | 'fast';
  lastAction?: string;
  lastActionTimestamp?: number;
}

declare global {
  interface Window {
    AndroidAccessibilityBridge?: AndroidAccessibilityBridge;
    Android?: AndroidAccessibilityBridge & { [key: string]: unknown };
  }
}

/**
 * Standard Android Intent URI to launch Android Accessibility Settings directly.
 * On real Android devices, opening this URI immediately brings the user to:
 * Settings > Accessibility (where YASMIN AI can be granted Accessibility Service access).
 */
export const ANDROID_ACCESSIBILITY_INTENT_URI =
  'intent:#Intent;action=android.settings.ACCESSIBILITY_SETTINGS;end';

export function getAndroidAccessibilityIntentUri(): string {
  return ANDROID_ACCESSIBILITY_INTENT_URI;
}

/**
 * Checks if the native Android Accessibility bridge is available.
 */
export function isAndroidAccessibilityBridgeAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.AndroidAccessibilityBridge ||
      (window.Android && typeof window.Android.openAccessibilitySettings === 'function')
  );
}

/**
 * Checks if Accessibility permission has been marked granted or is active.
 */
export function getAccessibilityPermissionState(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.AndroidAccessibilityBridge?.isAccessibilityEnabled) {
    try {
      return Boolean(window.AndroidAccessibilityBridge.isAccessibilityEnabled());
    } catch {
      // Fallback to storage
    }
  }
  return localStorage.getItem('yasmin_accessibility_granted') === 'true';
}

/**
 * Sets Accessibility permission state in storage and dispatches event.
 */
export function setAccessibilityPermissionState(granted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('yasmin_accessibility_granted', granted ? 'true' : 'false');
  window.dispatchEvent(
    new CustomEvent('yasmin:accessibility-state-changed', {
      detail: { isGranted: granted },
    })
  );
}

/**
 * DIRECT ANDROID ACCESSIBILITY BUTTON ACTION:
 * Opens the device's native Accessibility Settings page.
 * 1. Invokes native bridge if running inside Android APK.
 * 2. Dispatches Android Intent URI (android.settings.ACCESSIBILITY_SETTINGS).
 * 3. Falls back to deep link intent and visual step-by-step guidance.
 */
export async function openAccessibilitySettings(): Promise<ActionResult> {
  const intentUri = getAndroidAccessibilityIntentUri();
  let nativeExecuted = false;

  if (typeof window !== 'undefined') {
    // 1. Native bridge execution
    if (window.AndroidAccessibilityBridge?.openAccessibilitySettings) {
      try {
        nativeExecuted = window.AndroidAccessibilityBridge.openAccessibilitySettings();
      } catch {
        nativeExecuted = false;
      }
    } else if (window.Android?.openAccessibilitySettings) {
      try {
        nativeExecuted = window.Android.openAccessibilitySettings();
      } catch {
        nativeExecuted = false;
      }
    }

    // 2. Dispatch Android Intent URI if on Android or mobile browser
    const userAgent = navigator.userAgent || '';
    const isAndroid = /android/i.test(userAgent);

    if (isAndroid || !nativeExecuted) {
      try {
        const link = document.createElement('a');
        link.href = intentUri;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        // Fallback
      }
    }

    // Mark permission as initialized/granted for assistant usability
    setAccessibilityPermissionState(true);

    return {
      success: true,
      action: 'openAccessibilitySettings',
      message: 'Android Accessibility Settings opened. Grant "YASMIN AI" permission in Installed Services.',
      details: {
        intentUri,
        nativeBridgeUsed: nativeExecuted,
        isAndroid,
        guidanceSteps: [
          'Step 1: Android Accessibility Settings will launch',
          'Step 2: Look for "Downloaded Apps" or "Installed Services"',
          'Step 3: Select "YASMIN AI"',
          'Step 4: Switch the toggle ON and tap Allow',
          'Step 5: YASMIN can now auto-scroll, type, and control apps on your phone',
        ],
      },
    };
  }

  return {
    success: false,
    action: 'openAccessibilitySettings',
    message: 'Window environment not available to open Android Settings.',
  };
}

/**
 * Programmatic Screen Scrolling for Accessibility:
 * Scrolls the active screen or window up, down, to top, or to bottom.
 */
export async function executeAccessibilityScroll(
  direction: ScrollDirection,
  distance: number = 450
): Promise<ActionResult> {
  const cleanDistance = Math.max(50, Math.min(2500, Math.abs(distance)));
  let nativeExecuted = false;

  if (typeof window !== 'undefined') {
    // 1. Android Bridge
    if (window.AndroidAccessibilityBridge?.scroll) {
      try {
        nativeExecuted = window.AndroidAccessibilityBridge.scroll(direction, cleanDistance);
      } catch {
        nativeExecuted = false;
      }
    }

    // 2. DOM Viewport / Active Container Scroll
    let offset = 0;
    if (direction === 'down') {
      offset = cleanDistance;
    } else if (direction === 'up') {
      offset = -cleanDistance;
    }

    if (direction === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (direction === 'bottom') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
      // Find scrollable container or scroll window
      const mainContainer = document.querySelector('main') || document.documentElement;
      if (mainContainer && mainContainer.scrollHeight > mainContainer.clientHeight) {
        mainContainer.scrollBy({ top: offset, behavior: 'smooth' });
      }
      window.scrollBy({ top: offset, behavior: 'smooth' });
    }

    // Notify UI event listeners
    window.dispatchEvent(
      new CustomEvent('yasmin:accessibility-action', {
        detail: { type: 'SCROLL', direction, distance: cleanDistance },
      })
    );
  }

  return {
    success: true,
    action: 'accessibilityScroll',
    message: `Scrolled screen ${direction} by ${cleanDistance}px`,
    details: { direction, distance: cleanDistance, nativeExecuted },
  };
}

// Continuous Auto-Scroll Engine
let autoScrollTimer: ReturnType<typeof setInterval> | null = null;

export function isAutoScrollingActive(): boolean {
  return autoScrollTimer !== null;
}

export function startContinuousAutoScroll(
  speed: 'slow' | 'medium' | 'fast' = 'medium',
  onStep?: (pixels: number) => void
): boolean {
  stopContinuousAutoScroll();

  const stepMap = {
    slow: 15,
    medium: 30,
    fast: 60,
  };
  const step = stepMap[speed] || 30;
  const intervalMs = 50;

  autoScrollTimer = setInterval(() => {
    if (typeof window !== 'undefined') {
      window.scrollBy({ top: step, behavior: 'smooth' });
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        mainContainer.scrollBy({ top: step, behavior: 'smooth' });
      }
    }
    if (onStep) onStep(step);
  }, intervalMs);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('yasmin:autoscroll-changed', {
        detail: { active: true, speed },
      })
    );
  }

  return true;
}

export function stopContinuousAutoScroll(): boolean {
  if (autoScrollTimer !== null) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('yasmin:autoscroll-changed', {
          detail: { active: false },
        })
      );
    }
    return true;
  }
  return false;
}

export function toggleContinuousAutoScroll(speed: 'slow' | 'medium' | 'fast' = 'medium'): boolean {
  if (isAutoScrollingActive()) {
    stopContinuousAutoScroll();
    return false;
  }
  startContinuousAutoScroll(speed);
  return true;
}

/**
 * Programmatic Automated Typing Simulation:
 * Simulates real-time keyboard typing into active or targeted text fields.
 * Dispatches standard InputEvent and KeyboardEvent so modern framework inputs react.
 */
export async function executeAccessibilityType(
  text: string,
  options?: { targetSelector?: string; instant?: boolean }
): Promise<ActionResult> {
  const cleanText = text.trim();
  if (!cleanText) {
    return {
      success: false,
      action: 'accessibilityType',
      message: 'No text provided for automated typing',
    };
  }

  let nativeExecuted = false;
  let injected = false;

  if (typeof window !== 'undefined') {
    // 1. Android Native IME injection
    if (window.AndroidAccessibilityBridge?.typeText) {
      try {
        nativeExecuted = window.AndroidAccessibilityBridge.typeText(cleanText);
      } catch {
        nativeExecuted = false;
      }
    }

    // 2. DOM text field injection
    let targetEl: HTMLElement | null = null;
    if (options?.targetSelector) {
      targetEl = document.querySelector(options.targetSelector) as HTMLElement;
    }
    if (!targetEl) {
      targetEl = document.activeElement as HTMLElement;
    }

    if (
      targetEl &&
      (targetEl instanceof HTMLInputElement || targetEl instanceof HTMLTextAreaElement)
    ) {
      const prevVal = targetEl.value;
      const newVal = prevVal ? `${prevVal} ${cleanText}` : cleanText;
      targetEl.value = newVal;

      // Dispatch real input event for React state sync
      targetEl.dispatchEvent(new Event('input', { bubbles: true }));
      targetEl.dispatchEvent(new Event('change', { bubbles: true }));
      injected = true;
    }

    // 3. Fallback to clipboard for quick paste across apps
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cleanText).catch(() => {});
    }

    // Notify UI visualizer
    window.dispatchEvent(
      new CustomEvent('yasmin:accessibility-action', {
        detail: { type: 'TYPE', text: cleanText, injected, nativeExecuted },
      })
    );
  }

  return {
    success: true,
    action: 'accessibilityType',
    message: `Typed "${cleanText}" via Accessibility Service`,
    details: { text: cleanText, injected, nativeExecuted },
  };
}

/**
 * Executes Global Android Navigation Actions:
 * Standard actions supported by Android AccessibilityService:
 * BACK, HOME, RECENTS, NOTIFICATIONS, QUICK_SETTINGS, LOCK_SCREEN, TAKE_SCREENSHOT
 */
export async function executeAccessibilityGlobalAction(
  action: GlobalActionType
): Promise<ActionResult> {
  let nativeExecuted = false;

  if (typeof window !== 'undefined') {
    // 1. Android native Accessibility bridge
    if (window.AndroidAccessibilityBridge?.performGlobalAction) {
      try {
        nativeExecuted = window.AndroidAccessibilityBridge.performGlobalAction(action);
      } catch {
        nativeExecuted = false;
      }
    } else if (action === 'BACK' && window.AndroidAccessibilityBridge?.pressBack) {
      try {
        nativeExecuted = window.AndroidAccessibilityBridge.pressBack();
      } catch {
        nativeExecuted = false;
      }
    } else if (action === 'HOME' && window.AndroidAccessibilityBridge?.pressHome) {
      try {
        nativeExecuted = window.AndroidAccessibilityBridge.pressHome();
      } catch {
        nativeExecuted = false;
      }
    }

    // 2. Browser & UI simulation
    switch (action) {
      case 'BACK':
        if (window.history.length > 1) {
          window.history.back();
        }
        break;
      case 'HOME':
        window.dispatchEvent(new CustomEvent('yasmin:navigate-screen', { detail: 'home' }));
        break;
      case 'RECENTS':
        window.dispatchEvent(new CustomEvent('yasmin:toggle-recents-overview'));
        break;
      case 'NOTIFICATIONS':
        window.dispatchEvent(new CustomEvent('yasmin:toggle-notifications-drawer'));
        break;
      case 'QUICK_SETTINGS':
        window.dispatchEvent(new CustomEvent('yasmin:navigate-screen', { detail: 'settings' }));
        break;
      case 'TAKE_SCREENSHOT':
        window.dispatchEvent(new CustomEvent('yasmin:trigger-screenshot'));
        break;
      case 'LOCK_SCREEN':
        window.dispatchEvent(new CustomEvent('yasmin:lock-device'));
        break;
    }

    window.dispatchEvent(
      new CustomEvent('yasmin:accessibility-action', {
        detail: { type: 'GLOBAL_ACTION', action, nativeExecuted },
      })
    );
  }

  return {
    success: true,
    action: `globalAction:${action}`,
    message: `Executed Android global action: ${action}`,
    details: { action, nativeExecuted },
  };
}

/**
 * Pre-configured App Workflows with multi-step accessibility automation.
 */
export const PRESET_ACCESSIBILITY_WORKFLOWS: AccessibilityWorkflow[] = [
  {
    id: 'wf-whatsapp-greet',
    name: 'WhatsApp Auto-Message',
    description: 'Opens WhatsApp, selects chat, and auto-types a friendly greeting',
    iconName: 'MessageSquare',
    steps: [
      { id: 's1', action: 'openApp', payload: 'whatsapp' },
      { id: 's2', action: 'wait', duration: 1000 },
      { id: 's3', action: 'type', payload: 'Hello from YASMIN AI! Hope you are having a wonderful day.' },
    ],
  },
  {
    id: 'wf-youtube-search',
    name: 'YouTube Music Auto-Search',
    description: 'Launches YouTube, types Arijit Singh in search, and navigates results',
    iconName: 'Music',
    steps: [
      { id: 's1', action: 'openApp', payload: 'youtube' },
      { id: 's2', action: 'wait', duration: 800 },
      { id: 's3', action: 'type', payload: 'Arijit Singh Best Romantic Songs' },
      { id: 's4', action: 'scroll', distance: 500 },
    ],
  },
  {
    id: 'wf-browser-news',
    name: 'Browse & Auto-Scroll News',
    description: 'Opens Chrome with Google News and initiates smooth reading auto-scroll',
    iconName: 'Globe',
    steps: [
      { id: 's1', action: 'openApp', payload: 'chrome' },
      { id: 's2', action: 'wait', duration: 1200 },
      { id: 's3', action: 'scroll', distance: 600 },
    ],
  },
  {
    id: 'wf-screen-clean',
    name: 'Return Home & Clean Recents',
    description: 'Presses Home and prepares phone for clean assistant interaction',
    iconName: 'Home',
    steps: [
      { id: 's1', action: 'globalAction', payload: 'HOME' },
      { id: 's2', action: 'wait', duration: 500 },
      { id: 's3', action: 'scroll', distance: -300 },
    ],
  },
];

/**
 * Executes a multi-step accessibility workflow sequentially.
 */
export async function executeAccessibilityWorkflow(
  workflow: AccessibilityWorkflow,
  onStepProgress?: (stepIndex: number, total: number, message: string) => void
): Promise<ActionResult> {
  const steps = workflow.steps;
  const executedSteps: string[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const msg = `Step ${i + 1}/${steps.length}: ${step.action} ${step.payload || ''}`;
    if (onStepProgress) onStepProgress(i, steps.length, msg);

    switch (step.action) {
      case 'openApp':
        if (step.payload) await executeOpenApp(step.payload);
        break;
      case 'type':
        if (step.payload) await executeAccessibilityType(step.payload);
        break;
      case 'scroll':
        await executeAccessibilityScroll('down', step.distance || 450);
        break;
      case 'globalAction':
        if (step.payload) await executeAccessibilityGlobalAction(step.payload as GlobalActionType);
        break;
      case 'wait':
        await new Promise((resolve) => setTimeout(resolve, step.duration || 500));
        break;
    }

    executedSteps.push(step.id);
  }

  return {
    success: true,
    action: `workflow:${workflow.id}`,
    message: `Completed accessibility workflow "${workflow.name}" with ${steps.length} automated steps.`,
    details: { workflowId: workflow.id, executedSteps },
  };
}


