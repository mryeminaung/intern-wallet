import { Image, type ImageStyle, type StyleProp } from 'react-native';

type MascotMood = 'welcome' | 'coin' | 'jump' | 'warning' | 'empty' | 'trophy';

const artwork = {
  welcome: require('../../../assets/chibi/Kawaii Green Wallet Mascot-1.png'),
  coin: require('../../../assets/chibi/Kawaii Wallet Mascot with Golden Coin-2.png'),
  jump: require('../../../assets/chibi/Cheerful Jumping Wallet Girl with Coins-3.png'),
  warning: require('../../../assets/chibi/Worried Wallet Expense Alert-4.png'),
  empty: require('../../../assets/chibi/Worried Empty Wallet Mascot-5.png'),
  trophy: require('../../../assets/chibi/Sleeping Wallet Mascot Hugging Trophy-6.png'),
} as const;

export function WalletMascot({ mood, size, style }: { mood: MascotMood; size: number; style?: StyleProp<ImageStyle> }): React.JSX.Element {
  return <Image accessible={false} accessibilityIgnoresInvertColors resizeMode="contain" source={artwork[mood]} style={[{ width: size, height: size }, style]} />;
}
