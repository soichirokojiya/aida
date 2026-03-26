import Link from "next/link";
import { LineMock, FAMILY_CHAT, BUSINESS_CHAT, DM_CONSULT_CHAT } from "@/components/line-mock";

const LINE_ADD_URL = "https://lin.ee/nHtneAR";

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
              <p className="text-gray-500 text-base leading-relaxed mb-8">
                グループに入れたら会話を見守って整理。
                <br />
                1対1で話しかければ、相談相手にもなります。
              </p>

              <LineButton>LINEで友だち追加する</LineButton>
              <p className="mt-3 text-sm text-gray-500">
                <span className="font-medium text-teal-600">1ヶ月間無料</span>
                　その後 月額¥980
              </p>
            </div>

            <div className="hidden md:block">
              <LineMock title="家族グループ" messages={FAMILY_CHAT} memberCount={3} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2つの使い方 ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">2つの使い方</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            グループでも、1対1でも
          </h2>
          <p className="text-center text-gray-500 text-base mb-12 max-w-lg mx-auto">
            うめこはグループトークに参加して会話を見守ることも、
            <br />
            1対1で直接相談することもできます。
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                  <span className="text-lg">👥</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">グループに招待する</p>
                  <p className="text-sm text-gray-500">会話を見守り、必要なときだけ介入</p>
                </div>
              </div>
              <ul className="space-y-2 text-base text-gray-600">
                <li className="flex gap-2"><span className="text-teal-400">・</span>普段は静かに見守っている</li>
                <li className="flex gap-2"><span className="text-teal-400">・</span>空気が悪くなりそうなとき、さりげなく整理</li>
                <li className="flex gap-2"><span className="text-teal-400">・</span>「うめこ、まとめて」と呼べばいつでも対応</li>
                <li className="flex gap-2"><span className="text-teal-400">・</span>どちらの味方もしない</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center border border-sky-100">
                  <span className="text-lg">💬</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">1対1で相談する</p>
                  <p className="text-sm text-gray-500">伝え方の相談、言い換え、愚痴を聞く</p>
                </div>
              </div>
              <ul className="space-y-2 text-base text-gray-600">
                <li className="flex gap-2"><span className="text-sky-400">・</span>「こう言いたいけど、どう伝えたらいい？」</li>
                <li className="flex gap-2"><span className="text-sky-400">・</span>送る前のメッセージをやわらかくチェック</li>
                <li className="flex gap-2"><span className="text-sky-400">・</span>モヤモヤを整理するだけでもOK</li>
                <li className="flex gap-2"><span className="text-sky-400">・</span>いつでも気軽に話しかけられる</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 共感 ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">ことばに迷う瞬間</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            こんなこと、ありませんか？
          </h2>

          <div className="grid md:grid-cols-2 gap-3">
            {[
              "言いたいことはあるけど、きつく聞こえそうで言えない",
              "同じことで何度もすれ違って、もう話すのが面倒",
              "言わなかったことが積もって、ある日ドカンとなる",
              "部下へのフィードバック、パワハラと思われたくない",
              "取引先への催促、角が立たない言い方がわからない",
              "誰かに相談したいけど、わざわざ人を巻き込むほどでもない",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-4 bg-gray-50 border border-gray-100">
                <span className="text-teal-400 mt-0.5 text-sm">&#9679;</span>
                <p className="text-base text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── グループで使う：家庭版 ── */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-[#F6FAF8]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">グループで使う</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            会話が荒れそうなとき、そっと整理
          </h2>
          <p className="text-center text-gray-500 text-base mb-12 max-w-md mx-auto">
            うめこをグループに招待しておくだけ。
            <br />
            普段は静かに見守り、空気が変わったときだけ声をかけます。
          </p>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <LineMock title="家族グループ" messages={FAMILY_CHAT} memberCount={3} />
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-3">うめこがやっていること</p>
                <ul className="space-y-2 text-base text-gray-600">
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>どちらが悪いかは言わない</li>
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>すれ違いのポイントを言語化</li>
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>次にやることを1つだけ提案</li>
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-3">こんなグループで</p>
                <ul className="space-y-1.5 text-sm text-gray-500">
                  <li>・夫婦・カップル・家族</li>
                  <li>・プロジェクトチーム</li>
                  <li>・取引先との連絡グループ</li>
                  <li>・シェアハウスの共有グループ</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 1対1で使う ── */}
      <section className="py-20 px-6 bg-[#F6FAF8]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">1対1で使う</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            伝え方に迷ったら、まずうめこに相談
          </h2>
          <p className="text-center text-gray-500 text-base mb-12 max-w-md mx-auto">
            送る前のメッセージを見てもらったり、
            <br />
            モヤモヤを整理するだけの使い方もOK。
          </p>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-3">こんなふうに使える</p>
                <ul className="space-y-2 text-base text-gray-600">
                  <li className="flex gap-2"><span className="text-sky-500">&#10003;</span>「こう言いたいけど、どう伝える？」</li>
                  <li className="flex gap-2"><span className="text-sky-500">&#10003;</span>「このメッセージ、柔らかくして」</li>
                  <li className="flex gap-2"><span className="text-sky-500">&#10003;</span>「ちょっと愚痴聞いて」</li>
                  <li className="flex gap-2"><span className="text-sky-500">&#10003;</span>「断りの文面を一緒に考えて」</li>
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-3">グループとの違い</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  グループではみんなの前で整理役。
                  <br />
                  1対1では、あなただけの相談相手。
                  <br />
                  使い分けはお好みで。
                </p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <LineMock title="うめこ" messages={DM_CONSULT_CHAT} />
            </div>
          </div>
        </div>
      </section>

      {/* ── ビジネスでも ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">仕事でも使える</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            チーム内のすれ違いも、さらっと整理
          </h2>
          <p className="text-center text-gray-500 text-base mb-12 max-w-md mx-auto">
            社内のグループに入れておけば、
            <br />
            認識のズレや感情的なやりとりをやわらかく整理します。
          </p>

          <div className="max-w-sm mx-auto">
            <LineMock title="開発チーム" messages={BUSINESS_CHAT} memberCount={5} />
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
              { icon: "👥", title: "グループの会話を見守る", desc: "荒れそうなときだけ、さりげなく介入" },
              { icon: "💬", title: "1対1で相談にのる", desc: "伝え方の相談、愚痴、モヤモヤの整理" },
              { icon: "✏️", title: "やわらかく言い換え", desc: "意味はそのまま、温度だけ下げます" },
              { icon: "📝", title: "会話をまとめる", desc: "何が決まって何が残ってるかを整理" },
              { icon: "🤝", title: "次の一歩を提案", desc: "具体的で小さなアクションを1つだけ" },
              { icon: "🛡️", title: "どちらの味方もしない", desc: "善悪の判定はしません。整理だけ" },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 bg-white rounded-xl p-5 border border-gray-100">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-medium text-gray-800 text-sm mb-0.5">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 使い方 ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            使い方
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-teal-50/50 rounded-2xl p-6 border border-teal-100/50">
              <p className="font-medium text-gray-800 text-sm mb-4 flex items-center gap-2">
                <span>👥</span> グループで使う場合
              </p>
              <ol className="space-y-3 text-base text-gray-600">
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  うめこを友だち追加
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  グループに招待する
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  あとは普通に会話するだけ。必要なときだけうめこが声をかけます
                </li>
              </ol>
            </div>

            <div className="bg-sky-50/50 rounded-2xl p-6 border border-sky-100/50">
              <p className="font-medium text-gray-800 text-sm mb-4 flex items-center gap-2">
                <span>💬</span> 1対1で使う場合
              </p>
              <ol className="space-y-3 text-base text-gray-600">
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  うめこを友だち追加
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  そのまま話しかける
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  相談、言い換え、愚痴。なんでもOK
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 rounded-xl p-5 border border-gray-100 flex items-center gap-4">
            <span className="text-2xl flex-shrink-0">💼</span>
            <div>
              <p className="text-sm font-medium text-gray-800">Slack にも近日対応予定</p>
              <p className="text-sm text-gray-500">社内のSlackワークスペースでも、うめこが使えるようになります。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── うめこについて ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/umeko-avatar.png" alt="うめこ" className="w-24 h-24 rounded-full shadow-lg mx-auto mb-6 border-4 border-teal-50" />
          </div>

          <div className="space-y-6 text-gray-600 text-base leading-[1.9]">
            <p>
              どこの職場にも、どこの家庭にも、
              ひとりくらい「この人がいると空気が変わる」って人がいると思う。
            </p>

            <p>
              会議で空気が固まったとき、いつの間にか隣にいて、
              さらっと場の温度を変えてくれる人。
              本人は「別に何もしてないよ」って言うけど、
              周りから見ると、その人がいるだけでなぜか話しやすくなる。
            </p>

            <p>
              うめこは、そういう人をイメージして生まれました。
            </p>

            <p className="text-gray-400 text-sm py-2">───</p>

            <p>
              人は言い方ひとつで傷つくし、言い方ひとつで救われる。
              <br />
              正しいことを正しく言っても、伝わらないことがある。
            </p>

            <p>
              黙ることは優しさじゃない。でも、言い方は選べる。
            </p>

            <p className="text-gray-400 text-sm py-2">───</p>

            <p>
              紅茶が好きで、散歩が好きで、古い喫茶店の窓際の席が好き。
              <br />
              大声は苦手。正論で詰めてくる人も得意じゃない。
              <br />
              「で、結論は？」って急かされると、ちょっと黙る。
            </p>

            <p>
              100点の解決より、まず1歩だけ前に進めたらいいと思ってる。
            </p>
          </div>

          {/* うめこのことば */}
          <div className="mt-16 bg-teal-50/60 rounded-2xl p-8 border border-teal-100/60">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/umeko-avatar.png" alt="" className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 leading-[1.9]">
                言いたいことがあるのに言い方がわからなくて黙ってしまったり、
                つい強く言いすぎてあとから後悔したり。
                たぶん誰にでもある。
                <br /><br />
                わたしにできるのは、どっちが正しいか決めることじゃなくて、
                ちょっとだけことばを整えること。
                <br /><br />
                気軽に話しかけてね。
              </p>
            </div>
          </div>

          <p className="text-center mt-14 text-teal-700 text-lg font-medium tracking-wide">
            「どっちが悪いかより、どうしたらうまくいくか」
          </p>
        </div>
      </section>

      {/* ── 料金 ── */}
      <section className="py-20 px-6 bg-[#FAFBFC]">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-10">
            料金
          </h2>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <p className="text-teal-600 font-medium text-sm mb-1">まずは無料でおためし</p>
            <p className="text-4xl font-bold text-gray-800 mb-1">¥0</p>
            <p className="text-gray-500 text-base mb-6">最初の1ヶ月間</p>

            <div className="border-t border-gray-100 pt-6 mb-6">
              <p className="text-gray-500 text-sm mb-1">その後</p>
              <p className="text-2xl font-bold text-gray-800">¥980<span className="text-base font-normal text-gray-500"> /月</span></p>
            </div>

            <ul className="text-left space-y-2 text-base text-gray-600 mb-6">
              <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>グループ会話の見守り・整理</li>
              <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>1対1の相談・言い換え</li>
              <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>回数無制限</li>
              <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>いつでも解約OK</li>
            </ul>

            <LineButton size="sm">友だち追加して無料で始める</LineButton>
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

          <p className="text-gray-500 text-base leading-relaxed">
            うめこは裁判官じゃなくて、ちょっと気が利く友達。
            <br />
            どっちが悪いかじゃなく、どうしたらうまくいくかを考えます。
          </p>
        </div>
      </section>

      {/* ── Q&A ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            よくある質問
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "会話の内容は安全ですか？",
                a: "はい。会話データはユーザーの実名を保存せず、LINE上のIDのみで管理しています。万が一の情報漏洩時にも、誰の発言かが特定されない設計です。",
              },
              {
                q: "グループの会話が外部に共有されることはありますか？",
                a: "ありません。会話データは第三者に共有・販売されることはありません。AIの応答生成のためにのみ使用されます。",
              },
              {
                q: "無料期間が終わったらどうなりますか？",
                a: "1対1でのお返事ができなくなります。グループでの会話記録は引き続き行われます。月額プランに登録すればすぐに復帰できます。",
              },
              {
                q: "グループに入れたら全部の会話に返信しますか？",
                a: "いいえ。普段は静かに見守っているだけです。空気が悪くなりそうなときや、「うめこ」と呼びかけたときだけ反応します。",
              },
              {
                q: "1対1では何ができますか？",
                a: "伝え方の相談、メッセージの言い換え、愚痴を聞く、モヤモヤの整理など、なんでも話しかけてもらえます。",
              },
              {
                q: "解約はかんたんにできますか？",
                a: "はい。いつでも解約できます。LINEをブロックするだけでもOKです。",
              },
              {
                q: "LINE以外でも使えますか？",
                a: "現在はLINEのみ対応しています。Slackにも近日対応予定です。",
              },
            ].map((item, i) => (
              <div key={i} className="border-b border-gray-100 pb-6">
                <p className="font-medium text-gray-800 mb-2">{item.q}</p>
                <p className="text-gray-500 text-base leading-relaxed">{item.a}</p>
              </div>
            ))}
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

          <p className="text-gray-500 text-base leading-relaxed mb-10">
            グループに招待しても、1対1で話しかけても。
            <br />
            関係を壊さずに伝えるための、小さな相棒。
          </p>

          <LineButton>LINEで友だち追加する</LineButton>
          <p className="mt-3 text-sm text-gray-500">
            <span className="font-medium text-teal-600">1ヶ月間無料</span>
            　その後 月額¥980・いつでも解約OK
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://qr-official.line.me/gs/M_031xyrtk_GW.png?oat_content=qr"
            alt="LINE QRコード"
            className="w-32 h-32 mx-auto mt-8 rounded-xl"
          />
          <p className="mt-2 text-xs text-gray-300">QRコードからも追加できます</p>
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
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <a href="https://cfac.co.jp" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition">運営会社</a>
            <Link href="/admin" className="hover:text-gray-700 transition">管理画面</Link>
            <span>&copy; 2026 うめこ</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
