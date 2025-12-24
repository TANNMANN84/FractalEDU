
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Users, 
  Layout, 
  BarChart2, 
  Activity,
  TrendingUpDown,
  Settings,
  Hexagon,
  ClipboardCheck,
  FileText
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Classes & Students', path: '/classes', icon: Users },
    { name: 'Exam Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Pre/Post Diagnostics', path: '/diagnostics', icon: TrendingUpDown },
    { name: 'Junior Monitoring', path: '/monitoring', icon: ClipboardCheck  },
    { name: 'Reporting', path: '/reporting', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full w-20 lg:w-64 bg-slate-900 text-white border-r border-slate-800 transition-all duration-300">
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
        <Hexagon className="w-8 h-8 text-brand-400" strokeWidth={2.5} />
        <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight text-white">
          Fractal<span className="text-brand-400">EDU</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-3 rounded-lg transition-colors group ${
                isActive 
                  ? 'bg-brand-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-6 h-6 shrink-0" />
            <span className="hidden lg:block ml-3 font-medium text-sm">
              {item.name}
            </span>
            
            {/* Tooltip for mobile/collapsed state */}
            <div className="lg:hidden absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
              {item.name}
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Management */}
      <div className="p-4 border-t border-slate-800">
        <NavLink 
          to="/management"
          className={({ isActive }) =>
            `flex items-center px-3 py-3 rounded-lg transition-colors group ${
              isActive 
                ? 'bg-brand-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Settings className="w-6 h-6 shrink-0" />
          <span className="hidden lg:block ml-3 text-sm font-medium">Management Console</span>
          
           {/* Tooltip for mobile/collapsed state */}
           <div className="lg:hidden absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
              Management Console
            </div>
        </NavLink>
      </div>
    </div>
  );
};
