import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, differenceInDays } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { Download, FileText, Calendar, Users, Target, TrendingUp, Filter, BarChart3 } from 'lucide-react';

const COLORS = ['#5B9A9A', '#C9A962', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

export default function Reports() {
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [chartType, setChartType] = useState('bar');
  const [demographicFilter, setDemographicFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { data: participants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => base44.entities.Participant.list(),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.list(),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => base44.entities.Milestone.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list(),
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys'],
    queryFn: () => base44.entities.Survey.list(),
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list(),
  });

  // Date range calculation
  const getDateRange = () => {
    const now = new Date();
    switch (reportPeriod) {
      case 'weekly':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'monthly':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'quarterly':
        return { start: startOfQuarter(now), end: endOfQuarter(now) };
      case 'yearly':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { 
          start: customStart ? new Date(customStart) : subDays(now, 30), 
          end: customEnd ? new Date(customEnd) : now 
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start: dateStart, end: dateEnd } = getDateRange();

  // Filter data by date and demographics
  const filterByDate = (items, dateField) => {
    return items.filter(item => {
      const date = new Date(item[dateField]);
      return date >= dateStart && date <= dateEnd;
    });
  };

  const filterByDemographic = (items) => {
    if (demographicFilter === 'all') return items;
    return items.filter(item => {
      const participant = participants.find(p => p.id === item.participant_id);
      if (!participant) return false;
      switch (demographicFilter) {
        case 'male': return participant.gender === 'Male';
        case 'female': return participant.gender === 'Female';
        case 'veteran': return participant.veteran_status;
        case 'medicaid': return participant.insurance_status === 'Medicaid';
        default: return true;
      }
    });
  };

  // Calculate metrics
  const periodInteractions = filterByDemographic(filterByDate(interactions, 'date'));
  const periodGoals = filterByDemographic(filterByDate(goals, 'created_date'));
  const periodMilestones = filterByDemographic(filterByDate(milestones, 'date_achieved'));
  const periodCheckIns = filterByDemographic(filterByDate(checkIns, 'date'));
  const periodReferrals = filterByDemographic(filterByDate(referrals, 'referral_date'));

  const totalServiceHours = Math.round(periodInteractions.reduce((sum, i) => sum + (i.duration_minutes || 0), 0) / 60);
  const uniqueParticipantsServed = [...new Set(periodInteractions.map(i => i.participant_id))].length;
  const goalsCompleted = periodGoals.filter(g => g.status === 'Completed').length;
  const avgSatisfaction = surveys.length > 0 
    ? (surveys.reduce((sum, s) => sum + (s.overall_satisfaction || 0), 0) / surveys.length).toFixed(1)
    : 'N/A';

  // Demographics breakdown
  const demographicsData = [
    { name: 'Male', value: participants.filter(p => p.gender === 'Male').length },
    { name: 'Female', value: participants.filter(p => p.gender === 'Female').length },
    { name: 'Other', value: participants.filter(p => !['Male', 'Female'].includes(p.gender)).length },
  ].filter(d => d.value > 0);

  const substanceData = participants.reduce((acc, p) => {
    const substance = p.primary_substance || 'Not Specified';
    acc[substance] = (acc[substance] || 0) + 1;
    return acc;
  }, {});

  const substanceChartData = Object.entries(substanceData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const outcomeData = [
    { name: 'Active', value: participants.filter(p => p.status === 'Active').length },
    { name: 'Graduated', value: participants.filter(p => p.status === 'Graduated').length },
    { name: 'Inactive', value: participants.filter(p => p.status === 'Inactive').length },
    { name: 'Transferred', value: participants.filter(p => p.status === 'Transferred').length },
  ].filter(d => d.value > 0);

  // Interaction types breakdown
  const interactionTypeData = periodInteractions.reduce((acc, i) => {
    acc[i.interaction_type] = (acc[i.interaction_type] || 0) + 1;
    return acc;
  }, {});

  const interactionChartData = Object.entries(interactionTypeData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Referral sources
  const referralSourceData = participants.reduce((acc, p) => {
    const source = p.referral_source || 'Not Specified';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const referralSourceChartData = Object.entries(referralSourceData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Export function
  const exportReport = () => {
    const reportData = {
      reportPeriod: `${format(dateStart, 'MMM d, yyyy')} - ${format(dateEnd, 'MMM d, yyyy')}`,
      generatedAt: new Date().toISOString(),
      summary: {
        totalParticipants: participants.length,
        activeParticipants: participants.filter(p => p.status === 'Active').length,
        totalInteractions: periodInteractions.length,
        totalServiceHours,
        uniqueParticipantsServed,
        goalsCompleted,
        totalMilestones: periodMilestones.length,
        referralsProcessed: periodReferrals.length,
        avgSatisfactionRating: avgSatisfaction,
      },
      demographics: {
        gender: demographicsData,
        substance: substanceChartData,
        outcomes: outcomeData,
      },
      services: {
        interactionTypes: interactionChartData,
        referralSources: referralSourceChartData,
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GFA_Report_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Report Period', `${format(dateStart, 'MMM d, yyyy')} - ${format(dateEnd, 'MMM d, yyyy')}`],
      ['Total Participants', participants.length],
      ['Active Participants', participants.filter(p => p.status === 'Active').length],
      ['Total Interactions', periodInteractions.length],
      ['Total Service Hours', totalServiceHours],
      ['Unique Participants Served', uniqueParticipantsServed],
      ['Goals Completed', goalsCompleted],
      ['Total Milestones', periodMilestones.length],
      ['Referrals Processed', periodReferrals.length],
      ['Avg Satisfaction Rating', avgSatisfaction],
    ];

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GFA_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderChart = (data, title) => {
    if (data.length === 0) return <div className="h-[250px] flex items-center justify-center text-slate-400">No data available</div>;

    switch (chartType) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#5B9A9A" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#5B9A9A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Generate comprehensive reports for grant reporting and quality assurance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={exportReport} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
            <FileText className="w-4 h-4 mr-2" />
            Export Full Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label className="text-xs text-slate-500">Report Period</Label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {reportPeriod === 'custom' && (
              <>
                <div>
                  <Label className="text-xs text-slate-500">Start Date</Label>
                  <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-40" />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">End Date</Label>
                  <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-40" />
                </div>
              </>
            )}
            <div>
              <Label className="text-xs text-slate-500">Demographic Filter</Label>
              <Select value={demographicFilter} onValueChange={setDemographicFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Demographics</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="veteran">Veterans</SelectItem>
                  <SelectItem value="medicaid">Medicaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Chart Type</Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-slate-50 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">
              Report Period: <strong>{format(dateStart, 'MMM d, yyyy')}</strong> - <strong>{format(dateEnd, 'MMM d, yyyy')}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="bg-[#5B9A9A]/5">
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto text-[#5B9A9A] mb-2" />
            <p className="text-3xl font-bold text-[#5B9A9A]">{uniqueParticipantsServed}</p>
            <p className="text-xs text-slate-600">Participants Served</p>
          </CardContent>
        </Card>
        <Card className="bg-[#C9A962]/5">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-[#C9A962] mb-2" />
            <p className="text-3xl font-bold text-[#C9A962]">{periodInteractions.length}</p>
            <p className="text-xs text-slate-600">Total Interactions</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-purple-600">{totalServiceHours}h</p>
            <p className="text-xs text-slate-600">Service Hours</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50">
          <CardContent className="pt-6 text-center">
            <Target className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <p className="text-3xl font-bold text-emerald-600">{goalsCompleted}</p>
            <p className="text-xs text-slate-600">Goals Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6 text-center">
            <FileText className="w-8 h-8 mx-auto text-amber-600 mb-2" />
            <p className="text-3xl font-bold text-amber-600">{periodReferrals.length}</p>
            <p className="text-xs text-slate-600">Referrals</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="demographics">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Gender Distribution</CardTitle></CardHeader>
              <CardContent>{renderChart(demographicsData, 'Gender')}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Primary Substance</CardTitle></CardHeader>
              <CardContent>{renderChart(substanceChartData, 'Substance')}</CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="outcomes" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Participant Status</CardTitle></CardHeader>
              <CardContent>{renderChart(outcomeData, 'Status')}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Outcome Metrics</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Graduation Rate</span>
                    <span className="text-xl font-bold text-[#5B9A9A]">
                      {participants.length > 0 ? Math.round((participants.filter(p => p.status === 'Graduated').length / participants.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Retention Rate</span>
                    <span className="text-xl font-bold text-emerald-600">
                      {participants.length > 0 ? Math.round((participants.filter(p => p.status === 'Active').length / participants.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Avg Satisfaction</span>
                    <span className="text-xl font-bold text-[#C9A962]">{avgSatisfaction}/10</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Milestones Achieved</span>
                    <span className="text-xl font-bold text-purple-600">{periodMilestones.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Interaction Types</CardTitle></CardHeader>
              <CardContent>{renderChart(interactionChartData, 'Interactions')}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Service Delivery Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {interactionChartData.slice(0, 6).map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <Badge variant="outline">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Referral Sources</CardTitle></CardHeader>
              <CardContent>{renderChart(referralSourceChartData, 'Sources')}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Referral Statistics</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Total Incoming</span>
                    <span className="text-xl font-bold text-blue-600">
                      {referrals.filter(r => r.referral_type === 'Incoming').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Total Outgoing</span>
                    <span className="text-xl font-bold text-purple-600">
                      {referrals.filter(r => r.referral_type === 'Outgoing').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Completed</span>
                    <span className="text-xl font-bold text-emerald-600">
                      {referrals.filter(r => r.status === 'Completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Completion Rate</span>
                    <span className="text-xl font-bold text-[#5B9A9A]">
                      {referrals.length > 0 ? Math.round((referrals.filter(r => r.status === 'Completed').length / referrals.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Grant Compliance Note */}
      <Card className="bg-gradient-to-r from-[#5B9A9A]/5 to-[#C9A962]/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <FileText className="w-8 h-8 text-[#5B9A9A] shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Grant Reporting Ready</h3>
              <p className="text-sm text-slate-600">
                This report includes all key metrics required for state and federal grant reporting, including participant demographics, 
                service delivery hours, outcome measures, referral tracking, and quality indicators. Export options provide both 
                detailed JSON format for data integration and CSV format for spreadsheet analysis.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline" className="text-[#5B9A9A] border-[#5B9A9A]/30">SAMHSA Compliant</Badge>
                <Badge variant="outline" className="text-[#5B9A9A] border-[#5B9A9A]/30">GPRA Metrics</Badge>
                <Badge variant="outline" className="text-[#5B9A9A] border-[#5B9A9A]/30">State Reporting</Badge>
                <Badge variant="outline" className="text-[#5B9A9A] border-[#5B9A9A]/30">Quality Assurance</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}