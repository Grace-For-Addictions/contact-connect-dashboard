import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, BookOpen, MessageCircle, Award, TrendingUp, Send, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function CoachTraining() {
  const [activeTab, setActiveTab] = useState('assistant');
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [caseStudyDialogOpen, setCaseStudyDialogOpen] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [coachResponse, setCoachResponse] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: trainingRecords = [] } = useQuery({
    queryKey: ['coachTraining', user?.id],
    queryFn: () => base44.entities.CoachTraining.filter({ coach_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list(),
  });

  const createTrainingMutation = useMutation({
    mutationFn: (data) => base44.entities.CoachTraining.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachTraining'] });
      toast.success('Training record saved');
    }
  });

  const handleAskAssistant = async () => {
    if (!query.trim()) return;

    const userMessage = { role: 'coach', content: query };
    setChatHistory([...chatHistory, userMessage]);
    setQuery('');
    setIsLoadingAI(true);

    try {
      const prompt = `You are an expert coach trainer specializing in addiction recovery and trauma-informed care. A coach has asked you the following question:

"${query}"

Provide practical, evidence-based guidance that includes:
1. Best practices and proven intervention strategies
2. Specific techniques they can use in their next session
3. Potential pitfalls to avoid
4. Resources for further learning

Keep your response conversational, supportive, and actionable.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      setChatHistory([...chatHistory, userMessage, { role: 'assistant', content: response }]);
    } catch (error) {
      toast.error('Failed to get response');
      console.error(error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const generateCaseStudy = async () => {
    setIsLoadingAI(true);
    try {
      const prompt = `Generate a realistic case study scenario for addiction recovery coach training. Create a challenging but realistic participant scenario that includes:

1. Participant background (age, substance use history, current situation)
2. Recent developments or challenges
3. Specific presenting issue or crisis
4. Context about their progress and setbacks

Make it detailed enough for a coach to practice applying intervention strategies. Return as JSON with fields: participant_name, background, current_challenge, context.`;

      const scenario = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            participant_name: { type: "string" },
            background: { type: "string" },
            current_challenge: { type: "string" },
            context: { type: "string" }
          }
        }
      });

      setCurrentScenario(scenario);
      setCaseStudyDialogOpen(true);
    } catch (error) {
      toast.error('Failed to generate case study');
      console.error(error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const submitCaseStudyResponse = async () => {
    if (!coachResponse.trim()) {
      toast.error('Please provide your response');
      return;
    }

    setIsLoadingAI(true);
    try {
      const prompt = `You are evaluating a coach's response to a case study scenario. 

Scenario:
${JSON.stringify(currentScenario, null, 2)}

Coach's Response:
"${coachResponse}"

Provide constructive feedback in JSON format with:
1. strengths_identified: array of specific things the coach did well
2. areas_for_improvement: array of specific suggestions
3. overall_score: 0-100 based on best practices
4. detailed_feedback: paragraph with specific examples and suggestions

Evaluate based on trauma-informed care, motivational interviewing, boundary-setting, and evidence-based practices.`;

      const feedback = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            strengths_identified: { type: "array", items: { type: "string" } },
            areas_for_improvement: { type: "array", items: { type: "string" } },
            overall_score: { type: "number" },
            detailed_feedback: { type: "string" }
          }
        }
      });

      setAiFeedback(feedback);

      // Save training record
      await createTrainingMutation.mutateAsync({
        coach_id: user.id,
        coach_name: user.full_name,
        module_name: 'Case Study Practice',
        completion_date: new Date().toISOString().split('T')[0],
        score: feedback.overall_score,
        case_study_completed: true,
        case_study_scenario: JSON.stringify(currentScenario),
        coach_response: coachResponse,
        ai_feedback: feedback.detailed_feedback,
        strengths_identified: feedback.strengths_identified,
        areas_for_improvement: feedback.areas_for_improvement
      });
    } catch (error) {
      toast.error('Failed to evaluate response');
      console.error(error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const generateTrainingPlan = async () => {
    setIsLoadingAI(true);
    try {
      // Calculate coach's performance metrics
      const coachInteractions = interactions.filter(i => i.staff_id === user.id);
      const avgEngagement = coachInteractions.length > 0
        ? coachInteractions.filter(i => i.engagement_level === 'High').length / coachInteractions.length
        : 0;

      const completedTraining = trainingRecords.filter(r => r.case_study_completed);
      const avgScore = completedTraining.length > 0
        ? completedTraining.reduce((sum, r) => sum + (r.score || 0), 0) / completedTraining.length
        : 0;

      const allAreasForImprovement = trainingRecords.flatMap(r => r.areas_for_improvement || []);

      const prompt = `Create a personalized training plan for a recovery coach based on their performance data.

Coach Performance Metrics:
- Total Interactions: ${coachInteractions.length}
- High Engagement Rate: ${(avgEngagement * 100).toFixed(0)}%
- Case Study Average Score: ${avgScore.toFixed(0)}/100
- Completed Training Modules: ${completedTraining.length}
- Common Areas for Improvement: ${[...new Set(allAreasForImprovement)].join(', ') || 'None yet'}

Generate a personalized 30-day training plan with:
1. Priority areas to focus on
2. Specific daily activities and practice exercises
3. Recommended resources (articles, videos, workshops)
4. Milestones and success indicators

Return as JSON with: priority_areas (array), weekly_goals (array of 4 weeks), resources (array), expected_outcomes (string)`;

      const plan = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            priority_areas: { type: "array", items: { type: "string" } },
            weekly_goals: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  week: { type: "number" },
                  focus: { type: "string" },
                  activities: { type: "array", items: { type: "string" } }
                }
              }
            },
            resources: { type: "array", items: { type: "string" } },
            expected_outcomes: { type: "string" }
          }
        }
      });

      toast.success('Training plan generated!');
      return plan;
    } catch (error) {
      toast.error('Failed to generate training plan');
      console.error(error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coach Training Module</h1>
          <p className="text-slate-500 mt-1">AI-powered professional development and practice</p>
        </div>
        <Button onClick={generateTrainingPlan} disabled={isLoadingAI} className="bg-[#C9A962] hover:bg-[#B8905A]">
          <TrendingUp className="w-4 h-4 mr-2" />
          Generate My Training Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-8 h-8 mx-auto text-[#5B9A9A] mb-2" />
            <p className="text-2xl font-bold text-slate-900">{trainingRecords.length}</p>
            <p className="text-sm text-slate-600">Training Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="w-8 h-8 mx-auto text-[#C9A962] mb-2" />
            <p className="text-2xl font-bold text-slate-900">
              {trainingRecords.length > 0 
                ? Math.round(trainingRecords.reduce((sum, r) => sum + (r.score || 0), 0) / trainingRecords.length)
                : 0}
            </p>
            <p className="text-sm text-slate-600">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Sparkles className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-slate-900">
              {trainingRecords.filter(r => r.case_study_completed).length}
            </p>
            <p className="text-sm text-slate-600">Case Studies Completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assistant">
            <MessageCircle className="w-4 h-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="cases">
            <BookOpen className="w-4 h-4 mr-2" />
            Case Studies
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="w-4 h-4 mr-2" />
            My Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ask Your AI Training Coach</CardTitle>
              <p className="text-sm text-slate-500">Get instant guidance on best practices and intervention strategies</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="min-h-[300px] max-h-[500px] overflow-y-auto space-y-4 p-4 rounded-lg bg-slate-50">
                  {chatHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500">Ask a question to get started</p>
                      <p className="text-xs text-slate-400 mt-2">Example: "How do I handle resistance to change?"</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'coach' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                          msg.role === 'coach' 
                            ? 'bg-[#5B9A9A] text-white' 
                            : 'bg-white border border-slate-200'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {isLoadingAI && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask about motivational interviewing, trauma-informed care, boundary setting..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAskAssistant())}
                    rows={2}
                  />
                  <Button onClick={handleAskAssistant} disabled={isLoadingAI} size="icon" className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Practice with Case Studies</CardTitle>
              <p className="text-sm text-slate-500">Develop your skills with AI-generated scenarios and feedback</p>
            </CardHeader>
            <CardContent>
              <Button onClick={generateCaseStudy} disabled={isLoadingAI} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Start New Case Study
              </Button>

              <div className="mt-6 space-y-3">
                <h4 className="font-semibold text-sm">Recent Case Studies</h4>
                {trainingRecords.filter(r => r.case_study_completed).slice(0, 5).map((record) => (
                  <Card key={record.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{record.module_name}</p>
                          <p className="text-xs text-slate-500">{record.completion_date}</p>
                        </div>
                        <Badge className={record.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                          Score: {record.score}/100
                        </Badge>
                      </div>
                      {record.strengths_identified?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold mb-1">Strengths:</p>
                          <div className="flex flex-wrap gap-1">
                            {record.strengths_identified.map((s, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Completed Modules</span>
                    <span className="text-xl font-bold text-[#5B9A9A]">
                      {trainingRecords.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Average Score</span>
                    <span className="text-xl font-bold text-[#C9A962]">
                      {trainingRecords.length > 0 
                        ? Math.round(trainingRecords.reduce((sum, r) => sum + (r.score || 0), 0) / trainingRecords.length)
                        : 0}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span>Case Studies</span>
                    <span className="text-xl font-bold text-purple-600">
                      {trainingRecords.filter(r => r.case_study_completed).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {trainingRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Areas for Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...new Set(trainingRecords.flatMap(r => r.areas_for_improvement || []))].map((area, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50">
                        <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5" />
                        <span className="text-sm text-slate-700">{area}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={caseStudyDialogOpen} onOpenChange={setCaseStudyDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Study Practice</DialogTitle>
          </DialogHeader>
          {currentScenario && (
            <div className="space-y-4">
              <Card className="bg-slate-50">
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <p className="font-semibold text-sm mb-1">Participant:</p>
                    <p className="text-sm">{currentScenario.participant_name}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Background:</p>
                    <p className="text-sm">{currentScenario.background}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Current Challenge:</p>
                    <p className="text-sm">{currentScenario.current_challenge}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Context:</p>
                    <p className="text-sm">{currentScenario.context}</p>
                  </div>
                </CardContent>
              </Card>

              {!aiFeedback ? (
                <>
                  <div>
                    <Label className="font-semibold">Your Response:</Label>
                    <Textarea
                      value={coachResponse}
                      onChange={(e) => setCoachResponse(e.target.value)}
                      placeholder="How would you approach this situation? What interventions would you use? What would you say?"
                      rows={6}
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={submitCaseStudyResponse} disabled={isLoadingAI} className="w-full">
                    {isLoadingAI ? 'Evaluating...' : 'Submit for Feedback'}
                  </Button>
                </>
              ) : (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>AI Feedback</CardTitle>
                      <Badge className={aiFeedback.overall_score >= 80 ? 'bg-green-500' : 'bg-amber-500'}>
                        Score: {aiFeedback.overall_score}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-semibold text-sm mb-2">Strengths:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {aiFeedback.strengths_identified.map((s, idx) => (
                          <li key={idx} className="text-sm text-green-700">{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-2">Areas for Improvement:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {aiFeedback.areas_for_improvement.map((a, idx) => (
                          <li key={idx} className="text-sm text-amber-700">{a}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-2">Detailed Feedback:</p>
                      <p className="text-sm text-slate-700">{aiFeedback.detailed_feedback}</p>
                    </div>
                    <Button onClick={() => {
                      setCaseStudyDialogOpen(false);
                      setCurrentScenario(null);
                      setCoachResponse('');
                      setAiFeedback(null);
                    }} className="w-full">
                      Complete
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}