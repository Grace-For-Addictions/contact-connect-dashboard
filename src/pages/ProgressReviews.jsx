import React, { useState } from 'react';
import { db } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Sparkles, Calendar, TrendingUp, TrendingDown, User, Edit } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

export default function ProgressReviews() {
  const [selectedParticipant, setSelectedParticipant] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ['progressReviews'],
    queryFn: () => db.entities.ProgressReview.list('-created_date'),
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => db.entities.Participant.list(),
  });

  const generateMonthlyReview = async (participantId) => {
    setIsGenerating(true);
    try {
      const participant = participants.find(p => p.id === participantId);
      const now = new Date();
      const periodStart = startOfMonth(subMonths(now, 1));
      const periodEnd = endOfMonth(subMonths(now, 1));

      // Fetch all relevant data for the participant
      const [checkIns, goals, recoveryCapital, interactions] = await Promise.all([
        db.entities.CheckIn.filter({ participant_id: participantId }),
        db.entities.Goal.filter({ participant_id: participantId }),
        db.entities.RecoveryCapital.filter({ participant_id: participantId }),
        db.entities.Interaction.filter({ participant_id: participantId })
      ]);

      // Filter data by period
      const periodCheckIns = checkIns.filter(c => {
        const date = new Date(c.date);
        return date >= periodStart && date <= periodEnd;
      });

      const periodInteractions = interactions.filter(i => {
        const date = new Date(i.date);
        return date >= periodStart && date <= periodEnd;
      });

      // Calculate metrics
      const completedGoals = goals.filter(g => g.status === 'Completed');
      const inProgressGoals = goals.filter(g => g.status === 'In Progress');
      const goalCompletionRate = goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

      const avgMood = periodCheckIns.length > 0
        ? periodCheckIns.reduce((sum, c) => sum + (c.mood_rating || 0), 0) / periodCheckIns.length
        : null;

      const sobrietyRate = periodCheckIns.length > 0
        ? (periodCheckIns.filter(c => c.sobriety_maintained).length / periodCheckIns.length) * 100
        : null;

      const sortedCapital = recoveryCapital.sort((a, b) => 
        new Date(b.assessment_date) - new Date(a.assessment_date)
      );
      const capitalTrend = sortedCapital.length >= 2
        ? sortedCapital[0].total_score > sortedCapital[1].total_score ? 'Improving' : 
          sortedCapital[0].total_score < sortedCapital[1].total_score ? 'Declining' : 'Stable'
        : 'Insufficient Data';

      // Build AI prompt
      const prompt = `You are a compassionate recovery coach creating a monthly progress review. Use dignity-first, person-centered language.

Participant: ${participant.first_name} ${participant.last_name}
Review Period: ${format(periodStart, 'MMMM yyyy')}

Data Summary:
- Check-ins completed: ${periodCheckIns.length}
- Average mood rating: ${avgMood ? avgMood.toFixed(1) : 'N/A'}/10
- Sobriety maintained: ${sobrietyRate ? sobrietyRate.toFixed(0) : 'N/A'}%
- Goals: ${completedGoals.length} completed, ${inProgressGoals.length} in progress
- Coach interactions: ${periodInteractions.length}
- Recovery capital trend: ${capitalTrend}

Recent Check-in Notes:
${periodCheckIns.slice(0, 3).map(c => `- Highlights: ${c.highlights || 'None'}\n  Challenges: ${c.challenges || 'None'}`).join('\n')}

Active Goals:
${inProgressGoals.slice(0, 5).map(g => `- ${g.title} (${g.category}): ${g.progress_percentage}% complete`).join('\n')}

Generate a comprehensive monthly review in JSON format with:
1. summary: 2-3 paragraph narrative of their progress (warm, specific, encouraging)
2. areas_of_excellence: array of 3-5 specific strengths or achievements
3. areas_needing_support: array of 2-4 areas where additional support would help
4. recommendations: specific, actionable next steps for the coming month
5. check_in_consistency: rate their engagement (Excellent/Good/Fair/Poor)

Use "person in recovery" language, celebrate small wins, and frame challenges with grace.`;

      const aiResponse = await db.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            areas_of_excellence: { type: "array", items: { type: "string" } },
            areas_needing_support: { type: "array", items: { type: "string" } },
            recommendations: { type: "string" },
            check_in_consistency: { type: "string" }
          }
        }
      });

      // Create the review
      const user = await db.auth.me();
      await db.entities.ProgressReview.create({
        participant_id: participantId,
        participant_name: `${participant.first_name} ${participant.last_name}`,
        review_period_start: periodStart.toISOString().split('T')[0],
        review_period_end: periodEnd.toISOString().split('T')[0],
        status: 'Draft',
        ai_generated_summary: aiResponse.summary + '\n\nRecommendations:\n' + aiResponse.recommendations,
        coach_edited_summary: aiResponse.summary + '\n\nRecommendations:\n' + aiResponse.recommendations,
        areas_of_excellence: aiResponse.areas_of_excellence,
        areas_needing_support: aiResponse.areas_needing_support,
        recovery_capital_trend: capitalTrend,
        goal_completion_rate: Math.round(goalCompletionRate),
        check_in_consistency: aiResponse.check_in_consistency,
        generated_by: user.full_name
      });

      toast.success('Progress review generated successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to generate review');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesParticipant = selectedParticipant === 'all' || r.participant_id === selectedParticipant;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesParticipant && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      'Draft': 'bg-amber-100 text-amber-700',
      'Finalized': 'bg-green-100 text-green-700',
      'Shared': 'bg-blue-100 text-blue-700'
    };
    return styles[status] || styles.Draft;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'Improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'Declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Progress Reviews</h1>
          <p className="text-slate-500 mt-1">AI-generated monthly summaries with coach oversight</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-8 h-8 mx-auto text-[#5B9A9A] mb-2" />
            <p className="text-2xl font-bold text-slate-900">{reviews.length}</p>
            <p className="text-sm text-slate-600">Total Reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Sparkles className="w-8 h-8 mx-auto text-amber-600 mb-2" />
            <p className="text-2xl font-bold text-slate-900">
              {reviews.filter(r => r.status === 'Draft').length}
            </p>
            <p className="text-sm text-slate-600">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-slate-900">
              {reviews.filter(r => r.status === 'Finalized').length}
            </p>
            <p className="text-sm text-slate-600">Finalized</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate New Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select onValueChange={(value) => generateMonthlyReview(value)} disabled={isGenerating}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select participant to generate review" />
              </SelectTrigger>
              <SelectContent>
                {participants.filter(p => p.status === 'Active').map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-4 h-4 border-2 border-[#5B9A9A] border-t-transparent rounded-full animate-spin" />
                Generating...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="All Participants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Participants</SelectItem>
              {participants.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Finalized">Finalized</SelectItem>
              <SelectItem value="Shared">Shared</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredReviews.map((review) => (
          <Card key={review.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-slate-400" />
                    {review.participant_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(review.review_period_start), 'MMM yyyy')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusBadge(review.status)}>
                    {review.status}
                  </Badge>
                  <Link to={createPageUrl(`EditProgressReview?id=${review.id}`)}>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Recovery Capital</p>
                  <div className="flex items-center gap-1 font-semibold">
                    {getTrendIcon(review.recovery_capital_trend)}
                    {review.recovery_capital_trend}
                  </div>
                </div>
                <div>
                  <p className="text-slate-500">Goal Completion</p>
                  <p className="font-semibold">{review.goal_completion_rate}%</p>
                </div>
                <div>
                  <p className="text-slate-500">Engagement</p>
                  <p className="font-semibold">{review.check_in_consistency}</p>
                </div>
                <div>
                  <p className="text-slate-500">Generated By</p>
                  <p className="font-semibold text-xs">{review.generated_by || 'System'}</p>
                </div>
              </div>

              {review.areas_of_excellence?.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2 text-green-700">Areas of Excellence:</p>
                  <div className="flex flex-wrap gap-2">
                    {review.areas_of_excellence.map((area, idx) => (
                      <Badge key={idx} className="bg-green-100 text-green-700">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {review.areas_needing_support?.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2 text-amber-700">Areas Needing Support:</p>
                  <div className="flex flex-wrap gap-2">
                    {review.areas_needing_support.map((area, idx) => (
                      <Badge key={idx} variant="outline" className="border-amber-300 text-amber-700">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredReviews.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No progress reviews found</p>
              <p className="text-xs text-slate-400 mt-1">Generate a new review to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}