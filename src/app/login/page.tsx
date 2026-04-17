import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <LoginForm />
      <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
        NoteE2E Developed by Jack90Nguyen
      </p>
    </div>
  );
}