import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function UpcomingItems({ items = [], title = "Upcoming" }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No upcoming items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.slice(0, 5).map((item, index) => (
          <div key={index} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{item.title}</p>
                {item.participant && (
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <User className="w-3 h-3" />
                    <span>{item.participant}</span>
                  </div>
                )}
              </div>
              <Badge variant="outline" className="shrink-0 text-[#5B9A9A] border-[#5B9A9A]/30">
                {item.type}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{item.date ? format(new Date(item.date), 'MMM d, yyyy') : ''}</span>
              </div>
              {item.time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.time}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}