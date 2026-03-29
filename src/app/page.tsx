import Link from "next/link";
import { LineMock, FAMILY_CHAT, DM_CONSULT_CHAT, DM_INTERVENTION_CHAT } from "@/components/line-mock";
import { SlackMock, SLACK_BUSINESS_CHAT } from "@/components/slack-mock";
import { PlatformTabs } from "@/components/platform-tabs";

const LINE_ADD_URL = "https://lin.ee/nHtneAR";
const SLACK_INSTALL_URL = "/api/slack/install";

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

function SlackButton({ children, size = "lg" }: { children: React.ReactNode; size?: "lg" | "sm" }) {
  const cls = size === "lg"
    ? "px-8 py-4 text-base md:text-lg"
    : "px-6 py-3 text-sm";
  return (
    <Link
      href={SLACK_INSTALL_URL}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full bg-[#4A154B] text-white font-semibold shadow-lg hover:bg-[#611f64] transition-all hover:shadow-xl hover:-translate-y-0.5 ${cls}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" />
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
            <img src="/umeko-logo.png" alt="うめこ" className="w-8 h-8 rounded-full" />
            <span className="font-bold text-gray-800">うめこ</span>
          </div>
          <div className="flex items-center gap-2">
            <LineButton size="sm">LINE</LineButton>
            <SlackButton size="sm">Slack</SlackButton>
          </div>
        </div>
      </nav>

      {/* ── 1. Hero ── */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F0] via-white to-[#EBF2FA]" />
        <div className="absolute top-20 -left-40 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-sky-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/umeko-logo.png" alt="うめこ" className="w-16 h-16 rounded-2xl shadow-md mb-6" />

              <h1 className="text-3xl md:text-[2.75rem] font-bold text-gray-800 leading-[1.3] tracking-tight mb-5">
                言いづらいことを、
                <br />
                <span className="text-teal-600">やわらかく。</span>
              </h1>

              <p className="text-gray-500 text-base md:text-lg leading-relaxed mb-3">
                すれ違いや気まずさを、少しずつ軽く。
              </p>
              <p className="text-gray-500 text-base leading-relaxed mb-3">
                うめこは、ことばに迷ったときのAIサービスです。
              </p>
              <p className="text-gray-500 text-base leading-relaxed mb-3">
                グループに入れておくと、空気が変わったときに<strong className="text-gray-700">当事者にだけDM</strong>で伝え方を提案します。
                みんなの前では何も言わない。本人が自分のことばで場に戻れるように。
              </p>
              <p className="text-gray-500 text-base leading-relaxed mb-8">
                1対1で話しかければ、伝え方の相談や言い換え、モヤモヤの整理もできます。
              </p>

              <div className="flex flex-wrap gap-3">
                <LineButton>LINEで気軽に始める</LineButton>
                <SlackButton>Slackに追加する</SlackButton>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                最初の1ヶ月は無料で使えます
              </p>
            </div>

            <div className="hidden md:flex flex-col gap-3">
              <LineMock title="家族グループ" messages={FAMILY_CHAT} memberCount={3} />
              <div className="flex items-center gap-2 justify-center">
                <div className="h-px w-8 bg-gray-300" />
                <p className="text-xs text-gray-400">うめこが当事者にDM</p>
                <div className="h-px w-8 bg-gray-300" />
              </div>
              <LineMock title="うめこ" messages={DM_INTERVENTION_CHAT} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. 掲載媒体 ── */}
      <section className="py-10 px-6 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs text-gray-400 mb-6">メディアで紹介されました</p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap opacity-70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media-mainichi.png" alt="毎日新聞" className="w-32 md:w-36 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media-nishinippon.png" alt="西日本新聞" className="w-32 md:w-36 object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media-niconico.png" alt="ニコニコニュース" className="w-32 md:w-36 object-contain" />
          </div>
        </div>
      </section>

      {/* ── 3. 共感 ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">ことばに迷う瞬間</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            こんなこと、ありませんか？
          </h2>

          <div className="space-y-4 max-w-xl mx-auto">
            {[
              "言いたいことはあるけど、きつく聞こえそうで言えない。",
              "同じことで何度もすれ違って、話すのがしんどくなる。",
              "言わなかったことが積もって、ある日まとめてあふれてしまう。",
              "部下へのフィードバックで、強く言いすぎたくない。",
              "誰かに少し相談したいけれど、わざわざ人を巻き込むほどでもない。",
            ].map((text, i) => (
              <p key={i} className="text-gray-600 text-base leading-relaxed">{text}</p>
            ))}
          </div>

          <p className="text-center text-gray-500 text-base mt-10">
            そんな&ldquo;ことばに迷う瞬間&rdquo;に、うめこがいます。
          </p>
        </div>
      </section>

      {/* ── 4. うめこという存在（約束 + キャラ統合） ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/umeko-logo.png" alt="うめこ" className="w-20 h-20 rounded-full shadow-lg mx-auto mb-6 border-4 border-teal-50" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              うめこってこんな存在
            </h2>
            <p className="text-gray-500 text-base leading-relaxed max-w-lg mx-auto">
              どこの職場にも、どこの家庭にも、
              ひとりくらい「この人がいると空気がやわらぐ」人がいると思う。
              うめこは、そういう存在を目指しています。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-12">
            {[
              "中立です",
              "説教しません",
              "どちらの味方にもなりません",
              "感情を否定しません",
            ].map((text, i) => (
              <div key={i} className="bg-[#FAFBFC] rounded-xl py-4 px-5 border border-gray-100 text-center">
                <p className="text-base text-gray-700">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-teal-50/60 rounded-2xl p-8 border border-teal-100/60">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/umeko-logo.png" alt="" className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 leading-[1.9] text-sm">
                福岡出身。前職はカスタマーサポート。
                そこで気づいたのは、同じ内容でも伝え方ひとつで相手の反応がまるで変わるということ。
                正しいことを正しく言っても、届かないことがある。
                <br /><br />
                わたしにできるのは、どっちが正しいか決めることじゃなくて、
                ちょっとだけことばを整えること。
                気軽に話しかけてね。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. できること（3つに厳選） ── */}
      <section className="py-20 px-6 bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            うめこにできること
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
              <span className="text-3xl block mb-3">👥</span>
              <p className="font-medium text-gray-800 mb-2">グループを見守る</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                ふだんは静か。空気が変わったら、当事者それぞれにDMで「こう言い換えると伝わるかも」と提案します。
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
              <span className="text-3xl block mb-3">💬</span>
              <p className="font-medium text-gray-800 mb-2">1対1で相談にのる</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                伝え方の相談、言い換え、モヤモヤの整理。気軽に話しかけてもらえます。
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
              <span className="text-3xl block mb-3">✏️</span>
              <p className="font-medium text-gray-800 mb-2">ことばをやわらかくする</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                意味はそのままに、温度だけ少し下げます。画像やPDFも読み取れます。
              </p>
            </div>
          </div>

          <div className="text-center mt-10">
            <LineButton size="sm">気軽に話しかけてみる</LineButton>
            <p className="mt-2 text-xs text-gray-400">最初の1ヶ月は無料です</p>
          </div>
        </div>
      </section>

      {/* ── 6. グループで使う ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">グループで使う</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            会話が荒れそうなとき、そっと整理
          </h2>
          <p className="text-center text-gray-500 text-base mb-12 max-w-lg mx-auto">
            LINEグループやSlackチャンネルに入れておくだけ。
            言い分がぶつかっているときに、何がすれ違っているのかを見つけて、
            次にどう話せばいいかを少しだけ整えます。
          </p>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <LineMock title="家族グループ" messages={FAMILY_CHAT} memberCount={3} />
            <div className="space-y-6">
              <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-gray-100">
                <p className="font-medium text-gray-800 mb-3">うめこがやっていること</p>
                <ul className="space-y-2 text-base text-gray-600">
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>どちらが悪いかは言わない</li>
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>すれ違いのポイントをことばにする</li>
                  <li className="flex gap-2"><span className="text-teal-500">&#10003;</span>次にやることを1つだけ提案する</li>
                </ul>
              </div>
              <div className="bg-[#FAFBFC] rounded-2xl p-6 border border-gray-100">
                <p className="font-medium text-gray-800 mb-3">こんなグループで使えます</p>
                <ul className="space-y-1.5 text-base text-gray-500">
                  <li>・夫婦、カップル、家族</li>
                  <li>・プロジェクトチーム</li>
                  <li>・取引先との連絡グループ</li>
                  <li>・シェアハウスや共同生活の連絡</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. 1対1で使う ── */}
      <section className="py-20 px-6 bg-[#F6FAF8]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-teal-600 text-sm font-medium mb-3">1対1で使う</p>
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            伝え方に迷ったら、まずうめこに
          </h2>
          <p className="text-center text-gray-500 text-base mb-12 max-w-lg mx-auto">
            送る前のメッセージを見てもらったり、モヤモヤをことばにしたり。
            うまく言えないときに、気軽に話しかけられる存在です。
          </p>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="font-medium text-gray-800 mb-3">こんなふうに使える</p>
                <ul className="space-y-2 text-base text-gray-600">
                  <li className="flex gap-2"><span className="text-sky-500">&#10003;</span>「こう言いたいけど、どう伝える？」</li>
                  <li className="flex gap-2"><span className="text-sky-500">&#10003;</span>「このメッセージ、柔らかくして」</li>
                  <li className="flex gap-2"><span className="text-sky-500">&#10003;</span>「ちょっと愚痴聞いて」</li>
                  <li className="flex gap-2"><span className="text-sky-500">&#10003;</span>「断りの文面を一緒に考えて」</li>
                </ul>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <LineMock title="うめこ" messages={DM_CONSULT_CHAT} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. ユースケース（親子・夫婦・職場） ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            いろんな場面で、うめこ
          </h2>

          {/* 親子 */}
          <div className="mb-12">
            <p className="text-teal-600 text-sm font-medium mb-2">親子でも、うめこ</p>
            <p className="text-gray-800 font-medium text-lg mb-1">言いすぎる前に、ひと呼吸</p>
            <p className="text-gray-500 text-sm mb-5">反抗期の会話も、少しやわらかく。</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#FAFBFC] rounded-xl p-5 border border-gray-100">
                <p className="text-xl mb-2">📚</p>
                <p className="font-medium text-gray-800 text-sm mb-1">宿題・勉強</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  「なんで宿題やってないの」が口癖になっていませんか。
                  うめこは「どこまでやった？」という聞き方を提案します。
                </p>
              </div>
              <div className="bg-[#FAFBFC] rounded-xl p-5 border border-gray-100">
                <p className="text-xl mb-2">📱</p>
                <p className="font-medium text-gray-800 text-sm mb-1">スマホ・ゲーム</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  ルールの話し合いを「対決」ではなく「相談」に変えるきっかけに。
                </p>
              </div>
              <div className="bg-[#FAFBFC] rounded-xl p-5 border border-gray-100">
                <p className="text-xl mb-2">🎯</p>
                <p className="font-medium text-gray-800 text-sm mb-1">進路・習い事</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  どちらの気持ちも否定せずに「何がすれ違っているのか」を整理します。
                </p>
              </div>
            </div>
          </div>

          {/* 職場・Slack */}
          <div>
            <p className="text-teal-600 text-sm font-medium mb-2">仕事でも、うめこ</p>
            <p className="text-gray-800 font-medium text-lg mb-1">チーム内のすれ違いも、さらっと整理</p>
            <p className="text-gray-500 text-sm mb-5">Slackにも対応。チャンネルに追加するだけ。</p>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                <div className="bg-[#FAFBFC] rounded-xl p-5 border border-gray-100">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>リモートワーク中心のチーム</li>
                    <li className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>テキストコミュニケーションが多い職場</li>
                    <li className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>部署横断のプロジェクト</li>
                    <li className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>フリーランス・外注先とのやりとり</li>
                  </ul>
                </div>
              </div>
              <SlackMock channel="開発チーム" messages={SLACK_BUSINESS_CHAT} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. 料金 ── */}
      <section className="py-20 px-6 bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            料金
          </h2>
          <p className="text-center text-gray-500 text-base mb-8">
            最初の1ヶ月は無料で使えます
          </p>

          <PlatformTabs
            lineContent={
              <div>
                <div className="max-w-md mx-auto">
                  <div className="bg-white rounded-2xl p-8 border border-[#06C755]/30 shadow-sm text-center">
                    <p className="text-[#06C755] font-medium text-sm mb-1">うめこ LINE</p>
                    <p className="text-4xl font-bold text-gray-800 mb-1">¥980<span className="text-base font-normal text-gray-500"> /月</span></p>
                    <p className="text-gray-500 text-sm mb-6">1対1の相談も、グループの見守りも、これ1つ</p>
                    <ul className="space-y-2 text-base text-gray-600 text-left">
                      <li className="flex gap-2"><span className="text-[#06C755]">&#10003;</span>1対1で相談・言い換え・要約</li>
                      <li className="flex gap-2"><span className="text-[#06C755]">&#10003;</span>LINEグループの見守り・整理（1グループ含む）</li>
                      <li className="flex gap-2"><span className="text-[#06C755]">&#10003;</span>画像・音声・PDF読み取り</li>
                      <li className="flex gap-2"><span className="text-[#06C755]">&#10003;</span>Web検索</li>
                      <li className="flex gap-2"><span className="text-[#06C755]">&#10003;</span>回数無制限</li>
                      <li className="flex gap-2"><span className="text-[#06C755]">&#10003;</span>1人が払えばグループ全員使える</li>
                    </ul>
                    <p className="text-xs text-gray-400 mt-4">追加グループ: +¥490/月</p>
                  </div>
                </div>
                <div className="text-center mt-8">
                  <LineButton size="sm">LINEで気軽に始める</LineButton>
                  <p className="mt-3 text-sm text-gray-400">いつでも解約OK</p>
                </div>
              </div>
            }
            slackContent={
              <div>
                <div className="max-w-md mx-auto">
                  <div className="bg-white rounded-2xl p-8 border border-[#4A154B]/30 shadow-sm text-center">
                    <p className="text-[#4A154B] font-medium text-sm mb-1">うめこ for Slack</p>
                    <p className="text-4xl font-bold text-gray-800 mb-1">¥980<span className="text-base font-normal text-gray-500"> /月</span></p>
                    <p className="text-gray-500 text-sm mb-6">1対1の相談も、チャンネルの見守りも、これ1つ</p>
                    <ul className="space-y-2 text-base text-gray-600 text-left">
                      <li className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>1対1で相談・言い換え・要約</li>
                      <li className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>Slackチャンネルの見守り・整理（1チャンネル含む）</li>
                      <li className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>画像・PDF・Excel読み取り</li>
                      <li className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>Web検索</li>
                      <li className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>回数無制限</li>
                      <li className="flex gap-2"><span className="text-[#4A154B]">&#10003;</span>1人が払えばチャンネル全員使える</li>
                    </ul>
                    <p className="text-xs text-gray-400 mt-4">追加チャンネル: +¥490/月</p>
                  </div>
                </div>
                <div className="text-center mt-8">
                  <SlackButton size="sm">Slackに追加する</SlackButton>
                  <p className="mt-3 text-sm text-gray-400">いつでも解約OK</p>
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* ── 10. よくある質問 ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            よくある質問
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "会話の内容は安全ですか？",
                a: "会話データは、実名ではなくLINE・Slack上の識別情報をもとに管理しています。会話内容が外部に公開されたり、第三者に販売されることはありません。",
              },
              {
                q: "グループに入れたら、すべての会話に返信しますか？",
                a: "いいえ。普段は静かに見守っていて、空気が悪くなりそうなときや「うめこ」と呼びかけられたときだけ反応します。",
              },
              {
                q: "無料期間が終わったらどうなりますか？",
                a: "うめこが応答しなくなります。うめこプラン（月額980円）に登録すると、1対1の相談もグループの見守りもすべて使えるようになります。",
              },
              {
                q: "画像やPDFも読めますか？",
                a: "はい。画像、音声メッセージ、PDF、Word、Excelを読み取れます。スクリーンショットを送って「この会話、どう返す？」という使い方もできます。",
              },
              {
                q: "解約はかんたんにできますか？",
                a: "はい。うめこに「解約したい」と話しかけると、手続きページのリンクが届きます。LINEのブロックやSlackからのアンインストールだけでは課金は停止されないのでご注意ください。",
              },
              {
                q: "LINEとSlack、どちらでも使えますか？",
                a: "はい。「うめこ LINE」と「うめこ for Slack」の2つのサービスがあります。どちらも同じうめこですが、それぞれ独立したサービスで、料金も別々です。",
              },
            ].map((item, i) => (
              <div key={i} className="border-b border-gray-200 pb-6">
                <p className="font-medium text-gray-800 mb-2">{item.q}</p>
                <p className="text-gray-500 text-base leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. CTA ── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8F4F0] via-white to-[#EBF2FA]" />
        <div className="absolute top-10 -right-20 w-60 h-60 bg-teal-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/umeko-logo.png" alt="うめこ" className="w-16 h-16 rounded-2xl shadow-md mx-auto mb-6" />

          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            ことばに迷ったとき、
            <br />
            うめこへ。
          </h2>

          <p className="text-gray-500 text-base leading-relaxed mb-10">
            ひとりで抱えこまずに、まずは気軽に話しかけてみてください。
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <LineButton>LINEで気軽に始める</LineButton>
            <SlackButton>Slackに追加する</SlackButton>
          </div>
          <p className="mt-3 text-sm text-gray-400">
            最初の1ヶ月は無料・いつでも解約OK
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://qr-official.line.me/gs/M_031xyrtk_GW.png?oat_content=qr"
            alt="LINE QRコード"
            className="w-28 h-28 mx-auto mt-8 rounded-xl"
          />
          <p className="mt-2 text-xs text-gray-400">LINEはQRコードからも追加できます</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/umeko-logo.png" alt="うめこ" className="w-6 h-6 rounded-full" />
            <span className="text-sm font-semibold text-gray-700">うめこ</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <a href="https://cfac.co.jp" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition">運営会社</a>
            <span>&copy; 2026 うめこ</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
