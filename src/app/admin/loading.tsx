import React from "react";
import { Dumbbell } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="w-full min-h-[65vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-150">
      <div className="flex flex-col items-center max-w-xs text-center space-y-4">
        
        {/* Animated Dumbbell with Glowing Pulse Ring */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute w-20 h-20 rounded-2xl bg-rose-500/15 animate-ping duration-1000" />
          
          {/* Rotating gradient border */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 via-rose-600 to-amber-500 p-0.5 shadow-xl animate-pulse">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white">
              <Dumbbell className="w-7 h-7 text-rose-500 animate-bounce duration-700" />
            </div>
          </div>
        </div>

        {/* Brand & Loading Status */}
        <div className="space-y-1">
          <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Concept I <span className="text-rose-600">Gym</span>
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Loading dashboard & records...
          </p>
        </div>

        {/* Micro Shimmer Progress Bar */}
        <div className="w-36 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-slate-900 via-rose-600 to-slate-900 w-full animate-indeterminate rounded-full" />
        </div>
      </div>
    </div>
  );
}
