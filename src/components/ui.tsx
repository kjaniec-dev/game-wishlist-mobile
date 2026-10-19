import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, TextInput as RNTextInput, View, type TextInputProps } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { coverFor, PRIORITY_META, STATUS_META, STORE_META } from '@/lib/catalog';
import { bestOffer, formatPLN, isDeal } from '@/lib/prices';
import { useKj, withAlpha } from '@/lib/theme';
import type { Game, Platform, Priority, Status, StoreId } from '@/lib/types';

import { Icon, type IconName } from './icon';

// ── Cover art ───────────────────────────────────────────────────────────
export function Cover({ title, size = 56, radius = 10 }: { title: string; size?: number; radius?: number }) {
  const [a, b] = coverFor(title);
  const words = title
    .replace(/[:!?,]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^(the|a|of|and|de|to)$/i.test(w));
  const initials = ((words[0]?.[0] ?? '?') + (words[1]?.[0] ?? '')).toUpperCase();
  return (
    <LinearGradient
      colors={[a, b]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text
        style={{ color: 'rgba(255,255,255,0.92)', fontWeight: '800', fontSize: Math.max(11, Math.round(size * 0.34)) }}
      >
        {initials}
      </Text>
    </LinearGradient>
  );
}

// ── Chips ───────────────────────────────────────────────────────────────
export function StatusChip({ status, large = false }: { status: Status; large?: boolean }) {
  const meta = STATUS_META[status];
  return (
    <View
      className="flex-row items-center rounded-full"
      style={{
        gap: 5,
        paddingHorizontal: large ? 10 : 7,
        paddingVertical: large ? 4 : 2,
        backgroundColor: withAlpha(meta.color, 0.18),
        borderWidth: 1,
        borderColor: withAlpha(meta.color, 0.3),
      }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: meta.color }} />
      <Text style={{ color: meta.color, fontSize: large ? 12 : 11, fontWeight: '600' }}>{meta.label}</Text>
    </View>
  );
}

export function PlatformChip({ platform }: { platform?: Platform }) {
  if (!platform) return null;
  return (
    <View
      className="flex-row items-center rounded-md"
      style={{
        gap: 5,
        paddingHorizontal: 7,
        paddingVertical: 2,
        backgroundColor: withAlpha(platform.color, 0.16),
        borderWidth: 1,
        borderColor: withAlpha(platform.color, 0.3),
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: platform.color }} />
      <Text style={{ color: platform.color, fontSize: 11, fontWeight: '600' }}>{platform.short}</Text>
    </View>
  );
}

export function PriorityPips({ priority, color }: { priority: Priority; color: string }) {
  const kj = useKj();
  return (
    <View className="flex-row items-center" style={{ gap: 2.5 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: 4,
            height: 10,
            borderRadius: 1,
            backgroundColor: i < PRIORITY_META[priority].pips ? color : kj.border,
          }}
        />
      ))}
    </View>
  );
}

export function DealBadge({ label = 'Okazja' }: { label?: string }) {
  const kj = useKj();
  return (
    <View
      className="flex-row items-center rounded-full"
      style={{ gap: 4, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: withAlpha(kj.success, 0.16) }}
    >
      <Icon name="tag" size={11} stroke={2.2} color={kj.success} />
      <Text style={{ color: kj.success, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

// ── Store marks ─────────────────────────────────────────────────────────
export function StoreMark({ colors, mark, size = 30 }: { colors: [string, string]; mark: string; size?: number }) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.37, fontWeight: '700', letterSpacing: -0.3 }}>{mark}</Text>
    </LinearGradient>
  );
}

export function StoreLogo({ store, size }: { store: StoreId; size?: number }) {
  const m = STORE_META[store];
  return <StoreMark colors={m.colors} mark={m.mark} size={size} />;
}

// ── Cards & sections ────────────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View className="flex-row items-baseline justify-between" style={{ paddingHorizontal: 4, paddingBottom: 10 }}>
      <Text className="text-muted-foreground" style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>
        {title}
      </Text>
      {action}
    </View>
  );
}

