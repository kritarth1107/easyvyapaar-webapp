import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard/finance/expenses?add=1");
}
