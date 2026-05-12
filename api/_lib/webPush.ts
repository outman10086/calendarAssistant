import webPush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

export { webPush };
