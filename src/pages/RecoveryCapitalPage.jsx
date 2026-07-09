import React, { useState, useEffect } from 'react';
import { db } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, Users, Heart, Home, Briefcase, Calendar, Flower2 } from 'lucide-react';
import BARC10Garden from '../components/recovery/BARC10Garden';

export default function RecoveryCapitalPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState('all');

  const [formData, setFormData] = useState({
    participant_id: '',
    participant_name: '',
    assessment_date: new Date().toISOString().split('T')[0],
    social_capital: 5,
    physical_capital: 5,
    human_capital: 5,
    cultural_capital: 5,
    community_capital: 5,
    family_support: 5,
    friend_support: 5,
    stable_housing: false,
    reliable_transportation: false,
    meaningful_activities: false,
    employment_education: false,
    healthy_coping_skills: false,
    notes: '',
  });

  useEffect(() => {
    db.entities.Participant.list().then(setParticipants);
  }, []);

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['recoveryCapital'],
    queryFn: () => db.entities.RecoveryCapital.list('-assessment_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const total = data.social_capital + data.physical_capital + data.human_capital + data.cultural_capital + data.community_capital;
      return db.entities.RecoveryCapital.create({ ...data, total_score: total });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recoveryCapital'] });
      setDialogOpen(false);
    },
  });

  const handleParticipantSelect = (id) => {
    const participant = participants.find(p => p.id === id);
    setFormData(prev => ({
      ...prev,
      participant_id: id,
      participant_name: participant ? `${participant.first_name} ${participant.last_name}` : ''
    }));
  };

  const filteredAssessments = selectedParticipant === 'all' 
    ? assessments 
    : assessments.filter(a => a.participant_id === selectedParticipant);

  const latestByParticipant = assessments.reduce((acc, curr) => {
    if (!acc[curr.participant_id] || new Date(curr.assessment_date) > new Date(acc[curr.participant_id].assessment_date)) {
      acc[curr.participant_id] = curr;
    }
    return acc;
  }, {});

  const avgScores = Object.values(latestByParticipant).reduce((acc, curr) => {
    acc.social += curr.social_capital || 0;
    acc.physical += curr.physical_capital || 0;
    acc.human += curr.human_capital || 0;
    acc.cultural += curr.cultural_capital || 0;
    acc.community += curr.community_capital || 0;
    acc.count++;
    return acc;
  }, { social: 0, physical: 0, human: 0, cultural: 0, community: 0, count: 0 });

  const radarData = avgScores.count > 0 ? [
    { subject: 'Social', A: avgScores.social / avgScores.count },
    { subject: 'Physical', A: avgScores.physical / avgScores.count },
    { subject: 'Human', A: avgScores.human / avgScores.count },
    { subject: 'Cultural', A: avgScores.cultural / avgScores.count },
    { subject: 'Community', A: avgScores.community / avgScores.count },
  ] : [];

  const CapitalSlider = ({ label, value, onChange }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium text-[#5B9A9A]">{value}/10</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} max={10} min={1} step={1} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recovery Capital</h1>
          <p className="text-slate-500 mt-1">Assess and track participant resources for sustained recovery</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recovery Capital Assessment</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Participant *</Label>
                  <Select value={formData.participant_id} onValueChange={handleParticipantSelect}>
                    <SelectTrigger><SelectValue placeholder="Select participant" /></SelectTrigger>
                    <SelectContent>
                      {participants.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assessment Date</Label>
                  <Input type="date" value={formData.assessment_date} onChange={(e) => setFormData(prev => ({ ...prev, assessment_date: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900">Capital Domains (1-10)</h4>
                <CapitalSlider label="Social Capital (relationships, networks)" value={formData.social_capital} onChange={(v) => setFormData(prev => ({ ...prev, social_capital: v }))} />
                <CapitalSlider label="Physical Capital (health, finances, housing)" value={formData.physical_capital} onChange={(v) => setFormData(prev => ({ ...prev, physical_capital: v }))} />
                <CapitalSlider label="Human Capital (skills, education, knowledge)" value={formData.human_capital} onChange={(v) => setFormData(prev => ({ ...prev, human_capital: v }))} />
                <CapitalSlider label="Cultural Capital (values, beliefs, traditions)" value={formData.cultural_capital} onChange={(v) => setFormData(prev => ({ ...prev, cultural_capital: v }))} />
                <CapitalSlider label="Community Capital (recovery community access)" value={formData.community_capital} onChange={(v) => setFormData(prev => ({ ...prev, community_capital: v }))} />
              </div>

              <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900">Support Ratings</h4>
                <CapitalSlider label="Family Support" value={formData.family_support} onChange={(v) => setFormData(prev => ({ ...prev, family_support: v }))} />
                <CapitalSlider label="Friend Support" value={formData.friend_support} onChange={(v) => setFormData(prev => ({ ...prev, friend_support: v }))} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.stable_housing} onCheckedChange={(v) => setFormData(prev => ({ ...prev, stable_housing: v }))} />
                  <Label>Stable Housing</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.reliable_transportation} onCheckedChange={(v) => setFormData(prev => ({ ...prev, reliable_transportation: v }))} />
                  <Label>Transportation</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.meaningful_activities} onCheckedChange={(v) => setFormData(prev => ({ ...prev, meaningful_activities: v }))} />
                  <Label>Meaningful Activities</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.employment_education} onCheckedChange={(v) => setFormData(prev => ({ ...prev, employment_education: v }))} />
                  <Label>Employment/Education</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.healthy_coping_skills} onCheckedChange={(v) => setFormData(prev => ({ ...prev, healthy_coping_skills: v }))} />
                  <Label>Healthy Coping</Label>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">Save Assessment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Visualization Tabs */}
      {radarData.length > 0 && (
        <Tabs defaultValue="radar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="radar">
              <TrendingUp className="w-4 h-4 mr-2" />
              Radar Chart
            </TabsTrigger>
            <TabsTrigger value="garden">
              <Flower2 className="w-4 h-4 mr-2" />
              Garden View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="radar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Recovery Capital Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} />
                      <Radar name="Average Score" dataKey="A" stroke="#5B9A9A" fill="#5B9A9A" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="garden" className="mt-6">
            {selectedParticipant !== 'all' ? (
              <BARC10Garden 
                assessments={filteredAssessments}
                participantName={participants.find(p => p.id === selectedParticipant)?.first_name + ' ' + participants.find(p => p.id === selectedParticipant)?.last_name}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Flower2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">Select a specific participant to view their recovery garden</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label>Filter by Participant:</Label>
        <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Participants</SelectItem>
            {participants.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assessments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading...</div>
        ) : filteredAssessments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No assessments yet</p>
          </div>
        ) : (
          filteredAssessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-slate-900">{assessment.participant_name || 'Unknown'}</p>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-[#5B9A9A]/10">
                    <p className="text-2xl font-bold text-[#5B9A9A]">{assessment.total_score || 0}</p>
                    <p className="text-xs text-[#5B9A9A]">Total</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Social</p>
                    <p className="font-bold">{assessment.social_capital}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Physical</p>
                    <p className="font-bold">{assessment.physical_capital}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Human</p>
                    <p className="font-bold">{assessment.human_capital}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Cultural</p>
                    <p className="font-bold">{assessment.cultural_capital}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Community</p>
                    <p className="font-bold">{assessment.community_capital}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {assessment.stable_housing && <span className="px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-600">Housing ✓</span>}
                  {assessment.reliable_transportation && <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600">Transport ✓</span>}
                  {assessment.employment_education && <span className="px-2 py-1 text-xs rounded-full bg-purple-50 text-purple-600">Employed ✓</span>}
                  {assessment.healthy_coping_skills && <span className="px-2 py-1 text-xs rounded-full bg-amber-50 text-amber-600">Coping ✓</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}