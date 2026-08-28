import LoginForm from '@/components/login-form';
import Footer from '@/components/footer';
 
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-red-600 p-3 md:h-36">
          <div className="w-full text-white">
            <h1 className="text-2xl font-bold">Administración Bendito Cross</h1>
          </div>
        </div>
        <LoginForm />
      </div>
      <Footer />
    </main>
  );
}
