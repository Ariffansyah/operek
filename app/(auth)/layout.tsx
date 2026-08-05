import { Logo } from "@/components/layout/header";

export default function AuthLayout({ children }: LayoutProps<"/"> ) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-card border border-gray-100 bg-white p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
