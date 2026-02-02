import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BARC_DOMAINS = [
  { key: 'social_capital', label: 'Social Support', color: '#FF8A80', icon: '🤝' },
  { key: 'physical_capital', label: 'Physical Health', color: '#FFD166', icon: '💪' },
  { key: 'human_capital', label: 'Skills & Knowledge', color: '#06D6A0', icon: '🎓' },
  { key: 'cultural_capital', label: 'Values & Purpose', color: '#118AB2', icon: '🌟' },
  { key: 'community_capital', label: 'Community Connection', color: '#8B5CF6', icon: '🏘️' },
  { key: 'family_support', label: 'Family Bonds', color: '#F43F5E', icon: '❤️' },
  { key: 'friend_support', label: 'Friendships', color: '#F59E0B', icon: '👥' },
  { key: 'meaningful_activities', label: 'Meaningful Activities', color: '#10B981', icon: '🎯' },
  { key: 'employment_education', label: 'Work & Learning', color: '#3B82F6', icon: '💼' },
  { key: 'healthy_coping_skills', label: 'Coping Skills', color: '#EC4899', icon: '🧘' }
];

export default function BARC10Garden({ assessments = [], participantName }) {
  const [hoveredDomain, setHoveredDomain] = useState(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  if (!assessments || assessments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-slate-500">No recovery capital assessments yet</p>
          <p className="text-xs text-slate-400 mt-2">Complete your first assessment to grow your garden</p>
        </CardContent>
      </Card>
    );
  }

  const latestAssessment = assessments.sort((a, b) => 
    new Date(b.assessment_date) - new Date(a.assessment_date)
  )[0];

  const previousAssessment = assessments.length > 1 ? assessments[1] : null;

  const getGrowthSize = (value) => {
    const baseSize = 40;
    const maxSize = 120;
    const normalizedValue = Math.max(0, Math.min(10, value || 0));
    return baseSize + (normalizedValue / 10) * (maxSize - baseSize);
  };

  const getFlowerStage = (value) => {
    if (value >= 8) return '🌺'; // Full bloom
    if (value >= 6) return '🌸'; // Blooming
    if (value >= 4) return '🌼'; // Budding
    if (value >= 2) return '🌱'; // Sprouting
    return '🌰'; // Seed
  };

  const getBooleanFlower = (value) => {
    return value ? '🌻' : '🌱';
  };

  const getTrend = (domain) => {
    if (!previousAssessment) return null;
    const current = latestAssessment[domain];
    const previous = previousAssessment[domain];
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const totalScore = latestAssessment.total_score || 0;
  const gardenHealth = totalScore > 70 ? 'Flourishing' : totalScore > 50 ? 'Growing' : totalScore > 30 ? 'Developing' : 'Emerging';

  return (
    <TooltipProvider>
      <Card className="overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#06D6A0]" />
                Your Recovery Capital Garden
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                {participantName ? `${participantName}'s journey of growth` : 'Watch your strengths bloom'}
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-[#06D6A0] text-white text-lg px-4 py-2">
                {totalScore}/100
              </Badge>
              <p className="text-xs text-slate-600 mt-1">{gardenHealth}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative min-h-[500px] bg-gradient-to-b from-sky-100 to-green-100 rounded-2xl p-8 overflow-hidden">
            {/* Sun */}
            <div className="absolute top-4 right-4 text-6xl animate-pulse" style={{ 
              opacity: 0.7 + Math.sin(animationPhase / 10) * 0.3 
            }}>
              ☀️
            </div>

            {/* Clouds */}
            <div className="absolute top-8 left-8 text-4xl opacity-40 animate-bounce" style={{ animationDuration: '6s' }}>
              ☁️
            </div>
            <div className="absolute top-16 right-32 text-3xl opacity-30 animate-bounce" style={{ animationDuration: '8s', animationDelay: '1s' }}>
              ☁️
            </div>

            {/* Garden Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-800 to-green-600 rounded-b-2xl" />

            {/* Flowers arranged in garden layout */}
            <div className="relative grid grid-cols-5 gap-8 pt-20">
              {BARC_DOMAINS.map((domain, idx) => {
                const value = typeof latestAssessment[domain.key] === 'boolean' 
                  ? (latestAssessment[domain.key] ? 10 : 2)
                  : (latestAssessment[domain.key] || 0);
                
                const size = getGrowthSize(value);
                const flower = typeof latestAssessment[domain.key] === 'boolean'
                  ? getBooleanFlower(latestAssessment[domain.key])
                  : getFlowerStage(value);
                
                const trend = getTrend(domain.key);
                const isHovered = hoveredDomain === domain.key;

                return (
                  <Tooltip key={domain.key}>
                    <TooltipTrigger asChild>
                      <div
                        className="relative flex flex-col items-center cursor-pointer transition-transform"
                        style={{
                          transform: `scale(${isHovered ? 1.2 : 1}) translateY(${Math.sin((animationPhase + idx * 10) / 20) * 5}px)`,
                          transition: 'transform 0.3s ease'
                        }}
                        onMouseEnter={() => setHoveredDomain(domain.key)}
                        onMouseLeave={() => setHoveredDomain(null)}
                      >
                        {/* Stem */}
                        <div 
                          className="absolute bottom-0 w-1 bg-green-600 rounded"
                          style={{ height: `${size * 0.4}px` }}
                        />
                        
                        {/* Flower */}
                        <div 
                          className="relative"
                          style={{ 
                            fontSize: `${size}px`,
                            filter: isHovered ? 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' : 'none'
                          }}
                        >
                          {flower}
                        </div>

                        {/* Trend indicator */}
                        {trend && trend !== 'stable' && (
                          <div className={`absolute -top-2 -right-2 text-xs ${
                            trend === 'up' ? 'text-green-600' : 'text-amber-600'
                          }`}>
                            {trend === 'up' ? '↑' : '↓'}
                          </div>
                        )}

                        {/* Label */}
                        <div 
                          className="mt-2 text-xs font-medium text-center px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
                          style={{ 
                            borderColor: domain.color,
                            borderWidth: '2px',
                            maxWidth: '100px'
                          }}
                        >
                          {domain.icon}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-semibold">{domain.label}</p>
                        <p className="text-sm">
                          {typeof latestAssessment[domain.key] === 'boolean'
                            ? (latestAssessment[domain.key] ? 'Yes ✓' : 'Not yet')
                            : `Score: ${value}/10`}
                        </p>
                        {trend && (
                          <p className="text-xs mt-1">
                            {trend === 'up' && '📈 Growing'}
                            {trend === 'down' && '📉 Needs attention'}
                            {trend === 'stable' && '➡️ Stable'}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Butterflies for high scores */}
            {totalScore > 70 && (
              <>
                <div className="absolute top-32 left-24 text-3xl animate-bounce" style={{ animationDuration: '4s' }}>
                  🦋
                </div>
                <div className="absolute top-48 right-24 text-3xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                  🦋
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-white/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <Info className="w-4 h-4" />
              <span className="font-semibold">Garden Growth Guide</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌰</span>
                <span>Seed (0-2)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌱</span>
                <span>Sprouting (2-4)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌼</span>
                <span>Budding (4-6)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌸</span>
                <span>Blooming (6-8)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌺</span>
                <span>Full Bloom (8-10)</span>
              </div>
            </div>
          </div>

          {previousAssessment && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Your garden has grown <strong>{totalScore - (previousAssessment.total_score || 0)}</strong> points 
                since {new Date(previousAssessment.assessment_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}