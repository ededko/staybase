import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-2xl border bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-800">Вхід у StayBase</h1>
      <p className="mt-2 text-slate-500">Увійдіть у свій акаунт.</p>
      <AuthForm mode="login" />
    </div>
  );
}
