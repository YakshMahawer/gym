"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Search, ChevronDown, Check, Dumbbell } from "lucide-react";
import { createEnquiry, CreateEnquiryInput } from "@/lib/actions/enquiries";
import { isValidPhoneNumber, cleanPhoneNumber } from "@/lib/utils";

interface NewEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  plans?: Array<{ id: string; name: string; price: number; durationInDays: number }>;
}

interface PlanItem {
  name: string;
  price: number;
  category: "Membership" | "Personal Training";
}

const ALL_GYM_PLANS: PlanItem[] = [
  // General Membership Plans
  { name: "1 Month", price: 4000, category: "Membership" },
  { name: "3 Months", price: 9000, category: "Membership" },
  { name: "6 Months (Regular)", price: 15000, category: "Membership" },
  { name: "1 Year (Males)", price: 25000, category: "Membership" },
  { name: "Happy Hours Offer", price: 18000, category: "Membership" },
  { name: "1 Year (Female)", price: 23000, category: "Membership" },
  { name: "1 Year (Student)", price: 23000, category: "Membership" },
  { name: "Group Training (3 Persons 12 Sessions)", price: 7500, category: "Membership" },

  // Personal Training (PT) Plans
  { name: "PT", price: 1000, category: "Personal Training" },
  { name: "1 Month PT (12 Sessions)", price: 6000, category: "Personal Training" },
  { name: "3 Months PT (36 Sessions)", price: 16500, category: "Personal Training" },
  { name: "6 Months PT (72 Sessions)", price: 30000, category: "Personal Training" },
  { name: "12 Months PT (144 Sessions)", price: 54000, category: "Personal Training" },
  { name: "1 Month PT (24 Sessions)", price: 10000, category: "Personal Training" },
  { name: "3 Months PT (72 Sessions)", price: 28500, category: "Personal Training" },
  { name: "6 Months PT (144 Sessions)", price: 54000, category: "Personal Training" },
  { name: "12 Months PT (288 Sessions)", price: 102000, category: "Personal Training" },
];

const INITIAL_FORM_DATA: CreateEnquiryInput = {
  name: "",
  phone: "",
  email: "",
  gender: "Male",
  source: "Walk-in",
  preferredPlan: "3 Months",
  budget: undefined,
  followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  status: "NEW",
  notes: "",
  assignedStaff: "None",
};

