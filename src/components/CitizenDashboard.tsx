import React, { useState } from "react";
import {
  User,
  Award,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  MessageSquare,
  Sparkles,
  Share2,
  ThumbsUp,
  Image as ImageIcon
} from "lucide-react";
import { Complaint, Citizen, Comment } from "../types";

interface CitizenDashboardProps {
  citizen: Citizen;
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onVote: (complaintId: string, isConfirm: boolean) => void;
  onAddComment: (complaintId: string, text: string) => void;
  onOpenShare: (complaint: Complaint) => void;
}

export default function CitizenDashboard({
  citizen,
  complaints,
  onSelectComplaint,
  onVote,
  onAddComment,
  onOpenShare
}: CitizenDashboardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [commentInputs, setCommentInputs] = useState<{ [id: string]: string }>({});

  const myComplaints = complaints.filter((c) => c.citizenId === citizen.id);

  const displayedComplaints = activeTab === "all" ? complaints : myComplaints;

  const handleSendComment = (complaintId: string) => {
    const text = commentInputs[complaintId];
    if (!text || !text.trim()) return;

    onAddComment(complaintId, text);
    setCommentInputs((prev) => ({ ...prev, [complaintId]: "" }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-[#E6F4EA] text-[#137333] border border-[#137333]/10";
      case "In Progress":
        return "bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/10";
      case "Verified":
        return "bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/10";
      default:
        return "bg-[#F1F3F4] text-[#5F6368] border border-[#E0E0E0]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Overview Card (Module 1) */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-sm relative overflow-hidden">
        {/* Abstract background graphics for Material look */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#1A73E8]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={citizen.avatar}
              alt={citizen.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#1A73E8] shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#202124]">{citizen.name}</h2>
                <span className="text-[9px] bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/10 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">
                  {citizen.role}
                </span>
              </div>
              <p className="text-xs text-[#5F6368] flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#1A73E8]" />
                {citizen.ward}, {citizen.district}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {citizen.badges.map((badge, i) => (
                  <span
                    key={i}
                    className="text-[9px] font-bold bg-[#F1F3F4] border border-[#E0E0E0] text-[#5F6368] px-2 py-0.5 rounded flex items-center gap-1"
                  >
                    <Award className="w-3 h-3 text-[#B06000]" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Gamification Stats */}
          <div className="flex gap-4 border-t md:border-t-0 border-[#E0E0E0] pt-4 md:pt-0">
            <div className="bg-[#F8F9FA] border border-[#E0E0E0] px-4 py-2.5 rounded-xl text-center min-w-[90px]">
              <span className="block text-[9px] font-bold text-[#5F6368] uppercase tracking-wider">Civic Points</span>
              <span className="text-base font-black text-[#137333] font-mono mt-0.5">{citizen.points}</span>
            </div>
            <div className="bg-[#F8F9FA] border border-[#E0E0E0] px-4 py-2.5 rounded-xl text-center min-w-[90px]">
              <span className="block text-[9px] font-bold text-[#5F6368] uppercase tracking-wider">Trust rating</span>
              <span className="text-base font-black text-[#1A73E8] font-mono mt-0.5">{citizen.trustScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complaint List Section */}
      <div className="space-y-4">
        {/* Tab Controls & Count info */}
        <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
                activeTab === "all"
                  ? "bg-[#1A73E8] text-white shadow-sm"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Public Grievances ({complaints.length})
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
                activeTab === "my"
                  ? "bg-[#1A73E8] text-white shadow-sm"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              My Reported ({myComplaints.length})
            </button>
          </div>
          <span className="text-[10px] text-[#5F6368] font-medium font-mono">
            Sorted by priority index
          </span>
        </div>

        {/* Complaints Grid/List */}
        {displayedComplaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#E0E0E0] space-y-2">
            <p className="text-xs text-[#5F6368]">No grievances logged in this segment.</p>
            <p className="text-[10px] text-[#5F6368]">Be the first to file a complaint in HSR Layout or Koramangala!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedComplaints.map((comp) => {
              const isFiler = comp.citizenId === citizen.id;
              const hasVoted = comp.votes[citizen.id] !== undefined;

              return (
                <div
                  key={comp.id}
                  className="bg-white border border-[#E0E0E0] hover:border-slate-300 rounded-2xl p-4.5 flex flex-col justify-between space-y-4 shadow-sm transition"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getStatusColor(comp.status)}`}>
                        {comp.status}
                      </span>
                      <span className="text-[10px] text-[#5F6368] font-medium">
                        {comp.category}
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectComplaint(comp)}
                      className="text-sm font-bold text-[#202124] hover:text-[#1A73E8] cursor-pointer line-clamp-1 transition"
                    >
                      {comp.title}
                    </h3>
                    <p className="text-xs text-[#5F6368] line-clamp-2 mt-1 leading-relaxed">
                      {comp.description}
                    </p>
                  </div>

                  {/* Evidence image slot */}
                  {comp.imageUrl && (
                    <div
                      onClick={() => onSelectComplaint(comp)}
                      className="relative w-full h-32 rounded-xl overflow-hidden border border-[#E0E0E0] cursor-pointer group"
                    >
                      <img
                        src={comp.imageUrl}
                        alt={comp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {/* Vision labels display */}
                      {comp.aiAnalysis?.visionLabels && (
                        <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
                          {comp.aiAnalysis.visionLabels.slice(0, 3).map((lbl, lIdx) => (
                            <span
                              key={lIdx}
                              className="text-[8px] font-bold bg-white/90 backdrop-blur-md text-[#202124] px-1.5 py-0.5 rounded border border-[#E0E0E0]"
                            >
                              {lbl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meta / Support Counts */}
                  <div className="flex items-center justify-between text-[11px] text-[#5F6368] border-t border-[#E0E0E0] pt-3">
                    <span className="flex items-center gap-1 font-medium text-[#1A73E8]">
                      <MapPin className="w-3.5 h-3.5" />
                      {comp.location.ward}
                    </span>
                    <span className="text-[10px] text-[#5F6368]">
                      {comp.supportCount} citizens affected
                    </span>
                  </div>

                  {/* Actions (Vote, Comments, Share) */}
                  <div className="flex gap-2 border-t border-[#E0E0E0] pt-3">
                    <button
                      onClick={() => onVote(comp.id, true)}
                      disabled={hasVoted || isFiler}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition ${
                        hasVoted
                          ? "bg-[#E6F4EA] border-[#137333]/20 text-[#137333]"
                          : isFiler
                          ? "bg-[#F1F3F4] border-[#E0E0E0] text-slate-300 cursor-not-allowed"
                          : "bg-white border border-[#E0E0E0] text-[#5F6368] hover:bg-[#F8F9FA]"
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {hasVoted ? "Verified" : "Verify Issue"}
                    </button>

                    <button
                      onClick={() => onSelectComplaint(comp)}
                      className="px-3.5 py-1.5 rounded-lg border border-[#E0E0E0] bg-white text-[#5F6368] hover:bg-[#F8F9FA] transition flex items-center justify-center"
                      title="View tracking timeline and details"
                    >
                      < ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onOpenShare(comp)}
                      className="px-3.5 py-1.5 rounded-lg border border-[#E0E0E0] bg-white text-[#5F6368] hover:bg-[#F8F9FA] transition flex items-center justify-center"
                      title="Share QR Tracking Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
