import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Settings } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSwappingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DashboardCustomizeModal } from './DashboardCustomizeModal';
import { WIDGETS_CONFIG, SortableWidget } from './DashboardWidgets';

export const LandingPage: React.FC = () => {
    
    const [weather, setWeather] = useState<{ 
        temp: number; 
        condition: string; 
        high: number; 
        low: number; 
        humidity: number;
        uv: number;
        windSpeed: number;
        windDir: string;
        sunrise: string;
        sunset: string;
        moonPhase: number;
        moonrise: string;
        moonset: string;
    } | null>(null);

    const [location, setLocation] = useState<{ name: string; lat: number; lon: number }>(() => {
        try {
            const saved = localStorage.getItem('fractal_weather_loc');
            return saved ? JSON.parse(saved) : { name: 'Sydney', lat: -33.8688, lon: 151.2093 };
        } catch (e) {
            localStorage.removeItem('fractal_weather_loc');
            return { name: 'Sydney', lat: -33.8688, lon: 151.2093 };
        }
    });

    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [holidays, setHolidays] = useState<{date: string, name: string, type: 'public' | 'school'}[]>([]);
    const [calendarView, setCalendarView] = useState<'schedule' | 'week' | 'month'>('schedule');
    const [viewDate, setViewDate] = useState(new Date());

    // Dashboard Customization State
    const [widgets, setWidgets] = useState<string[]>(() => {
        const saved = localStorage.getItem('fractal_dashboard_widgets');
        return saved ? JSON.parse(saved) : Object.values(WIDGETS_CONFIG).filter(w => w.defaultEnabled).map(w => w.id);
    });
    const [layout, setLayout] = useState<'grid' | 'featured'>(() => (localStorage.getItem('fractal_dashboard_layout') as any) || 'grid');
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

    useEffect(() => {
        // Using Open-Meteo API (Free, no key required)
        // Defaulting to Sydney (-33.8688, 151.2093) for demo purposes
        const fetchWeather = async () => {
            try {
                const { lat, lon } = location;
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,moonrise,moonset,moon_phase&timezone=auto`);
                const data = await res.json();

                // Safety check for API response
                if (!data || !data.current || !data.daily) return;
                
                const getWeatherLabel = (code: number) => {
                    if (code === 0) return 'Clear Sky';
                    if (code >= 1 && code <= 3) return 'Partly Cloudy';
                    if (code >= 45 && code <= 48) return 'Foggy';
                    if (code >= 51) return 'Rain';
                    if (code >= 95) return 'Storms';
                    return 'Overcast';
                };

                const getWindDir = (deg: number) => {
                    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                    return dirs[Math.round(deg / 45) % 8];
                };

                setWeather({
                    temp: Math.round(data.current.temperature_2m ?? 0),
                    condition: getWeatherLabel(data.current.weather_code ?? 0),
                    high: Math.round(data.daily.temperature_2m_max?.[0] ?? 0),
                    low: Math.round(data.daily.temperature_2m_min?.[0] ?? 0),
                    humidity: data.current.relative_humidity_2m ?? 0,
                    uv: data.daily.uv_index_max?.[0] ?? 0,
                    windSpeed: Math.round(data.current.wind_speed_10m ?? 0),
                    windDir: getWindDir(data.current.wind_direction_10m ?? 0),
                    sunrise: data.daily.sunrise?.[0] ? new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                    sunset: data.daily.sunset?.[0] ? new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                    moonrise: data.daily.moonrise?.[0] ? new Date(data.daily.moonrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                    moonset: data.daily.moonset?.[0] ? new Date(data.daily.moonset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                    moonPhase: data.daily.moon_phase?.[0] ?? 0
                });
            } catch (e) {
                console.error("Weather load failed", e);
            }
        };
        fetchWeather();
        localStorage.setItem('fractal_weather_loc', JSON.stringify(location));
    }, [location]);

    useEffect(() => {
        // Data sourced from: https://data.nsw.gov.au/data/dataset/2-school-and-public-holidays
        // In a production environment, you could fetch this JSON from the CKAN API.
        // For stability, we are using a static list of NSW 2024/2025 dates.
        const nswHolidays = [
            { date: '2024-01-26', name: "Australia Day", type: 'public' },
            { date: '2024-03-29', name: "Good Friday", type: 'public' },
            { date: '2024-04-01', name: "Easter Monday", type: 'public' },
            { date: '2024-04-12', name: "Term 1 Ends", type: 'school' },
            { date: '2024-04-25', name: "Anzac Day", type: 'public' },
            { date: '2024-04-29', name: "Term 2 Starts", type: 'school' },
            { date: '2024-06-10', name: "King's Birthday", type: 'public' },
            { date: '2024-07-05', name: "Term 2 Ends", type: 'school' },
            { date: '2024-07-22', name: "Term 3 Starts", type: 'school' },
            { date: '2024-09-27', name: "Term 3 Ends", type: 'school' },
            { date: '2024-10-07', name: "Labour Day", type: 'public' },
            { date: '2024-10-14', name: "Term 4 Starts", type: 'school' },
            { date: '2024-12-20', name: "Term 4 Ends", type: 'school' },
            { date: '2024-12-25', name: "Christmas Day", type: 'public' },
            { date: '2024-12-26', name: "Boxing Day", type: 'public' },
        ] as const;

        setHolidays(nswHolidays.map(h => ({ ...h, type: h.type as 'public' | 'school' })));
    }, []);

    // DND sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = widgets.indexOf(String(active.id));
            const newIndex = widgets.indexOf(String(over.id));
            setWidgets(currentWidgets => arrayMove(currentWidgets, oldIndex, newIndex));
        }
    };

    // Static Astronomy Events (Free alternative to paid APIs)
    const astroEvents = React.useMemo(() => {
        const events = [
            { date: '2024-03-20', name: 'March Equinox', type: 'Equinox' },
            { date: '2024-04-08', name: 'Total Solar Eclipse', type: 'Eclipse' },
            { date: '2024-04-22', name: 'Lyrids Meteor Shower', type: 'Meteor' },
            { date: '2024-05-05', name: 'Eta Aquarids', type: 'Meteor' },
            { date: '2024-06-20', name: 'June Solstice', type: 'Solstice' },
            { date: '2024-08-12', name: 'Perseids Meteor Shower', type: 'Meteor' },
            { date: '2024-09-18', name: 'Partial Lunar Eclipse', type: 'Eclipse' },
            { date: '2024-09-22', name: 'September Equinox', type: 'Equinox' },
        ];
        return events.filter(e => new Date(e.date) >= new Date()).slice(0, 3);
    }, []);

    const { teacherProfile, exams } = useAppStore();
    // Unified Event Source
    const allEvents = React.useMemo(() => {
        const safeExams = Array.isArray(exams) ? exams : [];
        const items = [
            // 1. Daily Mock Event
            { 
                id: 'daily-1', 
                date: new Date(), 
                title: 'Staff Briefing', 
                type: 'event', 
                details: 'Common Room',
                time: '08:30'
            },
            // 2. Exams
            ...safeExams.map(e => ({
                id: `exam-${e.id}`,
                date: new Date(e.date),
                title: e.name,
                type: 'exam',
                details: `${e.type} • ${e.questions.length} Qs`
            })),
            // 3. Holidays
            ...holidays.map((h, i) => ({
                id: `hol-${i}`,
                date: new Date(h.date),
                title: h.name,
                type: h.type === 'public' ? 'holiday' : 'term',
                details: h.type === 'public' ? 'Public Holiday' : 'Term Date'
            }))
        ];

        return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [exams, holidays]);

    // Persist widget order on change
    useEffect(() => {
        localStorage.setItem('fractal_dashboard_widgets', JSON.stringify(widgets));
    }, [widgets]);

    // Filtered List for Schedule View
    const scheduleItems = React.useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return allEvents
            .filter(i => {
                const d = new Date(i.date);
                d.setHours(0,0,0,0);
                return d >= now;
            })
            .slice(0, 5); // Show next 5 items
    }, [allEvents]);

    // Calendar Navigation Helpers
    const navigateView = (direction: 'prev' | 'next') => {
        const newDate = new Date(viewDate);
        if (calendarView === 'month') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else if (calendarView === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        }
        setViewDate(newDate);
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && 
               d1.getMonth() === d2.getMonth() && 
               d1.getFullYear() === d2.getFullYear();
    };

    const handleLocationSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                setLocation({ name: result.name, lat: result.latitude, lon: result.longitude });
                setIsEditingLocation(false);
                setSearchQuery('');
            } else {
                alert("Location not found. Please try a major city name.");
            }
        } catch (error) {
            console.error("Geocoding failed", error);
        }
    };

    const getMoonPhaseName = (phase: number) => {
        if (phase === 0 || phase === 1) return 'New Moon';
        if (phase > 0 && phase < 0.25) return 'Waxing Crescent';
        if (phase === 0.25) return 'First Quarter';
        if (phase > 0.25 && phase < 0.5) return 'Waxing Gibbous';
        if (phase === 0.5) return 'Full Moon';
        if (phase > 0.5 && phase < 0.75) return 'Waning Gibbous';
        if (phase === 0.75) return 'Last Quarter';
        return 'Waning Crescent';
    };

    const handleSetLayout = (newLayout: 'grid' | 'featured') => {
        setLayout(newLayout);
        localStorage.setItem('fractal_dashboard_layout', newLayout);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        Welcome, {teacherProfile?.title} {teacherProfile?.name || 'Teacher'}
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Here's an overview of your teaching dashboard.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCustomizeModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm">
                        <Settings className="w-4 h-4" /> Customize
                    </button>
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-slate-400 uppercase">{teacherProfile?.schoolName || 'Fractal EDU'}</p>
                        <p className="text-xs text-slate-400">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Widgets Grid */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={widgets} strategy={rectSwappingStrategy}>
                        <div className={`grid gap-6 ${layout === 'featured' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                            {widgets.map((widgetId, index) => {
                                const config = WIDGETS_CONFIG[widgetId];
                                if (!config) return null;
                                const WidgetComponent = config.component;
                                const isFeatured = layout === 'featured' && index === 0 && config.featured;

                                return (
                                    <SortableWidget key={widgetId} id={widgetId} isFeatured={isFeatured} >
                                        <WidgetComponent
                                            data={{
                                                weather, location, isEditingLocation,
                                                setIsEditingLocation, handleLocationSearch,
                                                searchQuery, setSearchQuery, allEvents,
                                                scheduleItems, viewDate, setViewDate,
                                                calendarView, setCalendarView, navigateView,
                                                isSameDay, astroEvents, getMoonPhaseName
                                            }}
                                        />
                                    </SortableWidget>
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {isCustomizeModalOpen && (
                <DashboardCustomizeModal
                    isOpen={isCustomizeModalOpen}
                    onClose={() => setIsCustomizeModalOpen(false)}
                    widgets={widgets}
                    setWidgets={setWidgets}
                    layout={layout}
                    setLayout={handleSetLayout}
                />
            )}
        </div>
    );
};