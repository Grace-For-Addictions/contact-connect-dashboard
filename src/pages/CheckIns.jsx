import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import GracefulTextarea from '../components/recovery/GracefulTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Plus, Calendar, ClipboardCheck, User, TrendingUp, Heart, Moon, Brain, Smile } from 'lucide-react';

export default function CheckIns() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);

  const [formData, setFormData] = useState({
    participant_id: '',
    participant_name: '',
    date: new Date().toISOString().split('T')[0],
    check_in_type: 'Week 1',
    sobriety_maintained: true,
    days_sober_since_last: 7,
    mood_rating: 5,
    stress_level: 5,
    sleep_quality: 5,
    cravings_level: 3,
    support_system_rating: 5,
    physical_health_rating: 5,
    highlights: '',
    challenges: '',
    goals_progress: '',
    additional_support_needed: '',
    staff_notes: '',
  });

  useEffect(() => {
    base44.entities.Participant.filter({ status: 'Active' }).then(setParticipants);
  }, []);

  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CheckIn.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkIns'] });
      setDialogOpen(false);
      setFormData({
        participant_id: '', participant_name: '', date: new Date().toISOString().split('T')[0],
        check_in_type: 'Week 1', sobriety_maintained: true, days_sober_since_last: 7,
        mood_rating: 5, stress_level: 5, sleep_quality: 5, cravings_level: 3,
        support_system_rating: 5, physical_health_rating: 5, highlights: '',
        challenges: '', goals_progress: '', additional_support_needed: '', staff_notes: '',
      });
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

  const getCheckInTypeBadge = (type) => {
    const styles = {
      'Week 1': 'bg-blue-50 text-blue-600',
      'Week 2': 'bg-purple-50 text-purple-600',
      'Week 3': 'bg-indigo-50 text-indigo-600',
      'Week 4': 'bg-[#5B9A9A]/10 text-[#5B9A9A]',
      'Monthly': 'bg-[#C9A962]/10 text-[#C9A962]',
      'Quarterly': 'bg-emerald-50 text-emerald-600',
    };
    return styles[type] || 'bg-slate-100 text-slate-600';
  };

  const RatingSlider = ({ label, icon: Icon, value, onChange, color }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          {label}
        </Label>
        <span className="text-sm font-medium">{value}/10</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        max={10}
        min={1}
        step={1}
        className="w-full"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Check-Ins</h1>
          <p className="text-slate-500 mt-1">Weekly and monthly participant progress tracking</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
              <Plus className="w-4 h-4 mr-2" />
              New Check-In
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Check-In</DialogTitle>
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
                  <Label>Check-In Type *</Label>
                  <Select value={formData.check_in_type} onValueChange={(v) => setFormData(prev => ({ ...prev, check_in_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Week 1">Week 1</SelectItem>
                      <SelectItem value="Week 2">Week 2</SelectItem>
                      <SelectItem value="Week 3">Week 3</SelectItem>
                      <SelectItem value="Week 4">Week 4</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} required />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.sobriety_maintained} onCheckedChange={(v) => setFormData(prev => ({ ...prev, sobriety_maintained: v }))} />
                    <Label>Sobriety Maintained</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium text-slate-900">Wellness Ratings</h4>
                <RatingSlider label="Mood" icon={Smile} value={formData.mood_rating} onChange={(v) => setFormData(prev => ({ ...prev, mood_rating: v }))} color="text-amber-500" />
                <RatingSlider label="Stress Level" icon={Brain} value={formData.stress_level} onChange={(v) => setFormData(prev => ({ ...prev, stress_level: v }))} color="text-rose-500" />
                <RatingSlider label="Sleep Quality" icon={Moon} value={formData.sleep_quality} onChange={(v) => setFormData(prev => ({ ...prev, sleep_quality: v }))} color="text-indigo-500" />
                <RatingSlider label="Cravings" icon={TrendingUp} value={formData.cravings_level} onChange={(v) => setFormData(prev => ({ ...prev, cravings_level: v }))} color="text-orange-500" />
                <RatingSlider label="Support System" icon={Heart} value={formData.support_system_rating} onChange={(v) => setFormData(prev => ({ ...prev, support_system_rating: v }))} color="text-rose-400" />
                <RatingSlider label="Physical Health" icon={Heart} value={formData.physical_health_rating} onChange={(v) => setFormData(prev => ({ ...prev, physical_health_rating: v }))} color="text-emerald-500" />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Highlights This Period</Label>
                  <Textarea value={formData.highlights} onChange={(e) => setFormData(prev => ({ ...prev, highlights: e.target.value }))} rows={2} placeholder="What went well?" />
                </div>
                <div>
                  <Label>Challenges Faced</Label>
                  <Textarea value={formData.challenges} onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))} rows={2} placeholder="What challenges did they encounter?" />
                </div>
                <div>
                  <Label>Goals Progress</Label>
                  <Textarea value={formData.goals_progress} onChange={(e) => setFormData(prev => ({ ...prev, goals_progress: e.target.value }))} rows={2} placeholder="Progress on current goals" />
                </div>
                <div>
                  <Label>Staff Notes</Label>
                  <Textarea value={formData.staff_notes} onChange={(e) => setFormData(prev => ({ ...prev, staff_notes: e.target.value }))} rows={2} placeholder="Additional observations" />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
                  {createMutation.isPending ? 'Saving...' : 'Save Check-In'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Check-Ins</p>
          <p className="text-2xl font-bold text-slate-900">{checkIns.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">This Week</p>
          <p className="text-2xl font-bold text-[#5B9A9A]">
            {checkIns.filter(c => {
              const date = new Date(c.date);
              const now = new Date();
              const weekAgo = new Date(now.setDate(now.getDate() - 7));
              return date >= weekAgo;
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Avg Mood</p>
          <p className="text-2xl font-bold text-amber-500">
            {checkIns.length > 0 ? (checkIns.reduce((sum, c) => sum + (c.mood_rating || 0), 0) / checkIns.length).toFixed(1) : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Sobriety Rate</p>
          <p className="text-2xl font-bold text-emerald-600">
            {checkIns.length > 0 ? Math.round((checkIns.filter(c => c.sobriety_maintained).length / checkIns.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Check-ins List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading check-ins...</div>
        ) : checkIns.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No check-ins recorded yet</p>
          </div>
        ) : (
          checkIns.map((checkIn) => (
            <Card key={checkIn.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-[#5B9A9A]/10">
                      <ClipboardCheck className="w-6 h-6 text-[#5B9A9A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900">{checkIn.participant_name || 'Unknown'}</p>
                        <Badge className={getCheckInTypeBadge(checkIn.check_in_type)}>{checkIn.check_in_type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(checkIn.date), 'MMM d, yyyy')}
                        </div>
                        {checkIn.sobriety_maintained !== undefined && (
                          <Badge variant="outline" className={checkIn.sobriety_maintained ? 'text-emerald-600 border-emerald-200' : 'text-rose-600 border-rose-200'}>
                            {checkIn.sobriety_maintained ? '✓ Sober' : '⚠ Relapse'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="text-center px-3 py-1 rounded-lg bg-amber-50">
                      <p className="text-xs text-amber-600">Mood</p>
                      <p className="font-bold text-amber-700">{checkIn.mood_rating || '—'}</p>
                    </div>
                    <div className="text-center px-3 py-1 rounded-lg bg-rose-50">
                      <p className="text-xs text-rose-600">Stress</p>
                      <p className="font-bold text-rose-700">{checkIn.stress_level || '—'}</p>
                    </div>
                    <div className="text-center px-3 py-1 rounded-lg bg-indigo-50">
                      <p className="text-xs text-indigo-600">Sleep</p>
                      <p className="font-bold text-indigo-700">{checkIn.sleep_quality || '—'}</p>
                    </div>
                    <div className="text-center px-3 py-1 rounded-lg bg-orange-50">
                      <p className="text-xs text-orange-600">Cravings</p>
                      <p className="font-bold text-orange-700">{checkIn.cravings_level || '—'}</p>
                    </div>
                  </div>
                </div>
                {(checkIn.highlights || checkIn.challenges) && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {checkIn.highlights && (
                      <div>
                        <p className="text-xs font-medium text-emerald-600 mb-1">Highlights</p>
                        <p className="text-sm text-slate-600">{checkIn.highlights}</p>
                      </div>
                    )}
                    {checkIn.challenges && (
                      <div>
                        <p className="text-xs font-medium text-rose-600 mb-1">Challenges</p>
                        <p className="text-sm text-slate-600">{checkIn.challenges}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}