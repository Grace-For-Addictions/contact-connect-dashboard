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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Compass, ArrowRight, ArrowLeft, Calendar, User, Building, Phone, Mail } from 'lucide-react';

export default function Referrals() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    participant_id: '',
    participant_name: '',
    referral_type: 'Outgoing',
    referral_date: new Date().toISOString().split('T')[0],
    source_organization: '',
    destination_organization: '',
    service_type: '',
    status: 'Pending',
    follow_up_date: '',
    outcome: '',
    notes: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
  });

  useEffect(() => {
    base44.entities.Participant.list().then(setParticipants);
  }, []);

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list('-referral_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Referral.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setDialogOpen(false);
      setFormData({
        participant_id: '', participant_name: '', referral_type: 'Outgoing',
        referral_date: new Date().toISOString().split('T')[0], source_organization: '',
        destination_organization: '', service_type: '', status: 'Pending',
        follow_up_date: '', outcome: '', notes: '', contact_person: '', contact_phone: '', contact_email: '',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Referral.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referrals'] }),
  });

  const handleParticipantSelect = (id) => {
    const participant = participants.find(p => p.id === id);
    setFormData(prev => ({
      ...prev,
      participant_id: id,
      participant_name: participant ? `${participant.first_name} ${participant.last_name}` : ''
    }));
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesType = typeFilter === 'all' || r.referral_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-amber-50 text-amber-600',
      'Contacted': 'bg-blue-50 text-blue-600',
      'Scheduled': 'bg-purple-50 text-purple-600',
      'Completed': 'bg-emerald-50 text-emerald-600',
      'Declined': 'bg-rose-50 text-rose-600',
      'No Response': 'bg-slate-100 text-slate-600',
    };
    return styles[status] || styles['Pending'];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Referrals</h1>
          <p className="text-slate-500 mt-1">Track incoming and outgoing participant referrals</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
              <Plus className="w-4 h-4 mr-2" />
              New Referral
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Referral</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
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
                  <Label>Referral Type *</Label>
                  <Select value={formData.referral_type} onValueChange={(v) => setFormData(prev => ({ ...prev, referral_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Incoming">Incoming (to GFA)</SelectItem>
                      <SelectItem value="Outgoing">Outgoing (from GFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Service Type *</Label>
                  <Select value={formData.service_type} onValueChange={(v) => setFormData(prev => ({ ...prev, service_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      {['Treatment', 'Housing', 'Employment', 'Mental Health', 'Medical', 'Legal', 'Social Services', 'Education', 'Peer Support', 'Other'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Referral Date</Label>
                  <Input type="date" value={formData.referral_date} onChange={(e) => setFormData(prev => ({ ...prev, referral_date: e.target.value }))} />
                </div>
                <div>
                  <Label>{formData.referral_type === 'Incoming' ? 'Source Organization' : 'Destination Organization'}</Label>
                  <Input 
                    value={formData.referral_type === 'Incoming' ? formData.source_organization : formData.destination_organization} 
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      [formData.referral_type === 'Incoming' ? 'source_organization' : 'destination_organization']: e.target.value 
                    }))} 
                    placeholder="Organization name"
                  />
                </div>
                <div>
                  <Label>Follow-up Date</Label>
                  <Input type="date" value={formData.follow_up_date} onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Contact Person</Label>
                  <Input value={formData.contact_person} onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))} />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input value={formData.contact_phone} onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))} />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input type="email" value={formData.contact_email} onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">Create Referral</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Referrals</p>
          <p className="text-2xl font-bold text-slate-900">{referrals.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Incoming</p>
          <p className="text-2xl font-bold text-blue-600">{referrals.filter(r => r.referral_type === 'Incoming').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Outgoing</p>
          <p className="text-2xl font-bold text-purple-600">{referrals.filter(r => r.referral_type === 'Outgoing').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{referrals.filter(r => r.status === 'Completed').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Incoming">Incoming</SelectItem>
            <SelectItem value="Outgoing">Outgoing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {['Pending', 'Contacted', 'Scheduled', 'Completed', 'Declined', 'No Response'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Type</TableHead>
              <TableHead>Participant</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12">Loading...</TableCell></TableRow>
            ) : filteredReferrals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Compass className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No referrals found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredReferrals.map((referral) => (
                <TableRow key={referral.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Badge variant="outline" className={referral.referral_type === 'Incoming' ? 'text-blue-600 border-blue-200' : 'text-purple-600 border-purple-200'}>
                      {referral.referral_type === 'Incoming' ? <ArrowRight className="w-3 h-3 mr-1" /> : <ArrowLeft className="w-3 h-3 mr-1" />}
                      {referral.referral_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {referral.participant_name || '—'}
                    </div>
                  </TableCell>
                  <TableCell>{referral.service_type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      {referral.referral_type === 'Incoming' ? referral.source_organization : referral.destination_organization || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {format(new Date(referral.referral_date), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(referral.status)}>{referral.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={referral.status}
                      onValueChange={(v) => updateMutation.mutate({ id: referral.id, data: { status: v } })}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Pending', 'Contacted', 'Scheduled', 'Completed', 'Declined', 'No Response'].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}