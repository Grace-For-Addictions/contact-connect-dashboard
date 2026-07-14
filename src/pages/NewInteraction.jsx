import React, { useState, useEffect } from 'react';
import { db } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import GracefulTextarea from '../components/recovery/GracefulTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, MessageSquare, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewInteraction() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    participant_id: '',
    participant_name: '',
    staff_id: '',
    staff_name: '',
    staff_role: '',
    interaction_type: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    duration_minutes: 0,
    location: '',
    topics_covered: [],
    goals_discussed: '',
    progress_notes: '',
    follow_up_needed: false,
    follow_up_date: '',
    mood_rating: '',
    engagement_level: '',
    crisis_intervention: false,
    billable: true,
  });

  useEffect(() => {
    db.entities.Participant.filter({ status: 'Active' }).then(setParticipants);
    db.auth.me().then(u => {
      setUser(u);
      setFormData(prev => ({
        ...prev,
        staff_id: u.id,
        staff_name: u.full_name,
      }));
    });
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if ((field === 'start_time' || field === 'end_time') && updated.start_time && updated.end_time) {
        const [startH, startM] = updated.start_time.split(':').map(Number);
        const [endH, endM] = updated.end_time.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        updated.duration_minutes = Math.max(0, endMinutes - startMinutes);
      }
      return updated;
    });
  };

  const handleParticipantSelect = (id) => {
    const participant = participants.find(p => p.id === id);
    setFormData(prev => ({
      ...prev,
      participant_id: id,
      participant_name: participant ? `${participant.first_name} ${participant.last_name}` : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await db.entities.Interaction.create(formData);
    navigate(createPageUrl('Interactions'));
  };

  const topicOptions = [
    'Recovery Progress', 'Coping Skills', 'Relapse Prevention', 'Goal Setting',
    'Mental Health', 'Family/Relationships', 'Employment', 'Housing',
    'Education', 'Legal Issues', 'Health/Wellness', 'Spirituality',
    'Community Resources', 'Life Skills', 'Trauma', 'Grief/Loss'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Interactions')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Log Interaction</h1>
          <p className="text-slate-500">Record a participant interaction or session</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5 text-[#5B9A9A]" />
              Interaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label>Interaction Type *</Label>
              <Select value={formData.interaction_type} onValueChange={(v) => handleChange('interaction_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="One-on-One Session">One-on-One Session</SelectItem>
                  <SelectItem value="Group Workshop">Group Workshop</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="GFA Recovery Circle">GFA Recovery Circle</SelectItem>
                  <SelectItem value="Phone Call">Phone Call</SelectItem>
                  <SelectItem value="Text/Message">Text/Message</SelectItem>
                  <SelectItem value="Home Visit">Home Visit</SelectItem>
                  <SelectItem value="Crisis Intervention">Crisis Intervention</SelectItem>
                  <SelectItem value="Referral Coordination">Referral Coordination</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Your Role</Label>
              <Select value={formData.staff_role} onValueChange={(v) => handleChange('staff_role', v)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Life Coach">Life Coach</SelectItem>
                  <SelectItem value="Recovery Coach">Recovery Coach</SelectItem>
                  <SelectItem value="Peer Support Specialist">Peer Support Specialist</SelectItem>
                  <SelectItem value="Volunteer">Volunteer</SelectItem>
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
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Community Setting">Community Setting</SelectItem>
                  <SelectItem value="Participant Home">Participant Home</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-[#5B9A9A]" />
              Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} required />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input type="time" value={formData.start_time} onChange={(e) => handleChange('start_time', e.target.value)} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={formData.end_time} onChange={(e) => handleChange('end_time', e.target.value)} />
            </div>
            <div>
              <Label>Duration (minutes) *</Label>
              <Input type="number" value={formData.duration_minutes} onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 0)} required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Topics Covered</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {topicOptions.map(topic => (
                  <Button
                    key={topic}
                    type="button"
                    variant={formData.topics_covered.includes(topic) ? "default" : "outline"}
                    size="sm"
                    className={formData.topics_covered.includes(topic) ? "bg-[#5B9A9A] hover:bg-[#3D7A7A]" : ""}
                    onClick={() => {
                      const topics = formData.topics_covered.includes(topic)
                        ? formData.topics_covered.filter(t => t !== topic)
                        : [...formData.topics_covered, topic];
                      handleChange('topics_covered', topics);
                    }}
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Goals Discussed</Label>
              <Textarea value={formData.goals_discussed} onChange={(e) => handleChange('goals_discussed', e.target.value)} rows={2} placeholder="What goals were discussed during this session?" />
            </div>
            <div>
              <GracefulTextarea
                label="Progress Notes"
                value={formData.progress_notes}
                onChange={(e) => handleChange('progress_notes', e.target.value)}
                rows={4}
                placeholder="Document session notes and participant progress..."
                enableAI={true}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Participant Mood (1-10)</Label>
                <Input type="number" min="1" max="10" value={formData.mood_rating} onChange={(e) => handleChange('mood_rating', parseInt(e.target.value) || '')} />
              </div>
              <div>
                <Label>Engagement Level</Label>
                <Select value={formData.engagement_level} onValueChange={(v) => handleChange('engagement_level', v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Resistant">Resistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formData.follow_up_needed} onCheckedChange={(v) => handleChange('follow_up_needed', v)} />
                <Label>Follow-up Needed</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.crisis_intervention} onCheckedChange={(v) => handleChange('crisis_intervention', v)} />
                <Label>Crisis Intervention</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.billable} onCheckedChange={(v) => handleChange('billable', v)} />
                <Label>Billable</Label>
              </div>
            </div>
            {formData.follow_up_needed && (
              <div className="w-48">
                <Label>Follow-up Date</Label>
                <Input type="date" value={formData.follow_up_date} onChange={(e) => handleChange('follow_up_date', e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to={createPageUrl('Interactions')}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
            {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save Interaction</>}
          </Button>
        </div>
      </form>
    </div>
  );
}