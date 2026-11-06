import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { UserRound } from 'lucide-react-native';
import { colors } from '../../../theme/colors';
import { fontFamily } from '../../../theme/typography';

export function ProfileAvatar({ avatarUri, displayName, size }: { avatarUri: string | null; displayName: string; size: number }): React.JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [avatarUri]);
  const frame = { borderRadius: size / 2, height: size, width: size };
  if (avatarUri && !imageFailed) return <Image accessibilityLabel={`${displayName || 'Profile'} photo`} onError={() => setImageFailed(true)} source={{ uri: avatarUri }} style={[styles.image, frame]} />;
  const initials = getInitials(displayName);
  return <View accessibilityLabel={`${displayName || 'Profile'} avatar`} style={[styles.fallback, frame]}>{initials ? <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text> : <UserRound color={colors.forest} size={size * 0.46} strokeWidth={1.8} />}</View>;
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0] ?? '').join('').toLocaleUpperCase();
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.forestSoft },
  fallback: { alignItems: 'center', backgroundColor: colors.forestSoft, justifyContent: 'center' },
  initials: { color: colors.forest, fontFamily: fontFamily.bold },
});
