"use client";

import { useState } from "react";
import { SDLC_PHASES, SDLC_PHASE_CONFIG, SDLCPhase } from "@/lib/tokens";
import { Check, ChevronRight, History, Clock, ArrowRight, Loader2 } from "lucide-react";

interface PhaseHistoryRecord {
  id: string;
  phase: SDLCPhase;
  startedAt: string;
  completedAt?: string | null;
  notes?: string | null;
}

interface ProjectSDLCBarProps {
  projectId: string;
  currentPhase: SDLCPhase;
  phaseHistory: PhaseHistoryRecord[];
  onPhaseChange?: (newPhase: SDLCPhase) => void;
}

export function ProjectSDLCBar({
  projectId,
  currentPhase,
  phaseHistory = [],
  onPhaseChange,
}: ProjectSDLCBarProps) {
  const [transitioning, setTransitioning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [transitionNotes, setTransitionNotes] = useState("");
  const [pendingPhase, setPendingPhase] = useState<SDLCPhase | null>(null);

  const currentIndex = SDLC_PHASES.indexOf(currentPhase);

  async function handleConfirmTransition() {
    if (!pendingPhase) return;
    setTransitioning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/phase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: pendingPhase, notes: transitionNotes.trim() || undefined }),
      });
      if (res.ok) {
        if (onPhaseChange) onPhaseChange(pendingPhase);
        setPendingPhase(null);
        setTransitionNotes("");
      }
    } catch (err) {
      console.error("Failed to transition SDLC phase:", err);
    } finally {
      setTransitioning(false);
    }
  }

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">SDLC Phase:</span>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              SDLC_PHASE_CONFIG[currentPhase]?.badgeClass || "border-slate-700 text-slate-300"
            }`}
          >
            {SDLC_PHASE_CONFIG[currentPhase]?.label || currentPhase}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition self-start sm:self-auto cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span>{showHistory ? "Hide Phase History" : "View Phase History"}</span>
        </button>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 pt-1">
        {SDLC_PHASES.map((phase, idx) => {
          const isCurrent = phase === currentPhase;
          const isPassed = idx < currentIndex;
          const config = SDLC_PHASE_CONFIG[phase];

          return (
            <button
              key={phase}
              type="button"
              onClick={() => {
                if (phase !== currentPhase) {
                  setPendingPhase(phase);
                }
              }}
              className={`p-2 rounded-lg border text-left transition flex items-center justify-between gap-1.5 cursor-pointer ${
                isCurrent
                  ? `${config.badgeClass} ring-1 ring-primary/40 shadow-sm`
                  : isPassed
                  ? "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                  : "border-slate-900 bg-slate-950/30 text-slate-500 hover:border-slate-800"
              }`}
            >
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-semibold tracking-wider opacity-70">
                  Step {idx + 1}
                </div>
                <div className="text-xs font-medium truncate">{config.label}</div>
              </div>

              {isPassed ? (
                <Check className="w-3.5 h-3.5 text-success shrink-0" />
              ) : isCurrent ? (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Transition Confirmation Modal/Inline Form */}
      {pendingPhase && (
        <div className="p-3.5 rounded-lg border border-primary/30 bg-slate-900/90 space-y-2 mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">
              Transition phase to &ldquo;{SDLC_PHASE_CONFIG[pendingPhase].label}&rdquo;?
            </span>
            <button
              type="button"
              onClick={() => setPendingPhase(null)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <input
            type="text"
            placeholder="Optional transition notes (e.g. 'Passed QA, moving to production')"
            value={transitionNotes}
            onChange={(e) => setTransitionNotes(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleConfirmTransition}
              disabled={transitioning}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-blue-600 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {transitioning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Transition</span>
            </button>
          </div>
        </div>
      )}

      {/* Expandable Phase History */}
      {showHistory && (
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Phase Progression History
          </h4>

          {phaseHistory.length === 0 ? (
            <p className="text-xs text-slate-400">No recorded phase history yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {phaseHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg border border-slate-800/60 bg-slate-900/30 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        SDLC_PHASE_CONFIG[item.phase]?.badgeClass || "border-slate-700 text-slate-300"
                      }`}
                    >
                      {item.phase}
                    </span>
                    {item.notes && <p className="text-slate-300 text-[11px] mt-1">{item.notes}</p>}
                  </div>

                  <div className="text-right text-[10px] font-mono text-slate-400 shrink-0">
                    <div>Started: {new Date(item.startedAt).toLocaleDateString()}</div>
                    {item.completedAt ? (
                      <div>Completed: {new Date(item.completedAt).toLocaleDateString()}</div>
                    ) : (
                      <span className="text-primary font-semibold">Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
