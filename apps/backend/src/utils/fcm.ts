import { initializeApp, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { env } from "../config/env";
import { User } from "../modules/user/user.model";
import { log } from "./logger";

let firebaseApp: App | null = null;
let messaging: Messaging | null = null;

function getFirebaseApp(): App | null {
  if (firebaseApp) return firebaseApp;

  const serviceAccount = env.firebaseServiceAccountJson();
  if (!serviceAccount) {
    log("warn", "Firebase service account not configured, push notifications disabled");
    return null;
  }

  try {
    firebaseApp = initializeApp({
      credential: cert(serviceAccount as any)
    });
    messaging = getMessaging(firebaseApp);
    log("info", "Firebase Admin initialized successfully");
    return firebaseApp;
  } catch (error) {
    log("error", "Failed to initialize Firebase Admin", { message: (error as Error).message });
    return null;
  }
}

export function isPushEnabled(): boolean {
  return getFirebaseApp() !== null;
}

export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<{ sent: number; failed: string[] }> {
  const app = getFirebaseApp();
  if (!app || !messaging || tokens.length === 0) {
    return { sent: 0, failed: [] };
  }

  const message = {
    notification: { title, body },
    data,
    tokens
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    const failedTokens: string[] = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx]);
        const error = resp.error;
        if (error?.code === "messaging/registration-token-not-registered" ||
            error?.code === "messaging/invalid-registration-token") {
          log("info", "Removing invalid FCM token", { token: tokens[idx].substring(0, 20) + "..." });
        }
      }
    });

    if (failedTokens.length > 0) {
      await User.updateMany(
        { fcmTokens: { $in: failedTokens } },
        { $pullAll: { fcmTokens: failedTokens } }
      );
    }

    log("info", "Push notifications sent", { total: tokens.length, success: response.successCount, failed: failedTokens.length });
    return { sent: response.successCount, failed: failedTokens };
  } catch (error) {
    log("error", "Failed to send push notifications", { message: (error as Error).message });
    return { sent: 0, failed: tokens };
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  const user = await User.findById(userId).lean();
  if (!user || !user.fcmTokens?.length) return;

  await sendPushToTokens(user.fcmTokens, title, body, data);
}

export async function sendPushToAllAdmins(
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  const admins = await User.find({ role: "admin", fcmTokens: { $exists: true, $ne: [] } }).lean();
  const allTokens = admins.flatMap((admin) => admin.fcmTokens || []);

  if (allTokens.length === 0) return;

  await sendPushToTokens(allTokens, title, body, data);
}