export function NewEnquiryModal({ isOpen, onClose, onSuccess, plans }: NewEnquiryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available plans list
  const availablePlans: PlanItem[] =
    plans && plans.length > 0
      ? [
          ...plans.map((p) => ({
            name: p.name,
            price: p.price,
            category: "Membership" as const,
          })),
          ...ALL_GYM_PLANS.filter((p) => p.category === "Personal Training"),
        ]
      : ALL_GYM_PLANS;

  const [formData, setFormData] = useState<CreateEnquiryInput>(INITIAL_FORM_DATA);

  // Custom Dropdown State
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "Membership" | "Personal Training">("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...INITIAL_FORM_DATA,
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      setError(null);
      setPlanSearch("");
      setIsPlanDropdownOpen(false);
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsPlanDropdownOpen(false);
      }
    }
    if (isPlanDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPlanDropdownOpen]);

  if (!isOpen) return null;

  // Filtered plans
  const filteredPlans = availablePlans.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(planSearch.toLowerCase()) ||
      `₹${p.price}`.includes(planSearch);
    return matchesCategory && matchesSearch;
  });

  const selectedPlanObj = availablePlans.find(
    (p) => p.name === formData.preferredPlan || (formData.preferredPlan && formData.preferredPlan.startsWith(p.name))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please enter visitor full name");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Please enter visitor phone number");
      return;
    }

    if (!isValidPhoneNumber(formData.phone)) {
      setError("Please enter a valid 10-digit mobile number or valid international phone number");
      return;
    }

    setLoading(true);
    setError(null);

    const cleanedPhone = cleanPhoneNumber(formData.phone);
    const res = await createEnquiry({
      ...formData,
      phone: cleanedPhone,
    });
    setLoading(false);

    if (res.success) {
      setFormData(INITIAL_FORM_DATA);
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || "Failed to add enquiry");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-visible my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-slate-700" />
              <span>Add New Enquiry</span>
            </h3>
            <p className="text-xs text-slate-500">Capture visitor interest & schedule follow-up</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono shadow-xs"
              />
            </div>
          </div>

          {/* Email & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="name@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Lead Source & Custom Plan Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-xs"
              >
                <option value="Walk-in">Walk-in (Direct Visit)</option>
                <option value="Instagram">Instagram / Social Media</option>
                <option value="Google">Google / Website</option>
                <option value="Referral">Friend / Member Referral</option>
                <option value="Flyer">Flyer / Banner</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* SLEEK CUSTOM PLAN SELECTOR */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Interested Plan</span>
                <span className="text-[10px] text-slate-400 font-normal">{availablePlans.length} options</span>
              </label>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 text-left flex items-center justify-between shadow-xs transition"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="font-semibold text-slate-900 truncate">
                    {selectedPlanObj?.name || formData.preferredPlan || "Select Plan"}
                  </span>
                  {selectedPlanObj && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                      ₹{selectedPlanObj.price.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
                    isPlanDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Custom Popover Dropdown */}
              {isPlanDropdownOpen && (
                <div className="absolute right-0 left-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Search Bar */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search plan or session..."
                        value={planSearch}
                        onChange={(e) => setPlanSearch(e.target.value)}
                        autoFocus
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 p-2 bg-slate-50/30 border-b border-slate-100 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("ALL")}
                      className={`px-2 py-0.5 rounded-md transition ${
                        selectedCategory === "ALL"
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      All ({availablePlans.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("Membership")}
                      className={`px-2 py-0.5 rounded-md transition ${
                        selectedCategory === "Membership"
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Gym ({availablePlans.filter((p) => p.category === "Membership").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("Personal Training")}
                      className={`px-2 py-0.5 rounded-md transition ${
                        selectedCategory === "Personal Training"
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      PT ({availablePlans.filter((p) => p.category === "Personal Training").length})
                    </button>
                  </div>

                  {/* Scrollable Plan List */}
                  <div className="max-h-52 overflow-y-auto p-1 divide-y divide-slate-50">
                    {filteredPlans.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No matching plans found
                      </div>
                    ) : (
                      filteredPlans.map((plan) => {
                        const isSelected =
                          formData.preferredPlan === plan.name ||
                          Boolean(formData.preferredPlan && formData.preferredPlan.startsWith(plan.name));

                        return (
                          <div
                            key={plan.name}
                            onClick={() => {
                              setFormData({ ...formData, preferredPlan: plan.name });
                              setIsPlanDropdownOpen(false);
                              setPlanSearch("");
                            }}
                            className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between transition text-xs ${
                              isSelected
                                ? "bg-slate-900 text-white"
                                : "hover:bg-slate-100/80 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-white shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="font-medium truncate">{plan.name}</span>
                            </div>

                            <span
                              className={`text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : "text-emerald-700 bg-emerald-50 border border-emerald-200"
                              }`}
                            >
                              ₹{plan.price.toLocaleString("en-IN")}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Follow-up Date & Representative */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Representative</label>
              <select
                value={formData.assignedStaff || "None"}
                onChange={(e) => setFormData({ ...formData, assignedStaff: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-xs"
              >
                <option value="None">None</option>
                <option value="Coach Vikram">Coach Vikram</option>
                <option value="Coach Ananya">Coach Ananya</option>
                <option value="Desk Receptionist">Desk Receptionist</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Visitor Requirement</label>
            <textarea
              rows={2}
              placeholder="e.g. Inquired about morning slot and personal training options"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Enquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
