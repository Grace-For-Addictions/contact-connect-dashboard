import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Plus, UserPlus, MessageSquarePlus, Target, ClipboardCheck, Users2 } from 'lucide-react';

const actions = [
  { name: 'Add Participant', icon: UserPlus, page: 'AddParticipant', color: 'bg-[#5B9A9A]' },
  { name: 'Log Interaction', icon: MessageSquarePlus, page: 'LogInteraction', color: 'bg-[#C9A962]' },
  { name: 'New Check-in', icon: ClipboardCheck, page: 'CheckIns', color: 'bg-emerald-500' },
  { name: 'Add Goal', icon: Target, page: 'GoalsMilestones', color: 'bg-purple-500' },
  { name: 'Group Session', icon: Users2, page: 'GroupSessions', color: 'bg-blue-500' },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => (
          <Link
            key={action.name}
            to={createPageUrl(action.page)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
          >
            <div className={`p-3 rounded-xl ${action.color} text-white group-hover:scale-110 transition-transform`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">{action.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}