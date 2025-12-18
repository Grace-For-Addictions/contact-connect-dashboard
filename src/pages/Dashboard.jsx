import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { Users, MessageSquare, Target, Award, TrendingUp, Calendar, Heart, Sparkles } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import OutcomeChart from '../components/dashboard/OutcomeChart';
import UpcomingItems from '../components/dashboard/UpcomingItems';

export default function Dashboard() {
  const [engagementChartType, setEngagementChartType] = useState('area');
  const [outcomeChartType, setOutcomeChartType] = useState('bar');

  const { data: participants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => base44.entities.Participant.list(),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list('-date', 100),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.list(),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list('-date_achieved', 50),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-date', 50),
  });

  // Calculate stats
  const activeParticipants = participants.filter(p => p.status === 'Active').length;
  const thisMonthInteractions = interactions.filter(i => {
    const date = new Date(i.date);
    return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
  }).length;
  const totalHours = Math.round(interactions.reduce((sum, i) => sum + (i.duration_minutes || 0), 0) / 60);
  const completedGoals = goals.filter(g => g.status === 'Completed').length;
  const activeGoals = goals.filter(g => g.status === 'In Progress').length;

  // Calculate average days in recovery
  const avgDaysRecovery = participants.length > 0 
    ? Math.round(participants.reduce((sum, p) => {
        if (p.recovery_start_date) {
          return sum + differenceInDays(new Date(), new Date(p.recovery_start_date));
        }
        return sum;
      }, 0) / participants.filter(p => p.recovery_start_date).length) || 0
    : 0;

  // Prepare engagement data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayInteractions = interactions.filter(int => 
      format(new Date(int.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return {
      name: format(date, 'EEE'),
      value: dayInteractions.length,
      value2: dayInteractions.reduce((sum, i) => sum + (i.duration_minutes || 0), 0) / 60
    };
  });

  // Prepare outcome data by status
  const outcomeData = [
    { name: 'Active', value: participants.filter(p => p.status === 'Active').length },
    { name: 'Graduated', value: participants.filter(p => p.status === 'Graduated').length },
    { name: 'Inactive', value: participants.filter(p => p.status === 'Inactive').length },
    { name: 'Transferred', value: participants.filter(p => p.status === 'Transferred').length },
  ].filter(d => d.value > 0);

  // Prepare recent activity
  const recentActivity = [
    ...interactions.slice(0, 3).map(i => ({
      type: 'interaction',
      title: i.interaction_type,
      description: `${i.participant_name || 'Participant'} - ${i.duration_minutes} min`,
      date: i.date
    })),
    ...milestones.slice(0, 2).map(m => ({
      type: 'milestone',
      title: m.title || m.milestone_type,
      description: m.participant_name || 'Participant',
      date: m.date_achieved
    })),
    ...goals.filter(g => g.status === 'Completed').slice(0, 2).map(g => ({
      type: 'goal',
      title: g.title,
      description: g.participant_name || 'Participant',
      date: g.completed_date
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  // Prepare upcoming items
  const upcomingItems = [
    ...goals.filter(g => g.status === 'In Progress' && g.target_date).map(g => ({
      title: g.title,
      participant: g.participant_name,
      type: 'Goal',
      date: g.target_date
    })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's your recovery program overview.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Participants"
          value={activeParticipants}
          subtitle={`${participants.length} total enrolled`}
          icon={Users}
          color="teal"
        />
        <StatCard
          title="This Month's Interactions"
          value={thisMonthInteractions}
          subtitle={`${totalHours} total hours`}
          icon={MessageSquare}
          color="gold"
        />
        <StatCard
          title="Goals Completed"
          value={completedGoals}
          subtitle={`${activeGoals} in progress`}
          icon={Target}
          color="purple"
        />
        <StatCard
          title="Avg. Days in Recovery"
          value={avgDaysRecovery}
          subtitle="Across all participants"
          icon={Heart}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OutcomeChart
          data={last7Days}
          chartType={engagementChartType}
          title="Weekly Engagement"
          onChartTypeChange={setEngagementChartType}
        />
        <OutcomeChart
          data={outcomeData}
          chartType={outcomeChartType}
          title="Participant Outcomes"
          onChartTypeChange={setOutcomeChartType}
        />
      </div>

      {/* Activity and Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={recentActivity} />
        <UpcomingItems items={upcomingItems} title="Upcoming Goals & Follow-ups" />
      </div>

      {/* Inspirational Quote */}
      <div className="bg-gradient-to-r from-[#5B9A9A] to-[#3D7A7A] rounded-2xl p-8 text-white">
        <div className="flex items-start gap-4">
          <Sparkles className="w-8 h-8 opacity-80 shrink-0" />
          <div>
            <p className="text-lg font-medium italic">
              "Recovery is a journey that often includes periods of high-risk transition. We are here to ensure no one falls through the cracks."
            </p>
            <p className="mt-3 text-white/80 text-sm">— Grace For Addictions Mission</p>
          </div>
        </div>
      </div>
    </div>
  );
}