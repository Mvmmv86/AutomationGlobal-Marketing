import { cn } from '@/lib/utils';

interface PeriodFiltersProps {
  selectedPeriod: number | 'today';
  onPeriodChange: (period: number | 'today') => void;
  theme?: 'dark' | 'light';
}

const periods = [
  { label: 'Hoje', value: 'today' as const },
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 }
];

export function PeriodFilters({
  selectedPeriod,
  onPeriodChange,
  theme = 'dark'
}: PeriodFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={cn(
        "text-sm font-medium mr-2",
        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
      )}>
        Período:
      </span>

      {periods.map((period) => {
        const isActive = selectedPeriod === period.value;

        return (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              "hover:scale-105 active:scale-95",
              isActive
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                : theme === 'dark'
                  ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30"
                  : "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200"
            )}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}
