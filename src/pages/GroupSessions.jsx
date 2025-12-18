import React, { useState } from 'react';
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
import { Plus, Calendar, Clock, Users2, MapPin, User } from 'lucide-react';

export default function GroupSessions() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    session_type: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    location: '',
    facilitator_name: '',
    co_facilitator_name: '',
    attendance_count: 0,
    topics_covered: [],
    session_notes: '',
    average_engagement: '',
    follow_up_items: '',
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['groupSessions'],
    queryFn: () => base44.entities.GroupSession.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupSessions'] });
      setDialogOpen(false);
      setFormData({
        title: '', session_type: '', date: new Date().toISOString().split('T')[0],
        start_time: '', end_time: '', duration_minutes: 60, location: '',
        facilitator_name: '', co_facilitator_name: '', attendance_count: 0,
        topics_covered: [], session_notes: '', average_engagement: '', follow_up_items: '',
      });
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTypeBadge = (type) => {
    const styles = {
      'Group Workshop': 'bg-purple-50 text-purple-600',
      'Training': 'bg-blue-50 text-blue-600',
      'GFA Recovery Circle': 'bg-[#C9A962]/10 text-[#C9A962]',
      'Support Group': 'bg-emerald-50 text-emerald-600',
      'Education Session': 'bg-indigo-50 text-indigo-600',
      'Community Event': 'bg-rose-50 text-rose-600',
    };
    return styles[type] || 'bg-slate-100 text-slate-600';
  };

  const totalAttendees = sessions.reduce((sum, s) => sum + (s.attendance_count || 0), 0);
  const totalHours = Math.round(sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Group Sessions</h1>
          <p className="text-slate-500 mt-1">Manage workshops, trainings, and recovery circles</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Group Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Session Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g., Weekly Recovery Circle"
                    required
                  />
                </div>
                <div>
                  <Label>Session Type *</Label>
                  <Select value={formData.session_type} onValueChange={(v) => handleChange('session_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Group Workshop">Group Workshop</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="GFA Recovery Circle">GFA Recovery Circle</SelectItem>
                      <SelectItem value="Support Group">Support Group</SelectItem>
                      <SelectItem value="Education Session">Education Session</SelectItem>
                      <SelectItem value="Community Event">Community Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Location</Label>
                  <Select value={formData.location} onValueChange={(v) => handleChange('location', v)}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Virtual (VRCC)">Virtual (VRCC)</SelectItem>
                      <SelectItem value="In-Person">In-Person</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} required />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={formData.duration_minutes} onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Facilitator</Label>
                  <Input value={formData.facilitator_name} onChange={(e) => handleChange('facilitator_name', e.target.value)} />
                </div>
                <div>
                  <Label>Co-Facilitator</Label>
                  <Input value={formData.co_facilitator_name} onChange={(e) => handleChange('co_facilitator_name', e.target.value)} />
                </div>
                <div>
                  <Label>Attendance Count</Label>
                  <Input type="number" value={formData.attendance_count} onChange={(e) => handleChange('attendance_count', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Engagement Level</Label>
                  <Select value={formData.average_engagement} onValueChange={(v) => handleChange('average_engagement', v)}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Session Notes</Label>
                  <Textarea
                    value={formData.session_notes}
                    onChange={(e) => handleChange('session_notes', e.target.value)}
                    rows={3}
                    placeholder="Document session notes..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
                  {createMutation.isPending ? 'Creating...' : 'Create Session'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Sessions</p>
          <p className="text-2xl font-bold text-slate-900">{sessions.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Attendees</p>
          <p className="text-2xl font-bold text-[#5B9A9A]">{totalAttendees}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Hours</p>
          <p className="text-2xl font-bold text-purple-600">{totalHours}h</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Recovery Circles</p>
          <p className="text-2xl font-bold text-[#C9A962]">
            {sessions.filter(s => s.session_type === 'GFA Recovery Circle').length}
          </p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No group sessions yet</p>
          </div>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  <Badge className={getTypeBadge(session.session_type)}>
                    {session.session_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(session.date), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {session.duration_minutes} min
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Users2 className="w-4 h-4 text-slate-400" />
                    {session.attendance_count || 0} attendees
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {session.location || 'TBD'}
                  </div>
                </div>
                {session.facilitator_name && (
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <User className="w-4 h-4" />
                    <span>Led by {session.facilitator_name}</span>
                  </div>
                )}
                {session.session_notes && (
                  <p className="text-sm text-slate-500 line-clamp-2">{session.session_notes}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}