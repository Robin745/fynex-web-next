import { Loader2 } from "lucide-react";

export default function CommonLoading() {
  return (
    <div className="w-full flex-1 min-h-[50vh] flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3 text-center animate-in fade-in duration-200">
        <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            FYN<span className="text-emerald-600">EX</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Loading data, please wait...</p>
        </div>
      </div>
    </div>
  );
}
