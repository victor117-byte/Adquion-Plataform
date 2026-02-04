import { FileText, Users, Zap, HardDrive, AlertTriangle, Crown, Building2, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsage, LimitStatus } from '@/hooks/use-usage';
import { cn } from '@/lib/utils';

// ==================== ICONOS POR RECURSO ====================

const resourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  files: FileText,
  sat_automations: Zap,
  users: Users,
  clients: Building2,
  storage: HardDrive,
  scheduled_executions: Calendar,
};

// ==================== COMPONENTE ====================

interface PlanLimitsCardProps {
  onUpgradeClick?: () => void;
  showAlways?: boolean;
}

export function PlanLimitsCard({ onUpgradeClick, showAlways = false }: PlanLimitsCardProps) {
  const { usage, loading, error, hasAnyAtLimit, hasAnyNearLimit } = useUsage();

  // Loading state
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Error state
  if (error || !usage) {
    return null;
  }

  const isFree = usage.planId === 'basic_free' || usage.planName.toLowerCase().includes('free');
  const hasAlerts = hasAnyAtLimit() || hasAnyNearLimit();

  // Solo mostrar si es gratis, hay alertas, o showAlways está activo
  if (!showAlways && !isFree && !hasAlerts) {
    return null;
  }

  // Filtrar límites que tienen restricción (no ilimitados y mayor a 0)
  const limitedItems = usage.limits.filter((item) => !item.isUnlimited && item.limit > 0);

  if (limitedItems.length === 0 && !showAlways) {
    return null;
  }

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Plan {usage.planName}</span>
          {isFree && (
            <Badge variant="secondary" className="text-xs">
              Gratuito
            </Badge>
          )}
        </div>
        {(isFree || hasAlerts) && onUpgradeClick && (
          <Button variant="outline" size="sm" onClick={onUpgradeClick} className="text-xs h-7">
            Mejorar plan
          </Button>
        )}
      </div>

      {/* Warnings */}
      {usage.hasWarnings && usage.warnings.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-md p-2 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-xs text-warning-foreground">
              {usage.warnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Limits */}
      <div className="space-y-3">
        {limitedItems.map((item) => (
          <LimitItem key={item.resource} item={item} />
        ))}
      </div>

      {/* Quick Stats */}
      {usage.quickStats && (usage.quickStats.atLimit > 0 || usage.quickStats.nearLimit > 0) && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {usage.quickStats.atLimit > 0 && (
              <span className="text-destructive">
                {usage.quickStats.atLimit} en límite
              </span>
            )}
            {usage.quickStats.nearLimit > 0 && (
              <span className="text-warning">
                {usage.quickStats.nearLimit} cerca del límite
              </span>
            )}
            {usage.quickStats.unlimited > 0 && (
              <span>
                {usage.quickStats.unlimited} ilimitados
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ==================== LIMIT ITEM ====================

interface LimitItemProps {
  item: LimitStatus;
}

function LimitItem({ item }: LimitItemProps) {
  const Icon = resourceIcons[item.resource] || FileText;
  const showAlert = item.isAtLimit || item.isNearLimit;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {showAlert && (
            <AlertTriangle
              className={cn('h-3.5 w-3.5', item.isAtLimit ? 'text-destructive' : 'text-warning')}
            />
          )}
          <span
            className={cn(
              'font-medium',
              item.isAtLimit && 'text-destructive',
              item.isNearLimit && !item.isAtLimit && 'text-warning'
            )}
          >
            {formatValue(item.current, item.unit)}
          </span>
          <span className="text-muted-foreground">
            / {formatValue(item.limit, item.unit)}
          </span>
        </div>
      </div>
      <Progress
        value={item.percentage}
        className={cn(
          'h-1.5',
          item.isAtLimit && '[&>div]:bg-destructive',
          item.isNearLimit && !item.isAtLimit && '[&>div]:bg-warning'
        )}
      />
    </div>
  );
}

// ==================== HELPERS ====================

function formatValue(value: number, unit: string): string {
  if (unit === 'MB' || unit === 'mb') {
    if (value >= 1024) {
      return `${(value / 1024).toFixed(1)} GB`;
    }
    return `${value.toFixed(0)} MB`;
  }
  return value.toString();
}