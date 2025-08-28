import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bot,
  ChartLine,
  Megaphone,
  Headphones,
  TrendingUp,
  Settings,
  Cog,
  Plug,
  PieChart,
  CreditCard,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const navigationItems = [
    { name: "Dashboard", href: "#dashboard", icon: ChartLine, active: true },
    { 
      name: "AI Modules", 
      items: [
        { name: "Marketing AI", href: "#marketing", icon: Megaphone, badge: true },
        { name: "Support AI", href: "#support", icon: Headphones, badge: true },
        { name: "Trading AI", href: "#trading", icon: TrendingUp, badge: true },
      ]
    },
    {
      name: "Automation",
      items: [
        { name: "Automations", href: "#automations", icon: Cog },
        { name: "Integrations", href: "#integrations", icon: Plug },
      ]
    },
    {
      name: "Management", 
      items: [
        { name: "Analytics", href: "#analytics", icon: PieChart },
        { name: "Billing", href: "#billing", icon: CreditCard },
        { name: "Settings", href: "#settings", icon: Settings },
      ]
    }
  ];

  return (
    <div className={cn(
      "w-64 bg-card shadow-lg border-r border-border flex flex-col transition-transform duration-300",
      !isOpen && "lg:translate-x-0 -translate-x-full fixed lg:relative z-50 h-full"
    )}>
      {/* Organization Selector */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Bot className="text-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Automation Global</h1>
            <p className="text-xs text-muted-foreground">AI-Powered Platform</p>
          </div>
        </div>
        
        {/* Organization Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              data-testid="org-selector"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                    AC
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Acme Corp</p>
                  <p className="text-xs text-muted-foreground">Professional Plan</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>Switch Organization</DropdownMenuItem>
            <DropdownMenuItem>Create Organization</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((section, index) => (
          <div key={index}>
            {section.items ? (
              <div className="space-y-1">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {section.name}
                </p>
                {section.items.map((item, itemIndex) => (
                  <Button
                    key={itemIndex}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-foreground hover:bg-muted",
                      item.href === "#dashboard" && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  section.active 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "text-foreground hover:bg-muted"
                )}
                data-testid={`nav-${section.name.toLowerCase()}`}
              >
                <section.icon className="mr-3 h-4 w-4" />
                <span>{section.name}</span>
              </Button>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-500 text-white">
              JS
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">John Smith</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="user-menu">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
