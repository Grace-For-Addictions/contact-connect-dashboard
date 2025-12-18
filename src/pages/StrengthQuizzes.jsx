import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Plus, Sparkles, Brain, Heart, Zap, Shield, Calendar, User } from 'lucide-react';

const STRENGTH_OPTIONS = [
  'Resilience', 'Empathy', 'Creativity', 'Leadership', 'Perseverance', 'Honesty',
  'Courage', 'Kindness', 'Gratitude', 'Humor', 'Curiosity', 'Self-discipline',
  'Teamwork', 'Communication', 'Problem-solving', 'Adaptability', 'Patience',
  'Optimism', 'Self-awareness', 'Spirituality'
];

const VALUE_OPTIONS = [
  'Family', 'Health', 'Honesty', 'Faith', 'Community', 'Education', 'Career',
  'Friendship', 'Independence', 'Creativity', 'Service', 'Adventure', 'Security',
  'Peace', 'Love', 'Growth', 'Respect', 'Freedom', 'Integrity', 'Compassion'
];

export default function StrengthQuizzes() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);

  const [formData, setFormData] = useState({
    participant_id: '',
    participant_name: '',
    assessment_date: new Date().toISOString().split('T')[0],
    assessment_type: 'Personal Strengths',
    top_strengths: [],
    areas_for_growth: [],
    core_values: [],
    coping_mechanisms: [],
    motivation_level: 5,
    self_awareness_score: 5,
    resilience_score: 5,
    emotional_regulation_score: 5,
    interpersonal_skills_score: 5,
    summary: '',
    recommendations: '',
  });

  useEffect(() => {
    base44.entities.Participant.list().then(setParticipants);
  }, []);

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['strengthAssessments'],
    queryFn: () => base44.entities.StrengthAssessment.list('-assessment_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StrengthAssessment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strengthAssessments'] });
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

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const getTypeIcon = (type) => {
    const icons = {
      'Core Values': Heart,
      'Personal Strengths': Sparkles,
      'Coping Skills': Shield,
      'Motivation': Zap,
      'Resilience': Shield,
      'Emotional Intelligence': Brain,
    };
    return icons[type] || Sparkles;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Strength Assessments</h1>
          <p className="text-slate-500 mt-1">Help participants discover their strengths and values</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Strength-Based Assessment</DialogTitle>
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
                  <Label>Assessment Type</Label>
                  <Select value={formData.assessment_type} onValueChange={(v) => setFormData(prev => ({ ...prev, assessment_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Core Values', 'Personal Strengths', 'Coping Skills', 'Motivation', 'Resilience', 'Emotional Intelligence'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Top Strengths (select up to 5)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STRENGTH_OPTIONS.map(strength => (
                    <Button
                      key={strength}
                      type="button"
                      variant={formData.top_strengths.includes(strength) ? "default" : "outline"}
                      size="sm"
                      className={formData.top_strengths.includes(strength) ? "bg-[#5B9A9A] hover:bg-[#3D7A7A]" : ""}
                      onClick={() => toggleArrayItem('top_strengths', strength)}
                      disabled={!formData.top_strengths.includes(strength) && formData.top_strengths.length >= 5}
                    >
                      {strength}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Core Values (select up to 5)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {VALUE_OPTIONS.map(value => (
                    <Button
                      key={value}
                      type="button"
                      variant={formData.core_values.includes(value) ? "default" : "outline"}
                      size="sm"
                      className={formData.core_values.includes(value) ? "bg-[#C9A962] hover:bg-[#B89952]" : ""}
                      onClick={() => toggleArrayItem('core_values', value)}
                      disabled={!formData.core_values.includes(value) && formData.core_values.length >= 5}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium">Skill Ratings</h4>
                {[
                  { key: 'motivation_level', label: 'Motivation Level' },
                  { key: 'self_awareness_score', label: 'Self-Awareness' },
                  { key: 'resilience_score', label: 'Resilience' },
                  { key: 'emotional_regulation_score', label: 'Emotional Regulation' },
                  { key: 'interpersonal_skills_score', label: 'Interpersonal Skills' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <Label>{label}</Label>
                      <span className="text-sm font-medium">{formData[key]}/10</span>
                    </div>
                    <Slider
                      value={[formData[key]]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, [key]: v }))}
                      max={10}
                      min={1}
                      step={1}
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>Summary</Label>
                <Textarea value={formData.summary} onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))} rows={2} placeholder="Overall assessment summary" />
              </div>
              <div>
                <Label>Recommendations</Label>
                <Textarea value={formData.recommendations} onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))} rows={2} placeholder="Suggested next steps" />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">Save Assessment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Assessments</p>
          <p className="text-2xl font-bold text-slate-900">{assessments.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Avg Resilience</p>
          <p className="text-2xl font-bold text-[#5B9A9A]">
            {assessments.length > 0 ? (assessments.reduce((sum, a) => sum + (a.resilience_score || 0), 0) / assessments.length).toFixed(1) : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Avg Motivation</p>
          <p className="text-2xl font-bold text-[#C9A962]">
            {assessments.length > 0 ? (assessments.reduce((sum, a) => sum + (a.motivation_level || 0), 0) / assessments.length).toFixed(1) : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">This Month</p>
          <p className="text-2xl font-bold text-purple-600">
            {assessments.filter(a => {
              const date = new Date(a.assessment_date);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading...</div>
        ) : assessments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No assessments yet</p>
          </div>
        ) : (
          assessments.map((assessment) => {
            const TypeIcon = getTypeIcon(assessment.assessment_type);
            return (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#5B9A9A]/10">
                        <TypeIcon className="w-5 h-5 text-[#5B9A9A]" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{assessment.participant_name || 'Unknown'}</CardTitle>
                        <p className="text-sm text-slate-500">{assessment.assessment_type}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
                  </div>
                  {assessment.top_strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Top Strengths</p>
                      <div className="flex flex-wrap gap-1">
                        {assessment.top_strengths.slice(0, 3).map(s => (
                          <Badge key={s} variant="outline" className="text-xs text-[#5B9A9A] border-[#5B9A9A]/30">{s}</Badge>
                        ))}
                        {assessment.top_strengths.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{assessment.top_strengths.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {assessment.core_values?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Core Values</p>
                      <div className="flex flex-wrap gap-1">
                        {assessment.core_values.slice(0, 3).map(v => (
                          <Badge key={v} variant="outline" className="text-xs text-[#C9A962] border-[#C9A962]/30">{v}</Badge>
                        ))}
                        {assessment.core_values.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{assessment.core_values.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-lg font-bold text-[#5B9A9A]">{assessment.resilience_score || '—'}</p>
                      <p className="text-xs text-slate-500">Resilience</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-[#C9A962]">{assessment.motivation_level || '—'}</p>
                      <p className="text-xs text-slate-500">Motivation</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">{assessment.self_awareness_score || '—'}</p>
                      <p className="text-xs text-slate-500">Awareness</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}