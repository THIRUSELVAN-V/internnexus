"use client";

import React, { useEffect, useState } from "react";
import DataTable, { Column } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { collection, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import type { UserRole } from "@/lib/types";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export default function AdminUsersPage() {
  const db = getFirebaseDb();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Load real users
  // ---------------------------------------------------------

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const snapshot = await getDocs(collection(db, "users"));

        const rows: UserRow[] = snapshot.docs.map((userDoc) => {
          const data = userDoc.data();

          let createdAt = "";

          if (data.createdAt?.toDate) {
            createdAt = data.createdAt.toDate().toLocaleDateString();
          } else if (typeof data.createdAt === "string") {
            createdAt = data.createdAt;
          }

          return {
            id: userDoc.id,

            name:
              data.name || data.displayName || data.fullName || "Unnamed User",

            email: data.email || "",

            role: data.role as UserRole,

            createdAt,
          };
        });

        setUsers(rows);
      } catch (err) {
        console.error("Failed to load users:", err);

        setError(err instanceof Error ? err.message : "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // ---------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      header: "User Name",

      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>

          <p className="text-xs text-slate-500">{item.email}</p>
        </div>
      ),
    },

    {
      key: "role",
      header: "Platform Role",

      render: (item) => {
        const variants: Record<
          UserRole,
          "default" | "purple" | "success" | "destructive"
        > = {
          student: "default",
          hr: "purple",
          mentor: "success",
          admin: "destructive",
        };

        return (
          <Badge
            variant={variants[item.role]}
            className="capitalize text-xs font-semibold"
          >
            {item.role}
          </Badge>
        );
      },
    },

    {
      key: "createdAt",
      header: "Joined Date",

      render: (item) => (
        <span className="text-xs font-mono text-slate-600">
          {item.createdAt || "-"}
        </span>
      ),
    },
  ];

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">User Management</h1>

        <p className="text-xs text-slate-500">
          View Students, HR Managers, Industrial Mentors, and Administrators
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No users found.
            </div>
          ) : (
            <DataTable
              data={users}
              columns={columns}
              searchKey="name"
              searchPlaceholder="Search users by name..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
