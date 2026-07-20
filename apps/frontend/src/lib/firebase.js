import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { apiClient } from '../api/client';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let messaging = null;
let swRegistration = null;

async function getSWRegistration() {
  if (swRegistration) return swRegistration;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js');
    return swRegistration;
  } catch {
    return null;
  }
}

function getMessagingInstance() {
  if (messaging) return messaging;
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      messaging = getMessaging(initializeApp(firebaseConfig));
    }
  } catch {
    // Firebase not available
  }
  return messaging;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  return await retrieveFCMToken();
}

export async function retrieveFCMToken() {
  const msg = getMessagingInstance();
  if (!msg) return null;

  try {
    const registration = await getSWRegistration();
    const token = await getToken(msg, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration || undefined
    });
    return token;
  } catch {
    return null;
  }
}

export async function registerFCMToken() {
  const token = await retrieveFCMToken();
  if (!token) return;

  try {
    await apiClient('/notifications/token', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  } catch {
    // silent fail
  }
}

export async function unregisterFCMToken() {
  const token = await retrieveFCMToken();
  if (!token) return;

  try {
    await apiClient('/notifications/token', {
      method: 'DELETE',
      body: JSON.stringify({ token })
    });
  } catch {
    // silent fail
  }
}

export function onForegroundMessage(callback) {
  const msg = getMessagingInstance();
  if (!msg) return () => {};

  return onMessage(msg, (payload) => {
    callback(payload);
  });
}
