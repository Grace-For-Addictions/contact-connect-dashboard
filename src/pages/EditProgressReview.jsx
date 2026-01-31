import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Share2, Sparkles, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function EditProgressReview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const reviewId = urlParams.get('id');

  const [editedSummary, setEditedSummary] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [activeTab, setActiveTab] = useState('edit');

  const { data: review, isLoading } = useQuery({
    queryKey: ['progressReview', reviewId],
    queryFn: async () => {
      const reviews = await base44.entities.ProgressReview.list();
      return reviews.find(r => r.id === reviewId);
    },
    enabled: !!reviewId,
  });

  useEffect(() => {
    if (review) {
      setEditedSummary(review.coach_edited_summary || review.ai_generated_summary || '');
      setCoachNotes(review.coach_notes || '');
    }
  }, [review]);

  const updateReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.ProgressReview.update(reviewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressReview', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['progressReviews'] });
      toast.success('Progress review updated');
    }
  });

  const handleSaveDraft = async () => {
    const user = await base44.auth.me();
    await updateReviewMutation.mutateAsync({
      coach_edited_summary: editedSummary,
      coach_notes: coachNotes,
      status: 'Draft'
    });
  };

  const handleFinalize = async () => {
    const user = await base44.auth.me();
    await updateReviewMutation.mutateAsync({
      coach_edited_summary: editedSummary,
      coach_notes: coachNotes,
      status: 'Finalized',
      finalized_by: user.full_name,
      finalized_date: new Date().toISOString().split('T')[0]
    });
    toast.success('Review finalized and ready to share');
  };

  const handleShare = async () => {
    await updateReviewMutation.mutateAsync({
      status: 'Shared'
    });
    toast.success('Review marked as shared');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-[#5B9A9A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-500">Review not found</p>
        <Button onClick={() => navigate(createPageUrl('ProgressReviews'))} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('ProgressReviews'))}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Edit Progress Review</h1>
          <p className="text-slate-500 mt-1">
            {review.participant_name} - {format(new Date(review.review_period_start), 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          {review.status === 'Draft' && (
            <Button onClick={handleFinalize} className="bg-green-600 hover:bg-green-700">
              Finalize
            </Button>
          )}
          {review.status === 'Finalized' && (
            <Button onClick={handleShare} className="bg-blue-600 hover:bg-blue-700">
              <Share2 className="w-4 h-4 mr-2" />
              Mark as Shared
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Recovery Capital</p>
            <p className="text-xl font-bold text-slate-900">{review.recovery_capital_trend}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Goal Completion</p>
            <p className="text-xl font-bold text-slate-900">{review.goal_completion_rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Engagement</p>
            <p className="text-xl font-bold text-slate-900">{review.check_in_consistency}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">
            <FileText className="w-4 h-4 mr-2" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>AI-Generated Summary</CardTitle>
                <Badge className="bg-purple-100 text-purple-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-slate-50 text-sm whitespace-pre-wrap">
                {review.ai_generated_summary}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit Summary</CardTitle>
              <p className="text-sm text-slate-500">Refine the AI-generated content with your insights</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Coach-Edited Summary</Label>
                <Textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  rows={12}
                  className="mt-2 font-mono text-sm"
                  placeholder="Edit the summary as needed..."
                />
              </div>
              <div>
                <Label>Additional Coach Notes (Internal)</Label>
                <Textarea
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  rows={4}
                  className="mt-2"
                  placeholder="Add any internal notes, observations, or action items..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Areas of Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.areas_of_excellence?.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-700">Areas Needing Support</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.areas_needing_support?.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Final Review Preview</CardTitle>
              <p className="text-sm text-slate-500">This is how the review will appear when shared</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Progress Review</h3>
                  <div className="text-sm text-slate-500">
                    {format(new Date(review.review_period_start), 'MMMM yyyy')}
                  </div>
                </div>
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown>{editedSummary}</ReactMarkdown>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Celebrating Your Strengths</h4>
                  <ul className="space-y-1">
                    {review.areas_of_excellence?.map((area, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-700 mb-2">Growth Opportunities</h4>
                  <ul className="space-y-1">
                    {review.areas_needing_support?.map((area, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-amber-600">→</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t text-xs text-slate-500">
                <p>Generated by: {review.generated_by}</p>
                {review.finalized_by && (
                  <p>Finalized by: {review.finalized_by} on {format(new Date(review.finalized_date), 'MMM d, yyyy')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}