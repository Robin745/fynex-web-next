"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition disabled:opacity-75 cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Signing In...</span>
        </>
      ) : (
        <span>Sign In with Credentials</span>
      )}
    </button>
  );
}
