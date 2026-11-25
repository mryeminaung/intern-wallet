import Svg, { Circle, Path, type SvgProps } from 'react-native-svg';

type DecorationName = 'dots-small' | 'dot-pattern' | 'organic-blob-light' | 'sparkle-green' | 'sparkle';

const smallDots = [64, 128, 192];
const patternColumns = [48, 88, 128, 168, 208];
const patternRows = [68, 108, 148, 188];

export function Decoration({ name, width, height, style }: { name: DecorationName; width: number; height: number; style?: SvgProps['style'] }): React.JSX.Element {
  return <Svg accessible={false} height={height} pointerEvents="none" style={style} viewBox="0 0 256 256" width={width}>
    {name === 'dots-small' ? smallDots.flatMap((cy) => smallDots.map((cx) => <Circle cx={cx} cy={cy} fill="#047857" key={`${cx}-${cy}`} r={12} />)) : null}
    {name === 'dot-pattern' ? patternRows.flatMap((cy) => patternColumns.map((cx) => <Circle cx={cx} cy={cy} fill="#047857" key={`${cx}-${cy}`} r={10} />)) : null}
    {name === 'organic-blob-light' ? <Path d="M43 44C86 13 165 19 196 64S242 156 193 201 87 237 59 188 9 82 43 44Z" fill="#D1FAE5" /> : null}
    {name === 'sparkle-green' || name === 'sparkle' ? <Path d="M128 16Q150 101 240 128Q150 155 128 240Q106 155 16 128Q106 101 128 16Z" fill={name === 'sparkle' ? '#D97706' : '#047857'} /> : null}
  </Svg>;
}
