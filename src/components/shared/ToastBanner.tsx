import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../../stores/ui.store';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { radii, shadows, spacing } from '../../theme/spacing';

export function ToastBanner(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const notice = useUiStore((state) => state.notice);
  const clearNotice = useUiStore((state) => state.clearNotice);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => clearNotice(notice.id), 2600);
    return () => clearTimeout(timer);
  }, [clearNotice, notice]);

  if (!notice) return null;
  return <View pointerEvents="none" style={[styles.host, { top: insets.top + spacing.sm }]}><View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.banner}><CheckCircle2 color={colors.white} size={19} /><Text style={styles.text}>{notice.message}</Text></View></View>;
}

const styles = StyleSheet.create({
  host: { left: spacing.md, position: 'absolute', right: spacing.md, zIndex: 1000 },
  banner: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.forest, borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, maxWidth: 420, minHeight: 48, paddingHorizontal: spacing.md, ...shadows.floating },
  text: { color: colors.white, flexShrink: 1, fontFamily: fontFamily.semiBold, fontSize: 13 },
});
