import Link from "next/link";
import { LineMock, FAMILY_CHAT, BUSINESS_CHAT, REWRITE_CHAT } from "@/components/line-mock";

const LINE_ADD_URL = "https://lin.ee/XXXXXXXXX"; // TODO: LINE友だち追加URLに差し替え

function LineButton({ children, size = "lg" }: { children: React.ReactNode; size?: "lg" | "sm" }) {
  const cls = size === "lg"
    ? "px-8 py-4 text-base md:text-lg"
    : "px-6 py-3 text-sm";
  return (
    <Link
      href={LINE_ADD_URL}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full bg-[#06C755] text-white font-semibold shadow-lg hover:bg-[#05b04c] transition-all hover:shadow-xl hover:-translate-y-0.5 ${cls}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
      {children}
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/umeko-avatar.png" alt="うめこ" className="w-8 h-8 rounded-full" />
            <span className="font-bold text-gray-800">うめこ</span>
          </div>
          <LineButton size="sm">友だち追加</LineButton>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F0] via-white to-[#EBF2FA]" />
        <div className="absolute top-20 -left-40 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/umeko-avatar.png" alt="うめこ" className="w-16 h-16 rounded-2xl shadow-md mb-6" />

              <h1 className="text-3xl md:text-[2.75rem] font-bold text-gray-800 leading-[1.3] tracking-tight mb-5">
                言いづらいことを、
                <br />
                <span className="text-teal-600">やわらかく。</span>
              </h1>

              <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-3">
                すれ違いを、少しずつ軽く。
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                LINEで使える会話サポートAI。
                <br />
                きつい言い方をやわらかくしたり、
                <br />
                話がこじれそうなときにそっと整理したり。
              </p>

              <LineButton>LINEで友だち追加する</LineButton>
              <p className="mt-3 text-xs text-gray-400">
                無料ではじめられます
              </p>
            </div>

            <div className="hidden md:block">
              <LineMock title="家族グループ" messages={FAMILY_CHAT} memberCount={3} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 共感 ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">ことばに迷う瞬間</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            こんなこと、ありませんか？
          </h2>

          <div className="grid md:grid-cols-2 gap-3">
            {[
              "言いたいことはあるけど、きつく聞こえそうで言えない",
              "同じことで何度もすれ違って、もう話すのが面倒",
              "LINEの返信、何度も書き直してしまう",
              "言わなかったことが積もって、ある日ドカンとなる",
              "部下へのフィードバック、パワハラと思われたくない",
              "取引先への催促、角が立たない言い方がわからない",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-4 bg-white border border-gray-100">
                <span className="text-teal-400 mt-0.5 text-sm">&#9679;</span>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-10">
            伝えたい気持ちはある。ただ、ことばの選び方がわからないだけ。
          </p>
        </div>
      </section>

      {/* ── LINE Mock: 家庭版 ── */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-[#F6FAF8]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">家庭・パートナーとの会話</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            すれ違いをやさしくほどく
          </h2>
          <p className="text-center text-gray-400 text-sm mb-12 max-w-md mx-auto">
            感情的になりそうな会話に、さりげなく入って整理してくれます。
            <br />
            どちらの味方もしません。
          </p>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <LineMock title="家族グループ" messages={FAMILY_CHAT} memberCount={3} />
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-2">うめこがやっていること</p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>どちらが悪いかは言わない</li>
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>すれ違いのポイントを言語化</li>
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>次にやることを1つだけ提案</li>
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-2">こんな場面で</p>
                <ul className="space-y-1.5 text-sm text-gray-400">
                  <li>・夫婦の家事分担の話</li>
                  <li>・カップルの予定のすれ違い</li>
                  <li>・親子のコミュニケーション</li>
                  <li>・同居人との生活ルール</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LINE Mock: ビジネス版 ── */}
      <section className="py-20 px-6 bg-[#F6FAF8]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">ビジネスの会話</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            角が立たない伝え方を
          </h2>
          <p className="text-center text-gray-400 text-sm mb-12 max-w-md mx-auto">
            催促、断り、フィードバック。
            <br />
            言いにくいことを、ちょうどいい温度にしてくれます。
          </p>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-2">うめこがやっていること</p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>感情的な表現を事実ベースに</li>
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>建設的な次のステップを提案</li>
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>相手の立場にも配慮した言い方</li>
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-2">こんな場面で</p>
                <ul className="space-y-1.5 text-sm text-gray-400">
                  <li>・取引先への催促・お断り</li>
                  <li>・部下へのフィードバック</li>
                  <li>・チーム内の認識すり合わせ</li>
                  <li>・クライアント対応</li>
                </ul>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <LineMock title="鈴木さん（取引先）" messages={BUSINESS_CHAT} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 言い換え機能 ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">言い換え機能</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            「柔らかくして」で伝わる
          </h2>
          <p className="text-center text-gray-400 text-sm mb-12 max-w-md mx-auto">
            送りたいメッセージをうめこに渡すだけ。
            <br />
            意味はそのまま、温度だけ調整します。
          </p>

          <div className="max-w-sm mx-auto">
            <LineMock title="うめこ" messages={REWRITE_CHAT} />
          </div>
        </div>
      </section>

      {/* ── できること ── */}
      <section className="py-20 px-6 bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            うめこにできること
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: "✏️", title: "やわらかく言い換え", desc: "きつい言い方の温度だけ下げます" },
              { icon: "🔍", title: "すれ違いを整理", desc: "何が食い違ってるのか見える化します" },
              { icon: "📝", title: "会話をまとめる", desc: "何が決まって何が残ってるかを整理" },
              { icon: "🌡️", title: "空気を読む", desc: "荒れそうなときだけ、そっと入ります" },
              { icon: "🤝", title: "次の一歩を提案", desc: "具体的で小さなアクションを1つだけ" },
              { icon: "🛡️", title: "どちらの味方もしない", desc: "善悪の判定はしません。整理だけ" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 bg-white rounded-xl p-5 border border-gray-100">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-medium text-gray-800 text-sm mb-0.5">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 使い方 ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            使い方
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "友だち追加", desc: "LINEで「うめこ」を\n友だちに追加" },
              { step: "2", title: "話しかける", desc: "「柔らかくして」「まとめて」\nと送るだけ" },
              { step: "3", title: "整ったことばで伝える", desc: "うめこが返してくれた\nメッセージをそのまま使える" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm border border-teal-100">
                  {item.step}
                </div>
                <p className="font-medium text-gray-800 text-sm mb-2">{item.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 安心感 ── */}
      <section className="py-20 px-6 bg-[#FAFBFC]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-10">
            うめこの約束
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              "中立です",
              "説教しません",
              "味方しません",
              "感情を否定しません",
            ].map((text, i) => (
              <div key={i} className="bg-white rounded-xl py-4 px-5 border border-gray-100">
                <p className="text-sm text-gray-700">{text}</p>
              </div>
            ))}
          </div>

          <p className="text-gray-400 text-sm leading-relaxed">
            うめこは裁判官じゃなくて、ちょっと気が利く友達。
            <br />
            どっちが悪いかじゃなく、どうしたらうまくいくかを考えます。
          </p>
        </div>
      </section>

      {/* ── 向いてる人 / 向いてない人 ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-teal-50/50 rounded-2xl p-6 border border-teal-100/50">
              <p className="font-medium text-gray-800 text-sm mb-4">こんな人に向いています</p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[
                  "言い方ひとつで空気が変わるのを知っている",
                  "つい黙ってしまうけど、本当は伝えたい",
                  "LINEの返信で悩む時間を減らしたい",
                  "催促や断りの伝え方に困る",
                ].map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-teal-500 mt-0.5">&#10003;</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <p className="font-medium text-gray-800 text-sm mb-4">うめこにできないこと</p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                {[
                  "どちらが正しいかの判定",
                  "カウンセリングや医療の代わり",
                  "相手を論破するための文章づくり",
                ].map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gray-300 mt-0.5">-</span>{t}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                万能じゃないけど、ことばに迷ったときの相棒にはなれます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F0] via-white to-[#EBF2FA]" />
        <div className="absolute top-10 -right-20 w-60 h-60 bg-teal-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/umeko-avatar.png" alt="うめこ" className="w-16 h-16 rounded-2xl shadow-md mx-auto mb-6" />

          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            ことばに迷ったとき、
            <br />
            うめこへ。
          </h2>

          <p className="text-gray-400 text-sm leading-relaxed mb-10">
            関係を壊さずに伝えるための、小さな相棒。
          </p>

          <LineButton>LINEで友だち追加する</LineButton>
          <p className="mt-3 text-xs text-gray-400">
            無料ではじめられます・いつでもブロックできます
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/umeko-avatar.png" alt="うめこ" className="w-6 h-6 rounded-full" />
            <span className="text-sm font-semibold text-gray-700">うめこ</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <Link href="/admin" className="hover:text-gray-600 transition">管理画面</Link>
            <span>&copy; 2026 うめこ</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
