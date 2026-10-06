"use client";

import React, { createContext, useContext } from "react";
import { SessionUser } from "@/lib/auth";

interface AuthContextType {
  user: SessionUser | null;
  role: "SUPERUSER" | "ADMIN" | "FRONTDESK";
  isSuperUser: boolean;
  isAdmin: boolean;
  isFrontDesk: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "FRONTDESK",
  isSuperUser: false,
  isAdmin: false,
  isFrontDesk: true,
  canEdit: false,
  canDelete: false,
});

export function AuthProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser | null;
}) {
  const role = user?.role || "FRONTDESK";
  const isSuperUser = role === "SUPERUSER";
  const isAdmin = role === "ADMIN";
  const isFrontDesk = role === "FRONTDESK";

  // FrontDesk can only ADD data, cannot EDIT or DELETE data
  const canEdit = isSuperUser || isAdmin;
  const canDelete = isSuperUser || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isSuperUser,
        isAdmin,
        isFrontDesk,
        canEdit,
        canDelete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
