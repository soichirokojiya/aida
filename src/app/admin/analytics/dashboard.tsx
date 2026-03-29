"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MetricLineChart, MetricBarChart, type MetricRow } from "./chart";

export function AnalyticsDashboard({ data }: { data: MetricRow[] }) {
  if (data.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">日次アナリティクス</h1>
        <p className="text-gray-500">
          まだデータがありません。日次スナップショットは毎日自動で記録されます。
        </p>
      </div>
    );
  }

  const yen = (v: number) => `¥${v.toLocaleString()}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">日次アナリティクス</h1>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">全体</TabsTrigger>
          <TabsTrigger value="line">LINE</TabsTrigger>
          <TabsTrigger value="slack">Slack</TabsTrigger>
        </TabsList>

        {/* ===== 全体 ===== */}
        <TabsContent value="overview">
          <MetricLineChart
            title="MRR / APIコスト"
            data={data}
            lines={[
              { key: "mrr", color: "#2563eb", label: "MRR" },
              { key: "apiCost", color: "#ef4444", label: "APIコスト" },
            ]}
            yFormatter={yen}
          />
          <MetricBarChart
            title="新規登録数（合計）"
            data={data}
            bars={[
              { key: "lineNewUsers", color: "#06c755", label: "LINE" },
              { key: "slackNewUsers", color: "#4a154b", label: "Slack" },
            ]}
          />
          <MetricBarChart
            title="解約数（合計）"
            data={data}
            bars={[
              { key: "lineCanceledDm", color: "#ef4444", label: "LINE DM" },
              { key: "lineCanceledGroup", color: "#f97316", label: "LINEグループ" },
              { key: "slackCanceledDm", color: "#dc2626", label: "Slack DM" },
              { key: "slackCanceledChannel", color: "#ea580c", label: "Slackチャンネル" },
            ]}
          />
          <MetricLineChart
            title="DAU"
            data={data}
            lines={[
              { key: "lineDau", color: "#06c755", label: "LINE" },
              { key: "slackDau", color: "#4a154b", label: "Slack" },
            ]}
          />
          <MetricBarChart
            title="メッセージ / 介入"
            data={data}
            bars={[
              { key: "messages", color: "#3b82f6", label: "メッセージ" },
              { key: "interventions", color: "#f59e0b", label: "介入" },
            ]}
          />
        </TabsContent>

        {/* ===== LINE ===== */}
        <TabsContent value="line">
          <MetricLineChart
            title="LINE MRR"
            data={data}
            lines={[{ key: "lineMrr", color: "#06c755", label: "LINE MRR" }]}
            yFormatter={yen}
          />
          <MetricBarChart
            title="LINE 新規登録"
            data={data}
            bars={[{ key: "lineNewUsers", color: "#06c755", label: "新規ユーザー" }]}
          />
          <MetricBarChart
            title="LINE 解約 / ブロック"
            data={data}
            bars={[
              { key: "lineCanceledDm", color: "#ef4444", label: "DM解約" },
              { key: "lineCanceledGroup", color: "#f97316", label: "グループ解約" },
              { key: "lineUnfollows", color: "#6b7280", label: "ブロック" },
            ]}
          />
          <MetricLineChart
            title="LINE 有料契約"
            data={data}
            lines={[
              { key: "lineActiveDm", color: "#06c755", label: "DM契約" },
              { key: "lineActiveGroup", color: "#22c55e", label: "グループ契約" },
            ]}
          />
          <MetricLineChart
            title="LINE DAU / トライアル"
            data={data}
            lines={[
              { key: "lineDau", color: "#06c755", label: "DAU" },
              { key: "lineTrialUsers", color: "#86efac", label: "トライアル中" },
            ]}
          />
        </TabsContent>

        {/* ===== Slack ===== */}
        <TabsContent value="slack">
          <MetricLineChart
            title="Slack MRR"
            data={data}
            lines={[{ key: "slackMrr", color: "#4a154b", label: "Slack MRR" }]}
            yFormatter={yen}
          />
          <MetricBarChart
            title="Slack 新規登録"
            data={data}
            bars={[{ key: "slackNewUsers", color: "#4a154b", label: "新規ユーザー" }]}
          />
          <MetricBarChart
            title="Slack 解約"
            data={data}
            bars={[
              { key: "slackCanceledDm", color: "#dc2626", label: "DM解約" },
              { key: "slackCanceledChannel", color: "#ea580c", label: "チャンネル解約" },
            ]}
          />
          <MetricLineChart
            title="Slack 有料契約"
            data={data}
            lines={[
              { key: "slackActiveDm", color: "#4a154b", label: "DM契約" },
              { key: "slackActiveChannel", color: "#7c3aed", label: "チャンネル契約" },
            ]}
          />
          <MetricLineChart
            title="Slack DAU / トライアル / ワークスペース"
            data={data}
            lines={[
              { key: "slackDau", color: "#4a154b", label: "DAU" },
              { key: "slackTrialUsers", color: "#a78bfa", label: "トライアル中" },
              { key: "slackWorkspaces", color: "#c084fc", label: "ワークスペース数" },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
