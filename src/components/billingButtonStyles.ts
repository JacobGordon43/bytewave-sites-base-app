const base = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

export const billingButtonStyles = {
  primary: `${base} bg-blue-600 text-white enabled:hover:bg-blue-700 focus-visible:ring-blue-400`,
  secondary: `${base} border border-slate-600 bg-slate-700 text-white enabled:hover:bg-slate-600 focus-visible:ring-slate-400`,
  danger: `${base} border border-red-800 bg-red-900/20 text-red-300 enabled:hover:bg-red-900/50 enabled:hover:border-red-600 focus-visible:ring-red-400`,
  confirmDanger: `${base} bg-red-600 text-white enabled:hover:bg-red-700 focus-visible:ring-red-400`,
  link: `${base} bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-400`,
};
