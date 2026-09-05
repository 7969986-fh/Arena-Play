import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

const DURATION_MS = 750;

/**
 * Animates a number up to its new value instead of snapping.
 *
 * A balance that jumps gives no sense that anything happened; one that
 * climbs makes a win or a top-up feel earned. The first render shows the
 * value directly, so opening a screen is never animated from zero.
 */
export default function CountUp({
  value,
  prefix = '',
  style,
}: {
  value: number;
  prefix?: string;
  style?: StyleProp<TextStyle>;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      from.current = value;
      setShown(value);
      return;
    }
    if (from.current === value) return;

    const start = Date.now();
    const origin = from.current;
    const delta = value - origin;

    const tick = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / DURATION_MS);
      // Ease-out: fast at first, settling into the final figure.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(origin + delta * eased));
      if (t >= 1) {
        clearInterval(tick);
        from.current = value;
      }
    }, 16);

    return () => clearInterval(tick);
  }, [value]);

  return <Text style={style}>{prefix}{shown.toLocaleString('en-IN')}</Text>;
}
