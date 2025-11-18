// Advanced UI Patterns - Reusable Components Library
"use client";

import { type ReactNode, memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Stats Card - Optimized for dashboard metrics
 */
interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  gradient?: string;
  onClick?: () => void;
  className?: string;
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  gradient = "from-blue-50 to-blue-100",
  onClick,
  className,
}: StatsCardProps) {
  const Wrapper = onClick ? "button" : "div";
  
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 transition-all",
        `bg-gradient-to-br ${gradient}`,
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-1",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-1 rounded-full",
              trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{trend.value}%</span>
              <span className="opacity-75">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="h-12 w-12 rounded-full bg-white/50 flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
});

/**
 * Feature Card - For landing pages and feature showcases
 */
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  gradient?: string;
}

export const FeatureCard = memo(function FeatureCard({
  icon,
  title,
  description,
  gradient = "from-blue-500 to-purple-500",
}: FeatureCardProps) {
  return (
    <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      
      <CardHeader>
        <div className="h-12 w-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
});

/**
 * Section Container - Consistent spacing and layout
 */
interface SectionProps {
  children: ReactNode;
  className?: string;
  contained?: boolean;
}

export const Section = memo(function Section({
  children,
  className,
  contained = true,
}: SectionProps) {
  return (
    <section
      className={cn(
        "py-12 sm:py-16 lg:py-20",
        contained && "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </section>
  );
});

/**
 * Grid Container - Responsive grid layout
 */
interface GridProps {
  children: ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const Grid = memo(function Grid({
  children,
  cols = { sm: 1, md: 2, lg: 3 },
  gap = 6,
  className,
}: GridProps) {
  return (
    <div
      className={cn(
        "grid",
        cols.sm && `grid-cols-${cols.sm}`,
        cols.md && `md:grid-cols-${cols.md}`,
        cols.lg && `lg:grid-cols-${cols.lg}`,
        cols.xl && `xl:grid-cols-${cols.xl}`,
        `gap-${gap}`,
        className,
      )}
    >
      {children}
    </div>
  );
});

/**
 * Action Bar - Sticky action buttons
 */
interface ActionBarProps {
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    icon?: ReactNode;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  }>;
  position?: "top" | "bottom";
}

export const ActionBar = memo(function ActionBar({
  primaryAction,
  secondaryActions,
  position = "bottom",
}: ActionBarProps) {
  return (
    <div
      className={cn(
        "sticky left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-lg",
        position === "top" ? "top-0 border-b" : "bottom-0 border-t",
      )}
    >
      <div className="flex items-center gap-2">
        {secondaryActions?.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        ))}
      </div>
      
      {primaryAction && (
        <Button
          size="lg"
          onClick={primaryAction.onClick}
          loading={primaryAction.loading || false}
          leftIcon={primaryAction.icon}
        >
          {primaryAction.label}
        </Button>
      )}
    </div>
  );
});

/**
 * List Item - Consistent list styling
 */
interface ListItemProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  rightContent?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ListItem = memo(function ListItem({
  title,
  description,
  icon,
  rightContent,
  onClick,
  className,
}: ListItemProps) {
  const Wrapper = onClick ? "button" : "div";
  
  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border bg-white transition-all",
        onClick && "cursor-pointer hover:border-blue-300 hover:shadow-md",
        className,
      )}
    >
      {icon && (
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
            {icon}
          </div>
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">{title}</h4>
        {description && (
          <p className="text-sm text-gray-600 truncate">{description}</p>
        )}
      </div>
      
      {rightContent && (
        <div className="flex-shrink-0">
          {rightContent}
        </div>
      )}
    </Wrapper>
  );
});

/**
 * Badge Group - Multiple badges in a row
 */
interface BadgeGroupProps {
  items: Array<{
    label: string;
    variant?: "default" | "success" | "warning" | "error";
  }>;
  className?: string;
}

export const BadgeGroup = memo(function BadgeGroup({
  items,
  className,
}: BadgeGroupProps) {
  const variantStyles = {
    default: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700",
    error: "bg-red-100 text-red-700",
  };
  
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item, index) => (
        <span
          key={index}
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            variantStyles[item.variant || "default"],
          )}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
});
