export function getDueReminderMessage(dmCheckoutUrl: string): string {
  return `うめこです。

無料おためし期間が今日で終わりになります。

引き続き使ってもらえる場合は、プランを選んで登録をお願いします。

▼ DMプラン（月額¥490）
1対1でうめこと話せます
${dmCheckoutUrl}

グループで使いたい場合は、グループ内で「うめこ」と呼びかけてもらえれば、そこから登録できます。

また使いたくなったら、いつでも戻ってきてくださいね。`;
}

export function getDmExpiredMessage(dmCheckoutUrl: string): string {
  return `おためし期間が終了しているので、1対1ではお返事ができない状態です。

▼ DMプラン（月額¥490）
${dmCheckoutUrl}

グループでの利用は、グループごとに別途登録できます。`;
}

export function getGroupExpiredMessage(groupCheckoutUrl: string): string {
  return `このグループではまだうめこが有効になってないよ。

使うには、このグループ用の利用権が必要です。

▼ グループ利用権（月額¥980）
${groupCheckoutUrl}

誰か1人が登録すれば、グループ全員が使えるようになります。`;
}

export function getWelcomeMessage(): string {
  return `はじめまして、うめこです！

会話をやさしく整理するお手伝いをしています。

使い方はかんたん：
・グループに招待すれば、会話を見守ります
・1対1で話しかければ、相談相手になります
・「柔らかくして」「まとめて」と言えばOK

最初の1ヶ月は無料で使えます。
気軽に話しかけてみてくださいね。`;
}
