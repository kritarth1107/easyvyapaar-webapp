"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/marketing/site-content";

const inputClass =
  "h-11 w-full rounded-sm border border-slate-200/90 bg-white px-4 text-sm text-brand-primary outline-none transition focus:border-brand-orange-1/50 focus:ring-2 focus:ring-brand-orange-1/15";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-brand-primary">Thanks — we&apos;ll be in touch.</p>
        <p className="mt-2 text-sm text-brand-primary-muted">
          You can also email us directly at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-brand-orange-2">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className="mb-1.5 block text-xs font-medium text-brand-primary-muted">Name</span>
          <input required name="name" className={inputClass} placeholder="Your name" />
        </label>
        <label className="block sm:col-span-1">
          <span className="mb-1.5 block text-xs font-medium text-brand-primary-muted">Mobile</span>
          <input required name="phone" type="tel" className={inputClass} placeholder="+91" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-brand-primary-muted">Shop name</span>
          <input name="shop" className={inputClass} placeholder="Business name" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-brand-primary-muted">Email</span>
          <input name="email" type="email" className={inputClass} placeholder="you@shop.com" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-brand-primary-muted">Message</span>
          <textarea
            required
            name="message"
            rows={4}
            className={`${inputClass} h-auto py-3`}
            placeholder="Tell us about your shop or ask for a demo"
          />
        </label>
      </div>
      <button
        type="submit"
        className="brand-gradient-orange-h mt-6 w-full rounded-sm py-3 text-sm font-semibold text-white sm:w-auto sm:px-8"
      >
        Send message
      </button>
    </form>
  );
}
