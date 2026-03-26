"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Settings {
  conflictThreshold: string;
  systemPrompt: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    conflictThreshold: "50",
    systemPrompt: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage("保存しました");
      } else {
        setMessage("保存に失敗しました");
      }
    } catch {
      setMessage("エラーが発生しました");
    }
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">設定</h1>
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">自動介入しきい値</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-2">
              Conflict score がこの値以上になったとき、自動的に仲介メッセージを送信します（0〜100）
            </p>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.conflictThreshold}
              onChange={(e) =>
                setSettings({ ...settings, conflictThreshold: e.target.value })
              }
              className="border rounded px-3 py-2 w-24"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">システムプロンプト（カスタム）</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-2">
              空の場合はデフォルトのシステムプロンプトが使用されます
            </p>
            <Textarea
              rows={10}
              value={settings.systemPrompt}
              onChange={(e) =>
                setSettings({ ...settings, systemPrompt: e.target.value })
              }
              placeholder="カスタムシステムプロンプトを入力..."
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
          {message && <span className="text-sm text-green-600">{message}</span>}
        </div>
      </div>
    </div>
  );
}
