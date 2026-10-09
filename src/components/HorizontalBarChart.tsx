import { useId } from 'react';
import {
  Bar,
  BarChart,
  LabelList,
  Rectangle,
  ResponsiveContainer,
  Text,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
  type YAxisTickContentProps,
} from 'recharts';
import type { CountBucket } from '../data/aggregators/demographics.ts';
import { formatCount, formatShare } from './format.ts';
import styles from './HorizontalBarChart.module.css';

// The only file that imports `recharts`, so the chart library can be swapped without touching anything else.

export interface HorizontalBarChartProps {
  /** Accessible name of the chart's SVG. */
  title: string;
  buckets: readonly CountBucket<string>[];
  /** Denominator of the shares in the tooltip. */
  total: number;
}

// Recharts sizes in px; derive them from the root font size so the chart follows the user's text size.
function remToPx(rem: number): number {
  const root =
    typeof document === 'undefined'
      ? NaN
      : parseFloat(getComputedStyle(document.documentElement).fontSize);
  return rem * (Number.isFinite(root) ? root : 16);
}

const BAR_COLOR = 'var(--color-chart-bar)';
const TEXT_COLOR = 'var(--color-text)';

/** Category label, wrapped onto several lines instead of truncated ("Unknown / Not specified" at 320 px). */
function CategoryTick({
  x,
  y,
  payload,
  width,
  fontSize,
}: YAxisTickContentProps & { fontSize: number }) {
  return (
    <Text
      x={Number(x)}
      y={Number(y)}
      width={Number(width)}
      textAnchor="end"
      verticalAnchor="middle"
      fill={TEXT_COLOR}
      style={{ fontSize }}
    >
      {String(payload.value)}
    </Text>
  );
}

function BarTooltip({ active, payload, total }: TooltipContentProps & { total: number }) {
  const bucket = active ? (payload[0]?.payload as CountBucket<string> | undefined) : undefined;
  if (bucket === undefined) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{bucket.label}</p>
      <p>
        {formatCount(bucket.count)} ({formatShare(bucket.count, total)})
      </p>
    </div>
  );
}

// One horizontal bar per bucket, in bucket order. Counts are always written at the end of each bar; tapping a bar
// adds its share. One neutral color; Unknown is hatched, and its label says so. No animation.
export function HorizontalBarChart({ title, buckets, total }: HorizontalBarChartProps) {
  const hatchId = `hatch-${useId().replace(/[^\w-]/g, '')}`;
  const fontSize = remToPx(0.875);
  // Fits the longest word of a label ("specified"); longer labels wrap onto more lines.
  const yAxisWidth = remToPx(4.5);
  const maxCount = Math.max(0, ...buckets.map((b) => b.count));
  // Room for the widest count label at the end of the longest bar.
  const labelRoom = formatCount(maxCount).length * fontSize * 0.65 + fontSize;

  const barShape = (props: BarShapeProps) => {
    const unknown = (props.payload as CountBucket<string> | undefined)?.key === 'unknown';
    return unknown ? (
      <Rectangle {...props} fill={`url(#${hatchId})`} stroke={BAR_COLOR} strokeWidth={1} />
    ) : (
      <Rectangle {...props} fill={BAR_COLOR} />
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={buckets as CountBucket<string>[]}
        title={title}
        margin={{ top: 0, right: labelRoom, bottom: 0, left: 0 }}
        barCategoryGap="20%"
      >
        <defs>
          <pattern
            id={hatchId}
            width={6}
            height={6}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width={3} height={6} fill={BAR_COLOR} />
          </pattern>
        </defs>
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey="label"
          width={yAxisWidth}
          axisLine={false}
          tickLine={false}
          interval={0}
          tick={(props: YAxisTickContentProps) => <CategoryTick {...props} fontSize={fontSize} />}
        />
        <Tooltip
          trigger="click"
          cursor={{ fill: 'var(--color-border)', fillOpacity: 0.5 }}
          isAnimationActive={false}
          content={(props) => <BarTooltip {...props} total={total} />}
        />
        <Bar dataKey="count" isAnimationActive={false} shape={barShape}>
          <LabelList
            dataKey="count"
            position="right"
            fill={TEXT_COLOR}
            style={{ fontSize, fontVariantNumeric: 'tabular-nums' }}
            formatter={(value) => (typeof value === 'number' ? formatCount(value) : value)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
