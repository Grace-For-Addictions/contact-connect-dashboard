import React, { useState, useEffect } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, differenceInDays } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ArrowLeft, Edit, Heart, Calendar, MapPin, Phone, Mail, User, 
  MessageSquare, Target, Award, ClipboardCheck, TrendingUp, Clock,
  Save, X
} from 'lucide-react';

export default function ParticipantDetail() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const participantId = urlParams.get('id');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const { data: participant, isLoading } = useQuery({
    queryKey: ['participant', participantId],
    queryFn: async () => {
      const participants = await db.entities.Participant.filter({ id: participantId });
      return participants[0];
    },
    enabled: !!participantId,
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['participantInteractions', participantId],
    queryFn: () => db.entities.Interaction.filter({ participant_id: participantId }, '-date'),
    enabled: !!participantId,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['participantGoals', participantId],
    queryFn: () => db.entities.Goal.filter({ participant_id: participantId }),
    enabled: !!participantId,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['participantMilestones', participantId],
    queryFn: () => db.entities.Milestone.filter({ participant_id: participantId }, '-date_achieved'),
    enabled: !!participantId,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['participantCheckIns', participantId],
    queryFn: () => db.entities.CheckIn.filter({ participant_id: participantId }, '-date'),
    enabled: !!participantId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => db.entities.Participant.update(participantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant', participantId] });
      setEditing(false);
    },
  });

  useEffect(() => {
    if (participant) {
      setEditData(participant);
    }
  }, [participant]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#5B9A9A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">Participant not found</p>
        <Link to={createPageUrl('Participants')}>
          <Button variant="outline" className="mt-4">Back to Participants</Button>
        </Link>
      </div>
    );
  }

  const daysInRecovery = participant.recovery_start_date
    ? differenceInDays(new Date(), new Date(participant.recovery_start_date))
    : null;

  const totalInteractionHours = Math.round(interactions.reduce((sum, i) => sum + (i.duration_minutes || 0), 0) / 60);
  const completedGoals = goals.filter(g => g.status === 'Completed').length;

  // Prepare mood chart data from check-ins
  const moodChartData = checkIns.slice(0, 10).reverse().map(c => ({
    date: format(new Date(c.date), 'MMM d'),
    mood: c.mood_rating,
    stress: c.stress_level,
  }));

  const getStatusBadge = (status) => {
    const styles = {
      'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Inactive': 'bg-slate-50 text-slate-600 border-slate-200',
      'Graduated': 'bg-[#C9A962]/10 text-[#C9A962] border-[#C9A962]/30',
    };
    return styles[status] || styles['Active'];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Participants')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#5B9A9A]/10 flex items-center justify-center">
              <span className="text-[#5B9A9A] font-bold text-xl">
                {participant.first_name?.[0]}{participant.last_name?.[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {participant.first_name} {participant.last_name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className={getStatusBadge(participant.status)}>
                  {participant.status || 'Active'}
                </Badge>
                {daysInRecovery !== null && (
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>{daysInRecovery} days in recovery</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditing(!editing)}>
          {editing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-[#5B9A9A]/5">
          <CardContent className="pt-6 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-[#5B9A9A] mb-2" />
            <p className="text-2xl font-bold text-[#5B9A9A]">{interactions.length}</p>
            <p className="text-xs text-slate-600">Interactions</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-6 text-center">
            <Clock className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-purple-600">{totalInteractionHours}h</p>
            <p className="text-xs text-slate-600">Service Hours</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50">
          <CardContent className="pt-6 text-center">
            <Target className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{completedGoals}/{goals.length}</p>
            <p className="text-xs text-slate-600">Goals Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-[#C9A962]/5">
          <CardContent className="pt-6 text-center">
            <Award className="w-8 h-8 mx-auto text-[#C9A962] mb-2" />
            <p className="text-2xl font-bold text-[#C9A962]">{milestones.length}</p>
            <p className="text-xs text-slate-600">Milestones</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Info */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {participant.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{participant.email}</span>
                  </div>
                )}
                {participant.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{participant.phone}</span>
                  </div>
                )}
                {(participant.city || participant.state) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{participant.city}{participant.city && participant.state ? ', ' : ''}{participant.state}</span>
                  </div>
                )}
                {participant.assigned_coach_name && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Coach: {participant.assigned_coach_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mood Trend */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Wellness Trend</CardTitle></CardHeader>
              <CardContent>
                {moodChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={moodChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="mood" stroke="#5B9A9A" strokeWidth={2} name="Mood" />
                      <Line type="monotone" dataKey="stress" stroke="#EF4444" strokeWidth={2} name="Stress" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-slate-400">
                    No check-in data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interactions.slice(0, 5).map((interaction) => (
                  <div key={interaction.id} className="flex items-start gap-4 p-3 rounded-lg bg-slate-50">
                    <MessageSquare className="w-5 h-5 text-[#5B9A9A] mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{interaction.interaction_type}</p>
                      <p className="text-sm text-slate-500">{interaction.duration_minutes} minutes • {interaction.location}</p>
                    </div>
                    <span className="text-sm text-slate-400">
                      {format(new Date(interaction.date), 'MMM d')}
                    </span>
                  </div>
                ))}
                {interactions.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No interactions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">All Interactions</CardTitle>
              <Link to={createPageUrl('NewInteraction')}>
                <Button size="sm" className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">Log Interaction</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="flex items-start justify-between p-4 rounded-lg border">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-[#5B9A9A]/10">
                        <MessageSquare className="w-5 h-5 text-[#5B9A9A]" />
                      </div>
                      <div>
                        <p className="font-medium">{interaction.interaction_type}</p>
                        <p className="text-sm text-slate-500">{interaction.staff_name} • {interaction.location}</p>
                        {interaction.progress_notes && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{interaction.progress_notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(new Date(interaction.date), 'MMM d, yyyy')}</p>
                      <p className="text-sm text-slate-500">{interaction.duration_minutes} min</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-6 space-y-6">
          {/* Goals */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Goals</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{goal.title}</p>
                        <Badge variant="outline" className="mt-1">{goal.category}</Badge>
                      </div>
                      <Badge className={goal.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}>
                        {goal.status}
                      </Badge>
                    </div>
                    <Progress value={goal.progress_percentage || 0} className="h-2 mt-3" />
                    <p className="text-xs text-slate-500 mt-1">{goal.progress_percentage || 0}% complete</p>
                  </div>
                ))}
                {goals.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No goals set yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Milestones</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#C9A962]/5">
                    <Award className="w-6 h-6 text-[#C9A962]" />
                    <div className="flex-1">
                      <p className="font-medium">{milestone.title || milestone.milestone_type}</p>
                      {milestone.days_in_recovery > 0 && (
                        <p className="text-sm text-[#5B9A9A] font-medium">{milestone.days_in_recovery} days</p>
                      )}
                    </div>
                    <span className="text-sm text-slate-500">
                      {format(new Date(milestone.date_achieved), 'MMM d, yyyy')}
                    </span>
                  </div>
                ))}
                {milestones.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No milestones yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Participant Details</CardTitle></CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(editData); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select value={editData.status} onValueChange={(v) => setEditData(prev => ({ ...prev, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Graduated">Graduated</SelectItem>
                          <SelectItem value="Transferred">Transferred</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Recovery Start Date</Label>
                      <Input 
                        type="date" 
                        value={editData.recovery_start_date || ''} 
                        onChange={(e) => setEditData(prev => ({ ...prev, recovery_start_date: e.target.value }))} 
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea 
                      value={editData.notes || ''} 
                      onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))} 
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button type="submit" disabled={updateMutation.isPending} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-500">Date of Birth</p>
                    <p className="font-medium">{participant.date_of_birth ? format(new Date(participant.date_of_birth), 'MMM d, yyyy') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Gender</p>
                    <p className="font-medium">{participant.gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Ethnicity</p>
                    <p className="font-medium">{participant.ethnicity || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Primary Substance</p>
                    <p className="font-medium">{participant.primary_substance || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Housing Status</p>
                    <p className="font-medium">{participant.housing_status || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Employment Status</p>
                    <p className="font-medium">{participant.employment_status || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Insurance</p>
                    <p className="font-medium">{participant.insurance_status || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Referral Source</p>
                    <p className="font-medium">{participant.referral_source || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Enrollment Date</p>
                    <p className="font-medium">{participant.enrollment_date ? format(new Date(participant.enrollment_date), 'MMM d, yyyy') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Emergency Contact</p>
                    <p className="font-medium">{participant.emergency_contact_name || '—'}</p>
                    {participant.emergency_contact_phone && <p className="text-sm text-slate-500">{participant.emergency_contact_phone}</p>}
                  </div>
                  {participant.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500">Notes</p>
                      <p className="font-medium">{participant.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}