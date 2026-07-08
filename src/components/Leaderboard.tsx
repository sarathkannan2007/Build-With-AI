import React from "react";
import { Trophy, Award, Flame, Zap, ShieldAlert, Star } from "lucide-react";
import { Citizen } from "../types";

interface LeaderboardProps {
  citizens: Citizen[];
  currentCitizenId?: string;
}

export default function Leaderboard({ citizens, currentCitizenId }: LeaderboardProps) {
  // Sort users by points
  const sortedCitizens = [...citizens].sort((a, b) => b.points - a.points);

  const getBadgeIcon = (badgeName: string) => {
    switch (badgeName) {
      case "Civic Hero":
      case "Constituency Champion":
        return <Trophy className="w-3.5 h-3.5 text-[#B06000]" />;
      case "Top Contributor":
      case "Monthly Leader":
        return <Flame className="w-3.5 h-3.5 text-[#D93025] animate-pulse" />;
      case "Deduplication Scout":
      case "Eagle Eye":
        return <Zap className="w-3.5 h-3.5 text-[#B06000]" />;
      case "Platform Master":
        return <ShieldAlert className="w-3.5 h-3.5 text-[#1A73E8]" />;
      default:
        return <Award className="w-3.5 h-3.5 text-[#137333]" />;
    }
  };

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-[#FEF7E0] p-2.5 rounded-xl border border-[#B06000]/10">
          <Trophy className="w-5 h-5 text-[#B06000]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#202124] uppercase tracking-wider">JanConnect Leaders</h3>
          <p className="text-[10px] text-[#5F6368]">Monthly local community champions & Trust ranking</p>
        </div>
      </div>

      {/* Gamification point explainer banner */}
      <div className="bg-[#F8F9FA] p-3 rounded-xl border border-[#E0E0E0] mb-4 flex items-start gap-2.5">
        <div className="p-1 rounded-full bg-[#E6F4EA] border border-[#137333]/10 mt-0.5">
          <Star className="w-3.5 h-3.5 text-[#137333] fill-[#137333]" />
        </div>
        <div className="text-[10px] text-[#5F6368] leading-relaxed">
          <span className="text-[#202124] font-bold">Earn Civic Points:</span> +50 for filing, +20 for verifying nearby issues, and +15 for helping merge duplicate reports! Ranks reset monthly.
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
        {sortedCitizens.map((user, idx) => {
          const rank = idx + 1;
          const isCurrentUser = user.id === currentCitizenId;

          return (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-all border ${
                isCurrentUser
                  ? "bg-[#E6F4EA] border-[#137333]/30"
                  : "bg-[#F8F9FA] border border-[#E0E0E0] hover:border-slate-300"
              }`}
            >
              {/* Rank & Profile */}
              <div className="flex items-center gap-3">
                {/* Rank indicator badge */}
                <span
                  className={`w-5 h-5 flex items-center justify-center text-[10px] font-extrabold rounded-full ${
                    rank === 1
                      ? "bg-[#FEF7E0] text-[#B06000] shadow-sm border border-[#B06000]/20"
                      : rank === 2
                      ? "bg-[#F1F3F4] text-[#202124]"
                      : rank === 3
                      ? "bg-[#ECEFF1] text-[#37474F]"
                      : "bg-[#F1F3F4] text-[#5F6368]"
                  }`}
                >
                  {rank}
                </span>

                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#E0E0E0]"
                />

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#202124] truncate flex items-center gap-1.5">
                    {user.name}
                    {isCurrentUser && (
                      <span className="text-[8px] bg-[#E6F4EA] text-[#137333] border border-[#137333]/10 px-1 rounded font-extrabold uppercase">
                        YOU
                      </span>
                    )}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    {/* Badge chips */}
                    {user.badges.slice(0, 2).map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        className="text-[8px] font-semibold bg-[#F1F3F4] border border-[#E0E0E0] text-[#5F6368] px-1.5 py-0.5 rounded flex items-center gap-1"
                        title={badge}
                      >
                        {getBadgeIcon(badge)}
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Points & Trust Score */}
              <div className="text-right flex-shrink-0">
                <span className="block text-xs font-black text-[#137333] font-mono">
                  {user.points.toLocaleString()} pts
                </span>
                <span className="text-[9px] font-medium text-[#5F6368]" title="AI-calculated Trust Score">
                  Trust: <strong className="text-[#202124] font-mono">{user.trustScore}%</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
