import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  TrendingUp, 
  MousePointer, 
  Target, 
  DollarSign,
  Instagram,
  Facebook,
  Brain,
  Calendar,
  Users,
  Video,
  Sun,
  Moon,
  Settings,
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";

// Theme Context
import { MarketingThemeProvider, useMarketingTheme } from "@/context/MarketingThemeContext";

interface MarketingMetric {
  id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  impressionsChange: number;
  clicksChange: number;
  conversionsChange: number;
  roiChange: number;
}

interface MarketingChannel {
  id: string;
  channelName: string;
  trafficPercentage: number;
  performanceData: {
    impressions: number;
    engagement: number;
  };
}

interface MarketingAiInsight {
  id: string;
  insightText: string;
  category: string;
  confidenceScore: number;
}

function WeatherCard({ theme }: { theme: string }) {
  return (
    <div className="glass-3d p-6 w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="text-left">
          <div className="text-3xl font-bold text-white">26°</div>
          <div className="text-sm text-gray-400">Clear</div>
        </div>
        <div className="w-16 h-16 rounded-full gradient-purple-blue flex items-center justify-center">
          <Sun className="w-8 h-8 text-white" />
        </div>
      </div>
      <div className="text-sm text-gray-400 mb-4">New York City, USA</div>
      
      {/* Chart Bars */}
      <div className="flex items-end gap-2 h-20">
        {[0.4, 0.6, 0.8, 1, 0.7, 0.5, 0.3].map((height, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-lg gradient-purple-blue"
            style={{ height: `${height * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ControlButtons() {
  return (
    <div className="flex flex-col gap-4">
      {/* Top row buttons */}
      <div className="flex gap-4">
        <button className="glass-button-3d p-4 rounded-2xl">
          <Settings className="w-6 h-6 text-white" />
        </button>
        <div className="glass-3d p-3 px-6 rounded-2xl flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400">Search</span>
        </div>
      </div>

      {/* Second row buttons */}
      <div className="flex gap-4">
        <button className="glass-button-3d p-4 rounded-2xl">
          <Plus className="w-6 h-6 text-white" />
        </button>
        <button className="glass-button-3d p-4 rounded-2xl">
          <ArrowRight className="w-6 h-6 text-white" />
        </button>
        <button className="glass-button-3d p-4 rounded-2xl">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <button className="glass-button-3d p-4 rounded-2xl">
          <Bookmark className="w-6 h-6 text-purple-400" />
        </button>
      </div>

      {/* Third row - smaller buttons */}
      <div className="flex gap-3">
        <button className="glass-button-3d p-3 rounded-xl">
          <Users className="w-5 h-5 text-white" />
        </button>
        <button className="glass-button-3d p-3 rounded-xl">
          <Brain className="w-5 h-5 text-purple-400" />
        </button>
        <button className="glass-button-3d p-3 rounded-xl">
          <Target className="w-5 h-5 text-white" />
        </button>
        <button className="glass-button-3d p-3 rounded-xl">
          <Calendar className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}

function CircularProgress({ value, label, subtitle }: { value: number; label: string; subtitle?: string }) {
  return (
    <div className="glass-3d p-6 rounded-3xl flex flex-col items-center">
      <div className="relative w-32 h-32 mb-4">
        <div className="circular-progress-3d w-full h-full">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
          </div>
        </div>
      </div>
      {subtitle && <div className="text-sm text-gray-400">{subtitle}</div>}
    </div>
  );
}

function ActionsList() {
  const actions = [
    { icon: Brain, label: "Lorem ipsum dolor", distance: "32 km" },
    { icon: Users, label: "Lorem ipsum", distance: "47 km" },
    { icon: Target, label: "Lorem ipsum dolor sit amet", distance: "16 km" }
  ];

  return (
    <div className="glass-3d p-6 w-80">
      <div className="space-y-4">
        {actions.map((action, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              index === 0 ? 'gradient-purple-blue' : 
              index === 1 ? 'bg-purple-600' : 'bg-blue-600'
            }`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white text-sm">{action.label}</div>
              <div className="text-gray-400 text-xs">New York, USA</div>
            </div>
            <div className="text-gray-400 text-sm">{action.distance}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopButtons() {
  return (
    <div className="flex gap-4 mb-8">
      <div className="glass-3d px-6 py-3 rounded-2xl flex items-center gap-3">
        <div className="text-white font-medium">RESUME</div>
      </div>
      <button className="glass-button-3d px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="w-4 h-8 bg-white rounded-sm"></div>
          <div className="w-4 h-8 bg-white rounded-sm"></div>
        </div>
      </button>
      <div className="glass-3d px-6 py-3 rounded-2xl">
        <div className="text-white font-medium">FINISH</div>
      </div>
      
      {/* Progress circle */}
      <div className="ml-8">
        <div className="w-20 h-20 rounded-full gradient-purple-blue flex items-center justify-center">
          <Settings className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <div className="glass-3d px-6 py-3 rounded-2xl ml-8">
        <div className="text-white font-medium">LOREM IPSUM</div>
      </div>
      
      {/* Right side circles */}
      <div className="ml-auto flex gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center">
          <div className="text-white font-medium">CHANGE</div>
        </div>
        <div className="w-16 h-16 rounded-full bg-gray-700"></div>
        <div className="w-16 h-16 rounded-full gradient-purple-blue"></div>
      </div>
    </div>
  );
}

function MarketingDashboard3DInner() {
  const { id } = useParams<{ id: string }>();
  const { theme, toggleTheme } = useMarketingTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('month');
  
  // Use um ID padrão para demonstração se não fornecido
  const organizationId = id || '123e4567-e89b-12d3-a456-426614174000';

  return (
    <div className={cn(
      "min-h-screen p-8 transition-all duration-500",
      theme === 'dark' 
        ? "marketing-gradient-bg text-white" 
        : "marketing-gradient-bg light text-gray-900"
    )}>
      <div className="max-w-7xl mx-auto">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Marketing Dashboard 3D
          </h1>
          
          <button
            onClick={toggleTheme}
            className="glass-button-3d p-3 rounded-xl transition-all duration-300 hover:scale-105"
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-purple-400" />}
          </button>
        </div>

        {/* Top control buttons */}
        <TopButtons />

        {/* Main content grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left column - Weather card */}
          <div className="col-span-4">
            <WeatherCard theme={theme} />
          </div>

          {/* Middle column - Control buttons */}
          <div className="col-span-4 flex justify-center">
            <ControlButtons />
          </div>

          {/* Right column - Actions list */}
          <div className="col-span-4">
            <ActionsList />
          </div>
        </div>

        {/* Bottom row - Circular progress indicators */}
        <div className="mt-8 flex justify-center gap-6">
          <CircularProgress value={14} label="km" />
          <CircularProgress value={9.2} label="Good" />
        </div>
      </div>
    </div>
  );
}

export default function MarketingDashboard3D() {
  return (
    <MarketingThemeProvider>
      <MarketingDashboard3DInner />
    </MarketingThemeProvider>
  );
}