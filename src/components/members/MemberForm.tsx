"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Briefcase,
  Heart,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  ShieldAlert,
  Search,
  X,
  Plus,
  IndianRupee,
  Calendar,
  Check,
  Printer,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";
import { createMember, updateMember, CreateMemberInput } from "@/lib/actions/members";
import { generateMemberId, formatINR, formatDateTime, formatDate, calculateDaysRemaining } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";
import { ReceiptModal } from "@/components/payments/ReceiptModal";

interface MemberFormProps {
  initialData?: any;
  plans?: Array<{ id: string; name: string; price: number; durationInDays: number }>;
  membersLookup?: Array<{ id: string; memberId: string; fullName: string; phone: string }>;
  initialMemberId?: string;
  isEdit?: boolean;
}

export function MemberForm({
  initialData,
  plans = [],
  membersLookup = [],
  initialMemberId,
  isEdit = false,
}: MemberFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"basic" | "additional" | "health" | "membership">("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Selected receipt for printing in modal
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<any | null>(null);

  // Current member ID if already created/saved
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(initialData?.id || null);

  // Active subscription analysis for smart extension start date
  const activeSub = initialData?.subscriptions?.find(
    (s: any) => new Date(s.endDate) > new Date()
  ) || initialData?.subscriptions?.[0];
  const isExistingOngoing = activeSub && new Date(activeSub.endDate) > new Date();
  const daysLeftInActiveSub = activeSub ? calculateDaysRemaining(activeSub.endDate) : 0;

  // Extension Start Date Logic: If member has an active package, new extension starts from day current plan ends!
  const defaultCalculatedStartDate = isExistingOngoing
    ? new Date(activeSub.endDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  // Pre-fill from query params if converted from Enquiry
  const defaultName = searchParams.get("name") || "";
  const nameParts = defaultName.split(" ");
  const defaultFirstName = nameParts[0] || "";
  const defaultLastName = nameParts.slice(1).join(" ") || "";
  const defaultPhone = searchParams.get("phone") || "";
  const queryPlanName = searchParams.get("plan") || "";
  const initialPlanName = initialData?.subscriptions?.[0]?.planName || queryPlanName;

  const matchedPlan = initialPlanName
    ? plans.find((p) => p.name.toLowerCase() === initialPlanName.toLowerCase())
    : undefined;

  const defaultCalculatedEndDate = matchedPlan
    ? new Date(
        new Date(defaultCalculatedStartDate).getTime() +
          (matchedPlan.durationInDays || 30) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0]
    : "";

  const [formData, setFormData] = useState<CreateMemberInput>({
    memberId: initialData?.memberId || initialMemberId || "1001",
    firstName: initialData?.firstName || defaultFirstName,
    lastName: initialData?.lastName || defaultLastName,
    email: initialData?.email || "",
    phone: initialData?.phone || defaultPhone,
    gender: initialData?.gender || "Male",
    dob: initialData?.dob ? new Date(initialData.dob).toISOString().split("T")[0] : "",
    address: initialData?.address || "",
    enrollDate: initialData?.enrollDate
      ? new Date(initialData.enrollDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    representative: initialData?.representative || "None",
    referredBy: initialData?.referredBy || "",

    // Additional Info
    isMarried: initialData?.isMarried || false,
    spouseName: initialData?.spouseName || "",
    spouseBirthDate: initialData?.spouseBirthDate
      ? new Date(initialData.spouseBirthDate).toISOString().split("T")[0]
      : "",
    anniversaryDate: initialData?.anniversaryDate
      ? new Date(initialData.anniversaryDate).toISOString().split("T")[0]
      : "",
    occupation: initialData?.occupation || "",
    designation: initialData?.designation || "",
    source: initialData?.source || "Walk-in",
    phoneOffice: initialData?.phoneOffice || "",
    phoneResidence: initialData?.phoneResidence || "",
    programme: initialData?.programme || "General Fitness",
    notes: initialData?.notes || "",

    // Medical Questionnaire
    qFaintOrDizzy: initialData?.qFaintOrDizzy || false,
    qChestPain: initialData?.qChestPain || false,
    qRecentChestPain: initialData?.qRecentChestPain || false,
    qBloodPressureHeart: initialData?.qBloodPressureHeart || false,
    qDiabetes: initialData?.qDiabetes || false,
    qJointBoneProblem: initialData?.qJointBoneProblem || false,
    qPregnant: initialData?.qPregnant || false,
    qOver65: initialData?.qOver65 || false,
    qOtherHealthIssues: initialData?.qOtherHealthIssues || "",

    // Membership Plan
    planId: matchedPlan?.id || "",
    planName: matchedPlan?.name || "",
    startDate: matchedPlan ? defaultCalculatedStartDate : "",
    endDate: matchedPlan ? defaultCalculatedEndDate : "",
    totalAmount: matchedPlan?.price || 0,
    paidAmount: isEdit ? (activeSub?.paidAmount || 0) : 0,
    paymentMethod: "UPI",
    paymentNotes: isExistingOngoing ? "Membership renewal extension" : "Enrollment payment",
  });

  // State for Referred By Search Combobox
  const [refSearch, setRefSearch] = useState(formData.referredBy || "");
  const [refDropdownOpen, setRefDropdownOpen] = useState(false);
  const refDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (refDropdownRef.current && !refDropdownRef.current.contains(event.target as Node)) {
        setRefDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredReferrals = membersLookup.filter((m) => {
    const q = refSearch.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.memberId.toLowerCase().includes(q) ||
      m.phone.includes(q)
    );
  });

  const handlePlanSelect = (planName: string) => {
    if (!planName) {
      setFormData({
        ...formData,
        planId: "",
        planName: "",
        totalAmount: 0,
        paidAmount: 0,
        startDate: "",
        endDate: "",
      });
      return;
    }
    const p = plans.find((item) => item.name === planName);
    if (!p) return;
    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    const end = new Date(start.getTime() + p.durationInDays * 24 * 60 * 60 * 1000);
    setFormData({
      ...formData,
      planId: p.id,
      planName: p.name,
      totalAmount: p.price,
      paidAmount: 0, // Defaults to 0 so full amount is due unless manager enters paid amount or clicks "Paid Full"
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  };

  const isBasicInfoValid = Boolean(
    formData.firstName.trim() && formData.phone.trim().length >= 7
  );

  // Explicit save member
  const handleSaveMember = async () => {
    if (!formData.firstName.trim() || !formData.phone.trim()) {
      setError("Please fill required fields (First Name and Mobile Phone)");
      setActiveTab("basic");
      return;
    }

    setLoading(true);
    setError(null);

    let res;
    if (isEdit && initialData?.id) {
      res = await updateMember(initialData.id, formData);
    } else if (currentMemberId) {
      res = await updateMember(currentMemberId, formData);
    } else {
      res = await createMember(formData);
      if (res.success && res.member) {
        setCurrentMemberId(res.member.id);
      }
    }

    setLoading(false);

    if (res.success) {
      setSavedSuccessMsg(isEdit ? "Member updated successfully!" : "Member successfully registered!");
      setTimeout(() => {
        router.push("/portal/members");
        router.refresh();
      }, 700);
    } else {
      setError(res.error || "Failed to save member profile");
    }
  };

  const calculatedDue = Math.max(0, (formData.totalAmount || 0) - (formData.paidAmount || 0));

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/members"
            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {isEdit ? `Edit: ${initialData?.fullName || "Member"}` : "Register New Member"}
            </h1>
            <p className="text-xs text-slate-400">
              {isEdit ? "Update member details & package renewals" : "Fill details across steps to register member"}
            </p>
          </div>
        </div>

        {savedSuccessMsg && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>{savedSuccessMsg}</span>
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Tabs Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="flex items-center gap-1 p-2 bg-slate-50/70 border-b border-slate-200/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeTab === "basic"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Basic Info *</span>
          </button>

          <button
            type="button"
            disabled={!isBasicInfoValid}
            onClick={() => {
              if (isBasicInfoValid) {
                setActiveTab("additional");
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "additional"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>2. Additional Info</span>
          </button>

          <button
            type="button"
            disabled={!isBasicInfoValid}
            onClick={() => {
              if (isBasicInfoValid) {
                setActiveTab("health");
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "health"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>3. Health Questionnaire</span>
          </button>

          <button
            type="button"
            disabled={!isBasicInfoValid}
            onClick={() => {
              if (isBasicInfoValid) {
                setActiveTab("membership");
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === "membership"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>4. Plan & Payments</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5">
          {/* TAB 1: Basic Info */}
          {activeTab === "basic" && (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Member ID
                  </label>
                  <input
                    type="text"
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Unique 4-digit ID (e.g. 1001). Auto-generated sequentially from the last entry.
                  </span>
                </div>

                {/* Referred By Search Lookup */}
                <div className="relative" ref={refDropdownRef}>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Referred By (Search existing member)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search member name or ID..."
                      value={refSearch}
                      onChange={(e) => {
                        setRefSearch(e.target.value);
                        setFormData({ ...formData, referredBy: e.target.value });
                        setRefDropdownOpen(true);
                      }}
                      onFocus={() => setRefDropdownOpen(true)}
                      className="w-full pl-3 pr-8 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                    />
                    {refSearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRefSearch("");
                          setFormData({ ...formData, referredBy: "" });
                        }}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    )}
                  </div>

                  {refDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 py-1 text-xs">
                      {filteredReferrals.length === 0 ? (
                        <div className="px-3 py-2 text-slate-400 text-[11px]">
                          No existing member match (custom name allowed)
                        </div>
                      ) : (
                        filteredReferrals.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              const refVal = `${m.fullName} (${m.memberId})`;
                              setRefSearch(refVal);
                              setFormData({ ...formData, referredBy: refVal });
                              setRefDropdownOpen(false);
                            }}
                            className="px-3 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-800">{m.fullName}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {m.memberId} • {m.phone}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName || ""}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender || "Male"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dob || ""}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Enrollment Date
                  </label>
                  <input
                    type="date"
                    value={formData.enrollDate || ""}
                    onChange={(e) => setFormData({ ...formData, enrollDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Representative
                  </label>
                  <select
                    value={formData.representative || "None"}
                    onChange={(e) =>
                      setFormData({ ...formData, representative: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="None">None</option>
                    <option value="Coach Vikram">Coach Vikram</option>
                    <option value="Coach Ananya">Coach Ananya</option>
                    <option value="Desk Receptionist">Desk Receptionist</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Street, locality, city"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-400">
                  {!isBasicInfoValid ? "Fill Name & Phone to proceed" : "Ready to proceed to next step"}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!isBasicInfoValid || loading}
                    onClick={() => handleSaveMember()}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition disabled:opacity-40"
                  >
                    {loading ? "Saving..." : isEdit ? "Save Changes" : "Quick Save"}
                  </button>

                  <button
                    type="button"
                    disabled={!isBasicInfoValid}
                    onClick={() => setActiveTab("additional")}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition disabled:opacity-40"
                  >
                    Next: Additional Info →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Additional Info */}
          {activeTab === "additional" && (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isMarried"
                    checked={Boolean(formData.isMarried)}
                    onChange={(e) => setFormData({ ...formData, isMarried: e.target.checked })}
                    className="w-4 h-4 text-slate-900 rounded border-slate-300"
                  />
                  <label htmlFor="isMarried" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Married
                  </label>
                </div>

                {formData.isMarried && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Spouse Name</label>
                      <input
                        type="text"
                        placeholder="Spouse Name"
                        value={formData.spouseName || ""}
                        onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Spouse Birthdate</label>
                      <input
                        type="date"
                        value={formData.spouseBirthDate || ""}
                        onChange={(e) => setFormData({ ...formData, spouseBirthDate: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Wedding Anniversary</label>
                      <input
                        type="date"
                        value={formData.anniversaryDate || ""}
                        onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Occupation</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineer, Business"
                    value={formData.occupation || ""}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Manager"
                    value={formData.designation || ""}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lead Source</label>
                  <select
                    value={formData.source || "Walk-in"}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="Instagram">Instagram / Social Media</option>
                    <option value="Google">Google / Website</option>
                    <option value="Referral">Friend Referral</option>
                    <option value="Flyer">Flyer / Banner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fitness Goal</label>
                  <select
                    value={formData.programme || "General Fitness"}
                    onChange={(e) => setFormData({ ...formData, programme: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="General Fitness">General Fitness</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain / Bodybuilding">Muscle Gain</option>
                    <option value="Cardio & Stamina">Cardio & Stamina</option>
                    <option value="Personal Training">Personal Training</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("basic")}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 transition"
                >
                  ← Back to Basic Info
                </button>
                <div className="flex items-center gap-2">
                  {isEdit && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSaveMember()}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab("health")}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition"
                  >
                    Next: Health Questionnaire →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Health Questionnaire */}
          {activeTab === "health" && (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "qFaintOrDizzy", label: "Do you ever faint or get dizzy / lose balance?" },
                  { key: "qChestPain", label: "Do you feel pain in chest during physical activity?" },
                  { key: "qRecentChestPain", label: "Have you experienced chest pain in past month at rest?" },
                  { key: "qBloodPressureHeart", label: "Diagnosed with High Blood Pressure or Heart condition?" },
                  { key: "qDiabetes", label: "Do you have insulin-dependent diabetes?" },
                  { key: "qJointBoneProblem", label: "Do you have injury or orthopedic joint issue?" },
                  { key: "qPregnant", label: "Are you currently pregnant or nursing?" },
                  { key: "qOver65", label: "Are you 65+ and not used to active exercise?" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-slate-800">{item.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, [item.key]: true })}
                        className={`px-2.5 py-0.5 rounded text-xs font-semibold transition ${
                          (formData as any)[item.key]
                            ? "bg-rose-600 text-white"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        YES
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, [item.key]: false })}
                        className={`px-2.5 py-0.5 rounded text-xs font-semibold transition ${
                          !(formData as any)[item.key]
                            ? "bg-slate-900 text-white"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        NO
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Health Remarks / Other Conditions
                </label>
                <input
                  type="text"
                  placeholder="Allergies, past surgeries, or medications..."
                  value={formData.qOtherHealthIssues || ""}
                  onChange={(e) => setFormData({ ...formData, qOtherHealthIssues: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("additional")}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 transition"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-2">
                  {isEdit && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSaveMember()}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab("membership")}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition"
                  >
                    Next: Plan & Payments →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Plan & Payments */}
          {activeTab === "membership" && (
            <div className="space-y-4 animate-in fade-in duration-100">
              
              {/* Gym Common Sense: Active Plan Status Banner & Smart Extension Start Notice */}
              {isExistingOngoing && activeSub && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-emerald-900">
                      Currently Active Plan: {activeSub.planName}
                    </p>
                    <p className="text-emerald-700">
                      Valid until <strong className="font-semibold">{formatDate(activeSub.endDate)}</strong> ({daysLeftInActiveSub} days remaining).
                    </p>
                    <p className="text-[11px] text-emerald-800/80 pt-1">
                      💡 <strong>Smart Extension:</strong> Renewal start date is set automatically to <strong className="font-mono font-semibold">{formatDate(formData.startDate)}</strong> so the member doesn't lose any current active days.
                    </p>
                  </div>
                </div>
              )}

              {/* TOP SECTION: Assign / Renew Membership Package (Moved to TOP per user request) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-700" />
                    <span>{isExistingOngoing ? "Renew / Extend Membership Package" : "Assign Membership Package"}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">{plans.length} Available Plans</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Select Plan
                    </label>
                    <select
                      value={formData.planName}
                      onChange={(e) => handlePlanSelect(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      <option value="">-- No Plan Selected (Assign Later) --</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} (Amt:- {p.price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Start Date {isExistingOngoing && <span className="text-emerald-600">(Extended)</span>}
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => {
                          const start = new Date(e.target.value);
                          const matched = plans.find((p) => p.name === formData.planName);
                          const end = new Date(
                            start.getTime() + (matched?.durationInDays || 30) * 24 * 60 * 60 * 1000
                          );
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                            endDate: end.toISOString().split("T")[0],
                          });
                        }}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Plan Fee (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.totalAmount === 0 ? "" : (formData.totalAmount ?? "")}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/^0+(?=\d)/, "");
                        setFormData({ ...formData, totalAmount: raw === "" ? 0 : Number(raw) });
                      }}
                      className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Amount Paid (₹)</label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, paidAmount: formData.totalAmount || 0 })}
                          className="text-[10px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 rounded transition"
                          title="Set full amount as paid"
                        >
                          Paid in Full
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, paidAmount: 0 })}
                          className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 rounded transition"
                          title="Mark full fee as pending due"
                        >
                          Full Due (₹0)
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.paidAmount === 0 ? "" : (formData.paidAmount ?? "")}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/^0+(?=\d)/, "");
                        setFormData({ ...formData, paidAmount: raw === "" ? 0 : Number(raw) });
                      }}
                      className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg font-semibold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Balance Due (₹)</label>
                    <div className="px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white font-bold text-rose-600">
                      ₹{calculatedDue.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                      }
                      className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="UPI">UPI (GPay, PhonePe, Paytm)</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card / POS</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Remarks</label>
                    <input
                      type="text"
                      placeholder="e.g. Transaction Ref / Notes"
                      value={formData.paymentNotes || ""}
                      onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons for Plan & Member Save */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("health")}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 transition"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSaveMember()}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-sm transition"
                >
                  {loading ? "Saving..." : "Save Member & Complete"}
                </button>
              </div>

              {/* BOTTOM SECTION: Member Payment History with Print Receipt Option */}
              {initialData?.payments && initialData.payments.length > 0 && (
                <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2.5 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Member Payment History ({initialData.payments.length})
                    </h3>
                    <span className="text-[10px] text-slate-400">Click receipt to view and print</span>
                  </div>

                  {/* Mobile Payment Cards */}
                  <div className="block md:hidden divide-y divide-slate-100 bg-white rounded-lg border border-slate-200">
                    {initialData.payments.map((p: any) => (
                      <div key={p.id} className="p-3 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-xs">{p.receiptNo}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                              {p.paymentMethod}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {formatDate(p.paymentDate)} • {p.paymentType?.replace("_", " ")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 font-mono">{formatINR(p.amount)}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedReceiptForPrint({
                                ...p,
                                member: {
                                  fullName: initialData.fullName,
                                  memberId: initialData.memberId,
                                  phone: initialData.phone,
                                },
                              })
                            }
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                            title="View Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Payment History Table */}
                  <div className="hidden md:block overflow-x-auto bg-white rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10px] uppercase bg-slate-50/60">
                          <th className="py-2 px-3">Receipt #</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Mode</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Amount</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {initialData.payments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2 px-3 font-mono font-semibold text-slate-900">{p.receiptNo}</td>
                            <td className="py-2 px-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                            <td className="py-2 px-3 font-medium text-slate-700">{p.paymentMethod}</td>
                            <td className="py-2 px-3 text-slate-500">{p.paymentType?.replace("_", " ")}</td>
                            <td className="py-2 px-3 font-bold text-emerald-700">{formatINR(p.amount)}</td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReceiptForPrint({
                                    ...p,
                                    member: {
                                      fullName: initialData.fullName,
                                      memberId: initialData.memberId,
                                      phone: initialData.phone,
                                    },
                                  })
                                }
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Receipt</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceiptForPrint && (
        <ReceiptModal
          receipt={selectedReceiptForPrint}
          onClose={() => setSelectedReceiptForPrint(null)}
        />
      )}
    </div>
  );
}
