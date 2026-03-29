interface SlackMessage {
  sender: "left" | "right" | "system";
  name?: string;
  avatar?: string;
  text: string;
  time?: string;
  isBot?: boolean;
}

function SlackBubble({ msg }: { msg: SlackMessage }) {
  return (
    <div className="flex items-start gap-2 px-4 py-1 hover:bg-gray-50/50">
      {msg.avatar ? (
        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 mt-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={msg.avatar} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-lg flex-shrink-0 bg-gray-300 flex items-center justify-center text-xs text-white font-bold mt-0.5">
          {msg.name?.charAt(0) || "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-[13px] font-bold ${msg.isBot ? "text-teal-700" : "text-gray-900"}`}>
            {msg.name}
            {msg.isBot && (
              <span className="ml-1 text-[10px] font-normal bg-gray-200 text-gray-500 px-1 py-0.5 rounded align-middle">APP</span>
            )}
          </span>
          {msg.time && (
            <span className="text-[10px] text-gray-400">{msg.time}</span>
          )}
        </div>
        <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{msg.text}</p>
      </div>
    </div>
  );
}

export function SlackMock({
  channel,
  messages,
  isDm,
}: {
  channel: string;
  messages: SlackMessage[];
  isDm?: boolean;
}) {
  return (
    <div className="w-full max-w-[380px] mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white">
      {/* Sidebar + Header */}
      <div className="bg-[#4A154B] px-4 py-2.5 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">U</span>
          </div>
          <span className="text-white/90 text-sm font-bold">うめこ</span>
        </div>
      </div>
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-1.5">
        {!isDm && <span className="text-gray-500 text-sm">#</span>}
        <span className="text-sm font-bold text-gray-900">{channel}</span>
      </div>

      {/* Messages */}
      <div className="py-3 space-y-2 min-h-[320px] bg-white">
        {messages.map((msg, i) =>
          msg.sender === "system" ? (
            <div key={i} className="text-center py-2">
              <span className="text-[11px] text-gray-400 border-t border-gray-200 px-3 pt-1 inline-block">
                {msg.text}
              </span>
            </div>
          ) : (
            <SlackBubble key={i} msg={msg} />
          )
        )}
      </div>

      {/* Input bar */}
      <div className="px-3 pb-3">
        <div className="border border-gray-300 rounded-lg px-3 py-2 text-[12px] text-gray-400">
          {isDm ? `${channel} にメッセージを送信` : `#${channel} にメッセージを送信`}
        </div>
      </div>
    </div>
  );
}

// Channel chat where umeko stays silent
export const SLACK_BUSINESS_CHAT: SlackMessage[] = [
  {
    sender: "right",
    name: "佐藤",
    text: "この前の件、なんで事前に共有してくれなかったんですか？\nこっちは聞いてなかったんですけど",
    time: "14:20",
  },
  {
    sender: "left",
    name: "田中",
    text: "いや、先週のMTGで話したと思うんですが…",
    time: "14:22",
  },
  {
    sender: "right",
    name: "佐藤",
    text: "聞いてないです。いつもそうですよね、共有が後出しなんですよ",
    time: "14:23",
  },
];

// DM from umeko to the party
export const SLACK_DM_INTERVENTION: SlackMessage[] = [
  {
    sender: "left",
    name: "うめこ",
    avatar: "/umeko-logo.png",
    isBot: true,
    text: "さっきの#開発チーム、少し強めに伝わってるかもしれません。\n「聞いてなかった」を「共有の仕方を決めませんか」に変えると、建設的に進みやすいかも",
    time: "14:24",
  },
];
