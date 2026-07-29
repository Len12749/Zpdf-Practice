"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useFeedback } from "@/components/ui/feedback";
import { api } from "@/lib/client-api";
import {
  Lightning,
  SignOut,
  Trash,
  User as UserIcon,
  ArrowsClockwise,
} from "@phosphor-icons/react";

type AdminUser = {
  id: string;
  account: string;
  email: string;
  speedTickets: number;
  createdAt: string;
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [adminAccount, setAdminAccount] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketDraft, setTicketDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const me = await api<{ account: string }>("/api/admin/me");
    setAdminAccount(me.account);
    const data = await api<{ users: AdminUser[] }>("/api/admin/users");
    setUsers(data.users);
    setTicketDraft(
      Object.fromEntries(
        data.users.map((u) => [u.id, String(u.speedTickets)]),
      ),
    );
  }, []);

  useEffect(() => {
    void load()
      .catch(() => router.replace("/admin/login"))
      .finally(() => setLoading(false));
  }, [load, router]);

  const saveTickets = async (user: AdminUser) => {
    const raw = ticketDraft[user.id];
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      toast("请输入非负整数", "error");
      return;
    }
    setSavingId(user.id);
    try {
      const res = await api<{ speedTickets: number }>(
        `/api/admin/users/${user.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ speedTickets: n }),
        },
      );
      setUsers((list) =>
        list.map((u) =>
          u.id === user.id ? { ...u, speedTickets: res.speedTickets } : u,
        ),
      );
      setTicketDraft((d) => ({ ...d, [user.id]: String(res.speedTickets) }));
      toast(`已更新 ${user.account} 的加速券`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "更新失败", "error");
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (user: AdminUser) => {
    const first = await confirm({
      title: `注销用户「${user.account}」？`,
      description:
        "将永久删除该用户账号，以及其全部题库、题目、收藏、错题与签到数据，此操作不可恢复。",
      confirmLabel: "继续注销",
      cancelLabel: "取消",
      danger: true,
    });
    if (!first) return;

    const second = await confirm({
      title: "再次确认注销",
      description: `请再次确认：彻底删除用户「${user.account}」（${user.email}）及其所有数据。`,
      confirmLabel: "确认删除",
      cancelLabel: "我再想想",
      danger: true,
    });
    if (!second) return;

    setDeletingId(user.id);
    try {
      await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((list) => list.filter((u) => u.id !== user.id));
      toast(`已注销用户 ${user.account}`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "删除失败", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted">
        加载中…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">用户管理</h1>
          <p className="mt-2 text-sm text-muted">
            管理员 {adminAccount} · 共 {users.length} 名用户
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowsClockwise size={16} />}
            className="border border-border bg-surface shadow-none"
            onClick={() => {
              setLoading(true);
              void load()
                .then(() => toast("已刷新", "success"))
                .catch((e: Error) => toast(e.message, "error"))
                .finally(() => setLoading(false));
            }}
          >
            刷新
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<SignOut size={16} />}
            onClick={() => {
              void api("/api/admin/logout", { method: "POST" }).then(() => {
                toast("已退出管理后台", "success");
                router.replace("/admin/login");
              });
            }}
          >
            退出管理
          </Button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">用户</th>
                <th className="px-4 py-3 font-medium">联系邮箱</th>
                <th className="px-4 py-3 font-medium">注册时间</th>
                <th className="px-4 py-3 font-medium">加速券</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted"
                  >
                    暂无注册用户
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                          <UserIcon size={18} />
                        </span>
                        <div>
                          <p className="font-medium">{u.account}</p>
                          <p className="font-mono text-[11px] text-muted">
                            {u.id.slice(0, 8)}…
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted">{u.email || "—"}</td>
                    <td className="px-4 py-3.5 tabular-nums text-muted">
                      {formatTime(u.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Lightning
                          size={14}
                          weight="fill"
                          className="shrink-0 text-warning"
                        />
                        <input
                          type="number"
                          min={0}
                          max={9999}
                          step={1}
                          value={ticketDraft[u.id] ?? "0"}
                          onChange={(e) =>
                            setTicketDraft((d) => ({
                              ...d,
                              [u.id]: e.target.value,
                            }))
                          }
                          className="h-9 w-20 rounded-[var(--radius-sm)] border border-border bg-background px-2 text-sm tabular-nums focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="border border-border bg-surface shadow-none"
                          disabled={
                            savingId === u.id ||
                            ticketDraft[u.id] === String(u.speedTickets)
                          }
                          onClick={() => void saveTickets(u)}
                        >
                          {savingId === u.id ? "…" : "保存"}
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Trash size={14} />}
                        disabled={deletingId === u.id}
                        onClick={() => void deleteUser(u)}
                      >
                        {deletingId === u.id ? "删除中…" : "注销"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        注销将删除该用户的题库文件、题目、收藏、错题本与签到记录。管理账号独立于用户表，不会出现在列表中。
      </p>
    </div>
  );
}
