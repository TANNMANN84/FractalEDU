import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/store';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, CloudOff, Save, CheckCircle, CloudSun, MapPin, Wind, Droplets, Calendar } from 'lucide-react';
import { useAutoSync } from '@/hooks/useAutoSync';

export const RootLayout: React.FC = () => {
  const { teacherProfile } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { isConnected, hasUnsavedChanges, saveNow, reconnect } = useAutoSync();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';

  // Weather State
  const [weather, setWeather] = useState<{ 
      temp: number; 
      condition: string; 
      location: string;
      high: number;
      low: number;
      feelsLike: number;
      humidity: number;
      wind: number;
      tomorrow: { high: number; condition: string };
  } | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Default to Inverell (User Request)
        let lat = -29.7725;
        let lon = 151.1139;
        let name = 'Inverell';

        const saved = localStorage.getItem('fractal_weather_loc');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.lat && parsed.lon) {
                    lat = parsed.lat;
                    lon = parsed.lon;
                    name = parsed.name;
                }
            } catch (e) { /* ignore */ }
        }

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        
        if (data.current && data.daily) {
            const getCondition = (code: number) => {
                if (code === 0) return 'Clear';
                if (code >= 1 && code <= 3) return 'Cloudy';
                if (code >= 45 && code <= 48) return 'Fog';
                if (code >= 51 && code <= 67) return 'Rain';
                if (code >= 71) return 'Snow';
                if (code >= 95) return 'Storm';
                return 'Overcast';
            };

            setWeather({ 
                temp: Math.round(data.current.temperature_2m), 
                condition: getCondition(data.current.weather_code), 
                location: name,
                high: Math.round(data.daily.temperature_2m_max[0]),
                low: Math.round(data.daily.temperature_2m_min[0]),
                feelsLike: Math.round(data.current.apparent_temperature),
                humidity: Math.round(data.current.relative_humidity_2m),
                wind: Math.round(data.current.wind_speed_10m),
                tomorrow: {
                    high: Math.round(data.daily.temperature_2m_max[1]),
                    condition: getCondition(data.daily.weather_code[1])
                }
            });
        }
      } catch (e) {
        console.error("Header weather fetch failed", e);
      }
    };
    
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // 10 mins
    return () => clearInterval(interval);
  }, []);

  const displayName = teacherProfile?.name || 'John Doe';
  const displayRole = teacherProfile?.role || 'Head of Science';
  const displayInitials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* HEADER */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shadow-sm shrink-0 z-10 transition-colors duration-200 gap-6">
          
          {/* LEFT: Weather Widget (Replaces Title) */}
          <div className="flex items-center min-w-fit">
            {weather ? (
                <div className="relative group z-20">
                    {/* Main Banner */}
                    <div className="flex items-center gap-5 px-5 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 transition-all cursor-default shadow-sm">
                        
                        {/* Icon & Location */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-slate-700 rounded-lg text-blue-500 dark:text-blue-400">
                                <CloudSun className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                                    <MapPin className="w-3 h-3" /> {weather.location}
                                </div>
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">
                                    {weather.condition}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

                        {/* Current Temp */}
                        <div className="flex flex-col justify-center">
                            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{weather.temp}°C</span>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">Feels {weather.feelsLike}°C</span>
                        </div>

                        {/* Extra Stats (Visible on larger screens) */}
                        <div className="hidden xl:flex items-center gap-5 border-l border-slate-200 dark:border-slate-700 pl-5">
                             <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Today</span>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">H:{weather.high}°C L:{weather.low}°C</span>
                             </div>
                             <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Wind</span>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                    <Wind className="w-3 h-3" /> {weather.wind}km/h
                                </span>
                             </div>
                        </div>
                    </div>

                    {/* Expanded Dropdown (Hover) */}
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-left scale-95 group-hover:scale-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Extended Forecast
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><Droplets className="w-3 h-3"/> Humidity</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{weather.humidity}%</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-slate-500 dark:text-slate-400">Tomorrow</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200 text-right">
                                    {weather.tomorrow.condition}<br/>
                                    <span className="text-xs opacity-75">High: {weather.tomorrow.high}°C</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-14 w-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
            )}
          </div>

          {/* CENTER: Spacer (Pushes search to right) */}
          <div className="flex-1"></div>

          {/* RIGHT: Global Search & Actions */}
          <div className="flex items-center gap-3 min-w-fit">
            
            {/* Sync Controls */}
            {!isConnected ? (
              <button 
                onClick={reconnect}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/30"
                title="Click to reconnect to local folder"
              >
                <CloudOff className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnected</span>
              </button>
            ) : (
              <button 
                onClick={saveNow}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-full transition-all duration-200 ${
                  hasUnsavedChanges 
                    ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800' 
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800'
                }`}
                title={hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
              >
                {hasUnsavedChanges ? <Save className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                <span className="hidden sm:inline">{hasUnsavedChanges ? 'Save' : 'Synced'}</span>
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Theme Toggle */}
            <button 
              onClick={() => setTheme(isDark ? 'light' : 'dark')} 
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Button */}
            <button 
              onClick={() => navigate('/management')}
              className="flex items-center gap-3 p-1 pl-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="hidden md:block text-right mr-1">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                  {displayRole}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm border-2 border-transparent group-hover:border-brand-200 dark:group-hover:border-brand-700 transition-all shadow-sm">
                {displayInitials}
              </div>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};