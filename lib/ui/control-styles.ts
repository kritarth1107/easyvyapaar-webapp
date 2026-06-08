/** Shared corner radius for buttons, inputs, and selects — keep sharper than cards/panels. */
export const controlRadius = "rounded-sm";

export const inputControlClass = `h-10 w-full ${controlRadius} border border-slate-200/90 bg-white px-3 text-sm text-brand-primary outline-none transition-all placeholder:text-brand-primary-muted/70 focus:border-brand-primary/25 focus:ring-2 focus:ring-brand-primary/[0.08]`;

export const inputControlSmClass = `h-9 w-full ${controlRadius} border border-slate-200/90 bg-white px-2.5 text-sm text-brand-primary outline-none focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15`;

export const buttonControlClass = `inline-flex items-center justify-center ${controlRadius} text-sm font-semibold transition-colors`;
