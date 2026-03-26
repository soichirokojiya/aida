import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Aida</h1>
        <p className="text-lg text-gray-600 max-w-md">
          関係を壊さずに会話を進めるための
          <br />
          AIファシリテーター
        </p>
        <Link
          href="/admin"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
        >
          管理画面へ
        </Link>
      </div>
    </div>
  );
}
