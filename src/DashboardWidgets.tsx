import React, { useState, useEffect } from 'react';
import { RefreshCw, Quote, Lightbulb, BookOpen, Puzzle, CloudSun, Calendar as CalendarIcon, MapPin, Search, X, Palmtree, School, Clock, ChevronLeft, ChevronRight, Wind, Droplets, Sun, Sunrise, Sunset, Moon, Star, Sparkles, CalendarClock, Bell, Settings, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


// NOTE TO USER: You need to get a free API key from https://api-ninjas.com/
// and add it to your .env file as VITE_API_NINJAS_KEY="YOUR_KEY_HERE"
const API_KEY = (import.meta as any).env.VITE_API_NINJAS_KEY;

// --- Custom Hook for API Ninja Widgets ---
const useApiNinja = (endpoint: string) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        if (!API_KEY) {
            setError("API Key is missing from .env file.");
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`https://api.api-ninjas.com/v1/${endpoint}`, {
                headers: { 'X-Api-Key': API_KEY }
            });
            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            const result = await res.json();
            setData(Array.isArray(result) ? result[0] : result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [endpoint]);

    return { data, loading, error, refresh: fetchData };
};

// --- Reusable Widget Components ---

export const WidgetContainer: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col ${className}`}>
        {children}
    </div>
);

const WidgetHeader: React.FC<{ title: string, icon: React.ElementType, onRefresh?: () => void }> = ({ title, icon: Icon, onRefresh }) => (
    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-slate-700">
            <Icon className="w-4 h-4 text-brand-500" />
            <span>{title}</span>
        </div>
        {onRefresh && (
            <button onClick={onRefresh} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full">
                <RefreshCw className="w-3 h-3" />
            </button>
        )}
    </div>
);

const WidgetContent: React.FC<{ children: React.ReactNode, loading?: boolean, error?: string | null }> = ({ children, loading, error }) => {
    if (loading) {
        return <div className="p-4 flex-1 flex items-center justify-center text-slate-400"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
    }
    if (error) {
        return <div className="p-4 flex-1 text-xs text-red-500 bg-red-50">{error}</div>;
    }
    return <div className="p-4 flex-1">{children}</div>;
};

// --- New API Widgets ---

export const QuoteWidget = () => {
    const { data, loading, error, refresh } = useApiNinja('quotes?category=learning');
    return (
        <WidgetContainer>
            <WidgetHeader title="Quote of the Day" icon={Quote} onRefresh={refresh} />
            <WidgetContent loading={loading} error={error}>
                {data && (
                    <div className="flex flex-col h-full">
                        <blockquote className="text-lg font-medium text-slate-700 flex-1">“{data.quote}”</blockquote>
                        <p className="text-right text-sm font-bold text-slate-500 mt-4">— {data.author}</p>
                    </div>
                )}
            </WidgetContent>
        </WidgetContainer>
    );
};

export const FactWidget = () => {
    const { data, loading, error, refresh } = useApiNinja('facts');
    return (
        <WidgetContainer>
            <WidgetHeader title="Random Fact" icon={Lightbulb} onRefresh={refresh} />
            <WidgetContent loading={loading} error={error}>
                {data && <p className="text-slate-700 text-base">{data.fact}</p>}
            </WidgetContent>
        </WidgetContainer>
    );
};

export const HistoryWidget = () => {
    const { data, loading, error, refresh } = useApiNinja('historicalevents');
    return (
        <WidgetContainer>
            <WidgetHeader title="On This Day in History" icon={BookOpen} onRefresh={refresh} />
            <WidgetContent loading={loading} error={error}>
                {data && (
                    <div className="space-y-2">
                        <p className="text-sm text-slate-600">
                            In the year <span className="font-bold text-slate-800">{data.year}</span>, {data.event}.
                        </p>
                    </div>
                )}
            </WidgetContent>
        </WidgetContainer>
    );
};

export const RiddleWidget = () => {
    const { data, loading, error, refresh } = useApiNinja('riddles');
    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => {
        setShowAnswer(false);
    }, [data]);

    return (
        <WidgetContainer>
            <WidgetHeader title="Riddle Me This" icon={Puzzle} onRefresh={refresh} />
            <WidgetContent loading={loading} error={error}>
                {data && (
                    <div className="flex flex-col h-full">
                        <p className="text-slate-700 flex-1">{data.question}</p>
                        <button onClick={() => setShowAnswer(!showAnswer)} className="text-xs text-brand-600 font-bold mt-2 self-start">
                            {showAnswer ? 'Hide Answer' : 'Show Answer'}
                        </button>
                        {showAnswer && (
                            <p className="mt-2 p-2 bg-slate-100 rounded text-sm font-bold text-slate-800 animate-in fade-in">
                                {data.answer}
                            </p>
                        )}
                    </div>
                )}
            </WidgetContent>
        </WidgetContainer>
    );
};

// --- Dashboard Specific Widgets (Moved from LandingPage to fix circular deps) ---

export const WeatherWidget: React.FC<{ data: any }> = ({ data }) => {
    const { weather, location, isEditingLocation, setIsEditingLocation, handleLocationSearch, searchQuery, setSearchQuery } = data;
    return (
        <div className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <CloudSun className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex-1 flex flex-col">
                {isEditingLocation ? (
                    <form onSubmit={handleLocationSearch} className="mb-4">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm p-1 rounded-lg border border-white/30">
                            <input 
                                autoFocus
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="City name..."
                                className="bg-transparent border-none outline-none text-white placeholder-blue-100 text-sm w-full px-2"
                            />
                            <button type="submit" className="p-1 hover:bg-white/20 rounded text-white">
                                <Search className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => setIsEditingLocation(false)} className="p-1 hover:bg-white/20 rounded text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-blue-100 text-sm font-medium flex-1 truncate">
                            <MapPin className="w-4 h-4" /> {location.name}
                        </div>
                        <button onClick={() => setIsEditingLocation(true)} className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded">
                            <Settings className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <div className="flex items-end gap-4 mb-2">
                    <span className="text-5xl font-bold">{weather ? weather.temp : '--'}°</span>
                    <span className="text-xl font-medium mb-1">{weather ? weather.condition : 'Loading...'}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-blue-50 text-xs mt-auto pt-4 border-t border-white/20">
                    <div className="flex items-center gap-2">
                        <Droplets className="w-3 h-3 opacity-70" /> Humidity: {weather ? weather.humidity : '-'}%
                    </div>
                    <div className="flex items-center gap-2">
                        <Wind className="w-3 h-3 opacity-70" /> Wind: {weather ? `${weather.windDir} ${weather.windSpeed}km/h` : '-'}
                    </div>
                    <div className="flex items-center gap-2">
                        <Sun className="w-3 h-3 opacity-70" /> UV Index: {weather ? weather.uv : '-'}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold">H:</span> {weather ? weather.high : '-'}° <span className="font-bold ml-1">L:</span> {weather ? weather.low : '-'}°
                    </div>
                    <div className="flex items-center gap-2 col-span-2 mt-1 pt-2 border-t border-white/10">
                        <Sunrise className="w-3 h-3 text-yellow-300" /> {weather ? weather.sunrise : '--:--'} 
                        <span className="mx-1 opacity-50">|</span>
                        <Sunset className="w-3 h-3 text-orange-300" /> {weather ? weather.sunset : '--:--'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AstronomyWidget: React.FC<{ data: any }> = ({ data }) => {
    const { weather, astroEvents, getMoonPhaseName } = data;
    return (
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border border-slate-800 h-full flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Star className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold mb-4 uppercase tracking-wider">
                    <Moon className="w-4 h-4" /> Astronomy
                </div>
                
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="text-2xl font-bold text-white">{weather ? getMoonPhaseName(weather.moonPhase) : '--'}</div>
                        <div className="text-xs text-slate-400 mt-1 flex gap-3">
                            <span>Rise: {weather ? weather.moonrise : '--:--'}</span>
                            <span>Set: {weather ? weather.moonset : '--:--'}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-500 shadow-[0_0_15px_rgba(255,255,255,0.1)] relative overflow-hidden">
                        <div className={`absolute inset-0 bg-slate-900 transition-all duration-1000 ${weather && weather.moonPhase > 0.5 ? 'left-1/2' : 'right-1/2'}`} style={{ opacity: 0.5 }}></div>
                    </div>
                </div>

                <div className="space-y-3 border-t border-slate-800 pt-4 mt-auto">
                    <div className="text-xs font-bold text-slate-500 uppercase">Upcoming Events</div>
                    {astroEvents.map((e: any) => (
                        <div key={e.name} className="flex justify-between items-center text-sm">
                            <span className="text-slate-300 flex items-center gap-2"><Sparkles className="w-3 h-3 text-amber-400" /> {e.name}</span>
                            <span className="text-slate-500 text-xs">{new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const CalendarWidget: React.FC<{ data: any }> = ({ data }) => {
    const { scheduleItems, viewDate, calendarView, setCalendarView, navigateView, isSameDay, allEvents } = data;
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                    <CalendarIcon className="w-4 h-4 text-brand-500" />
                    <span>Calendar</span>
                </div>
                <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                    <button
                        onClick={() => setCalendarView('schedule')}
                        className={`px-2 py-1 text-[10px] font-bold rounded ${calendarView === 'schedule' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        List
                    </button >
                    <button 
                        onClick={() => { setCalendarView('week'); data.setViewDate(new Date()); }}
                        className={`px-2 py-1 text-[10px] font-bold rounded ${calendarView === 'week' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Week
                    </button>
                    <button 
                        onClick={() => { setCalendarView('month'); data.setViewDate(new Date()); }}
                        className={`px-2 py-1 text-[10px] font-bold rounded ${calendarView === 'month' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Month
                    </button>
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                {calendarView === 'schedule' ? (
                    <>
                        <div className="text-sm font-medium text-slate-400 uppercase mb-4">{dateStr}</div>
                        <div className="space-y-4">
                            {scheduleItems.length > 0 ? scheduleItems.map((item: any) => {
                                let styles = 'bg-slate-50 border-slate-300';
                                if (item.type === 'event') styles = 'bg-amber-50 border-amber-400';
                                if (item.type === 'exam') styles = 'bg-purple-50 border-purple-400';
                                if (item.type === 'holiday') styles = 'bg-green-50 border-green-400';
                                if (item.type === 'term') styles = 'bg-blue-50 border-blue-400';

                                return (
                                    <div key={item.id} className="flex gap-3 items-start">
                                        <div className="w-12 text-xs font-bold text-slate-500 pt-1 text-right">
                                            {(item as any).time || new Date(item.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        </div>
                                        <div className={`flex-1 p-2 border-l-2 rounded-r text-sm ${styles}`}>
                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                {item.title}
                                                {item.type === 'holiday' && <Palmtree className="w-3 h-3 text-green-600" />}
                                                {item.type === 'term' && <School className="w-3 h-3 text-blue-600" />}
                                                {item.type === 'event' && <Clock className="w-3 h-3 text-amber-600" />}
                                            </div>
                                            <div className="text-xs text-slate-500">{item.details}</div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-4 text-slate-400 text-xs italic">
                                    No upcoming events.
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <button onClick={() => navigateView('prev')} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-sm font-bold text-slate-700">
                                {calendarView === 'month' 
                                    ? viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                    : `Week of ${viewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                }
                            </span>
                            <button onClick={() => navigateView('next')} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight className="w-4 h-4" /></button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                            {['S','M','T','W','T','F','S'].map(d => (
                                <div key={d} className="text-[10px] font-bold text-slate-400 py-1">{d}</div>
                            ))}
                            {(() => {
                                const start = new Date(viewDate);
                                if (calendarView === 'month') {
                                    start.setDate(1);
                                    const startDay = start.getDay();
                                    start.setDate(start.getDate() - startDay);
                                } else {
                                    const day = start.getDay();
                                    start.setDate(start.getDate() - day);
                                }

                                const days = [];
                                const count = calendarView === 'month' ? 42 : 7;
                                const current = new Date(start);

                                for (let i = 0; i < count; i++) {
                                    days.push(new Date(current));
                                    current.setDate(current.getDate() + 1);
                                }

                                return days.map((d, idx) => {
                                    const isToday = isSameDay(d, new Date());
                                    const isCurrentMonth = d.getMonth() === viewDate.getMonth();
                                    const dayEvents = allEvents.filter((e: any) => isSameDay(new Date(e.date), d));
                                    
                                    return (
                                        <div key={idx} className={`
                                            min-h-[40px] p-1 border border-transparent rounded-lg flex flex-col items-center justify-start
                                            ${!isCurrentMonth && calendarView === 'month' ? 'opacity-30' : ''}
                                            ${isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}
                                        `}>
                                            <span className={`text-xs ${isToday ? 'font-bold text-blue-600' : 'text-slate-600'}`}>{d.getDate()}</span>
                                            <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                                                {dayEvents.map((ev: any, ei: number) => {
                                                    let bg = 'bg-slate-400';
                                                    if (ev.type === 'event') bg = 'bg-amber-400';
                                                    if (ev.type === 'exam') bg = 'bg-purple-400';
                                                    if (ev.type === 'holiday') bg = 'bg-green-400';
                                                    if (ev.type === 'term') bg = 'bg-blue-400';
                                                    
                                                    return <div key={ei} className={`w-1.5 h-1.5 rounded-full ${bg}`} title={ev.title} />
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export const SortableWidget: React.FC<{ id: string; children: React.ReactNode; isFeatured?: boolean }> = ({ id, children, isFeatured }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`relative group ${isFeatured ? 'lg:col-span-2' : ''}`}>
            {children}
            <button {...listeners} {...attributes} className="absolute top-3 right-3 p-2 bg-black/10 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing z-20">
                <GripVertical className="w-4 h-4" />
            </button>
        </div>
    );
};

export interface WidgetConfig {
  id: string;
  name: string;
  component: React.FC<any>;
  defaultEnabled: boolean;
  featured?: boolean;
}

export const WIDGETS_CONFIG: Record<string, WidgetConfig> = {
  timetable: { id: 'timetable', name: 'Timetable', component: () => <WidgetContainer className="border-dashed border-2 items-center justify-center text-slate-400"><CalendarClock className="w-12 h-12 mb-3 opacity-20" /><h3 className="font-bold text-lg text-slate-600">Timetable</h3><p className="text-xs">Integration coming soon</p></WidgetContainer>, defaultEnabled: true, featured: true },
  reminders: { id: 'reminders', name: 'Reminders', component: () => <WidgetContainer className="border-dashed border-2 items-center justify-center text-slate-400"><Bell className="w-12 h-12 mb-3 opacity-20" /><h3 className="font-bold text-lg text-slate-600">Reminders</h3><p className="text-xs">Tasks and alerts coming soon</p></WidgetContainer>, defaultEnabled: true },
  weather: { id: 'weather', name: 'Weather', component: WeatherWidget, defaultEnabled: true },
  astronomy: { id: 'astronomy', name: 'Astronomy', component: AstronomyWidget, defaultEnabled: true },
  calendar: { id: 'calendar', name: 'Calendar', component: CalendarWidget, defaultEnabled: true, featured: true },
  quote: { id: 'quote', name: 'Quote of the Day', component: QuoteWidget, defaultEnabled: false },
  fact: { id: 'fact', name: 'Random Fact', component: FactWidget, defaultEnabled: false },
  history: { id: 'history', name: 'On This Day', component: HistoryWidget, defaultEnabled: false },
  riddle: { id: 'riddle', name: 'Riddle', component: RiddleWidget, defaultEnabled: false },
};