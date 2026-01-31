
import React from 'react';
import { TranslationProject, AppView } from '../types';

interface DashboardProps {
  setView?: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const stats = [
    { label: 'Total Words Translated', value: '1.2M', trend: '+12%', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    )},
    { label: 'Active Projects', value: '24', trend: '+2', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
    )},
    { label: 'Average Accuracy', value: '99.4%', trend: '+0.2%', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { label: 'Team Members', value: '12', trend: 'Active', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
  ];

  const recentProjects: TranslationProject[] = [
    { id: '1', name: 'Q4 Product Catalog', sourceLang: 'English', targetLang: 'Spanish', status: 'In Progress', progress: 65, lastModified: '2h ago' },
    { id: '2', name: 'User Manual v2.1', sourceLang: 'German', targetLang: 'French', status: 'Completed', progress: 100, lastModified: '5h ago' },
    { id: '3', name: 'Marketing Campaign', sourceLang: 'English', targetLang: 'Japanese', status: 'Pending', progress: 0, lastModified: '1d ago' },
    { id: '4', name: 'Legal Terms of Service', sourceLang: 'English', targetLang: 'German', status: 'In Progress', progress: 30, lastModified: '2d ago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Quick Actions Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-3xl shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
        </div>
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl font-bold text-white mb-2">Need Live Interpreting?</h2>
          <p className="text-indigo-100 mb-6 leading-relaxed">Experience zero-latency, AI-powered verbal translation using Gemini Live API. Perfect for international meetings and global support.</p>
          <button 
            onClick={() => setView?.(AppView.LIVE_INTERPRETER)}
            className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-all flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Launch Live Interpreter</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                {stat.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                stat.trend.startsWith('+') ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Localization Projects</h2>
          <button 
            onClick={() => alert("Project explorer view coming in v4.3. Please use the sidebar modules to manage existing translations.")}
            className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            View All Projects
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-3">Project Name</th>
                <th className="px-6 py-3">Languages</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Progress</th>
                <th className="px-6 py-3">Last Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{project.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{project.sourceLang}</span>
                      <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-800">{project.targetLang}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      project.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      project.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-32">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 font-bold">{project.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500 shadow-sm" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-400 dark:text-slate-500">{project.lastModified}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
