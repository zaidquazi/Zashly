import { Signal, SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import useCallStore from "../store/callSlice";

const QUALITY_CONFIG = {
  excellent: { icon: SignalHigh, color: "text-emerald-400", label: "Excellent" },
  good: { icon: Signal, color: "text-green-400", label: "Good" },
  moderate: { icon: SignalMedium, color: "text-amber-400", label: "Moderate" },
  poor: { icon: SignalLow, color: "text-red-400", label: "Poor" },
};

export function NetworkIndicator() {
  const networkQuality = useCallStore((s) => s.networkQuality);
  const config = QUALITY_CONFIG[networkQuality] || QUALITY_CONFIG.good;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 text-xs ${config.color}`} title={config.label}>
      <Icon className="size-4" />
      <span className="hidden sm:inline">{config.label}</span>
    </div>
  );
}

export default NetworkIndicator;
