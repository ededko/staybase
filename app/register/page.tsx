import AuthForm from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-800">Реєстрація StayBase</h1>
      <p className="mt-2 text-slate-500">Створіть акаунт власника.</p>
      <AuthForm mode="register" />
    </div>
  );
}
