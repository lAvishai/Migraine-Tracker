import authConfig from '../../google-auth-config.json';

export interface GoogleUser {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

const TOKEN_KEY = 'migraine_tracker_google_token';
const USER_KEY = 'migraine_tracker_google_user';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

let tokenClient: any = null;
let cachedAccessToken: string | null = null;
let cachedUser: GoogleUser | null = null;

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Load Google Identity Services script if not already loaded
export function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

// Fetch user profile using access token from Google userinfo API
async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUser> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        displayName: data.name || data.given_name || 'משתמש Google',
        email: data.email || null,
        photoURL: data.picture || null,
      };
    }
  } catch (e) {
    console.warn('Failed to fetch user profile:', e);
  }
  return {
    displayName: 'משתמש Google',
    email: null,
    photoURL: null,
  };
}

// Initialize authentication listener and restore previous session
export const initGoogleAuth = (
  onAuthSuccess?: (user: GoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUserRaw = localStorage.getItem(USER_KEY);

    if (storedToken && storedUserRaw) {
      cachedAccessToken = storedToken;
      cachedUser = JSON.parse(storedUserRaw);
      if (cachedUser && onAuthSuccess) {
        onAuthSuccess(cachedUser, storedToken);
      }
    } else if (onAuthFailure) {
      onAuthFailure();
    }
  } catch (e) {
    console.error('Error restoring Google Auth session:', e);
    if (onAuthFailure) onAuthFailure();
  }

  // Preload script in background
  loadGsiScript().catch((err) => {
    console.warn('GIS script preload error:', err);
  });

  return () => {
    // Cleanup if needed
  };
};

// Sign in with Google using Google Identity Services (OAuth 2.0 token flow)
export const googleSignIn = async (): Promise<{ user: GoogleUser; accessToken: string } | null> => {
  const clientId = authConfig.clientId;
  if (!clientId || clientId.includes('YOUR_CLIENT_ID')) {
    throw new Error('Google OAuth Client ID חסר בקובץ google-auth-config.json. אנא הגדר אותו מ-Google Cloud Console.');
  }

  await loadGsiScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('ספריית Google Identity Services אינה זמינה בדפדפן.');
  }

  return new Promise((resolve, reject) => {
    let resolved = false;

    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: async (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error || 'התחברות לגוגל נכשלה'));
          return;
        }

        if (response.access_token) {
          resolved = true;
          const token = response.access_token;
          cachedAccessToken = token;
          try {
            localStorage.setItem(TOKEN_KEY, token);
          } catch (e) {}

          const profile = await fetchGoogleUserProfile(token);
          cachedUser = profile;
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(profile));
          } catch (e) {}

          resolve({ user: profile, accessToken: token });
        } else {
          reject(new Error('לא התקבל אסימון גישה מחשבון Google.'));
        }
      },
      error_callback: (error: any) => {
        if (!resolved) {
          reject(new Error(error?.message || 'התחברות לגוגל נסגרה או נכשלה.'));
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || localStorage.getItem(TOKEN_KEY);
};

export const logout = async () => {
  const token = cachedAccessToken || localStorage.getItem(TOKEN_KEY);
  if (token && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(token);
    } catch (e) {
      console.warn('Error revoking token:', e);
    }
  }
  cachedAccessToken = null;
  cachedUser = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
