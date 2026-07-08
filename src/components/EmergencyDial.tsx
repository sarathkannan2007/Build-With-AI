import React, { useState } from "react";
import { AlertOctagon, PhoneCall, ShieldAlert, HeartHandshake, Flame, Droplets, Zap, ShieldCheck } from "lucide-react";

interface EmergencyDialProps {
  onTriggerEmergency: (type: string, description: string) => void;
}

export default function EmergencyDial({ onTriggerEmergency }: EmergencyDialProps) {
  const [activeEmergency, setActiveEmergency] = useState<string | null>(null);
  const [customReport, setCustomReport] = useState("");
  const [success, setSuccess] = useState(false);

  const emergencyTypes = [
    {
      id: "electric_shock",
      label: "Electrical Shock Hazard / Broken Transformer",
      icon: <Zap className="w-5 h-5 text-[#B06000]" />,
      color: "border-[#E0E0E0] bg-[#FEF7E0]/40 hover:bg-[#FEF7E0] text-[#B06000]",
      descr: "Sparks flying or broken live high voltage cables exposed on the wet ground."
    },
    {
      id: "flooding",
      label: "Severe Water Flooding / Water Main Burst",
      icon: <Droplets className="w-5 h-5 text-[#1A73E8]" />,
      color: "border-[#E0E0E0] bg-[#E8F0FE]/40 hover:bg-[#E8F0FE] text-[#1A73E8]",
      descr: "Large volumes of clean municipal water pipe burst or sewage water flooding apartments."
    },
    {
      id: "fire_hazard",
      label: "Active Fire Outbreak / Gas Leak",
      icon: <Flame className="w-5 h-5 text-[#D93025]" />,
      color: "border-[#E0E0E0] bg-[#FCE8E6]/40 hover:bg-[#FCE8E6] text-[#D93025]",
      descr: "Open flame in public dumps, structural fires, or toxic chemical leakages."
    },
    {
      id: "accident",
      label: "Major Road Collapse / Accident Barrier Block",
      icon: <AlertOctagon className="w-5 h-5 text-[#B06000]" />,
      color: "border-[#E0E0E0] bg-[#FEF7E0]/40 hover:bg-[#FEF7E0] text-[#B06000]",
      descr: "Deep sinkholes or vehicular pileups blocking immediate ambulance passage."
    }
  ];

  const handleDial = (typeId: string, descr: string) => {
    setActiveEmergency(typeId);
    setCustomReport(descr);
    setSuccess(false);
  };

  const handleSubmit = () => {
    if (!customReport.trim()) return;
    const selected = emergencyTypes.find((e) => e.id === activeEmergency);
    onTriggerEmergency(
      selected ? selected.label : "Disaster Emergency",
      customReport
    );
    setSuccess(true);
    setTimeout(() => {
      setActiveEmergency(null);
      setCustomReport("");
      setSuccess(false);
    }, 4000);
  };

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-2xl p-5 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#FCE8E6] p-2.5 rounded-xl border border-[#D93025]/10">
          <ShieldAlert className="w-5 h-5 text-[#D93025] animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#202124] uppercase tracking-wider">Critical Emergency Dial</h3>
          <p className="text-[10px] text-[#5F6368]">1-Click Instant Disaster Broadcast & First Responders alert</p>
        </div>
      </div>

      {success ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-[#E6F4EA] rounded-xl border border-[#137333]/20 animate-fade-in">
          <div className="bg-white p-3 rounded-full border border-[#137333]/10 mb-3 animate-bounce">
            <ShieldCheck className="w-8 h-8 text-[#137333]" />
          </div>
          <h4 className="text-xs font-bold text-[#137333] uppercase tracking-wider">Emergency Dispatched!</h4>
          <p className="text-[10px] text-[#137333]/90 mt-1 max-w-[200px] leading-relaxed">
            Critical alert sent directly to Disaster Control, Ward Corporator, and Police Dispatch. Priority forced to **CRITICAL**.
          </p>
        </div>
      ) : activeEmergency ? (
        <div className="flex-1 flex flex-col justify-between space-y-3 bg-white p-4 rounded-xl border border-[#E0E0E0] animate-fade-in">
          <div>
            <h4 className="text-xs font-bold text-[#202124]">Describe Emergency Context</h4>
            <p className="text-[9px] text-[#5F6368] mt-0.5">Describe precise location and status details for the dispatcher</p>
            <textarea
              value={customReport}
              onChange={(e) => setCustomReport(e.target.value)}
              placeholder="e.g. Broken overhead power line fell on the main road outside Prestige Apartments, sparks hitting cars..."
              className="w-full h-24 bg-[#F8F9FA] border border-[#E0E0E0] rounded-lg p-2.5 text-xs text-[#202124] placeholder-[#5F6368] mt-2 focus:outline-none focus:border-[#D93025] transition resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveEmergency(null)}
              className="flex-1 text-[10px] font-bold uppercase tracking-wider text-[#5F6368] bg-white border border-[#E0E0E0] py-2 rounded-lg hover:bg-[#F8F9FA] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 text-[10px] font-bold uppercase tracking-wider text-white bg-[#D93025] hover:bg-[#C5221F] py-2 rounded-lg transition"
            >
              Broadcast Alert
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-4">
          {/* Quick-action Grid */}
          <div className="grid grid-cols-2 gap-2">
            {emergencyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleDial(type.id, type.descr)}
                className={`flex flex-col items-center justify-center p-3 border rounded-xl transition text-center space-y-1.5 ${type.color}`}
              >
                {type.icon}
                <span className="text-[9px] font-bold leading-tight uppercase tracking-wider">
                  {type.label.split(" / ")[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Emergency Hotline numbers */}
          <div className="border-t border-[#E0E0E0] pt-3 flex items-center justify-between">
            <span className="text-[9px] text-[#5F6368] font-medium">Quick-Dial Hotlines:</span>
            <div className="flex gap-2">
              <a
                href="tel:112"
                className="text-[9px] font-bold text-[#D93025] bg-[#FCE8E6]/40 border border-[#D93025]/20 px-2.5 py-1 rounded-md hover:bg-[#FCE8E6] transition flex items-center gap-1"
              >
                <PhoneCall className="w-2.5 h-2.5" /> Police: 112
              </a>
              <a
                href="tel:101"
                className="text-[9px] font-bold text-[#B06000] bg-[#FEF7E0]/40 border border-[#B06000]/20 px-2.5 py-1 rounded-md hover:bg-[#FEF7E0] transition flex items-center gap-1"
              >
                <PhoneCall className="w-2.5 h-2.5" /> Fire: 101
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
