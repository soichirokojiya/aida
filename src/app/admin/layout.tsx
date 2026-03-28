import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-6">
        <Link href="/admin" className="font-bold text-lg">
          うめこ Admin
        </Link>
        <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
          会話
        </Link>
        <Link href="/admin/interventions" className="text-sm text-gray-600 hover:text-gray-900">
          介入
        </Link>
        <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">
          ユーザー
        </Link>
        <Link href="/admin/slack" className="text-sm text-gray-600 hover:text-gray-900">
          Slack
        </Link>
        <Link href="/admin/usage" className="text-sm text-gray-600 hover:text-gray-900">
          API使用量
        </Link>
        <Link href="/admin/kpi" className="text-sm text-gray-600 hover:text-gray-900">
          KPI
        </Link>
        <a href="/api/admin/export?type=messages" className="text-sm text-gray-600 hover:text-gray-900">
          CSV出力
        </a>
      </nav>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
