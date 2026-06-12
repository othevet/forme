"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, UserCog } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  login_message: string | null;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          router.push("/dashboard");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.users) setUsers(data.users);
      })
      .catch(() => toast.error("Erreur chargement admin"))
      .finally(() => setLoading(false));
  }, [router]);

  async function updateUser(id: string, field: string, value: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    if (!res.ok) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
    toast.success("Utilisateur mis à jour");
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <p className="text-sm text-zinc-500">Chargement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-6 w-6 text-orange-500" />
          <h1 className="text-xl font-semibold">Administration</h1>
        </div>

        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="glass-card rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {u.display_name ?? "Sans nom"}
                    </p>
                    {u.role === "admin" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        <UserCog className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Créé le {new Date(u.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => updateUser(u.id, "role", e.target.value)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs font-medium text-zinc-500">
                  Message de connexion
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    defaultValue={u.login_message ?? ""}
                    placeholder="Aucun message..."
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    onFocus={() => setEditingId(u.id)}
                    onBlur={(e) => {
                      if (editingId === u.id) {
                        updateUser(u.id, "login_message", e.target.value);
                        setEditingId(null);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <p className="text-sm text-zinc-500">Aucun utilisateur.</p>
          )}
        </div>
      </div>
    </main>
  );
}
