"use client";

import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  Target,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Tag,
  Clock,
  Layers,
} from "lucide-react";
import {
  getAllPlansAdmin,
  createPlan,
  updatePlan,
  deletePlan,
  PlanCategory,
} from "@/lib/actions/plans";
import { formatRS } from "@/lib/utils";

interface PlanItem {
  id: string;
  name: string;
  price: number;
  durationInDays: number;
  category: string;
  sessions?: number | null;
  description?: string | null;
  isActive: boolean;
}

export function PlansSettingsTab() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"ALL" | PlanCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("30");
  const [formCategory, setFormCategory] = useState<PlanCategory>("GYM");
  const [formSessions, setFormSessions] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    const data = await getAllPlansAdmin();
    setPlans(data as PlanItem[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormName("");
    setFormPrice("");
    setFormDuration("30");
    setFormCategory(activeCategory === "ALL" ? "GYM" : activeCategory);
    setFormSessions("");
    setFormDescription("");
    setStatusMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: PlanItem) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormPrice(plan.price.toString());
    setFormDuration(plan.durationInDays.toString());
    setFormCategory((plan.category as PlanCategory) || "GYM");
    setFormSessions(plan.sessions ? plan.sessions.toString() : "");
    setFormDescription(plan.description || "");
    setStatusMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setStatusMsg({ type: "error", text: "Please enter a plan name." });
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setStatusMsg({ type: "error", text: "Please enter a valid price." });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      if (editingPlan) {
        const res = await updatePlan(editingPlan.id, {
          name: formName.trim(),
          price: priceNum,
          durationInDays: parseInt(formDuration, 10) || 30,
          category: formCategory,
          sessions: formSessions ? parseInt(formSessions, 10) : null,
          description: formDescription.trim() || undefined,
        });
        if (res.success) {
          setStatusMsg({ type: "success", text: "Plan updated successfully!" });
          await fetchPlans();
          setTimeout(() => setIsModalOpen(false), 600);
        } else {
          setStatusMsg({ type: "error", text: res.error || "Failed to update plan." });
        }
      } else {
        const res = await createPlan({
          name: formName.trim(),
          price: priceNum,
          durationInDays: parseInt(formDuration, 10) || 30,
          category: formCategory,
          sessions: formSessions ? parseInt(formSessions, 10) : null,
          description: formDescription.trim() || undefined,
        });
        if (res.success) {
          setStatusMsg({ type: "success", text: "Plan created successfully!" });
          await fetchPlans();
          setTimeout(() => setIsModalOpen(false), 600);
        } else {
          setStatusMsg({ type: "error", text: res.error || "Failed to create plan." });
        }
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: PlanItem) => {
    if (!confirm(`Are you sure you want to remove the plan "${plan.name}"?`)) return;
    try {
      const res = await deletePlan(plan.id);
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      } else {
        alert(res.error || "Failed to remove plan.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesCategory = activeCategory === "ALL" ? true : p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const gymCount = plans.filter((p) => p.category === "GYM").length;
  const ptCount = plans.filter((p) => p.category === "PT").length;
  const otherCount = plans.filter((p) => p.category === "OTHER").length;

  return (
    <div className="space-y-6">
      {/* Header Banner & Add Button */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Package & Membership Plans
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage plans across 3 dedicated categories: Gym Memberships, Personal Training (PT), and Others.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Plan</span>
        </button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeCategory === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            All Plans ({plans.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("GYM")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeCategory === "GYM"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 text-blue-500" />
            <span>Gym Membership ({gymCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("PT")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeCategory === "PT"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Target className="w-3.5 h-3.5 text-rose-500" />
            <span>Personal Training ({ptCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("OTHER")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeCategory === "OTHER"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Others ({otherCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading plans...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs text-slate-400">No plans found in this category.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      plan.category === "GYM"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : plan.category === "PT"
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    {plan.category === "GYM"
                      ? "Gym Membership"
                      : plan.category === "PT"
                      ? "Personal Training"
                      : "Other Payment / Plan"}
                  </span>

                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {formatRS(plan.price)}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                  {plan.name}
                </h3>

                {plan.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {plan.description}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{plan.durationInDays} Days</span>
                  </div>
                  {plan.sessions && (
                    <div className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-rose-500" />
                      <span>{plan.sessions} Sessions</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(plan)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    title="Edit Plan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(plan)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingPlan ? "Edit Plan Details" : "Create New Membership Plan"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {statusMsg && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 ${
                    statusMsg.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  {statusMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Plan Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plan Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormCategory("GYM")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                      formCategory === "GYM"
                        ? "bg-slate-900 dark:bg-sky-600 text-white border-transparent shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Gym Membership
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory("PT")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                      formCategory === "PT"
                        ? "bg-slate-900 dark:bg-sky-600 text-white border-transparent shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Personal Training
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory("OTHER")}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition ${
                      formCategory === "OTHER"
                        ? "bg-slate-900 dark:bg-sky-600 text-white border-transparent shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Others (Misc/Diet)
                  </button>
                </div>
              </div>

              {/* Plan Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1 Year Premium Membership or 1 Month PT"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price (Rs.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 5000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 30, 90, 365"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Sessions (Optional, particularly for PT or Group Training) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Sessions <span className="text-slate-400 font-normal">(Optional for PT packages)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 12, 24, 36 sessions"
                  value={formSessions}
                  onChange={(e) => setFormSessions(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Features <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what this plan includes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold rounded-lg text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{editingPlan ? "Save Changes" : "Create Plan"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
