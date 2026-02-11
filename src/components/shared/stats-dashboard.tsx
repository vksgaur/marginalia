'use client';

import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/shared/auth-provider';
import { useReadingStats } from '@/lib/hooks/use-articles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  Flame,
  Highlighter,
  TrendingUp,
  Library,
} from 'lucide-react';

export function StatsDashboard() {
  const isStatsOpen = useAppStore((s) => s.isStatsOpen);
  const setStatsOpen = useAppStore((s) => s.setStatsOpen);
  const { user } = useAuth();
  const userId = user?.uid || null;
  const stats = useReadingStats(userId);

  if (!stats) return null;

  const maxWeekly = Math.max(...stats.weeklyData.map((w) => w.count), 1);

  return (
    <Dialog open={isStatsOpen} onOpenChange={setStatsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Reading Stats
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Library className="h-4 w-4" />}
              label="Total Articles"
              value={stats.totalArticles}
            />
            <StatCard
              icon={<BookOpen className="h-4 w-4" />}
              label="Articles Read"
              value={stats.readArticles}
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Total Read Time"
              value={`${Math.round(stats.totalReadTime / 60)}m`}
            />
            <StatCard
              icon={<Flame className="h-4 w-4" />}
              label="Reading Streak"
              value={`${stats.streak} day${stats.streak !== 1 ? 's' : ''}`}
            />
          </div>

          {/* Period stats */}
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">This week: </span>
              <span className="font-medium">{stats.readThisWeek} read</span>
            </div>
            <div>
              <span className="text-muted-foreground">This month: </span>
              <span className="font-medium">{stats.readThisMonth} read</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg time: </span>
              <span className="font-medium">{Math.round(stats.avgReadTime / 60)}m</span>
            </div>
          </div>

          {/* Weekly chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Articles Read Per Week</h4>
            <div className="flex items-end gap-1.5 h-24">
              {stats.weeklyData.map((week, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: '80px' }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t bg-primary/80 transition-all"
                      style={{
                        height: `${Math.max((week.count / maxWeekly) * 100, week.count > 0 ? 8 : 0)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{week.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights + Top Tags */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Highlighter className="h-4 w-4 text-yellow-500" />
              <span>{stats.highlightCount} highlights</span>
            </div>

            {stats.topTags.length > 0 && (
              <div className="flex-1">
                <div className="flex gap-1 flex-wrap">
                  {stats.topTags.map(({ tag, count }) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
