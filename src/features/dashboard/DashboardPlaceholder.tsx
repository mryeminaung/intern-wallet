import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { APP_NAME } from '../../lib/constants';
import { formatDisplayDate } from '../../lib/date';
import { SqliteTransactionRepository } from '../../database/repositories/transaction.repository';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontFamily } from '../../theme/typography';
import { Screen } from '../../components/shared/Screen';
import { Surface } from '../../components/ui/Surface';

export function DashboardPlaceholder(): React.JSX.Element {
  const database = useSQLiteContext();
  const [transactionCount, setTransactionCount] = useState<number | null>(null);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    void new SqliteTransactionRepository(database)
      .count()
      .then((count) => {
        if (isActive) {
          setTransactionCount(count);
        }
      })
      .catch(() => {
        if (isActive) {
          setDatabaseError('We could not read local transactions yet.');
        }
      });

    return () => {
      isActive = false;
    };
  }, [database]);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>PERSONAL FINANCE</Text>
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.welcome}>A calm place to keep track of your everyday money.</Text>
        <Text style={styles.date}>{formatDisplayDate(new Date().toISOString())}</Text>

        <Surface>
          <Text style={styles.cardTitle}>Your wallet</Text>
          {databaseError ? (
            <Text style={styles.emptyMessage}>{databaseError}</Text>
          ) : transactionCount === null ? (
            <Text style={styles.emptyMessage}>Preparing your offline wallet…</Text>
          ) : transactionCount === 0 ? (
            <Text style={styles.emptyMessage}>No transactions yet. Your first entry will appear here.</Text>
          ) : (
            <Text style={styles.emptyMessage}>{transactionCount} transaction(s) recorded locally.</Text>
          )}
        </Surface>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>OFFLINE FIRST</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.income,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 1.4,
    marginTop: spacing.md,
  },
  brand: {
    color: colors.forest,
    fontFamily: fontFamily.bold,
    fontSize: 36,
    marginTop: spacing.xs,
  },
  welcome: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
    maxWidth: 310,
  },
  date: {
    color: colors.text,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  cardTitle: {
    color: colors.text,
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.forestSoft,
    borderRadius: radii.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    color: colors.forest,
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.8,
  },
});
