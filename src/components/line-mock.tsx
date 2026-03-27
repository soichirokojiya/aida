interface Message {
  sender: "left" | "right" | "system";
  name?: string;
  avatar?: string;
  text: string;
  time?: string;
  isBot?: boolean;
}

function BubbleLeft({ msg }: { msg: Message }) {
  return (
    <div className="flex items-end gap-2 max-w-[85%]">
      {msg.avatar ? (
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={msg.avatar} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-gray-300 flex items-center justify-center text-xs text-white font-bold">
          {msg.name?.charAt(0) || "?"}
        </div>
      )}
      <div>
        {msg.name && (
          <p className="text-[10px] text-gray-400 mb-0.5 ml-1">{msg.name}</p>
        )}
        <div className="flex items-end gap-1">
          <div className={`rounded-2xl rounded-bl-sm px-3.5 py-2 text-[13px] leading-relaxed ${msg.isBot ? "bg-white border border-teal-200 text-gray-700" : "bg-white text-gray-700"}`}>
            {msg.text}
          </div>
          {msg.time && (
            <span className="text-[9px] text-gray-300 flex-shrink-0">{msg.time}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function BubbleRight({ msg }: { msg: Message }) {
  return (
    <div className="flex items-end gap-1 max-w-[80%] ml-auto flex-row-reverse">
      <div className="rounded-2xl rounded-br-sm bg-[#8DE055] px-3.5 py-2 text-[13px] leading-relaxed text-gray-800">
        {msg.text}
      </div>
      {msg.time && (
        <span className="text-[9px] text-gray-300 flex-shrink-0">{msg.time}</span>
      )}
    </div>
  );
}

function SystemMessage({ msg }: { msg: Message }) {
  return (
    <div className="text-center">
      <span className="text-[10px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
        {msg.text}
      </span>
    </div>
  );
}

export function LineMock({
  title,
  messages,
  memberCount,
}: {
  title: string;
  messages: Message[];
  memberCount?: number;
}) {
  return (
    <div className="w-full max-w-[340px] mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-[#7494C0]">
      {/* Header */}
      <div className="bg-[#7494C0] px-4 py-3 flex items-center gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="opacity-80">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        <div className="flex-1 text-center">
          <p className="text-white text-sm font-medium">{title}</p>
          {memberCount && (
            <p className="text-white/60 text-[10px]">{memberCount}人のメンバー</p>
          )}
        </div>
        <div className="w-[18px]" />
      </div>

      {/* Chat area */}
      <div className="bg-[#8CABD9] px-3 py-4 space-y-3 min-h-[320px]">
        {messages.map((msg, i) =>
          msg.sender === "system" ? (
            <SystemMessage key={i} msg={msg} />
          ) : msg.sender === "left" ? (
            <BubbleLeft key={i} msg={msg} />
          ) : (
            <BubbleRight key={i} msg={msg} />
          )
        )}
      </div>

      {/* Input bar */}
      <div className="bg-[#EFF1F5] px-3 py-2 flex items-center gap-2">
        <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[12px] text-gray-300">
          メッセージを入力
        </div>
        <div className="w-7 h-7 rounded-full bg-[#06C755] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export const FAMILY_CHAT: Message[] = [
  { sender: "right", text: "なんで毎回こうなるの？\n私ばっかりやってるんだけど", time: "21:42" },
  { sender: "left", name: "たかし", text: "いや、言ってくれればやるって\n前も言ったじゃん", time: "21:43" },
  { sender: "right", text: "なんでこっちがお願いしなきゃ\nいけないの？自分の家でしょ？", time: "21:44" },
  {
    sender: "left",
    name: "うめこ",
    avatar: "/umeko-logo.jpg",
    isBot: true,
    text: "ちょっと待って。\n「やってほしい」と「自分で気づいてほしい」で、ちょっとすれ違ってるかも。\nいったん、何が一番モヤッとしてるか一つだけ聞いてみない？",
    time: "21:44",
  },
];

export const BUSINESS_CHAT: Message[] = [
  { sender: "right", text: "この前の件、なんで事前に\n共有してくれなかったんですか？\nこっちは聞いてなかったんですけど", time: "14:20" },
  { sender: "left", name: "田中", text: "いや、先週のMTGで\n話したと思うんですが…", time: "14:22" },
  { sender: "right", text: "聞いてないです。\nいつもそうですよね、\n共有が後出しなんですよ", time: "14:23" },
  {
    sender: "left",
    name: "うめこ",
    avatar: "/umeko-logo.jpg",
    isBot: true,
    text: "ちょっと待って。\n「伝えたつもり」と「聞いてない」がぶつかってるね。\nまず、先週のMTGの議事録を一緒に確認してみない？事実ベースで整理しよう。",
    time: "14:24",
  },
];

export const DM_CONSULT_CHAT: Message[] = [
  { sender: "right", text: "上司にプロジェクトの遅れを\n報告しなきゃなんだけど、\nどう言えばいいかな…", time: "19:30" },
  {
    sender: "left",
    name: "うめこ",
    avatar: "/umeko-logo.jpg",
    isBot: true,
    text: "それは言いづらいやつだね。\nどのくらい遅れてる？",
    time: "19:30",
  },
  { sender: "right", text: "1週間くらい。\n自分のミスもあるから\nよけいに言いにくい", time: "19:31" },
  {
    sender: "left",
    name: "うめこ",
    avatar: "/umeko-logo.jpg",
    isBot: true,
    text: "たとえばこんな感じはどう？\n\n「お伝えするのが遅くなり申し訳ありません。○○の件、当初の予定から1週間ほど遅れが出ています。原因と対策をまとめましたので、ご確認いただけますか」",
    time: "19:32",
  },
];
