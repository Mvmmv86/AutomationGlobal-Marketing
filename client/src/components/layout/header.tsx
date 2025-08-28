import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Menu, Search, Bell, Plus } from "lucide-react";

interface HeaderProps {
  onSidebarToggle: () => void;
  organizationName: string;
  userName: string;
}

export default function Header({ onSidebarToggle, organizationName, userName }: HeaderProps) {
  return (
    <header className="bg-card shadow-sm border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden" 
            onClick={onSidebarToggle}
            data-testid="sidebar-toggle"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {userName}! Here's your AI automation overview.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Input 
              type="search" 
              placeholder="Search automations..." 
              className="w-64 pl-10"
              data-testid="search-input"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative" data-testid="notifications">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-3 w-3 p-0 bg-destructive">
              <span className="sr-only">New notifications</span>
            </Badge>
          </Button>

          {/* Quick Actions */}
          <Button data-testid="new-automation">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Automation</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
