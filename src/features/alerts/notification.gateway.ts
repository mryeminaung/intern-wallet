import { Platform } from 'react-native';
import type { BudgetAlert } from './alert.service';

let configured = false;

async function configure(): Promise<typeof import('expo-notifications')> {
  const Notifications = await import('expo-notifications');
  if (!configured) {
    Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('budget-alerts', { name: 'Budget alerts', importance: Notifications.AndroidImportance.DEFAULT });
    configured = true;
  }
  return Notifications;
}

export async function requestBudgetAlertPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const Notifications = await configure();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function sendBudgetNotification(alert: BudgetAlert): Promise<void> {
  if (Platform.OS === 'web') throw new Error('Notifications are unavailable on web.');
  const Notifications = await configure();
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) throw new Error('Notification permission was removed.');
  await Notifications.scheduleNotificationAsync({
    content: { title: alert.title, body: alert.body, data: { route: alert.route } },
    trigger: Platform.OS === 'android' ? { channelId: 'budget-alerts' } : null,
  });
}
