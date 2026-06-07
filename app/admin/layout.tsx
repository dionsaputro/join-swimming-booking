import BottomNav from "@/components/layout/BottomNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F0F4FF] pb-20">
      <main className="max-w-lg mx-auto px-5 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
