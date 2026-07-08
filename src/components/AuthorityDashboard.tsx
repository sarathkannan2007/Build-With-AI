import React, { useState } from "react";
import {
  Shield,
  TrendingUp,
  Award,
  AlertTriangle,
  Users,
  Search,
  CheckCircle,
  Clock,
  Download,
  CheckSquare,
  DollarSign,
  UserCheck,
  MapPin,
  ChevronRight,
  Filter
} from "lucide-react";
import { Complaint, Officer } from "../types";

interface AuthorityDashboardProps {
  officer: Officer;
  complaints: Complaint[];
  onUpdateStatus: (complaintId: string, status: string, feedback: string) => void;
  onAllocateBudget: (complaintId: string, budget: number) => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export default function AuthorityDashboard({
  officer,
  complaints,
  onUpdateStatus,
  onAllocateBudget,
  onSelectComplaint
}: AuthorityDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [officerFeedback, setOfficerFeedback] = useState("");
  const [allocatedBudget, setAllocatedBudget] = useState("");
  const [exporting, setExporting] = useState(false);

  // Statistics calculation
  const totalGrievances = complaints.length;
  const criticalCount = complaints.filter((c) => c.urgency === "Critical").length;
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;
  const pendingCount = complaints.filter((c) => c.status === "Submitted" || c.status === "Verified").length;

  const totalSimulatedBudget = complaints.reduce(
    (sum, c) => sum + (c.aiAnalysis?.estimatedBudget || 0),
    0
  );

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || c.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleStatusChange = (complaintId: string, newStatus: string) => {
    onUpdateStatus(complaintId, newStatus, officerFeedback || "Official review updated.");
    setOfficerFeedback("");
    if (selectedComplaint && selectedComplaint.id === complaintId) {
      setSelectedComplaint({
        ...selectedComplaint,
        status: newStatus as any
      });
    }
  };

  const handleBudgetChange = (complaintId: string) => {
    const budgetVal = parseFloat(allocatedBudget);
    if (isNaN(budgetVal) || budgetVal <= 0) return;
    onAllocateBudget(complaintId, budgetVal);
    setAllocatedBudget("");
    alert(`₹${budgetVal.toLocaleString()} budget has been officially approved & locked.`);
  };

  // Simulate Analytical Export (Module 17)
  const handleExport = (format: "Excel" | "PDF") => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert(`JanConnect Report_${Date.now()}.${format === "Excel" ? "xlsx" : "pdf"} generated & downloaded to device.`);
    }, 1500);
  };

  // SVG-based bento chart datasets (category distribution counts)
  const categoryChartData = complaints.reduce((acc: { [key: string]: number }, cur) => {
    acc[cur.category] = (acc[cur.category] || 0) + 1;
    return acc;
  }, {});

  const categoriesList = Object.keys(categoryChartData);
  const maxCount = Math.max(...Object.values(categoryChartData), 1);

  return (
    <div className="space-y-6">
      {/* Officer welcome bar */}
      <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-[#E8F0FE] p-3 rounded-full border border-[#1A73E8]/10">
            <Shield className="w-6 h-6 text-[#1A73E8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#202124]">Welcome, Officer {officer.name}</h2>
              <span className="text-[9px] bg-[#E8F0FE] border border-[#1A73E8]/10 text-[#1A73E8] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                {officer.department}
              </span>
            </div>
            <p className="text-xs text-[#5F6368] mt-0.5">District Command: {officer.district}</p>
          </div>
        </div>

        {/* Analytical Export button */}
        <div className="flex gap-2.5">
          <button
            onClick={() => handleExport("Excel")}
            disabled={exporting}
            className="text-[10px] font-black uppercase tracking-wider bg-white border border-[#E0E0E0] text-[#5F6368] hover:bg-[#F8F9FA] px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={() => handleExport("PDF")}
            disabled={exporting}
            className="text-[10px] font-black uppercase tracking-wider bg-[#1A73E8] text-white hover:bg-[#1557B0] px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Generate PDF
          </button>
        </div>
      </div>

      {/* Bento statistics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E0E0E0] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E0E0E0] text-[#1A73E8]">
            <CheckSquare className="w-5 h-5 text-[#1A73E8]" />
          </div>
          <div>
            <span className="text-[10px] text-[#5F6368] font-bold uppercase tracking-wider block">Total Filed</span>
            <span className="text-lg font-black text-[#202124] font-mono leading-none">{totalGrievances}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E0E0E0] text-[#D93025]">
            <AlertTriangle className="w-5 h-5 text-[#D93025] animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-[#5F6368] font-bold uppercase tracking-wider block">Critical Urgency</span>
            <span className="text-lg font-black text-[#D93025] font-mono leading-none">{criticalCount}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E0E0E0] text-[#137333]">
            <CheckCircle className="w-5 h-5 text-[#137333]" />
          </div>
          <div>
            <span className="text-[10px] text-[#5F6368] font-bold uppercase tracking-wider block">Resolved Grievance</span>
            <span className="text-lg font-black text-[#137333] font-mono leading-none">{resolvedCount}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E0E0E0] text-[#B06000]">
            <DollarSign className="w-5 h-5 text-[#B06000]" />
          </div>
          <div>
            <span className="text-[10px] text-[#5F6368] font-bold uppercase tracking-wider block">Approved Budget</span>
            <span className="text-lg font-black text-[#B06000] font-mono leading-none">₹{totalSimulatedBudget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Analytical Charts and Live lists Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: SVG category distributions visualization and search filter */}
        <div className="lg:col-span-1 space-y-6">
          {/* SVG Bento Chart Card */}
          <div className="bg-white border border-[#E0E0E0] p-5 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#1A73E8]" />
              Category load
            </h3>
            <div className="space-y-3.5">
              {categoriesList.length === 0 ? (
                <p className="text-[10px] text-[#5F6368]">No category load available.</p>
              ) : (
                categoriesList.map((cat, i) => {
                  const count = categoryChartData[cat];
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#202124] font-bold">{cat}</span>
                        <span className="text-[#5F6368] font-mono">{count} reports</span>
                      </div>
                      <div className="w-full bg-[#F1F3F4] h-2 rounded-full overflow-hidden border border-[#E0E0E0]">
                        <div
                          className="bg-[#1A73E8] h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Filtering Panel */}
          <div className="bg-white border border-[#E0E0E0] p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#1A73E8]" />
              <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider">Search & Filters</h3>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#5F6368] font-bold">Category</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-[#E0E0E0] rounded-xl px-3 py-2 text-xs text-[#202124] focus:outline-none focus:border-[#1A73E8]"
              >
                <option value="All">All Categories</option>
                <option value="Garbage & Sanitation">Garbage & Sanitation</option>
                <option value="Roads & Potholes">Roads & Potholes</option>
                <option value="Water Supply & Drainage">Water Supply & Drainage</option>
                <option value="Street Lights">Street Lights</option>
                <option value="Public Safety">Public Safety</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#5F6368] font-bold">Grievance Status</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white border border-[#E0E0E0] rounded-xl px-3 py-2 text-xs text-[#202124] focus:outline-none focus:border-[#1A73E8]"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Verified">Verified</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Center / Right column: Live Grievances lists & Management action sheet */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0E0E0] pb-3 mb-4">
              <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
                Active Grievance Queues ({filteredComplaints.length})
              </h3>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#5F6368] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter address, content..."
                  className="bg-white border border-[#E0E0E0] rounded-xl pl-9 pr-4 py-2 text-xs text-[#202124] placeholder-[#5F6368] focus:outline-none focus:border-[#1A73E8] transition w-full sm:w-48"
                />
              </div>
            </div>

            {/* List */}
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-12 text-[#5F6368] text-xs">
                No active complaints match filters.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {filteredComplaints.map((comp) => {
                  const isCritical = comp.urgency === "Critical";
                  const isSelected = selectedComplaint?.id === comp.id;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => {
                        setSelectedComplaint(comp);
                        onSelectComplaint(comp);
                      }}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? "bg-[#E8F0FE] border-[#1A73E8]"
                          : isCritical
                          ? "bg-[#FCE8E6] border-[#D93025]/20 hover:border-[#D93025]/30"
                          : "bg-white border border-[#E0E0E0] hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                isCritical
                                  ? "bg-[#FCE8E6] text-[#D93025]"
                                  : "bg-[#FEF7E0] text-[#B06000]"
                              }`}
                            >
                               {comp.urgency}
                            </span>
                            <span className="text-[10px] text-[#5F6368] font-mono">
                              Ward: {comp.location.ward}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-[#202124] mt-1.5 line-clamp-1">{comp.title}</h4>
                        </div>

                        <span className="text-[10px] bg-[#F1F3F4] border border-[#E0E0E0] text-[#5F6368] px-2 py-0.5 rounded">
                          {comp.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#5F6368] border-t border-[#E0E0E0] pt-2">
                        <span>Reported by: {comp.citizenName}</span>
                        <span className="font-bold text-[#1A73E8] font-mono">₹{comp.aiAnalysis?.estimatedBudget.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action block for active item */}
          {selectedComplaint && (
            <div className="bg-white border border-[#1A73E8]/30 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
              <div className="border-b border-[#E0E0E0] pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-[#1A73E8] font-bold uppercase tracking-wider block">Grievance Action Terminal</span>
                  <h4 className="text-xs font-extrabold text-[#202124]">{selectedComplaint.title}</h4>
                </div>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-[10px] text-[#5F6368] hover:text-[#202124] uppercase tracking-wider cursor-pointer"
                >
                  Close panel
                </button>
              </div>

              {/* Status Update Options */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatusChange(selectedComplaint.id, "Verified")}
                  className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border transition ${
                    selectedComplaint.status === "Verified"
                      ? "bg-[#FEF7E0] border-[#B06000]/40 text-[#B06000]"
                      : "bg-white border border-[#E0E0E0] text-[#5F6368] hover:bg-[#F8F9FA]"
                  }`}
                >
                  Verify Grievance
                </button>
                <button
                  onClick={() => handleStatusChange(selectedComplaint.id, "In Progress")}
                  className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border transition ${
                    selectedComplaint.status === "In Progress"
                      ? "bg-[#E8F0FE] border-[#1A73E8]/40 text-[#1A73E8]"
                      : "bg-white border border-[#E0E0E0] text-[#5F6368] hover:bg-[#F8F9FA]"
                  }`}
                >
                  Begin Repair
                </button>
                <button
                  onClick={() => handleStatusChange(selectedComplaint.id, "Resolved")}
                  className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg border transition ${
                    selectedComplaint.status === "Resolved"
                      ? "bg-[#E6F4EA] border-[#137333]/40 text-[#137333]"
                      : "bg-white border border-[#E0E0E0] text-[#5F6368] hover:bg-[#F8F9FA]"
                  }`}
                >
                  Sign-off Resolve
                </button>
              </div>

              {/* Feedback and Budget override */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#5F6368] font-bold">Official updates & feedback comments</span>
                  <input
                    type="text"
                    value={officerFeedback}
                    onChange={(e) => setOfficerFeedback(e.target.value)}
                    placeholder="e.g. Sanitation workers dispatched on HSR layout sector 3..."
                    className="w-full bg-white border border-[#E0E0E0] rounded-xl px-3 py-2 text-xs text-[#202124] placeholder-[#5F6368] focus:outline-none focus:border-[#1A73E8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-[#5F6368] font-bold">Approve budget allocation (INR)</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={allocatedBudget}
                      onChange={(e) => setAllocatedBudget(e.target.value)}
                      placeholder="e.g. 15000"
                      className="flex-1 bg-white border border-[#E0E0E0] rounded-xl px-3 py-2 text-xs text-[#202124] placeholder-[#5F6368] focus:outline-none focus:border-[#1A73E8]"
                    />
                    <button
                      onClick={() => handleBudgetChange(selectedComplaint.id)}
                      className="bg-[#1A73E8] text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase hover:bg-[#1557B0] transition"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
