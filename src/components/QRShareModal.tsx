import React, { useState } from "react";
import { X, Copy, Check, Share2, MessageSquare } from "lucide-react";
import { Complaint } from "../types";

interface QRShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint | null;
}

export default function QRShareModal({ isOpen, onClose, complaint }: QRShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !complaint) return null;

  const trackingUrl = `${window.location.origin}/track/${complaint.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#202124]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E0E0E0] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
          <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-[#1A73E8]" />
            Share Grievance QR
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center text-center space-y-3 py-3">
          {/* Mock QR Code Vector */}
          <div className="bg-white p-4 rounded-xl border-4 border-[#1A73E8] shadow-sm">
            <svg
              className="w-40 h-40"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* QR Pattern */}
              <rect x="0" y="0" width="100" height="100" fill="white" />
              {/* Finding patterns */}
              <rect x="5" y="5" width="25" height="25" fill="black" />
              <rect x="10" y="10" width="15" height="15" fill="white" />
              <rect x="13" y="13" width="9" height="9" fill="black" />

              <rect x="70" y="5" width="25" height="25" fill="black" />
              <rect x="75" y="10" width="15" height="15" fill="white" />
              <rect x="78" y="13" width="9" height="9" fill="black" />

              <rect x="5" y="70" width="25" height="25" fill="black" />
              <rect x="10" y="75" width="15" height="15" fill="white" />
              <rect x="13" y="78" width="9" height="9" fill="black" />

              {/* Smaller alignment pattern */}
              <rect x="75" y="75" width="10" height="10" fill="black" />
              <rect x="78" y="78" width="4" height="4" fill="white" />

              {/* Random QR pixels */}
              <rect x="35" y="10" width="10" height="5" fill="black" />
              <rect x="50" y="5" width="5" height="15" fill="black" />
              <rect x="60" y="15" width="5" height="5" fill="black" />
              <rect x="35" y="25" width="15" height="5" fill="black" />

              <rect x="10" y="35" width="5" height="10" fill="black" />
              <rect x="25" y="40" width="10" height="5" fill="black" />
              <rect x="40" y="35" width="5" height="5" fill="black" />
              <rect x="45" y="45" width="15" height="10" fill="black" />

              <rect x="70" y="35" width="10" height="10" fill="black" />
              <rect x="85" y="45" width="10" height="5" fill="black" />
              <rect x="60" y="50" width="5" height="15" fill="black" />

              <rect x="35" y="70" width="5" height="10" fill="black" />
              <rect x="45" y="80" width="15" height="5" fill="black" />
              <rect x="65" y="75" width="5" height="15" fill="black" />

              <rect x="5" y="60" width="15" height="5" fill="black" />
              <rect x="25" y="60" width="5" height="5" fill="black" />
              <rect x="30" y="50" width="10" height="5" fill="black" />
              <rect x="80" y="60" width="15" height="5" fill="black" />
            </svg>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#202124] line-clamp-1">{complaint.title}</h4>
            <p className="text-[10px] text-[#5F6368]">Scan code to track status or vote on this issue</p>
          </div>
        </div>

        {/* Copy Direct Tracking Link */}
        <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E0E0E0] flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#5F6368] truncate flex-1 font-mono">{trackingUrl}</span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white border border-[#E0E0E0] text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#F8F9FA] transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://api.whatsapp.com/send?text=Help%20us%20solve%20this%20civic%20issue%20in%20our%20ward!%20View%20status%20and%20vote%20here:%20${encodeURIComponent(
              trackingUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 border border-[#E0E0E0] bg-[#E6F4EA] hover:bg-[#D4EDDA] text-[10px] font-bold text-[#137333] rounded-lg uppercase tracking-wider transition"
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2 border border-[#E0E0E0] bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[10px] font-bold text-[#1A73E8] rounded-lg uppercase tracking-wider transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> Direct Link
          </button>
        </div>
      </div>
    </div>
  );
}
