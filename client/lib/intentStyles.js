export const getIntentStyle = (intent) => {
  const normalized = intent?.toUpperCase();
  if (normalized === "COMPETITIVE" || normalized === "COMP") {
    return {
      border: "border-plasma-secondary",
      badge: "bg-plasma-secondary/10 text-plasma-secondary",
      label: "COMPETITIVE"
    };
  }
  if (normalized === "OFFLINE") {
    return {
      border: "border-slate-500",
      badge: "bg-slate-500/10 text-slate-400",
      label: "OFFLINE"
    };
  }
  return {
    border: "border-plasma-success",
    badge: "bg-plasma-success/10 text-plasma-success",
    label: "CHILL"
  };
};
