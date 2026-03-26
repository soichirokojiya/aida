export function getPreReminderMessage(checkoutUrl: string): string {
  return `こんにちは、うめこです。

友だちになってくれてから、もうすぐ1ヶ月ですね。
これまで使ってみてどうでしたか？

来週から月額プランへの切り替えをお願いすることになります。
もし続けて使ってもらえるなら、とてもうれしいです。

月額 ¥980

▼ 登録はこちら
${checkoutUrl}`;
}

export function getDueReminderMessage(checkoutUrl: string): string {
  return `うめこです。

無料おためし期間が今日で終わりになります。
引き続き使ってもらえる場合は、下のリンクから登録をお願いします。

月額 ¥980

▼ 登録はこちら
${checkoutUrl}

登録がない場合、明日からは返信ができなくなります。
また使いたくなったら、いつでも戻ってきてくださいね。`;
}

export function getExpiredReminderMessage(checkoutUrl: string): string {
  return `うめこです。

おためし期間が終了したので、今はお返事ができない状態です。

また話したいなと思ったら、いつでもここから登録できます。

▼ 登録はこちら
${checkoutUrl}

待ってますね。`;
}

export function getExpiredReplyMessage(checkoutUrl: string): string {
  return `ごめんなさい、おためし期間が終了しているので今はお返事ができません。

引き続き使ってもらえる場合は、こちらから登録をお願いします。

▼ 登録はこちら（月額¥980）
${checkoutUrl}`;
}

export function getWelcomeMessage(): string {
  return `はじめまして、うめこです！

会話をやさしく整理するお手伝いをしています。

使い方はかんたん：
・グループに招待すれば、会話を見守ります
・1対1で話しかければ、相談相手になります
・「柔らかくして」「まとめて」と言えばOK

1ヶ月間は無料で使えます。
気軽に話しかけてみてくださいね。`;
}
