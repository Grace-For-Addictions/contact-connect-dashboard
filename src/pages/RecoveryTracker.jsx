import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays, format, subDays, addDays } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Heart, Calendar, TrendingUp, Award, User, Clock, Target } from 'lucide-react';

export default function RecoveryTracker() {
  const [selectedParticipant, setSelectedParticipant] = useState('all');
  const [timeRange, setTimeRange] = useState('30');

  const { data: participants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => base44.entities.Participant.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-date'),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list('-date_achieved'),
  });

  const filteredParticipants = selectedParticipant === 'all'
    ? participants.filter(p => p.status === 'Active')
    : participants.filter(p => p.id === selectedParticipant);

  // Calculate days in recovery for each participant
  const participantStats = filteredParticipants.map(p => {
    const daysInRecovery = p.recovery_start_date
      ? differenceInDays(new Date(), new Date(p.recovery_start_date))
      : 0;
    const participantCheckIns = checkIns.filter(c => c.participant_id === p.id);
    const participantMilestones = milestones.filter(m => m.participant_id === p.id);
    
    return {
      ...p,
      daysInRecovery,
      checkInCount: participantCheckIns.length,
      milestoneCount: participantMilestones.length,
      latestCheckIn: participantCheckIns[0],
      latestMilestone: participantMilestones[0],
    };
  }).sort((a, b) => b.daysInRecovery - a.daysInRecovery);

  // Prepare chart data - aggregate check-in wellness over time
  const chartData = [];
  const days = parseInt(timeRange);
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayCheckIns = checkIns.filter(c => {
      if (selectedParticipant !== 'all' && c.participant_id !== selectedParticipant) return false;
      return format(new Date(c.date), 'yyyy-MM-dd') === dateStr;
    });
    
    const avgMood = dayCheckIns.length > 0
      ? dayCheckIns.reduce((sum, c) => sum + (c.mood_rating || 0), 0) / dayCheckIns.length
      : null;

    chartData.push({
      date: format(date, 'MMM d'),
      mood: avgMood,
      checkIns: dayCheckIns.length,
    });
  }

  // Get milestone breakdown
  const milestonesByType = milestones
    .filter(m => selectedParticipant === 'all' || m.participant_id === selectedParticipant)
    .reduce((acc, m) => {
      acc[m.milestone_type] = (acc[m.milestone_type] || 0) + 1;
      return acc;
    }, {});

  const getDaysBadge = (days) => {
    if (days >= 365) return 'bg-[#C9A962]/10 text-[#C9A962] border-[#C9A962]/30';
    if (days >= 90) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (days >= 30) return 'bg-blue-50 text-blue-600 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recovery Tracker</h1>
          <p className="text-slate-500 mt-1">Monitor recovery progress and days in recovery</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Active Participants</SelectItem>
              {participants.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#5B9A9A]/10 to-[#5B9A9A]/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Active</p>
                <p className="text-3xl font-bold text-[#5B9A9A]">{filteredParticipants.length}</p>
              </div>
              <Heart className="w-8 h-8 text-[#5B9A9A]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#C9A962]/10 to-[#C9A962]/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Days in Recovery</p>
                <p className="text-3xl font-bold text-[#C9A962]">
                  {participantStats.length > 0
                    ? Math.round(participantStats.reduce((sum, p) => sum + p.daysInRecovery, 0) / participantStats.length)
                    : 0}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-[#C9A962]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Milestones</p>
                <p className="text-3xl font-bold text-purple-600">
                  {milestones.filter(m => selectedParticipant === 'all' || m.participant_id === selectedParticipant).length}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">90+ Days</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {participantStats.filter(p => p.daysInRecovery >= 90).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mood Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.filter(d => d.mood !== null)}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B9A9A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#5B9A9A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="mood" stroke="#5B9A9A" fill="url(#moodGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Milestone Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(milestonesByType).length === 0 ? (
                <p className="text-center text-slate-500 py-8">No milestones recorded</p>
              ) : (
                Object.entries(milestonesByType)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-[#C9A962]" />
                        <span className="font-medium">{type}</span>
                      </div>
                      <Badge className="bg-[#C9A962]/10 text-[#C9A962]">{count}</Badge>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participantStats.map((participant) => (
          <Card key={participant.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#5B9A9A]/10 flex items-center justify-center">
                    <span className="text-[#5B9A9A] font-bold">
                      {participant.first_name?.[0]}{participant.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{participant.first_name} {participant.last_name}</p>
                    <p className="text-sm text-slate-500">
                      Started {participant.recovery_start_date ? format(new Date(participant.recovery_start_date), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[#5B9A9A]/10 to-[#5B9A9A]/5 mb-4">
                <p className="text-4xl font-bold text-[#5B9A9A]">{participant.daysInRecovery}</p>
                <p className="text-sm text-slate-600">Days in Recovery</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-lg font-bold text-purple-600">{participant.checkInCount}</p>
                  <p className="text-xs text-slate-500">Check-ins</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-lg font-bold text-[#C9A962]">{participant.milestoneCount}</p>
                  <p className="text-xs text-slate-500">Milestones</p>
                </div>
              </div>

              {participant.latestCheckIn && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-slate-500 mb-1">Latest Check-in Mood</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#5B9A9A] rounded-full" 
                        style={{ width: `${(participant.latestCheckIn.mood_rating || 0) * 10}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{participant.latestCheckIn.mood_rating}/10</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {participant.daysInRecovery >= 30 && (
                  <Badge variant="outline" className={getDaysBadge(participant.daysInRecovery)}>
                    {participant.daysInRecovery >= 365 ? '1+ Year' :
                     participant.daysInRecovery >= 90 ? '90+ Days' : '30+ Days'}
                  </Badge>
                )}
                {participant.primary_substance && (
                  <Badge variant="outline" className="text-xs">{participant.primary_substance}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}