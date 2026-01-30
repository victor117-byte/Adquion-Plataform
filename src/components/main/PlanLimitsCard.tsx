import { useState, useEffect } from 'react';
import { FileText, Users, Zap, HardDrive, AlertTriangle, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription, getUsagePercentage, shouldShowLimitAlert } from '@/hooks/use-subscription';
import { get } from '@/utils/api';
import { cn } from '@/lib/utils';

interface UsageData {
  files: number;
  users: number;
  automations: number;
  storage_mb: number;
}

interface UsageResponse {
  success: boolean;
  data: UsageData;
}

interface PlanLimitsCardProps {
  onUpgradeClick?: () => void;
}

export function PlanLimitsCard({ onUpgradeClick }: PlanLimitsCardProps) {
  const { subscription, loading: subLoading, isFree } = useSubscription();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await get<UsageResponse>('/stripe/usage');
        if (response.success) {
          setUsage(response.data);
        }
      } catch (error) {
        console.error('Error fetching usage:', error);
        // Use default values if endpoint doesn't exist yet
        setUsage({ files: 0, users: 1, automations: 0, storage_mb: 0 });
      } finally {
        setLoadingUsage(false);
      }
    }
    fetchUsage();
  }, []);

  if (subLoading || loadingUsage || !subscription) {
    return null; // Don't show skeleton, just hide until loaded
  }

  const limits = subscription.limits;
  const showCard = isFree || hasAnyAlert();

  function hasAnyAlert(): boolean {
    if (!usage || !limits) return false;
    return (
      shouldShowLimitAlert(usage.files, limits.max_files) ||
      shouldShowLimitAlert(usage.users, limits.max_users) ||
      shouldShowLimitAlert(usage.automations, limits.max_sat_automations) ||
      shouldShowLimitAlert(usage.storage_mb, limits.storage_mb)
    );
  }

  // Only show for free users or when there are alerts
  if (!showCard) return null;

  const limitItems = [
    {
      label: 'Archivos',
      icon: FileText,
      current: usage?.files || 0,
      max: limits.max_files,
    },
    {
      label: 'Usuarios',
      icon: Users,
      current: usage?.users || 0,
      max: limits.max_users,
    },
    {
      label: 'Automatizaciones',
      icon: Zap,
      current: usage?.automations || 0,
      max: limits.max_sat_automations,
    },
    {
      label: 'Almacenamiento',
      icon: HardDrive,
      current: usage?.storage_mb || 0,
      max: limits.storage_mb,
      suffix: 'MB',
    },
  ].filter((item) => item.max > 0 && item.max !== -1); // Only show limited items

  if (limitItems.length === 0) return null;

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Plan {subscription.plan_name}</span>
          {isFree && (
            <Badge variant="secondary" className="text-xs">
              Gratuito
            </Badge>
          )}
        </div>
        {isFree && onUpgradeClick && (
          <Button variant="outline" size="sm" onClick={onUpgradeClick} className="text-xs h-7">
            Mejorar plan
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {limitItems.map((item) => {
          const percentage = getUsagePercentage(item.current, item.max);
          const showAlert = shouldShowLimitAlert(item.current, item.max);
          const isAtLimit = percentage >= 100;

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {showAlert && (
                    <AlertTriangle
                      className={cn(
                        'h-3.5 w-3.5',
                        isAtLimit ? 'text-destructive' : 'text-warning'
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      'font-medium',
                      isAtLimit && 'text-destructive',
                      showAlert && !isAtLimit && 'text-warning'
                    )}
                  >
                    {item.current}
                    {item.suffix && ` ${item.suffix}`}
                  </span>
                  <span className="text-muted-foreground">
                    / {item.max}
                    {item.suffix && ` ${item.suffix}`}
                  </span>
                </div>
              </div>
              <Progress
                value={percentage}
                className={cn(
                  'h-1.5',
                  isAtLimit && '[&>div]:bg-destructive',
                  showAlert && !isAtLimit && '[&>div]:bg-warning'
                )}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
