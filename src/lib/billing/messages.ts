export function getDueReminderMessage(dmCheckoutUrl: string): string {
  return `うめこです。

おためし期間が今日で終わりだよ。
使ってくれてありがとう。

引き続き話したいなと思ってもらえたら、ここから登録してもらえるとうれしいです。

▼ パーソナルプラン（月額490円）
${dmCheckoutUrl}

LINEグループで使いたい場合は、グループ内で「うめこ」って呼んでくれたら、そこから登録できるよ。

またいつでも気軽に話しかけてね。`;
}

export function getDmExpiredMessage(dmCheckoutUrl: string): string {
  return `ごめんね、おためし期間が終わっちゃって、今は1対1ではお返事できないんだ。

また話したいなって思ったら、ここから登録してもらえるとうれしいです。

▼ パーソナルプラン（月額490円）
${dmCheckoutUrl}`;
}

export function getGroupExpiredMessage(groupCheckoutUrl: string): string {
  return `このLINEグループではまだうめこが使えない状態なんだ。

誰か1人が登録してくれれば、グループのみんなが使えるようになるよ。

▼ LINEグループプラン（月額980円）
${groupCheckoutUrl}`;
}

export function getWelcomeMessage(): string {
  return `はじめまして、うめこです！

会話をやさしく整理するお手伝いをしています。

使い方はかんたん：
・LINEグループに招待すれば、会話を見守ります
・1対1で話しかければ、相談相手になります
・「柔らかくして」「まとめて」と言えばOK

最初の1ヶ月は無料で使えます。
気軽に話しかけてみてくださいね。`;
}
