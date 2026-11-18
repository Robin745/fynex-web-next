"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export async function loginAction(prevState: { error?: string } | undefined, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return { error: "Invalid email or password." };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid email or password." };
  }

  await setSessionCookie(user.id);

  if (user.role === "SUPERADMIN") {
    redirect("/admin");
  } else if (user.memberships.length > 0) {
    redirect(`/portal/${user.memberships[0].tenant.slug}`);
  } else {
    redirect("/no-tenant");
  }
}

export async function demoLoginAction(role: "SUPERADMIN" | "CLIENT", tenantSlug?: string) {
  let email = "admin@business.com";

  if (role === "CLIENT") {
    if (tenantSlug === "rigan-travels" || tenantSlug === "vanguard-import" || tenantSlug === "vanguard-freight") {
      email = "rigan@rigantravels.com";
    } else if (tenantSlug === "rasel-atia" || tenantSlug === "horizon-media" || tenantSlug === "nexus-cloud") {
      email = "rasel@raselatia.com";
    } else {
      email = "robin@robintech.com";
    }
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Demo user not found");
  }

  await setSessionCookie(user.id);

  if (user.role === "SUPERADMIN") {
    redirect("/admin");
  } else {
    const slug = user.memberships[0]?.tenant.slug || "apex-retail";
    redirect(`/portal/${slug}`);
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
