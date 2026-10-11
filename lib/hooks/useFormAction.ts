"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { ActionState } from "@/types";

const initial: ActionState = { ok: false };

/**
 * Runs a server action from a form without letting React clear the fields
 * afterwards. A plain `<form action={...}>` resets every input when the action
 * returns, which would wipe a long experience just because the title was too
 * short. Submitting through onSubmit keeps what was typed.
 */
export function useFormAction(action: (state: ActionState, formData: FormData) => Promise<ActionState>) {
  const [state, dispatch, pending] = useActionState(action, initial);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return { state, onSubmit, pending };
}
