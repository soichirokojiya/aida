// ── Unified plan messages (new) ──

export function getDueReminderMessage(checkoutUrl: string): string {
  return `うめこです。

おためし期間が今日で終わりだよ。
使ってくれてありがとう。

引き続き話したいなと思ってもらえたら、ここから登録してもらえるとうれしいです。

▼ うめこプラン（月額980円）
${checkoutUrl}

1対1の相談も、グループの見守りも、これ1つで使えるよ。

またいつでも気軽に話しかけてね。`;
}

export function getDmExpiredMessage(checkoutUrl: string): string {
  return `ごめんね、おためし期間が終わっちゃって、今はお返事できないんだ。

また話したいなって思ったら、ここから登録してもらえるとうれしいです。

▼ うめこプラン（月額980円）
${checkoutUrl}

1対1の相談も、グループの見守りも、これ1つで使えるよ。`;
}

export function getGroupExpiredMessage(checkoutUrl: string): string {
  return `このグループではまだうめこが使えない状態なんだ。

誰か1人が登録してくれれば、グループのみんなが使えるようになるよ。

▼ うめこプラン（月額980円）
${checkoutUrl}`;
}

export function getSlackDmExpiredMessage(checkoutUrl: string): string {
  return `おためし期間が終わっちゃって、今はお返事できないんだ。

また話したいなって思ったら、ここから登録してもらえるとうれしいです。

▼ うめこ for Slack（月額980円）
${checkoutUrl}

1対1の相談も、チャンネルの見守りも、これ1つで使えるよ。`;
}

export function getSlackChannelExpiredMessage(checkoutUrl: string): string {
  return `このチャンネルではまだうめこが使えない状態なんだ。

誰か1人が登録してくれれば、チャンネルのみんなが使えるようになるよ。

▼ うめこ for Slack（月額980円）
${checkoutUrl}`;
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
