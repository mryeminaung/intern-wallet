export const fontFamily = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  myanmar: 'NotoSansMyanmar_400Regular',
} as const;

export const typography = {
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  cardTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  screenTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    lineHeight: 36,
  },
  amount: {
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'] as const,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
} as const;
