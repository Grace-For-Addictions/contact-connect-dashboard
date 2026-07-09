import React, { useState, useEffect } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Award, Plus, Calendar, User, CheckCircle2, TrendingUp, Star } from 'lucide-react';

export default function GoalsMilestones() {
  const queryClient = useQueryClient();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);

  const [goalForm, setGoalForm] = useState({
    participant_id: '', participant_name: '', category: '', title: '', description: '',
    target_date: '', status: 'Not Started', progress_percentage: 0, support_needed: '',
  });

  const [milestoneForm, setMilestoneForm] = useState({
    participant_id: '', participant_name: '', milestone_type: '', title: '',
    description: '', date_achieved: new Date().toISOString().split('T')[0], days_in_recovery: 0,
  });

  useEffect(() => {
    db.entities.Participant.list().then(setParticipants);
  }, []);

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => db.entities.Goal.list('-created_date'),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => db.entities.Milestone.list('-date_achieved'),
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => db.entities.Goal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setGoalDialogOpen(false);
      setGoalForm({ participant_id: '', participant_name: '', category: '', title: '', description: '', target_date: '', status: 'Not Started', progress_percentage: 0, support_needed: '' });
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: (data) => db.entities.Milestone.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      setMilestoneDialogOpen(false);
      setMilestoneForm({ participant_id: '', participant_name: '', milestone_type: '', title: '', description: '', date_achieved: new Date().toISOString().split('T')[0], days_in_recovery: 0 });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Goal.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const handleParticipantSelect = (id, formType) => {
    const participant = participants.find(p => p.id === id);
    const name = participant ? `${participant.first_name} ${participant.last_name}` : '';
    if (formType === 'goal') {
      setGoalForm(prev => ({ ...prev, participant_id: id, participant_name: name }));
    } else {
      setMilestoneForm(prev => ({ ...prev, participant_id: id, participant_name: name }));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Completed': 'bg-emerald-50 text-emerald-600',
      'In Progress': 'bg-blue-50 text-blue-600',
      'Not Started': 'bg-slate-100 text-slate-600',
      'On Hold': 'bg-amber-50 text-amber-600',
    };
    return styles[status] || styles['Not Started'];
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Recovery': 'bg-[#5B9A9A]/10 text-[#5B9A9A]',
      'Health': 'bg-emerald-50 text-emerald-600',
      'Employment': 'bg-blue-50 text-blue-600',
      'Education': 'bg-purple-50 text-purple-600',
      'Housing': 'bg-amber-50 text-amber-600',
      'Relationships': 'bg-rose-50 text-rose-600',
    };
    return colors[category] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Goals & Milestones</h1>
          <p className="text-slate-500 mt-1">Track participant progress and celebrate achievements</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
                <Target className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Goal</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createGoalMutation.mutate(goalForm); }} className="space-y-4">
                <div>
                  <Label>Participant *</Label>
                  <Select value={goalForm.participant_id} onValueChange={(v) => handleParticipantSelect(v, 'goal')}>
                    <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                    <SelectContent>
                      {participants.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Goal Title *</Label>
                  <Input value={goalForm.title} onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select value={goalForm.category} onValueChange={(v) => setGoalForm(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {['Recovery', 'Health', 'Employment', 'Education', 'Housing', 'Relationships', 'Financial', 'Legal', 'Personal Growth', 'Community'].map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Date</Label>
                    <Input type="date" value={goalForm.target_date} onChange={(e) => setGoalForm(prev => ({ ...prev, target_date: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={goalForm.description} onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))} rows={2} />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createGoalMutation.isPending} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">Create Goal</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-[#C9A962] text-[#C9A962] hover:bg-[#C9A962]/10">
                <Award className="w-4 h-4 mr-2" />
                Record Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Milestone</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMilestoneMutation.mutate(milestoneForm); }} className="space-y-4">
                <div>
                  <Label>Participant *</Label>
                  <Select value={milestoneForm.participant_id} onValueChange={(v) => handleParticipantSelect(v, 'milestone')}>
                    <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                    <SelectContent>
                      {participants.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Milestone Type *</Label>
                    <Select value={milestoneForm.milestone_type} onValueChange={(v) => setMilestoneForm(prev => ({ ...prev, milestone_type: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {['Days Clean', 'Recovery Anniversary', 'Goal Achievement', 'Employment', 'Housing', 'Education', 'Family Reunification', 'Health Improvement'].map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date Achieved</Label>
                    <Input type="date" value={milestoneForm.date_achieved} onChange={(e) => setMilestoneForm(prev => ({ ...prev, date_achieved: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={milestoneForm.title} onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., 90 Days Clean!" />
                </div>
                {milestoneForm.milestone_type === 'Days Clean' && (
                  <div>
                    <Label>Days in Recovery</Label>
                    <Input type="number" value={milestoneForm.days_in_recovery} onChange={(e) => setMilestoneForm(prev => ({ ...prev, days_in_recovery: parseInt(e.target.value) || 0 }))} />
                  </div>
                )}
                <div>
                  <Label>Description</Label>
                  <Textarea value={milestoneForm.description} onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))} rows={2} />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setMilestoneDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMilestoneMutation.isPending} className="bg-[#C9A962] hover:bg-[#B89952]">Record Milestone</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Goals</p>
          <p className="text-2xl font-bold text-slate-900">{goals.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{goals.filter(g => g.status === 'Completed').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{goals.filter(g => g.status === 'In Progress').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Milestones</p>
          <p className="text-2xl font-bold text-[#C9A962]">{milestones.length}</p>
        </div>
      </div>

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals" className="gap-2"><Target className="w-4 h-4" />Goals</TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2"><Award className="w-4 h-4" />Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Target className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No goals created yet</p>
              </div>
            ) : (
              goals.map((goal) => (
                <Card key={goal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      <Badge className={getStatusBadge(goal.status)}>{goal.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <User className="w-3 h-3" />
                      <span>{goal.participant_name || 'Unknown'}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className={getCategoryColor(goal.category)}>{goal.category}</Badge>
                    {goal.description && <p className="text-sm text-slate-600 line-clamp-2">{goal.description}</p>}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-medium">{goal.progress_percentage || 0}%</span>
                      </div>
                      <Progress value={goal.progress_percentage || 0} className="h-2" />
                    </div>
                    {goal.target_date && (
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar className="w-3 h-3" />
                        Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                      </div>
                    )}
                    <Select
                      value={goal.status}
                      onValueChange={(v) => updateGoalMutation.mutate({ id: goal.id, data: { status: v, ...(v === 'Completed' ? { progress_percentage: 100, completed_date: new Date().toISOString().split('T')[0] } : {}) } })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Award className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No milestones recorded yet</p>
              </div>
            ) : (
              milestones.map((milestone) => (
                <Card key={milestone.id} className="hover:shadow-md transition-shadow bg-gradient-to-br from-white to-[#C9A962]/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-[#C9A962]/10">
                        <Star className="w-6 h-6 text-[#C9A962]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{milestone.title || milestone.milestone_type}</p>
                        <p className="text-sm text-slate-500">{milestone.participant_name || 'Unknown'}</p>
                        {milestone.days_in_recovery > 0 && (
                          <p className="text-lg font-bold text-[#5B9A9A] mt-2">{milestone.days_in_recovery} Days</p>
                        )}
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-2">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(milestone.date_achieved), 'MMM d, yyyy')}
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-slate-600 mt-2">{milestone.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}