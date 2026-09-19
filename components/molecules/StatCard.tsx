"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Metric {
  label: string;
  value: number | string;
  percentage?: number;
}

interface StatCardProps {
  title: string;
  metrics: Metric[];
}

const integerFormatter = new Intl.NumberFormat("es-ES");
const decimalFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatValue(value: number | string, label: string): string {
  if (typeof value === "string") return value;
  // Use 1 decimal for ratings and efficiency
  if (
    label.toLowerCase().includes("rating") ||
    label.toLowerCase().includes("efficiency")
  ) {
    return decimalFormatter.format(value);
  }
  return integerFormatter.format(value);
}

export function StatCard({ title, metrics }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {metric.label}
              </span>
              <span className="text-sm font-medium">
                {formatValue(metric.value, metric.label)}
                {metric.percentage !== undefined && (
                  <span className="text-muted-foreground ml-1">
                    ({decimalFormatter.format(metric.percentage)}%)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
