import { cn } from '@/lib/utils';
import {
  Plus,
  FileText,
  BarChart3,
  Activity
} from 'lucide-react';
import { useLocation } from 'wouter';

interface QuickActionsProps {
  theme?: 'dark' | 'light';
}

interface Action {
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  gradient: string;
  route: string;
}

const actions: Action[] = [
  {
    title: 'Nova Campanha',
    description: 'Criar campanha de marketing',
    icon: Plus,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    gradient: 'from-purple-500 to-purple-600',
    route: '/app/campaigns'
  },
  {
    title: 'Novo Post',
    description: 'Publicar nas redes sociais',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    gradient: 'from-blue-500 to-blue-600',
    route: '/app/content'
  },
  {
    title: 'Relatórios',
    description: 'Ver análises e métricas',
    icon: BarChart3,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    gradient: 'from-green-500 to-green-600',
    route: '/app/reports'
  },
  {
    title: 'Status Operacional',
    description: 'Monitorar automações',
    icon: Activity,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    gradient: 'from-orange-500 to-orange-600',
    route: '/app/automation'
  }
];

export function QuickActions({ theme = 'dark' }: QuickActionsProps) {
  const [, setLocation] = useLocation();

  const handleActionClick = (route: string) => {
    setLocation(route);
  };

  return (
    <div className="glass-3d p-6 rounded-xl">
      {/* Header */}
      <div className="mb-4">
        <h3 className={cn(
          "text-lg font-bold",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Ações Rápidas
        </h3>
        <p className={cn(
          "text-xs mt-1",
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        )}>
          Acesse funcionalidades principais
        </p>
      </div>

      {/* Actions List */}
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              onClick={() => handleActionClick(action.route)}
              className={cn(
                "w-full p-4 rounded-lg transition-all duration-200",
                "hover:scale-105 active:scale-95 group",
                theme === 'dark'
                  ? 'bg-white/5 hover:bg-white/10'
                  : 'bg-gray-50 hover:bg-gray-100'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200",
                  `group-hover:bg-gradient-to-r group-hover:${action.gradient}`,
                  action.bgColor
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-colors duration-200",
                    "group-hover:text-white",
                    action.color
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className={cn(
                    "text-sm font-medium mb-0.5",
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {action.title}
                  </div>
                  <div className={cn(
                    "text-xs",
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {action.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
