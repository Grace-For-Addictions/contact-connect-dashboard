import React from 'react';
import { format } from 'date-fns';
import { MessageSquare, Target, Award, UserPlus, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const activityIcons = {
  interaction: { icon: MessageSquare, color: 'bg-[#5B9A9A]/10 text-[#5B9A9A]' },
  goal: { icon: Target, color: 'bg-purple-50 text-purple-600' },
  milestone: { icon: Award, color: 'bg-[#C9A962]/10 text-[#C9A962]' },
  participant: { icon: UserPlus, color: 'bg-emerald-50 text-emerald-600' },
  checkin: { icon: ClipboardList, color: 'bg-blue-50 text-blue-600' },
};

export default function RecentActivity({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-slate-500">
          <p>No recent activity to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const { icon: Icon, color } = activityIcons[activity.type] || activityIcons.interaction;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                <p className="text-xs text-slate-500">{activity.description}</p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {activity.date ? format(new Date(activity.date), 'MMM d') : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}