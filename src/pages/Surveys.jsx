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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Plus, FileText, Star, ThumbsUp, Calendar, User, TrendingUp } from 'lucide-react';

export default function Surveys() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);

  const [formData, setFormData] = useState({
    participant_id: '',
    participant_name: '',
    survey_type: 'Satisfaction',
    date_completed: new Date().toISOString().split('T')[0],
    overall_satisfaction: 5,
    service_quality: 5,
    coach_rating: 5,
    would_recommend: true,
    most_helpful_service: '',
    improvement_suggestions: '',
    life_quality_before: 5,
    life_quality_after: 7,
    confidence_level: 5,
    support_system_improved: true,
    goals_achieved: 0,
    additional_feedback: '',
  });

  useEffect(() => {
    db.entities.Participant.list().then(setParticipants);
  }, []);

  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => db.entities.Survey.list('-date_completed'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Survey.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
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

  const avgSatisfaction = surveys.length > 0 
    ? (surveys.reduce((sum, s) => sum + (s.overall_satisfaction || 0), 0) / surveys.length).toFixed(1)
    : '—';

  const recommendRate = surveys.length > 0
    ? Math.round((surveys.filter(s => s.would_recommend).length / surveys.length) * 100)
    : 0;

  const getTypeBadge = (type) => {
    const styles = {
      'Intake': 'bg-blue-50 text-blue-600',
      'Satisfaction': 'bg-[#5B9A9A]/10 text-[#5B9A9A]',
      'Outcome': 'bg-purple-50 text-purple-600',
      'Exit': 'bg-amber-50 text-amber-600',
      'Follow-up': 'bg-emerald-50 text-emerald-600',
    };
    return styles[type] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Participant Surveys</h1>
          <p className="text-slate-500 mt-1">Collect and analyze participant feedback</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
              <Plus className="w-4 h-4 mr-2" />
              New Survey
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Survey Response</DialogTitle>
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
                  <Label>Survey Type</Label>
                  <Select value={formData.survey_type} onValueChange={(v) => setFormData(prev => ({ ...prev, survey_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Intake', 'Satisfaction', 'Outcome', 'Exit', 'Follow-up'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium">Ratings (1-10)</h4>
                {[
                  { key: 'overall_satisfaction', label: 'Overall Satisfaction' },
                  { key: 'service_quality', label: 'Service Quality' },
                  { key: 'coach_rating', label: 'Coach Rating' },
                  { key: 'confidence_level', label: 'Confidence Level' },
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Life Quality Before (1-10)</Label>
                  <Slider
                    value={[formData.life_quality_before]}
                    onValueChange={([v]) => setFormData(prev => ({ ...prev, life_quality_before: v }))}
                    max={10}
                    min={1}
                    step={1}
                  />
                  <span className="text-sm text-slate-500">{formData.life_quality_before}/10</span>
                </div>
                <div className="space-y-2">
                  <Label>Life Quality After (1-10)</Label>
                  <Slider
                    value={[formData.life_quality_after]}
                    onValueChange={([v]) => setFormData(prev => ({ ...prev, life_quality_after: v }))}
                    max={10}
                    min={1}
                    step={1}
                  />
                  <span className="text-sm text-slate-500">{formData.life_quality_after}/10</span>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.would_recommend} onCheckedChange={(v) => setFormData(prev => ({ ...prev, would_recommend: v }))} />
                  <Label>Would Recommend</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.support_system_improved} onCheckedChange={(v) => setFormData(prev => ({ ...prev, support_system_improved: v }))} />
                  <Label>Support System Improved</Label>
                </div>
              </div>

              <div>
                <Label>Most Helpful Service</Label>
                <Input value={formData.most_helpful_service} onChange={(e) => setFormData(prev => ({ ...prev, most_helpful_service: e.target.value }))} />
              </div>
              <div>
                <Label>Improvement Suggestions</Label>
                <Textarea value={formData.improvement_suggestions} onChange={(e) => setFormData(prev => ({ ...prev, improvement_suggestions: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label>Additional Feedback</Label>
                <Textarea value={formData.additional_feedback} onChange={(e) => setFormData(prev => ({ ...prev, additional_feedback: e.target.value }))} rows={2} />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">Save Survey</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Surveys</p>
          <p className="text-2xl font-bold text-slate-900">{surveys.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Avg Satisfaction</p>
          <div className="flex items-center gap-1">
            <p className="text-2xl font-bold text-[#C9A962]">{avgSatisfaction}</p>
            <Star className="w-5 h-5 text-[#C9A962] fill-[#C9A962]" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Would Recommend</p>
          <div className="flex items-center gap-1">
            <p className="text-2xl font-bold text-emerald-600">{recommendRate}%</p>
            <ThumbsUp className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Avg Life Improvement</p>
          <div className="flex items-center gap-1">
            <p className="text-2xl font-bold text-[#5B9A9A]">
              +{surveys.length > 0 
                ? ((surveys.reduce((sum, s) => sum + ((s.life_quality_after || 0) - (s.life_quality_before || 0)), 0) / surveys.length)).toFixed(1)
                : '0'}
            </p>
            <TrendingUp className="w-5 h-5 text-[#5B9A9A]" />
          </div>
        </div>
      </div>

      {/* Surveys List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading...</div>
        ) : surveys.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No surveys collected yet</p>
          </div>
        ) : (
          surveys.map((survey) => (
            <Card key={survey.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{survey.participant_name || 'Unknown'}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getTypeBadge(survey.survey_type)}>{survey.survey_type}</Badge>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-[#C9A962]">{survey.overall_satisfaction}</span>
                      <Star className="w-5 h-5 text-[#C9A962] fill-[#C9A962]" />
                    </div>
                    <p className="text-xs text-slate-500">Satisfaction</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(survey.date_completed), 'MMM d, yyyy')}
                </div>
                <div className="flex gap-4">
                  <div className="text-center p-2 rounded-lg bg-slate-50 flex-1">
                    <p className="text-sm font-medium">{survey.service_quality || '—'}</p>
                    <p className="text-xs text-slate-500">Service</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-50 flex-1">
                    <p className="text-sm font-medium">{survey.coach_rating || '—'}</p>
                    <p className="text-xs text-slate-500">Coach</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-50 flex-1">
                    <p className="text-sm font-medium">{survey.life_quality_before} → {survey.life_quality_after}</p>
                    <p className="text-xs text-slate-500">Quality</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {survey.would_recommend && (
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Would Recommend
                    </Badge>
                  )}
                  {survey.support_system_improved && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                      Support Improved
                    </Badge>
                  )}
                </div>
                {survey.most_helpful_service && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Most helpful:</span> {survey.most_helpful_service}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}