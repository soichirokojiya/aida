import Link from "next/link";

export default function BillingSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC] px-6">
      <div className="text-center max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/umeko-logo.png" alt="うめこ" className="w-20 h-20 rounded-2xl shadow-md mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-3">ありがとうございます！</h1>
        <p className="text-gray-500 leading-relaxed mb-8">
          登録が完了しました。
          <br />
          引き続き、うめこをよろしくお願いします。
          <br />
          LINEに戻って、いつでも話しかけてくださいね。
        </p>
        <Link href="/" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
          トップページに戻る
        </Link>
      </div>
    </div>
  );
}
