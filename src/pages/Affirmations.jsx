import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Heart, Star, Sparkles, Shield, Zap, Smile, Sun, Trash2 } from 'lucide-react';

const CATEGORY_ICONS = {
  'Recovery': Shield,
  'Self-Worth': Heart,
  'Strength': Zap,
  'Hope': Sun,
  'Gratitude': Star,
  'Resilience': Shield,
  'Growth': Sparkles,
  'Custom': Smile,
};

const CATEGORY_COLORS = {
  'Recovery': 'bg-[#5B9A9A]/10 text-[#5B9A9A] border-[#5B9A9A]/30',
  'Self-Worth': 'bg-rose-50 text-rose-600 border-rose-200',
  'Strength': 'bg-amber-50 text-amber-600 border-amber-200',
  'Hope': 'bg-blue-50 text-blue-600 border-blue-200',
  'Gratitude': 'bg-[#C9A962]/10 text-[#C9A962] border-[#C9A962]/30',
  'Resilience': 'bg-purple-50 text-purple-600 border-purple-200',
  'Growth': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'Custom': 'bg-slate-100 text-slate-600 border-slate-200',
};

const DEFAULT_AFFIRMATIONS = [
  { text: "I am worthy of love and belonging.", category: "Self-Worth" },
  { text: "Every day, in every way, I am getting stronger.", category: "Strength" },
  { text: "I have the power to create positive change in my life.", category: "Recovery" },
  { text: "My past does not define my future.", category: "Hope" },
  { text: "I am grateful for this new day and the opportunities it brings.", category: "Gratitude" },
  { text: "I am resilient; I can handle whatever comes my way.", category: "Resilience" },
  { text: "I choose to see the good in myself and others.", category: "Growth" },
  { text: "Recovery is possible, and I am proof of that.", category: "Recovery" },
  { text: "I deserve a life filled with peace and joy.", category: "Self-Worth" },
  { text: "Each step forward is progress, no matter how small.", category: "Growth" },
];

export default function Affirmations() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedParticipant, setSelectedParticipant] = useState('all');

  const [formData, setFormData] = useState({
    participant_id: '',
    participant_name: '',
    affirmation_text: '',
    category: 'Recovery',
    date_added: new Date().toISOString().split('T')[0],
    is_favorite: false,
  });

  useEffect(() => {
    base44.entities.Participant.list().then(setParticipants);
  }, []);

  const { data: affirmations = [], isLoading } = useQuery({
    queryKey: ['affirmations'],
    queryFn: () => base44.entities.Affirmation.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Affirmation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affirmations'] });
      setDialogOpen(false);
      setFormData({
        participant_id: '', participant_name: '', affirmation_text: '',
        category: 'Recovery', date_added: new Date().toISOString().split('T')[0], is_favorite: false,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Affirmation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affirmations'] }),
  });

  const toggleFavorite = useMutation({
    mutationFn: ({ id, is_favorite }) => base44.entities.Affirmation.update(id, { is_favorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['affirmations'] }),
  });

  const handleParticipantSelect = (id) => {
    const participant = participants.find(p => p.id === id);
    setFormData(prev => ({
      ...prev,
      participant_id: id,
      participant_name: participant ? `${participant.first_name} ${participant.last_name}` : ''
    }));
  };

  const filteredAffirmations = affirmations.filter(a => {
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    const matchesParticipant = selectedParticipant === 'all' || a.participant_id === selectedParticipant;
    return matchesCategory && matchesParticipant;
  });

  const addDefaultAffirmation = (affirmation) => {
    createMutation.mutate({
      affirmation_text: affirmation.text,
      category: affirmation.category,
      date_added: new Date().toISOString().split('T')[0],
      is_favorite: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Affirmations</h1>
          <p className="text-slate-500 mt-1">Positive affirmations to support the recovery journey</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
              <Plus className="w-4 h-4 mr-2" />
              Add Affirmation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Affirmation</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-4">
              <div>
                <Label>For Participant (optional)</Label>
                <Select value={formData.participant_id} onValueChange={handleParticipantSelect}>
                  <SelectTrigger><SelectValue placeholder="General (no participant)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>General</SelectItem>
                    {participants.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(CATEGORY_ICONS).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Affirmation Text *</Label>
                <Textarea
                  value={formData.affirmation_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, affirmation_text: e.target.value }))}
                  rows={3}
                  placeholder="Write a positive, empowering affirmation..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">Add Affirmation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.keys(CATEGORY_ICONS).map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Participants</SelectItem>
            {participants.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Add Default Affirmations */}
      {affirmations.length === 0 && (
        <Card className="bg-gradient-to-r from-[#5B9A9A]/5 to-[#C9A962]/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Quick Start: Add Default Affirmations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEFAULT_AFFIRMATIONS.slice(0, 6).map((aff, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="justify-start h-auto py-3 text-left"
                  onClick={() => addDefaultAffirmation(aff)}
                >
                  <span className="line-clamp-2">{aff.text}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affirmations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading...</div>
        ) : filteredAffirmations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No affirmations yet</p>
          </div>
        ) : (
          filteredAffirmations.map((affirmation) => {
            const CategoryIcon = CATEGORY_ICONS[affirmation.category] || Sparkles;
            return (
              <Card key={affirmation.id} className="hover:shadow-md transition-shadow group relative">
                <CardContent className="pt-6">
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleFavorite.mutate({ id: affirmation.id, is_favorite: !affirmation.is_favorite })}
                    >
                      <Star className={`w-4 h-4 ${affirmation.is_favorite ? 'text-[#C9A962] fill-[#C9A962]' : 'text-slate-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:text-rose-600"
                      onClick={() => deleteMutation.mutate(affirmation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl ${CATEGORY_COLORS[affirmation.category]?.split(' ')[0] || 'bg-slate-100'}`}>
                      <CategoryIcon className={`w-5 h-5 ${CATEGORY_COLORS[affirmation.category]?.split(' ')[1] || 'text-slate-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-medium text-slate-900 italic leading-relaxed">
                        "{affirmation.affirmation_text}"
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className={CATEGORY_COLORS[affirmation.category]}>
                          {affirmation.category}
                        </Badge>
                        {affirmation.participant_name && (
                          <span className="text-xs text-slate-500">for {affirmation.participant_name}</span>
                        )}
                        {affirmation.is_favorite && (
                          <Star className="w-4 h-4 text-[#C9A962] fill-[#C9A962]" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Suggested Affirmations */}
      {affirmations.length > 0 && (
        <Card className="bg-slate-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 text-slate-700">More Suggested Affirmations</h3>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_AFFIRMATIONS.filter(d => !affirmations.some(a => a.affirmation_text === d.text)).slice(0, 4).map((aff, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => addDefaultAffirmation(aff)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {aff.text.substring(0, 30)}...
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}