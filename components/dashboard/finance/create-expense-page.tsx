"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMe } from "@/components/providers/user-me-provider";
import { ModernSelect } from "@/components/ui/modern-select";
import { inputClass } from "@/lib/dashboard/page-utils";
import {
  createExpense,
  fetchExpenseCategories,
} from "@/lib/finance/expenses-api-client";
import type { ExpenseCategory, ExpensePaymentMode } from "@/lib/types/expenses-api";
import { useTranslation } from "@/lib/localization";

export function CreateExpensePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeOrganisationId } = useUserMe();
  const orgId = activeOrganisationId?.trim() ?? "";
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [expensePrefix, setExpensePrefix] = useState("");
  const [expenseNumber, setExpenseNumber] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<ExpensePaymentMode>("cash");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetchExpenseCategories(orgId).then(setCategories).catch(() => setCategories([]));
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId || !categoryId || !amount) { setError(t("dashboard.expenses.create.validation")); return; }
    setSaving(true);
    try {
      await createExpense(orgId, {
        categoryId,
        expenseDate,
        amount: Number(amount),
        paymentMode,
        description: description.trim() || undefined,
      });
      router.push("/dashboard/finance/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.expenses.create.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <Link href="/dashboard/finance/expenses" className="text-sm font-semibold text-brand-orange-2 hover:underline">← {t("dashboard.expenses.backToList")}</Link>
      <h2 className="mt-2 text-xl font-bold">{t("dashboard.expenses.createTitle")}</h2>
      <div className="mt-4 max-w-lg space-y-4 rounded-xl border border-slate-200/90 bg-white shadow-sm p-4">
        <ModernSelect value={categoryId} onChange={setCategoryId} options={[{ value: "", label: t("dashboard.expenses.create.selectCategory") }, ...categories.map((c) => ({ value: c.categoryId, label: c.name }))]} />
        <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className={inputClass} />
        <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t("dashboard.expenses.create.amount")} className={inputClass} />
        <ModernSelect value={paymentMode} onChange={(v) => setPaymentMode(v as ExpensePaymentMode)} options={[{ value: "cash", label: t("dashboard.expenses.create.modeCash") }, { value: "upi", label: t("dashboard.expenses.create.modeUpi") }, { value: "bank", label: t("dashboard.expenses.create.modeBank") }]} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("dashboard.expenses.create.description")} className={inputClass} />
        {error && <p className="text-red-600">{error}</p>}
        <button type="button" disabled={saving} onClick={() => void handleSave()} className="w-full rounded-md bg-brand-primary py-2.5 text-sm font-semibold text-white">{saving ? t("dashboard.expenses.create.saving") : t("dashboard.expenses.create.save")}</button>
      </div>
    </div>
  );
}
