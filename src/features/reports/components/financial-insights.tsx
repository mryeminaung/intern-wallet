import { Lightbulb } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { radii, spacing } from '../../../theme/spacing';
import { fontFamily } from '../../../theme/typography';

export function FinancialInsights({ insights }: { insights: readonly string[] }): React.JSX.Element {
  return <View style={styles.card}><View style={styles.heading}><Lightbulb color={colors.forest} size={18} /><Text style={styles.title}>Financial insights</Text></View>{insights.map((insight) => <Text key={insight} style={styles.insight}>• {insight}</Text>)}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.forestSoft, borderRadius: radii.md, marginTop: spacing.md, padding: spacing.md },
  heading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  title: { color: colors.forest, fontFamily: fontFamily.semiBold, fontSize: 16 },
  insight: { color: colors.forestDark, fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
});
