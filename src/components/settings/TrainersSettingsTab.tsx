"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Phone,
  Award,
} from "lucide-react";
import {
  getAllTrainersAdmin,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from "@/lib/actions/trainers";

interface TrainerItem {
  id: string;
  name: string;
  phone?: string | null;
  specialty?: string | null;
  isActive: boolean;
}

export function TrainersSettingsTab() {
  const [trainers, setTrainers] = useState<TrainerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<TrainerItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("");

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTrainers = async () => {
    setLoading(true);
    const data = await getAllTrainersAdmin();
    setTrainers(data as TrainerItem[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const openCreateModal = () => {
    setEditingTrainer(null);
    setFormName("");
    setFormPhone("");
    setFormSpecialty("");
    setStatusMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: TrainerItem) => {
    setEditingTrainer(t);
    setFormName(t.name);
    setFormPhone(t.phone || "");
    setFormSpecialty(t.specialty || "");
    setStatusMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setStatusMsg({ type: "error", text: "Please enter the trainer's name." });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      if (editingTrainer) {
        const res = await updateTrainer(editingTrainer.id, {
          name: formName.trim(),
          phone: formPhone.trim() || undefined,
          specialty: formSpecialty.trim() || undefined,
        });
        if (res.success) {
          setStatusMsg({ type: "success", text: "Trainer updated successfully!" });
          await fetchTrainers();
          setTimeout(() => setIsModalOpen(false), 600);
        } else {
          setStatusMsg({ type: "error", text: res.error || "Failed to update trainer." });
        }
      } else {
        const res = await createTrainer({
          name: formName.trim(),
          phone: formPhone.trim() || undefined,
          specialty: formSpecialty.trim() || undefined,
        });
        if (res.success) {
          setStatusMsg({ type: "success", text: "Trainer added successfully!" });
          await fetchTrainers();
          setTimeout(() => setIsModalOpen(false), 600);
        } else {
          setStatusMsg({ type: "error", text: res.error || "Failed to add trainer." });
        }
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: TrainerItem) => {
    if (!confirm(`Are you sure you want to remove "${t.name}" from trainers?`)) return;
    try {
      const res = await deleteTrainer(t.id);
      if (res.success) {
        setTrainers((prev) => prev.filter((item) => item.id !== t.id));
      } else {
        alert(res.error || "Failed to remove trainer.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const filteredTrainers = trainers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.specialty && t.specialty.toLowerCase().includes(q)) ||
      (t.phone && t.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Personal Trainers & Coaches
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your fitness trainers. These trainers will dynamically appear in all PT enrollment & package assignment dropdowns.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Trainer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search trainer name, specialty, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 text-slate-900 dark:text-white"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Total Trainers: {trainers.length}
        </span>
      </div>

      {/* Trainers Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading trainers...</p>
        </div>
      ) : filteredTrainers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs text-slate-400">No trainers found.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Trainer</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrainers.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {t.name}
                  </h3>

                  {t.specialty ? (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
                      <Award className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t.specialty}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">Fitness Coach</span>
                  )}

                  {t.phone && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{t.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Coach
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(t)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    title="Edit Trainer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="Remove Trainer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Trainer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {editingTrainer ? "Edit Trainer Profile" : "Add New Trainer"}
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

              {/* Trainer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coach Vikram or Coach Rahul"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 font-medium"
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specialty / Focus Area <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Strength & Conditioning, Hypertrophy, Mobility"
                  value={formSpecialty}
                  onChange={(e) => setFormSpecialty(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-sky-500 font-mono"
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
                      <span>{editingTrainer ? "Save Changes" : "Add Trainer"}</span>
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
