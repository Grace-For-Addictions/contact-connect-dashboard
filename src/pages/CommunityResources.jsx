import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Sparkles, Plus, MapPin, Phone, Mail, Globe, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Housing', 'Food Assistance', 'Employment', 'Mental Health', 
  'Medical', 'Legal', 'Transportation', 'Education', 'Financial', 
  'Childcare', 'Substance Use Treatment', 'Peer Support'
];

export default function CommunityResources() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [aiMatchDialogOpen, setAiMatchDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [participantNeeds, setParticipantNeeds] = useState('');
  const [aiMatches, setAiMatches] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [gapsAnalysis, setGapsAnalysis] = useState(null);
  const [newResource, setNewResource] = useState({
    resource_name: '',
    description: '',
    categories: [],
    contact_name: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    eligibility_criteria: '',
    services_offered: '',
    hours_of_operation: ''
  });

  const queryClient = useQueryClient();

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.CommunityResource.list('-created_date'),
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['participants'],
    queryFn: () => base44.entities.Participant.list(),
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['resourceMatches'],
    queryFn: () => base44.entities.ResourceMatch.list('-match_date'),
  });

  const createResourceMutation = useMutation({
    mutationFn: (data) => base44.entities.CommunityResource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setAddDialogOpen(false);
      setNewResource({
        resource_name: '', description: '', categories: [], contact_name: '',
        phone: '', email: '', website: '', address: '', city: '', state: '',
        zip_code: '', eligibility_criteria: '', services_offered: '', hours_of_operation: ''
      });
      toast.success('Resource added successfully');
    }
  });

  const createMatchMutation = useMutation({
    mutationFn: (data) => base44.entities.ResourceMatch.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceMatches'] });
      toast.success('Resource match saved');
    }
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CommunityResource.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    }
  });

  const handleAIMatch = async () => {
    if (!selectedParticipant || !participantNeeds.trim()) {
      toast.error('Please select a participant and describe their needs');
      return;
    }

    setIsLoadingAI(true);
    try {
      const participant = participants.find(p => p.id === selectedParticipant);
      const prompt = `You are a social services coordinator. Based on the following participant information and their current needs, recommend the most suitable community resources from the available list.

Participant Profile:
- Name: ${participant.first_name} ${participant.last_name}
- Primary Substance: ${participant.primary_substance || 'N/A'}
- Housing Status: ${participant.housing_status || 'N/A'}
- Employment Status: ${participant.employment_status || 'N/A'}
- Insurance: ${participant.insurance_status || 'N/A'}

Current Needs: ${participantNeeds}

Available Resources:
${resources.map(r => `- ${r.resource_name} (Categories: ${r.categories.join(', ')}): ${r.description || 'No description'}`).join('\n')}

Provide a JSON array of the top 5 most relevant resources with:
1. resource_id (use the resource name to identify)
2. relevance_score (0-100)
3. match_reason (specific explanation why this resource fits their needs)

Consider eligibility, accessibility, and alignment with their current situation.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  resource_name: { type: "string" },
                  relevance_score: { type: "number" },
                  match_reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      const matches = response.recommendations.map(rec => {
        const resource = resources.find(r => r.resource_name === rec.resource_name);
        return resource ? { ...rec, resource_id: resource.id, resource } : null;
      }).filter(Boolean);

      setAiMatches(matches);
      toast.success(`Found ${matches.length} relevant resources`);
    } catch (error) {
      toast.error('Failed to generate AI matches');
      console.error(error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSaveMatch = async (match) => {
    const participant = participants.find(p => p.id === selectedParticipant);
    await createMatchMutation.mutateAsync({
      participant_id: selectedParticipant,
      participant_name: `${participant.first_name} ${participant.last_name}`,
      resource_id: match.resource_id,
      resource_name: match.resource_name,
      match_date: new Date().toISOString().split('T')[0],
      match_reason: match.match_reason,
      relevance_score: match.relevance_score,
      status: 'Suggested'
    });

    // Increment utilization count
    await updateResourceMutation.mutateAsync({
      id: match.resource_id,
      data: { utilization_count: (match.resource.utilization_count || 0) + 1 }
    });
  };

  const analyzeGaps = async () => {
    setIsLoadingAI(true);
    try {
      const prompt = `Analyze the following community resource data to identify service gaps and underutilized resources.

Available Resources:
${resources.map(r => `- ${r.resource_name} (Categories: ${r.categories.join(', ')}, Utilization: ${r.utilization_count || 0} times)`).join('\n')}

Resource Matches:
${matches.map(m => `- ${m.resource_name} for ${m.participant_name}: ${m.status}`).join('\n')}

Provide analysis in JSON format:
1. underutilized_resources: array of resources with low utilization
2. missing_categories: array of service types that are requested but not available
3. high_demand_areas: categories with high utilization
4. recommendations: specific suggestions for improving the resource library`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            underutilized_resources: { type: "array", items: { type: "string" } },
            missing_categories: { type: "array", items: { type: "string" } },
            high_demand_areas: { type: "array", items: { type: "string" } },
            recommendations: { type: "string" }
          }
        }
      });

      setGapsAnalysis(response);
      toast.success('Analysis complete');
    } catch (error) {
      toast.error('Failed to analyze gaps');
      console.error(error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = !search || 
      r.resource_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.categories?.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Resources</h1>
          <p className="text-slate-500 mt-1">AI-powered resource matching and gap analysis</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={aiMatchDialogOpen} onOpenChange={setAiMatchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50">
                <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                AI Match
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>AI-Powered Resource Matching</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Participant</Label>
                  <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose participant" />
                    </SelectTrigger>
                    <SelectContent>
                      {participants.filter(p => p.status === 'Active').map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Describe Current Needs</Label>
                  <Textarea
                    value={participantNeeds}
                    onChange={(e) => setParticipantNeeds(e.target.value)}
                    placeholder="E.g., Looking for emergency housing due to eviction, needs mental health services, requires employment assistance..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleAIMatch} disabled={isLoadingAI} className="w-full">
                  {isLoadingAI ? 'Analyzing...' : 'Find Matching Resources'}
                </Button>

                {aiMatches.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h4 className="font-semibold">AI Recommendations</h4>
                    {aiMatches.map((match, idx) => (
                      <Card key={idx} className="border-l-4 border-l-purple-500">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{match.resource_name}</h4>
                            <Badge className="bg-purple-100 text-purple-700">
                              {match.relevance_score}% match
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{match.match_reason}</p>
                          <Button size="sm" onClick={() => handleSaveMatch(match)}>
                            Save Match
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Community Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Resource Name *</Label>
                  <Input
                    value={newResource.resource_name}
                    onChange={(e) => setNewResource({...newResource, resource_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newResource.description}
                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Categories (comma-separated)</Label>
                  <Input
                    placeholder="Housing, Food Assistance, Employment"
                    onChange={(e) => setNewResource({
                      ...newResource, 
                      categories: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Name</Label>
                    <Input
                      value={newResource.contact_name}
                      onChange={(e) => setNewResource({...newResource, contact_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={newResource.phone}
                      onChange={(e) => setNewResource({...newResource, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={newResource.email}
                      onChange={(e) => setNewResource({...newResource, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input
                      value={newResource.website}
                      onChange={(e) => setNewResource({...newResource, website: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Services Offered</Label>
                  <Textarea
                    value={newResource.services_offered}
                    onChange={(e) => setNewResource({...newResource, services_offered: e.target.value})}
                    rows={2}
                  />
                </div>
                <Button onClick={() => createResourceMutation.mutate(newResource)} className="w-full">
                  Add Resource
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={analyzeGaps} disabled={isLoadingAI}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Analyze Gaps
          </Button>
        </div>
      </div>

      {gapsAnalysis && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Service Gap Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gapsAnalysis.missing_categories?.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-1">Missing Services:</p>
                <div className="flex flex-wrap gap-2">
                  {gapsAnalysis.missing_categories.map((cat, idx) => (
                    <Badge key={idx} variant="outline" className="border-red-300 text-red-700">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {gapsAnalysis.high_demand_areas?.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-1">High Demand Areas:</p>
                <div className="flex flex-wrap gap-2">
                  {gapsAnalysis.high_demand_areas.map((area, idx) => (
                    <Badge key={idx} className="bg-green-100 text-green-700">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="font-semibold text-sm mb-1">Recommendations:</p>
              <p className="text-sm text-slate-700">{gapsAnalysis.recommendations}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{resource.resource_name}</CardTitle>
              <div className="flex flex-wrap gap-1 mt-2">
                {resource.categories?.map((cat, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {resource.description && (
                <p className="text-sm text-slate-600">{resource.description}</p>
              )}
              {resource.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{resource.phone}</span>
                </div>
              )}
              {resource.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{resource.email}</span>
                </div>
              )}
              {resource.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <a href={resource.website} target="_blank" rel="noopener noreferrer" 
                     className="text-[#5B9A9A] hover:underline truncate">
                    Visit Website
                  </a>
                </div>
              )}
              {resource.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span className="text-slate-600">
                    {resource.address}, {resource.city}, {resource.state} {resource.zip_code}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-xs text-slate-500">
                  Utilized {resource.utilization_count || 0} times
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">No resources found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}