export function GameCard({ game, platform, compact = false }: { game: Game; platform?: Platform; compact?: boolean }) {
  const kj = useKj();
  const best = bestOffer(game);
  const deal = isDeal(game);
  const high = game.priority === 'high';
  return (
    <Link href={{ pathname: '/game/[id]', params: { id: game.id } }} asChild>
      <Pressable
        className="flex-row items-center rounded-2xl border border-border bg-card active:opacity-80"
        style={{ gap: compact ? 10 : 12, paddingHorizontal: compact ? 12 : 14, paddingVertical: compact ? 10 : 12 }}
      >
        <Cover title={game.title} size={compact ? 44 : 56} />
        <View className="flex-1" style={{ gap: compact ? 3 : 5 }}>
          <Text className="text-foreground" numberOfLines={compact ? 1 : 2} style={{ fontSize: compact ? 14 : 15, fontWeight: '600', lineHeight: 19 }}>
            {game.title}
          </Text>
          <View className="flex-row flex-wrap items-center" style={{ gap: 6 }}>
            <PlatformChip platform={platform} />
            <StatusChip status={game.status} />
            {deal && <DealBadge />}
          </View>
          {best ? (
            <Text className="text-muted-foreground" style={{ fontSize: 12 }} numberOfLines={1}>
              od <Text className={deal ? 'text-success' : 'text-foreground'} style={{ fontWeight: '700' }}>{formatPLN(best.price)}</Text>
              {` · ${STORE_META[best.store].name}`}
              {game.targetPrice !== undefined ? ` · cel ${formatPLN(game.targetPrice)}` : ''}
            </Text>
          ) : !compact && game.notes ? (
            <Text className="text-muted-foreground" style={{ fontSize: 12 }} numberOfLines={1}>
              {game.notes}
            </Text>
          ) : null}
        </View>
        <View className="items-end" style={{ gap: 6 }}>
          <PriorityPips priority={game.priority} color={high ? kj.primary : kj.mutedForeground} />
          <Icon name="chev" size={14} stroke={2} color={kj.mutedForeground} />
        </View>
      </Pressable>
    </Link>
  );
}

export function StatTile({ label, value, sub, icon, accent = false }: { label: string; value: number | string; sub?: string; icon?: IconName; accent?: boolean }) {
  const kj = useKj();
  return (
    <View
      className="flex-1 rounded-2xl border"
      style={{
        padding: 12,
        gap: 6,
        backgroundColor: accent ? withAlpha(kj.primary, 0.14) : kj.card,
        borderColor: accent ? withAlpha(kj.primary, 0.4) : kj.border,
      }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-muted-foreground" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' }}>
          {label}
        </Text>
        {icon && <Icon name={icon} size={14} stroke={2} color={kj.mutedForeground} />}
      </View>
      <Text className="text-foreground" style={{ fontSize: 28, fontWeight: '700', letterSpacing: -1 }}>
        {value}
      </Text>
      {sub && (
        <Text className="text-muted-foreground" style={{ fontSize: 11 }} numberOfLines={1}>
          {sub}
        </Text>
      )}
    </View>
  );
}

export function PageTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View className="flex-row items-baseline justify-between" style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 14 }}>
      <Text className="text-foreground" style={{ fontSize: 26, fontWeight: '700', letterSpacing: -1 }}>
        {title}
      </Text>
      {right}
    </View>
  );
}

// ── Controls ────────────────────────────────────────────────────────────
export function Button({
  children,
  onPress,
  variant = 'primary',
  icon,
  danger = false,
  disabled = false,
  full = true,
}: {
  children?: ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  danger?: boolean;
  disabled?: boolean;
  full?: boolean;
}) {
  const kj = useKj();
  const bg = danger ? withAlpha(kj.danger, 0.14) : variant === 'primary' ? kj.primary : variant === 'secondary' ? kj.card : 'transparent';
  const fg = danger ? kj.danger : variant === 'primary' ? kj.primaryForeground : variant === 'secondary' ? kj.foreground : kj.mutedForeground;
  const border = danger ? withAlpha(kj.danger, 0.3) : variant === 'primary' ? 'transparent' : kj.border;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center justify-center rounded-xl active:opacity-80"
      style={{
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 13,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        opacity: disabled ? 0.5 : 1,
        alignSelf: full ? 'stretch' : 'auto',
        flex: full ? 1 : undefined,
      }}
    >
      {icon && <Icon name={icon} size={16} stroke={2} color={fg} />}
      {children != null && <Text style={{ color: fg, fontSize: 15, fontWeight: '600' }}>{children}</Text>}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, color }: { icon: IconName; onPress?: () => void; label: string; color?: string }) {
  const kj = useKj();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      className="items-center justify-center rounded-xl active:opacity-60"
      style={{ width: 36, height: 36 }}
    >
      <Icon name={icon} size={20} color={color ?? kj.foreground} />
    </Pressable>
  );
}

