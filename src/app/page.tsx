import Link from "next/link";

const LINE_ADD_URL = "https://lin.ee/XXXXXXXXX"; // TODO: LINE友だち追加URLに差し替え

function LineButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={LINE_ADD_URL}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#06C755] px-8 py-4 text-white font-semibold text-lg shadow-lg hover:bg-[#05b04c] transition-all hover:shadow-xl ${className}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
      {children}
    </Link>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">{children}</h2>
      {sub && <p className="text-gray-500 text-sm md:text-base">{sub}</p>}
    </div>
  );
}

function BeforeAfter({
  label,
  before,
  after,
  prompt,
}: {
  label: string;
  before: string;
  after: string;
  prompt: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
      <span className="text-xs font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
        {label}
      </span>
      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">Before</p>
          <p className="text-gray-700 bg-red-50 rounded-xl px-4 py-3 text-sm leading-relaxed">
            {before}
          </p>
        </div>
        <div className="text-center">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            うめこに「{prompt}」と依頼
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">After</p>
          <p className="text-gray-700 bg-teal-50 rounded-xl px-4 py-3 text-sm leading-relaxed">
            {after}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-sky-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-100/40 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
          {/* Avatar */}
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-teal-400 to-sky-400 flex items-center justify-center shadow-lg">
            <span className="text-3xl md:text-4xl">&#x1F338;</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 leading-tight mb-4 tracking-tight">
            言いづらいことを、
            <br />
            <span className="text-teal-600">やわらかく。</span>
          </h1>

          <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-4 max-w-lg mx-auto">
            すれ違いを、少しずつ軽く。
            <br />
            会話の温度を、ちょうどよく。
          </p>

          <p className="text-gray-400 text-sm mb-10">
            会話をやさしく整理するAI「うめこ」
          </p>

          <LineButton>LINEで友だち追加する</LineButton>

          <p className="mt-4 text-xs text-gray-400">
            無料ではじめられます
          </p>
        </div>
      </section>

      {/* ── 共感セクション ── */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <SectionTitle sub="ことばに迷う瞬間は、意外と多い">
            こんなこと、ありませんか？
          </SectionTitle>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                emoji: "💬",
                text: "言いたいことはあるのに、きつく聞こえそうで言えない",
              },
              {
                emoji: "🔁",
                text: "同じことで何度もすれ違って、もう話すのが面倒になってきた",
              },
              {
                emoji: "📱",
                text: "LINEの返信、この言い方で大丈夫かな…と何度も書き直す",
              },
              {
                emoji: "😶",
                text: "言わなかったことが積もって、ある日ドカンとなる",
              },
              {
                emoji: "💼",
                text: "部下にフィードバックしたいけど、パワハラと思われたくない",
              },
              {
                emoji: "📧",
                text: "取引先への催促、角が立たない言い方がわからない",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-gray-50 rounded-xl p-4"
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            伝えたい気持ちはある。
            <br />
            ただ、ことばの選び方がわからないだけ。
          </p>
        </div>
      </section>

      {/* ── できること ── */}
      <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-3xl mx-auto">
          <SectionTitle sub="うめこはただのAIチャットではありません">
            うめこにできること
          </SectionTitle>

          <div className="grid gap-6">
            {[
              {
                icon: "✏️",
                title: "やわらかく言い換える",
                desc: "きつい言い方を、相手に受け取ってもらいやすい表現に整えます。意味は変えず、温度だけ下げます。",
              },
              {
                icon: "📋",
                title: "論点を整理する",
                desc: "話がこじれそうなとき、今なにが問題なのかを2〜3点に絞って見える化します。",
              },
              {
                icon: "🌡️",
                title: "会話の温度を下げる",
                desc: "感情的になりそうな流れを察知して、いったん落ち着くきっかけをつくります。",
              },
              {
                icon: "📝",
                title: "要点をまとめる",
                desc: "長くなった話し合いを、「何が決まって、何が残っているか」に整理します。",
              },
              {
                icon: "🤝",
                title: "次の一歩を提案する",
                desc: "すれ違ったまま終わらないように、小さな一歩を具体的に提案します。",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <span className="text-2xl flex-shrink-0 mt-1">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <SectionTitle sub="実際のやりとりのイメージ">
            たとえば、こんなふうに使えます
          </SectionTitle>

          <div className="grid md:grid-cols-2 gap-6">
            <BeforeAfter
              label="夫婦の会話"
              before="なんで毎回こうなの？ 私ばっかりやってるんだけど。"
              after="最近ちょっと負担が偏ってる気がしていて。一度、分担を見直せたらうれしいな。"
              prompt="やわらかくして"
            />
            <BeforeAfter
              label="仕事の連絡"
              before="なんでまだできてないの？ 期限過ぎてるんだけど。"
              after="進捗を確認したいです。現状と完了見込みを共有いただけますか？"
              prompt="柔らかくして"
            />
            <BeforeAfter
              label="パートナーとの会話"
              before="もういい。好きにすれば。"
              after="今はうまく言葉にできないから、少し時間をもらえると助かる。あとで落ち着いて話したい。"
              prompt="本当に伝えたいことを整理して"
            />
            <BeforeAfter
              label="取引先への連絡"
              before="早くしてください。困ってます。"
              after="お忙しいところ恐れ入ります。スケジュールの関係で、今週中にご対応いただけると大変助かります。"
              prompt="丁寧にして"
            />
          </div>
        </div>
      </section>

      {/* ── 向いている人 ── */}
      <section className="py-16 md:py-24 px-6 bg-gradient-to-b from-teal-50/50 to-white">
        <div className="max-w-3xl mx-auto">
          <SectionTitle>うめこが向いている人</SectionTitle>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs">&#10003;</span>
                こんな人におすすめ
              </h3>
              <ul className="space-y-3">
                {[
                  "言い方ひとつで空気が変わるのを知っている人",
                  "感情的にならずに伝えたい人",
                  "関係を壊したくないから、つい黙ってしまう人",
                  "LINEの返信で悩む時間を減らしたい人",
                  "催促や断りの言い方に困るビジネスパーソン",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-teal-500 mt-0.5">&#8226;</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs">&#8212;</span>
                うめこにできないこと
              </h3>
              <ul className="space-y-3">
                {[
                  "どちらが正しいかを判定すること",
                  "カウンセリングや医療行為の代わり",
                  "相手を論破するための文章を作ること",
                  "100%正解のことばを保証すること",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                    <span className="text-gray-300 mt-0.5">&#8226;</span>
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-gray-400 leading-relaxed">
                うめこは万能ではありません。
                <br />
                でも、ことばに迷ったときの「ちょっとした相棒」にはなれます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 使い方 ── */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <SectionTitle sub="むずかしい設定はいりません">
            使い方はシンプル
          </SectionTitle>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "友だち追加",
                desc: "LINEで「うめこ」を友だちに追加します。",
              },
              {
                step: "2",
                title: "相談する",
                desc: "「これ、やわらかくして」「まとめて」と話しかけるだけ。",
              },
              {
                step: "3",
                title: "ことばを整える",
                desc: "うめこが、相手に届きやすいことばに整理してくれます。",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-400 to-sky-400 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 安心感 ── */}
      <section className="py-16 md:py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <SectionTitle sub="うめこは裁判官ではなく、ファシリテーターです">
            うめこの約束
          </SectionTitle>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "⚖️", text: "中立です" },
              { icon: "🙅", text: "説教しません" },
              { icon: "🤝", text: "味方しません" },
              { icon: "💭", text: "感情を否定しません" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100"
              >
                <span className="text-2xl block mb-2">{item.icon}</span>
                <p className="text-sm font-medium text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-8 leading-relaxed">
            どちらが悪いかを決めるのではなく、
            <br />
            ことばを整えて、次の一歩をつくる。
            <br />
            それがうめこの役割です。
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-20 md:py-28 px-6 bg-gradient-to-br from-teal-50 via-white to-sky-50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-100/30 via-transparent to-transparent" />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-400 to-sky-400 flex items-center justify-center shadow-lg">
            <span className="text-2xl">&#x1F338;</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            ことばに迷ったとき、
            <br />
            うめこへ。
          </h2>

          <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-10 max-w-md mx-auto">
            関係を壊さずに伝えるための、
            <br />
            小さな相棒をためしてみませんか。
          </p>

          <LineButton>LINEで友だち追加する</LineButton>

          <p className="mt-4 text-xs text-gray-400">
            無料ではじめられます・いつでもブロックできます
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-sky-400 flex items-center justify-center">
              <span className="text-xs">&#x1F338;</span>
            </div>
            <span className="text-sm font-semibold text-gray-700">うめこ</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <Link href="/admin" className="hover:text-gray-600 transition">
              管理画面
            </Link>
            <span>&copy; 2026 うめこ</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
