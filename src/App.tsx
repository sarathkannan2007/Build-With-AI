import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldAlert,
  Plus,
  MessageSquare,
  Globe,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ThumbsUp,
  Sparkle,
  Award,
  BookOpen,
  Eye,
  FileSpreadsheet
} from "lucide-react";

import MapContainer from "./components/MapContainer";
import ChatbotModal from "./components/ChatbotModal";
import Leaderboard from "./components/Leaderboard";
import EmergencyDial from "./components/EmergencyDial";
import ReportGrievanceModal from "./components/ReportGrievanceModal";
import QRShareModal from "./components/QRShareModal";
import CitizenDashboard from "./components/CitizenDashboard";
import AuthorityDashboard from "./components/AuthorityDashboard";
import { Complaint, Citizen, Officer } from "./types";

export default function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [currentUserId, setCurrentUserId] = useState("user_1");
  const [activeRole, setActiveRole] = useState<"Citizen" | "Officer">("Citizen");

  // Navigation / Modal States
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [shareComplaint, setShareComplaint] = useState<Complaint | null>(null);
  const [activeDetailComplaint, setActiveDetailComplaint] = useState<Complaint | null>(null);

  // PWA Offline Sim states (Module 15)
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // AI Monthly Analytics Modal (Module 16)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [aiReportMarkdown, setAiReportMarkdown] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  // Selected Coordinates Pin tracker
  const [pinnedLatLng, setPinnedLatLng] = useState<{ lat: number; lng: number } | null>(null);

  // Active Emergency Dispatch Alert state
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState<{ type: string; desc: string } | null>(null);

  // On mount: fetch complaints and citizens
  useEffect(() => {
    fetchData();

    // Browser online status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchData = async () => {
    try {
      const cRes = await fetch("/api/complaints");
      const cData = await cRes.json();
      setComplaints(cData);

      const uRes = await fetch("/api/citizens");
      const uData = await uRes.json();
      setCitizens(uData);
    } catch (e) {
      console.error("Failed to load server data, using simulated presets.", e);
    }
  };

  const currentCitizen = citizens.find((c) => c.id === currentUserId) || citizens[0] || {
    id: "user_1",
    name: "Arjun Mehta",
    points: 450,
    badges: ["Top Contributor", "Civic Hero"],
    trustScore: 94,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    ward: "Ward 45 - HSR Layout",
    district: "Bengaluru Urban"
  };

  const currentOfficer: Officer = {
    id: "officer_1",
    name: "Ramesh Gowda",
    department: "Chief Sanitation & PWD Inspector",
    district: "Bengaluru Urban",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
  };

  // Submit Complaint Handler (Handles PWA Offline Queue)
  const handleReportSubmit = async (formData: any) => {
    // If simulated offline or browser offline, queue locally (PWA Module 15)
    if (simulatedOffline || !isOnline) {
      const localItem = {
        ...formData,
        id: `offline_comp_${Date.now()}`,
        status: "Submitted",
        createdAt: new Date().toISOString(),
        supportCount: 1,
        comments: [],
        votes: {},
        timeline: [
          {
            status: "Submitted",
            label: "Cached Offline in PWA Storage",
            date: new Date().toISOString(),
            comment: "Offline state active. Grievance cached inside local storage and will sync upon connection."
          }
        ]
      };

      const updatedQueue = [...offlineQueue, localItem];
      setOfflineQueue(updatedQueue);
      localStorage.setItem("janconnect_offline_queue", JSON.stringify(updatedQueue));

      // Append to local state list so it appears instantly!
      setComplaints((prev) => [localItem, ...prev]);
      alert("⚠️ No Network detected! Your grievance has been securely cached in PWA Storage. It will automatically sync when connection is recovered.");
      return;
    }

    // Standard online submission
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      fetchData(); // reload
      alert(data.message || "Grievance dispatched successfully to Ward Corporator.");
    } catch (e) {
      console.error("Grievance submission error", e);
    }
  };

  // PWA Sync cached complaints (Module 15)
  const handleOfflineSync = async () => {
    if (offlineQueue.length === 0) return;
    setSyncStatus("synchronizing");

    try {
      for (const cached of offlineQueue) {
        await fetch("/api/complaints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cached)
        });
      }
      setOfflineQueue([]);
      localStorage.removeItem("janconnect_offline_queue");
      setSyncStatus("success");
      fetchData();
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (e) {
      console.error("Sync failed", e);
      setSyncStatus("failed");
    }
  };

  // Voting / Support registration
  const handleVote = async (complaintId: string, isConfirm: boolean) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizenId: currentCitizen.id,
          citizenName: currentCitizen.name,
          isConfirm
        })
      });
      const data = await res.json();
      fetchData();
      // Update selected detail card if open
      if (activeDetailComplaint && activeDetailComplaint.id === complaintId) {
        setActiveDetailComplaint(data);
      }
    } catch (e) {
      console.error("Vote registration failed", e);
    }
  };

  // Add Comment (Module 7)
  const handleAddComment = async (complaintId: string, text: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: activeRole === "Citizen" ? currentCitizen.id : currentOfficer.id,
          authorName: activeRole === "Citizen" ? currentCitizen.name : `Officer ${currentOfficer.name}`,
          authorRole: activeRole,
          text
        })
      });
      const data = await res.json();
      fetchData();
      if (activeDetailComplaint && activeDetailComplaint.id === complaintId) {
        setActiveDetailComplaint(data);
      }
    } catch (e) {
      console.error("Comment post failed", e);
    }
  };

  // Officer updates status (Module 11)
  const handleUpdateStatus = async (complaintId: string, status: string, feedback: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          officerName: currentOfficer.name,
          message: feedback,
          budgetApproved: activeDetailComplaint?.aiAnalysis?.estimatedBudget
        })
      });
      const data = await res.json();
      fetchData();
      if (activeDetailComplaint && activeDetailComplaint.id === complaintId) {
        setActiveDetailComplaint(data);
      }
    } catch (e) {
      console.error("Officer status update failed", e);
    }
  };

  // Officer budget allocation approval
  const handleAllocateBudget = async (complaintId: string, budget: number) => {
    // Simply patch/status update with budgetApproved details
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: activeDetailComplaint?.status || "In Progress",
          officerName: currentOfficer.name,
          message: `Approved administrative capital budget of ₹${budget.toLocaleString()}.`,
          budgetApproved: budget
        })
      });
      fetchData();
    } catch (e) {
      console.error("Budget approved failed", e);
    }
  };

  // Trigger Emergency mode
  const handleTriggerEmergency = async (type: string, description: string) => {
    // Submit standard critical urgency complaint
    const payload = {
      title: `🚨 CRITICAL EMERGENCY: ${type}`,
      description: description,
      originalDescription: description,
      category: "Public Safety",
      department: "Disaster Management & First Responders Division",
      urgency: "Critical",
      severity: 10,
      imageUrl: "",
      location: {
        lat: 12.9716,
        lng: 77.5946,
        address: "Prestige Cyber Tower Intersection, Koramangala, Bengaluru Urban",
        ward: "Ward 12 - Koramangala",
        district: "Bengaluru Urban"
      },
      citizenId: currentCitizen.id,
      citizenName: currentCitizen.name,
      aiAnalysis: {
        summary: `🚨 EMERGENCY - ${type}`,
        correctedGrammar: description,
        predictedCategory: "Public Safety",
        predictedDepartment: "Disaster Management & First Responders Division",
        predictedUrgency: "Critical",
        estimatedSeverity: 10,
        suggestedSolution: "Dispatch first responder vehicles immediately to secure safety lines.",
        isDuplicate: false,
        isFake: false,
        confidenceScore: 100,
        estimatedBudget: 50000,
        requiredManpower: 8,
        completionDays: 1,
        visionLabels: ["disaster-hazard"]
      }
    };

    setActiveEmergencyAlert({ type, desc: description });
    handleReportSubmit(payload);

    setTimeout(() => {
      setActiveEmergencyAlert(null);
    }, 8000);
  };

  // Fetch AI Monthly Analytics (Module 16)
  const handleOpenMonthlyReport = async () => {
    setIsReportModalOpen(true);
    setLoadingReport(true);
    try {
      const res = await fetch("/api/reports/monthly");
      const data = await res.json();
      setAiReportMarkdown(data.report);
    } catch (e) {
      console.error("Failed to generate report", e);
      setAiReportMarkdown("Failed to retrieve smart planning analysis report.");
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Logo Branding */}
        <div className="flex items-center gap-3">
          <div className="bg-[#E8F0FE] p-2.5 rounded-xl border border-[#1A73E8]/10">
            <Sparkles className="w-5 h-5 text-[#1A73E8] animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#202124] uppercase font-display flex items-center gap-1.5">
              JanConnect
              <span className="text-[10px] bg-[#F1F3F4] border border-[#E0E0E0] text-[#5F6368] px-2 py-0.5 rounded font-mono font-medium">
                Smart Grievance Platform
              </span>
            </h1>
            <p className="text-[10px] text-[#5F6368]">Bengaluru Municipal Ward Operations & AI Prioritization</p>
          </div>
        </div>

        {/* PWA offline/online controller & switch account */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* PWA offline simulation switch (Module 15) */}
          <button
            onClick={() => {
              setSimulatedOffline(!simulatedOffline);
              alert(
                !simulatedOffline
                  ? "PWA simulator: Connected simulated state switched to OFFLINE."
                  : "PWA simulator: Connected simulated state restored to ONLINE."
              );
            }}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
              simulatedOffline || !isOnline
                ? "bg-red-50 border-red-200 text-red-600 font-bold"
                : "bg-white border-[#E0E0E0] text-[#5F6368] hover:text-[#202124]"
            }`}
            title="Toggle PWA simulated offline mode"
          >
            {simulatedOffline || !isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" /> PWA: Simulated Offline
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-[#1A73E8]" /> PWA: Live Syncing
              </>
            )}
          </button>

          {/* Offline local queue indicator with sync click */}
          {offlineQueue.length > 0 && (
            <button
              onClick={handleOfflineSync}
              className="bg-[#1A73E8] text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#1557b0] transition"
            >
              Sync Cache ({offlineQueue.length})
            </button>
          )}

          {/* User Account Switching console for judges */}
          <div className="bg-[#F1F3F4] border border-[#E0E0E0] rounded-xl p-1 flex">
            <button
              onClick={() => {
                setActiveRole("Citizen");
                setCurrentUserId("user_1");
              }}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition ${
                activeRole === "Citizen"
                  ? "bg-[#1A73E8] text-white"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Citizen Desk
            </button>
            <button
              onClick={() => setActiveRole("Officer")}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition ${
                activeRole === "Officer"
                  ? "bg-[#1A73E8] text-white"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              Officer Portal
            </button>
          </div>
        </div>
      </header>

      {/* Sync Success banner toast */}
      {syncStatus === "success" && (
        <div className="bg-[#E6F4EA] text-[#137333] px-6 py-2 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b border-[#E0E0E0]">
          <Wifi className="w-4 h-4" /> Successfully synchronized offline cached complaints with active city database!
        </div>
      )}

      {/* Active Disaster emergency alert banner */}
      {activeEmergencyAlert && (
        <div className="bg-[#FCE8E6] text-[#D93025] px-6 py-3 border-b border-[#FCE8E6] animate-pulse flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-[#D93025]" />
            <div>
              <strong className="text-xs uppercase tracking-wider block">Critical Disaster Alert Broadcasting</strong>
              <p className="text-[10px] text-[#D93025] font-medium">
                {activeEmergencyAlert.type}: {activeEmergencyAlert.desc}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono font-bold bg-[#D93025]/10 px-2 py-0.5 rounded">DISPATCHED</span>
        </div>
      )}

      {/* Main Split Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Side: Map GIS platform and Action logs list */}
        <div className="xl:col-span-8 space-y-6 flex flex-col">
          {/* Map GIS Card */}
          <div className="bg-white border border-[#E0E0E0] rounded-2xl p-4 shadow-sm flex-1 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
                Active Ward Incidents GIS
              </h2>
              {/* Report Issue button trigger */}
              {activeRole === "Citizen" && (
                <button
                  onClick={() => setIsReportOpen(true)}
                  className="bg-[#1A73E8] hover:bg-[#1557b0] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> File Grievance Desk
                </button>
              )}
            </div>

            <div className="flex-1 rounded-xl overflow-hidden relative">
              <MapContainer
                complaints={complaints}
                onSelectComplaint={(comp) => {
                  setActiveDetailComplaint(comp);
                }}
                selectedComplaintId={activeDetailComplaint?.id}
              />
            </div>
          </div>

          {/* Citizen / Officer dynamic dashboard panels */}
          {activeRole === "Citizen" ? (
            <CitizenDashboard
              citizen={currentCitizen}
              complaints={complaints}
              onSelectComplaint={(comp) => {
                setActiveDetailComplaint(comp);
              }}
              onVote={handleVote}
              onAddComment={handleAddComment}
              onOpenShare={(comp) => setShareComplaint(comp)}
            />
          ) : (
            <AuthorityDashboard
              officer={currentOfficer}
              complaints={complaints}
              onUpdateStatus={handleUpdateStatus}
              onAllocateBudget={handleAllocateBudget}
              onSelectComplaint={(comp) => {
                setActiveDetailComplaint(comp);
              }}
            />
          )}
        </div>

        {/* Right Side: Leaderboard, Emergency desk or details side panels */}
        <div className="xl:col-span-4 space-y-6">
          {/* Active grievance detail panel drawer (Timeline tracker Module 10) */}
          {activeDetailComplaint ? (
            <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-sm space-y-5 animate-fade-in flex flex-col justify-between">
              {/* Header */}
              <div className="border-b border-[#E0E0E0] pb-3 flex justify-between items-start">
                <div>
                  <span className="text-[9px] text-[#1A73E8] font-bold uppercase tracking-wider block">
                    Grievance ID: {activeDetailComplaint.id.substring(0, 15)}
                  </span>
                  <h3 className="text-sm font-bold text-[#202124] mt-1 line-clamp-1">{activeDetailComplaint.title}</h3>
                </div>
                <button
                  onClick={() => setActiveDetailComplaint(null)}
                  className="text-[10px] text-[#5F6368] hover:text-[#202124] font-bold uppercase"
                >
                  Close Detail
                </button>
              </div>

              {/* Original translation & correction comparison */}
              <div className="space-y-3 bg-[#F8F9FA] p-3.5 rounded-xl border border-[#E0E0E0]">
                <div className="text-[11px] text-[#5F6368]">
                  <span className="font-bold text-[#202124] block mb-1">Grievance Description:</span>
                  <p className="leading-relaxed italic">"{activeDetailComplaint.description}"</p>
                </div>

                {activeDetailComplaint.aiAnalysis?.suggestedSolution && (
                  <div className="text-[10px] text-[#5F6368] border-t border-[#E0E0E0] pt-2">
                    <span className="font-bold text-[#1A73E8] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Recommended Solution:
                    </span>
                    <p className="mt-1 leading-relaxed">{activeDetailComplaint.aiAnalysis.suggestedSolution}</p>
                  </div>
                )}
              </div>

              {/* Progress Milestones timeline (Module 10) */}
              <div className="space-y-3">
                <span className="text-[10px] text-[#5F6368] font-bold uppercase tracking-wider block">
                  Interactive Resolution Milestones
                </span>

                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E0E0E0]">
                  {activeDetailComplaint.timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      <div className="w-6.5 h-6.5 rounded-full bg-white border-2 border-[#1A73E8] flex items-center justify-center text-[10px] font-bold text-[#1A73E8] z-10 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="bg-[#F8F9FA] border border-[#E0E0E0] p-2.5 rounded-xl flex-1 text-[11px]">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-[#202124]">{event.label}</span>
                          <span className="text-[8px] text-[#5F6368] font-mono">
                            {new Date(event.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-[#5F6368] text-[10px] mt-1 leading-relaxed">{event.comment}</p>
                        {event.actor && (
                          <span className="text-[8px] bg-[#F1F3F4] text-[#5F6368] px-1.5 py-0.5 rounded mt-1.5 inline-block border border-[#E0E0E0]">
                            By: {event.actor}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments block (Module 7) */}
              <div className="space-y-3 border-t border-[#E0E0E0] pt-4">
                <span className="text-[10px] text-[#5F6368] font-bold uppercase tracking-wider block">
                  Public Comments & Support Feed ({activeDetailComplaint.comments.length})
                </span>

                {/* Comment List */}
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {activeDetailComplaint.comments.length === 0 ? (
                    <p className="text-[10px] text-[#5F6368] italic text-center py-2">No updates recorded.</p>
                  ) : (
                    activeDetailComplaint.comments.map((comm) => (
                      <div key={comm.id} className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E0E0E0] text-[10px] leading-relaxed">
                        <div className="flex justify-between items-center mb-1 text-[#5F6368] font-medium">
                          <span>
                            {comm.authorName}
                            <span className="text-[8px] text-slate-400 ml-1.5">({comm.authorRole})</span>
                          </span>
                          <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[#202124]">{comm.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Post New Comment */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Provide evidence comment or ask question..."
                    id={`cmt_inp_${activeDetailComplaint.id}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const target = e.currentTarget;
                        handleAddComment(activeDetailComplaint.id, target.value);
                        target.value = "";
                      }
                    }}
                    className="flex-1 bg-white border border-[#E0E0E0] rounded-xl px-3 py-2 text-[11px] text-[#202124] placeholder-[#5F6368] focus:outline-none focus:border-[#1A73E8]"
                  />
                  <button
                    onClick={() => {
                      const inputEl = document.getElementById(`cmt_inp_${activeDetailComplaint.id}`) as HTMLInputElement;
                      if (inputEl && inputEl.value.trim()) {
                        handleAddComment(activeDetailComplaint.id, inputEl.value);
                        inputEl.value = "";
                      }
                    }}
                    className="bg-[#1A73E8] hover:bg-[#1557b0] text-white text-[10px] font-bold px-4 py-2 rounded-xl transition"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Dial Emergency Module 12 */}
              <EmergencyDial onTriggerEmergency={handleTriggerEmergency} />

              {/* Gamification Leaderboard Module 13 */}
              <Leaderboard citizens={citizens} currentCitizenId={currentCitizen.id} />

              {/* AI Monthly Planning & Budget Forecasting Trigger (Module 16) */}
              <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-[#1A73E8]/5 rounded-full blur-2xl"></div>

                <div className="flex items-center gap-3 mb-3.5">
                  <div className="bg-[#E8F0FE] p-2 rounded-lg border border-[#1A73E8]/10">
                    <BookOpen className="w-5 h-5 text-[#1A73E8]" />
                  </div>
                  <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider">AI Planning Bureau</h3>
                </div>
                <p className="text-[11px] text-[#5F6368] leading-relaxed mb-4">
                  Analyze city-wide grievance patterns using Gemini, optimizing ward budgets and resolving systemic infrastructural issues.
                </p>
                <button
                  onClick={handleOpenMonthlyReport}
                  className="w-full text-center py-2 bg-[#1A73E8] hover:bg-[#1557b0] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-4 h-4" /> View AI Ward Analytics Report
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer credits and information */}
      <footer className="bg-white p-6 border-t border-[#E0E0E0] text-center mt-auto space-y-2 shadow-inner">
        <p className="text-[10px] text-[#5F6368] font-medium">
          JanConnect Smart Citizen Redressal Platform • National Hackathon Blueprint Edition
        </p>
        <p className="text-[9px] text-slate-400 font-mono">
          Interactive Fallback Map Activated • Simulated GPS Location Enabled • PWA local storage online status checked
        </p>
      </footer>

      {/* Modals & Popups */}
      <ReportGrievanceModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleReportSubmit}
        currentUserId={currentCitizen.id}
        currentUserName={currentCitizen.name}
      />

      {/* Floating Chatbot Assistant */}
      <ChatbotModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        citizenName={currentCitizen.name}
      />

      <QRShareModal
        isOpen={shareComplaint !== null}
        onClose={() => setShareComplaint(null)}
        complaint={shareComplaint}
      />

      {/* Floating bot activator */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-30 bg-[#1A73E8] hover:bg-[#1557b0] text-white p-4 rounded-full shadow-lg transition flex items-center justify-center group"
          title="Open AI Chatbot Assistant"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-extrabold text-[10px] uppercase tracking-wider ml-0 group-hover:ml-2 whitespace-nowrap">
            Ask Assistant
          </span>
        </button>
      )}

      {/* AI Monthly Analytics Markdown Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E0E0E0] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#F8F9FA] p-4 border-b border-[#E0E0E0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#1A73E8]" />
                <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
                  Gemini AI Monthly Ward Report
                </h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 rounded-lg text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {loadingReport ? (
                <div className="flex flex-col items-center justify-center text-center p-12 space-y-3">
                  <div className="w-12 h-12 rounded-full border-4 border-[#E0E0E0] border-t-[#1A73E8] animate-spin"></div>
                  <p className="text-xs text-[#5F6368]">Querying Gemini model & aggregating statistics...</p>
                </div>
              ) : (
                <div className="prose max-w-none text-xs leading-relaxed space-y-4 text-[#202124]">
                  {aiReportMarkdown.split("\n").map((line, idx) => {
                    if (line.startsWith("# ")) {
                      return <h1 key={idx} className="text-sm font-black text-[#202124] border-b border-[#E0E0E0] pb-2 uppercase tracking-wide">{line.replace("# ", "")}</h1>;
                    } else if (line.startsWith("## ")) {
                      return <h2 key={idx} className="text-xs font-bold text-[#1A73E8] pt-3 uppercase tracking-wider">{line.replace("## ", "")}</h2>;
                    } else if (line.startsWith("- ")) {
                      return <li key={idx} className="ml-4 list-disc text-[#202124]">{line.replace("- ", "")}</li>;
                    } else {
                      return <p key={idx} className="text-[#5F6368]">{line}</p>;
                    }
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#F8F9FA] p-4 border-t border-[#E0E0E0] flex justify-end">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#1A73E8] hover:bg-[#1557b0] px-5 py-2 rounded-xl transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline missing UI X component for Modal closings
function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