export function FilterPill({ label, active, color, onPress }: { label: string; active: boolean; color?: string; onPress: () => void }) {
  const kj = useKj();
  const c = color ?? kj.primary;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-full"
      style={{
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: active ? c : kj.border,
        backgroundColor: active ? withAlpha(c, 0.2) : kj.card,
      }}
    >
      {color && <View style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: c }} />}
      <Text style={{ color: active ? c : kj.mutedForeground, fontSize: 12.5, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text className="text-muted-foreground" style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' }}>
        {label}
        {required && <Text className="text-primary"> *</Text>}
      </Text>
      {children}
      {hint && (
        <Text className="text-muted-foreground" style={{ fontSize: 11 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}

export function TextField({ multiline, ...props }: TextInputProps) {
  const kj = useKj();
  return (
    <RNTextInput
      placeholderTextColor={kj.mutedForeground}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      className="rounded-xl border border-border bg-card text-foreground"
      style={{ paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, minHeight: multiline ? 84 : undefined }}
      {...props}
    />
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; color?: string }[];
}) {
  const kj = useKj();
  return (
    <View className="flex-row rounded-xl border border-border bg-card" style={{ padding: 3, gap: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className="flex-1 items-center justify-center rounded-lg"
            style={{ paddingVertical: 8, backgroundColor: active ? (o.color ?? kj.primary) : 'transparent' }}
          >
            <Text
              numberOfLines={1}
              style={{ color: active ? (o.color ? '#fff' : kj.primaryForeground) : kj.mutedForeground, fontSize: 12.5, fontWeight: '600' }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  const kj = useKj();
  return (
    <Pressable
      onPress={onChange}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      style={{ width: 42, height: 26, borderRadius: 13, backgroundColor: checked ? kj.primary : kj.border }}
    >
      <View
        style={{ position: 'absolute', top: 3, left: checked ? 19 : 3, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' }}
      />
    </Pressable>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  const kj = useKj();
  return (
    <View className="items-center" style={{ paddingVertical: 56, paddingHorizontal: 24, gap: 12 }}>
      <View className="items-center justify-center rounded-2xl bg-card" style={{ width: 64, height: 64 }}>
        <Icon name="controller" size={28} stroke={1.5} color={kj.mutedForeground} />
      </View>
      <Text className="text-foreground" style={{ fontSize: 16, fontWeight: '600' }}>
        {title}
      </Text>
      <Text className="text-center text-muted-foreground" style={{ fontSize: 13, maxWidth: 260 }}>
        {text}
      </Text>
      {action}
    </View>
  );
}

// ── Price chart ─────────────────────────────────────────────────────────
export function Sparkline({
  points,
  width,
  height,
  color,
  target,
}: {
  points: { t: number; price: number }[];
  width: number;
  height: number;
  color: string;
  /** Optional target price drawn as a dashed guide. */
  target?: number;
}) {
  if (points.length < 2) return <View style={{ width, height }} />;
  const pad = 4;
  const prices = points.map((p) => p.price);
  const lo = Math.min(...prices, target ?? Infinity);
  const hi = Math.max(...prices, target ?? -Infinity);
  const span = hi - lo || 1;
  const t0 = points[0].t;
  const tSpan = points[points.length - 1].t - t0 || 1;
  const x = (t: number) => pad + ((t - t0) / tSpan) * (width - pad * 2);
  const y = (p: number) => pad + (1 - (p - lo) / span) * (height - pad * 2);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.price).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  return (
    <Svg width={width} height={height}>
      {target !== undefined && (
        <Path d={`M${pad} ${y(target)} H${width - pad}`} stroke={color} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="4 4" />
      )}
      <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={x(last.t)} cy={y(last.price)} r={3.5} fill={color} />
    </Svg>
  );
}
