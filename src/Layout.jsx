import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { db } from '@/api/client';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Target,
  Award,
  Heart,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  UserCircle,
  MessageSquare,
  ClipboardList,
  Compass,
  Users2,
  TrendingUp,
  Sparkles,
  Home,
  ShieldAlert,
  Sprout,
  Star,
  MessagesSquare,
  CalendarDays,
  Pill
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  const navigation = [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
    { 
      name: 'Participants',
      icon: Users,
      children: [
        { name: 'All Participants', page: 'Participants' },
        { name: 'Add Participant', page: 'AddParticipant' },
        { name: 'Recovery Tracker', page: 'RecoveryTracker' },
      ]
    },
    {
      name: 'Interactions',
      icon: MessageSquare,
      children: [
        { name: 'All Interactions', page: 'Interactions' },
        { name: 'Log Interaction', page: 'NewInteraction' },
        { name: 'Group Sessions', page: 'GroupSessions' },
      ]
    },
    {
      name: 'Progress',
      icon: TrendingUp,
      children: [
        { name: 'Goals & Milestones', page: 'GoalsMilestones' },
        { name: 'Check-ins', page: 'CheckIns' },
        { name: 'Recovery Capital', page: 'RecoveryCapitalPage' },
      ]
    },
    {
      name: 'Assessments',
      icon: ClipboardList,
      children: [
        { name: 'Strength Quizzes', page: 'StrengthQuizzes' },
        { name: 'Surveys', page: 'Surveys' },
        { name: 'Affirmations', page: 'Affirmations' },
      ]
    },
    { name: 'Referrals', page: 'Referrals', icon: Compass },
    { name: 'Recovery Residences', page: 'RecoveryResidences', icon: Home },
    { name: 'Staff Operations', page: 'StaffOperations', icon: ShieldAlert },
    {
      name: 'VRCC Community',
      icon: Sparkles,
      children: [
        { name: 'BARC-10 Assessment', page: 'BARC10' },
        { name: 'Walls of Honor', page: 'WallsOfHonor' },
        { name: 'Safe Chat Rooms', page: 'CommunityRooms' },
        { name: 'Events Wall', page: 'EventsWall' },
        { name: 'Narcan Tracking', page: 'NarcanTracking' },
      ]
    },
    { name: 'Resources', page: 'CommunityResources', icon: Heart },
    { name: 'Progress Reviews', page: 'ProgressReviews', icon: FileText },
    { name: 'Coach Training', page: 'CoachTraining', icon: Sparkles },
    { name: 'Reports', page: 'Reports', icon: BarChart3 },
  ];

  const handleLogout = () => {
    db.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --gfa-teal: #5B9A9A;
          --gfa-teal-light: #A8D5D5;
          --gfa-teal-dark: #3D7A7A;
          --gfa-gold: #C9A962;
          --gfa-cream: #F5F3EE;
          --gfa-charcoal: #2D3748;
        }
      `}</style>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B9A9A] to-[#3D7A7A] flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <h1 className="font-bold text-[#2D3748] text-lg leading-tight">Grace For Addictions</h1>
                <p className="text-xs text-slate-500">Recovery Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => setExpandedSection(expandedSection === item.name ? null : item.name)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                          expandedSection === item.name || item.children.some(c => c.page === currentPageName)
                            ? "bg-[#5B9A9A]/10 text-[#3D7A7A]"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </div>
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform",
                          expandedSection === item.name && "rotate-180"
                        )} />
                      </button>
                      {(expandedSection === item.name || item.children.some(c => c.page === currentPageName)) && (
                        <ul className="mt-1 ml-8 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.page}>
                              <Link
                                to={createPageUrl(child.page)}
                                className={cn(
                                  "block px-4 py-2 rounded-lg text-sm transition-all",
                                  currentPageName === child.page
                                    ? "bg-[#5B9A9A] text-white font-medium"
                                    : "text-slate-600 hover:bg-slate-100"
                                )}
                                onClick={() => setSidebarOpen(false)}
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={createPageUrl(item.page)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        currentPageName === item.page
                          ? "bg-[#5B9A9A] text-white shadow-lg shadow-[#5B9A9A]/25"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-[#5B9A9A]/20 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-[#5B9A9A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.role || 'Staff'}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-100">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="hidden lg:block">
              <p className="text-sm text-slate-500">
                "Transforming Lives by Inspiring Hope to Empower Communities"
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-[#5B9A9A]/10 text-[#3D7A7A] text-xs font-medium">
                No Fees, No Stigma, Just Grace
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}