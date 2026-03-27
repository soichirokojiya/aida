import Link from "next/link";

export default function BillingCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC] px-6">
      <div className="text-center max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/umeko-logo.jpg" alt="うめこ" className="w-20 h-20 rounded-2xl shadow-md mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-3">また使いたくなったら</h1>
        <p className="text-gray-500 leading-relaxed mb-8">
          登録はキャンセルされました。
          <br />
          またいつでも戻ってきてくださいね。
        </p>
        <Link href="/" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
          トップページに戻る
        </Link>
      </div>
    </div>
  );
}
