import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Plus, Calendar, Clock, User, MapPin, MessageSquare } from 'lucide-react';

export default function Interactions() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list('-date', 200),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const filteredInteractions = interactions.filter(i => {
    const matchesSearch = !search || 
      i.participant_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.staff_name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || i.interaction_type === typeFilter;
    const matchesStaff = staffFilter === 'all' || i.staff_id === staffFilter;
    return matchesSearch && matchesType && matchesStaff;
  });

  const totalHours = Math.round(filteredInteractions.reduce((sum, i) => sum + (i.duration_minutes || 0), 0) / 60);

  const getTypeBadge = (type) => {
    const styles = {
      'One-on-One Session': 'bg-[#5B9A9A]/10 text-[#5B9A9A]',
      'Group Workshop': 'bg-purple-50 text-purple-600',
      'Training': 'bg-blue-50 text-blue-600',
      'GFA Recovery Circle': 'bg-[#C9A962]/10 text-[#C9A962]',
      'Phone Call': 'bg-emerald-50 text-emerald-600',
      'Crisis Intervention': 'bg-rose-50 text-rose-600',
    };
    return styles[type] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interactions</h1>
          <p className="text-slate-500 mt-1">Track all participant engagements and sessions</p>
        </div>
        <Link to={createPageUrl('LogInteraction')}>
          <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
            <Plus className="w-4 h-4 mr-2" />
            Log Interaction
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by participant or staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="One-on-One Session">One-on-One Session</SelectItem>
              <SelectItem value="Group Workshop">Group Workshop</SelectItem>
              <SelectItem value="Training">Training</SelectItem>
              <SelectItem value="GFA Recovery Circle">GFA Recovery Circle</SelectItem>
              <SelectItem value="Phone Call">Phone Call</SelectItem>
              <SelectItem value="Crisis Intervention">Crisis Intervention</SelectItem>
            </SelectContent>
          </Select>
          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Interactions</p>
          <p className="text-2xl font-bold text-slate-900">{filteredInteractions.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total Hours</p>
          <p className="text-2xl font-bold text-[#5B9A9A]">{totalHours}h</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">One-on-One</p>
          <p className="text-2xl font-bold text-purple-600">
            {filteredInteractions.filter(i => i.interaction_type === 'One-on-One Session').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Recovery Circles</p>
          <p className="text-2xl font-bold text-[#C9A962]">
            {filteredInteractions.filter(i => i.interaction_type === 'GFA Recovery Circle').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="w-5 h-5 border-2 border-[#5B9A9A] border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInteractions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No interactions found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInteractions.map((interaction) => (
                  <TableRow key={interaction.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{format(new Date(interaction.date), 'MMM d, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadge(interaction.interaction_type)}>
                        {interaction.interaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{interaction.participant_name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{interaction.staff_name || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{interaction.duration_minutes} min</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span className="text-sm">{interaction.location || '—'}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}