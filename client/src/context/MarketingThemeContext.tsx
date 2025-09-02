import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface MarketingThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const MarketingThemeContext = createContext<MarketingThemeContextType | undefined>(undefined);

interface MarketingThemeProviderProps {
  children: ReactNode;
}

export function MarketingThemeProvider({ children }: MarketingThemeProviderProps) {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('marketing-theme') as 'dark' | 'light';
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('marketing-theme', theme);
    
    // Apply CSS classes to document body for theme-specific styling
    document.body.classList.remove('marketing-theme-dark', 'marketing-theme-light');
    document.body.classList.add(`marketing-theme-${theme}`);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  };

  return (
    <MarketingThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </MarketingThemeContext.Provider>
  );
}

export function useMarketingTheme() {
  const context = useContext(MarketingThemeContext);
  if (context === undefined) {
    throw new Error('useMarketingTheme must be used within a MarketingThemeProvider');
  }
  return context;
}