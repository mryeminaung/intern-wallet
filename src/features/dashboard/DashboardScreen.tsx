import { Screen } from "@/components/shared/Screen";
import { useDailyBudget } from "@/features/budget";
import {
	BalanceCard,
	DailyBudgetCard,
	MonthlySnapshot,
	QuickActions,
	RecentTransactions,
} from "@/features/dashboard/components";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { ProfileAvatar, useProfile } from "@/features/profile";
import { millisecondsUntilNextLocalDay } from "@/lib/date";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { fontFamily } from "@/theme/typography";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
	ActivityIndicator,
	AppState,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

export function DashboardScreen(): React.JSX.Element {
	const router = useRouter();
	const { data, loading, error, refresh } = useDashboard();
	const {
		data: dailyBudget,
		loading: dailyBudgetLoading,
		error: dailyBudgetError,
		refresh: refreshDailyBudget,
	} = useDailyBudget();
	const { profile } = useProfile();
	useFocusEffect(
		useCallback(() => {
			const refreshAll = (): void => {
				void Promise.all([refresh(), refreshDailyBudget()]);
			};
			let dayTimer: ReturnType<typeof setTimeout>;
			const scheduleNextDay = (): void => {
				clearTimeout(dayTimer);
				dayTimer = setTimeout(() => {
					refreshAll();
					scheduleNextDay();
				}, millisecondsUntilNextLocalDay() + 1000);
			};
			refreshAll();
			scheduleNextDay();
			const subscription = AppState.addEventListener("change", (state) => {
				if (state === "active") {
					refreshAll();
					scheduleNextDay();
				}
			});
			return () => {
				clearTimeout(dayTimer);
				subscription.remove();
			};
		}, [refresh, refreshDailyBudget]),
	);
	const greeting = getGreeting();
	const personalizedGreeting = profile.displayName
		? `${greeting}, \n${profile.displayName}`
		: greeting;

	return (
		<Screen>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}>
				<View style={styles.header}>
					<View style={styles.headerCopy}>
						<View style={styles.brandRow}>
							<Image
								accessibilityIgnoresInvertColors
								source={require("../../../assets/icon.png")}
								style={styles.logo}
							/>
							<Text style={styles.eyebrow}>
								TODAY ·{" "}
								{new Intl.DateTimeFormat("en", {
									month: "short",
									day: "numeric",
								})
									.format(new Date())
									.toUpperCase()}
							</Text>
						</View>
						<Text
							numberOfLines={2}
							style={styles.title}>
							{personalizedGreeting}
						</Text>
					</View>
					<Pressable
						accessibilityLabel="Open settings"
						accessibilityRole="button"
						onPress={() => router.push("/settings")}
						style={({ pressed }) => [
							styles.settingsButton,
							pressed && styles.pressed,
						]}>
						<ProfileAvatar
							avatarUri={profile.avatarUri}
							displayName={profile.displayName}
							size={44}
						/>
					</Pressable>
				</View>
				{!data && loading ? (
					<View style={styles.loadingCard}>
						<ActivityIndicator color={colors.forest} />
						<Text style={styles.status}>Loading your wallet…</Text>
					</View>
				) : null}
				{error ? (
					<View style={styles.errorCard}>
						<Text style={styles.error}>{error}</Text>
						<Pressable
							accessibilityRole="button"
							onPress={() => {
								void refresh();
							}}
							style={styles.retryButton}>
							<Text style={styles.retryText}>Try again</Text>
						</Pressable>
					</View>
				) : null}
				{data ? (
					<>
						{dailyBudget ? (
							<DailyBudgetCard
								data={dailyBudget}
								onOpen={() => router.push("/daily-budget")}
							/>
						) : dailyBudgetLoading ? (
							<View style={styles.loadingCard}>
								<ActivityIndicator color={colors.forest} />
								<Text style={styles.status}>Loading today’s plan…</Text>
							</View>
						) : dailyBudgetError ? (
							<View style={styles.errorCard}>
								<Text style={styles.error}>{dailyBudgetError}</Text>
								<Pressable
									accessibilityRole="button"
									onPress={() => {
										void refreshDailyBudget();
									}}
									style={styles.retryButton}>
									<Text style={styles.retryText}>Try again</Text>
								</Pressable>
							</View>
						) : null}
						{dailyBudget && dailyBudgetError ? (
							<Text style={styles.staleNotice}>
								Today’s plan could not refresh. It may be out of date.
							</Text>
						) : null}
						<QuickActions
							onAddExpense={() => router.push("/transactions/new?type=expense")}
							onAddIncome={() => router.push("/transactions/new?type=income")}
						/>
						<BalanceCard balance={data.balance} />
						<MonthlySnapshot
							expenses={data.monthExpenses}
							income={data.monthIncome}
							remainingBudget={data.remainingBudget}
							totalBudget={data.totalBudget}
							usage={data.budgetUsagePercentage}
							onOpenBudget={() => router.push("/budget")}
							onOpenInsights={() => router.push("/reports")}
						/>
						<RecentTransactions
							onAddTransaction={() => router.push("/transactions/new")}
							onTransactionPress={(id) => router.push(`/transactions/${id}`)}
							onViewAll={() => router.push("/transactions")}
							transactions={data.recentTransactions}
						/>
					</>
				) : null}
			</ScrollView>
		</Screen>
	);
}

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: spacing.screenHorizontal,
		paddingTop: spacing.screenTop,
		paddingBottom: spacing.tabBarClearance,
	},
	header: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
	},
	headerCopy: { flex: 1, paddingRight: spacing.md },
	brandRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
	logo: { borderRadius: 7, height: 24, width: 24 },
	eyebrow: {
		color: colors.income,
		fontFamily: fontFamily.semiBold,
		fontSize: 11,
		letterSpacing: 1.3,
	},
	title: {
		color: colors.text,
		fontFamily: fontFamily.bold,
		fontSize: 25,
		lineHeight: 31,
		marginTop: spacing.xs,
	},
	settingsButton: {
		alignItems: "center",
		backgroundColor: colors.surface,
		borderRadius: 99,
		height: 44,
		justifyContent: "center",
		width: 44,
	},
	pressed: { opacity: 0.72 },
	loadingCard: {
		alignItems: "center",
		backgroundColor: colors.surface,
		borderRadius: 18,
		flexDirection: "row",
		gap: spacing.sm,
		marginTop: spacing.lg,
		minHeight: 100,
		padding: spacing.md,
	},
	status: {
		color: colors.textMuted,
		fontFamily: fontFamily.regular,
		fontSize: 14,
	},
	errorCard: {
		backgroundColor: "#FCEDEA",
		borderRadius: 18,
		marginTop: spacing.lg,
		padding: spacing.md,
	},
	error: {
		color: colors.expense,
		fontFamily: fontFamily.medium,
		fontSize: 13,
		lineHeight: 19,
	},
	staleNotice: {
		color: colors.expense,
		fontFamily: fontFamily.medium,
		fontSize: 12,
		marginTop: spacing.sm,
	},
	retryButton: {
		alignSelf: "flex-start",
		marginTop: spacing.sm,
		minHeight: 40,
		justifyContent: "center",
	},
	retryText: {
		color: colors.forest,
		fontFamily: fontFamily.semiBold,
		fontSize: 14,
	},
});

function getGreeting(hour = new Date().getHours()): string {
	if (hour < 12) return "Good morning";
	if (hour < 18) return "Good afternoon";
	return "Good evening";
}
