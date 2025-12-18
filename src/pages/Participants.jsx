import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, differenceInDays } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, UserPlus, Filter, ChevronRight, Calendar, Heart, User } from 'lucide-react';

export default function Participants() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [substanceFilter, setSubstanceFilter] = useState('all');

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['participants'],
    queryFn: () => base44.entities.Participant.list('-created_date'),
  });

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = !search || 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSubstance = substanceFilter === 'all' || p.primary_substance === substanceFilter;
    return matchesSearch && matchesStatus && matchesSubstance;
  });

  const getStatusBadge = (status) => {
    const styles = {
      'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Inactive': 'bg-slate-50 text-slate-600 border-slate-200',
      'Graduated': 'bg-[#C9A962]/10 text-[#C9A962] border-[#C9A962]/30',
      'Transferred': 'bg-blue-50 text-blue-600 border-blue-200',
      'Lost to Follow-up': 'bg-rose-50 text-rose-600 border-rose-200',
    };
    return styles[status] || styles['Inactive'];
  };

  const getDaysInRecovery = (startDate) => {
    if (!startDate) return null;
    return differenceInDays(new Date(), new Date(startDate));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Participants</h1>
          <p className="text-slate-500 mt-1">Manage and track all program participants</p>
        </div>
        <Link to={createPageUrl('AddParticipant')}>
          <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Participant
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Graduated">Graduated</SelectItem>
              <SelectItem value="Transferred">Transferred</SelectItem>
            </SelectContent>
          </Select>
          <Select value={substanceFilter} onValueChange={setSubstanceFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Primary Substance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Substances</SelectItem>
              <SelectItem value="Alcohol">Alcohol</SelectItem>
              <SelectItem value="Opioids">Opioids</SelectItem>
              <SelectItem value="Methamphetamine">Methamphetamine</SelectItem>
              <SelectItem value="Cocaine">Cocaine</SelectItem>
              <SelectItem value="Cannabis">Cannabis</SelectItem>
              <SelectItem value="Multiple Substances">Multiple Substances</SelectItem>
              <SelectItem value="None - Mental Health Only">Mental Health Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{participants.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{participants.filter(p => p.status === 'Active').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Graduated</p>
          <p className="text-2xl font-bold text-[#C9A962]">{participants.filter(p => p.status === 'Graduated').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">This Month</p>
          <p className="text-2xl font-bold text-[#5B9A9A]">
            {participants.filter(p => {
              if (!p.enrollment_date) return false;
              const date = new Date(p.enrollment_date);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Participant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days in Recovery</TableHead>
                <TableHead>Assigned Coach</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="w-5 h-5 border-2 border-[#5B9A9A] border-t-transparent rounded-full animate-spin" />
                      Loading participants...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No participants found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map((participant) => {
                  const daysInRecovery = getDaysInRecovery(participant.recovery_start_date);
                  return (
                    <TableRow key={participant.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#5B9A9A]/10 flex items-center justify-center">
                            <span className="text-[#5B9A9A] font-medium">
                              {participant.first_name?.[0]}{participant.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {participant.first_name} {participant.last_name}
                            </p>
                            <p className="text-sm text-slate-500">{participant.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(participant.status)}>
                          {participant.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {daysInRecovery !== null ? (
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-rose-400" />
                            <span className="font-medium">{daysInRecovery} days</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">{participant.assigned_coach_name || '—'}</span>
                      </TableCell>
                      <TableCell>
                        {participant.enrollment_date && (
                          <div className="flex items-center gap-1 text-slate-500 text-sm">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(participant.enrollment_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link to={createPageUrl(`ParticipantDetail?id=${participant.id}`)}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}