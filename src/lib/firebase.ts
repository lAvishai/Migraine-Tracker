import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

const TOKEN_STORAGE_KEY = 'migraine_tracker_google_token';

const saveStoredAccessToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (e) {
    console.warn('Unable to store access token in localStorage', e);
  }
};

const getStoredAccessToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    return null;
  }
};

const clearStoredAccessToken = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {}
};

let isSigningIn = false;
let cachedAccessToken: string | null = getStoredAccessToken();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check for redirect result on initialization
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          saveStoredAccessToken(cachedAccessToken);
          if (onAuthSuccess && result.user) {
            onAuthSuccess(result.user, cachedAccessToken);
          }
        }
      }
    })
    .catch((err) => {
      console.error('Redirect auth result error:', err);
    });

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!cachedAccessToken) {
        cachedAccessToken = getStoredAccessToken();
      }
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken || "");
    } else {
      cachedAccessToken = null;
      clearStoredAccessToken();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('לא התקבל אסימון גישה (Access Token) מ-Google Auth');
    }
    cachedAccessToken = credential.accessToken;
    saveStoredAccessToken(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    let userFriendlyMsg = 'התחברות לגוגל נכשלה';
    if (error.code === 'auth/popup-blocked') {
      userFriendlyMsg = 'חלון ההתחברות נחסם בדפדפן. לחץ "פתח בלשונית חדשה" להתחברות ישירה.';
    } else if (error.code === 'auth/popup-closed-by-user') {
      userFriendlyMsg = 'חלון ההתחברות נסגר על ידך לפני השלמת התהליך.';
    } else if (error.code === 'auth/unauthorized-domain') {
      userFriendlyMsg = 'דומיין האפליקציה טרם אושר ב-Firebase. לחץ "פתח בלשונית חדשה" להתחברות.';
    } else if (error.message) {
      userFriendlyMsg = error.message;
    }
    const errObj = new Error(userFriendlyMsg);
    (errObj as any).code = error.code;
    throw errObj;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignInRedirect = async (): Promise<void> => {
  await signInWithRedirect(auth, provider);
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || getStoredAccessToken();
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  clearStoredAccessToken();
};

