import { NextResponse } from "next/server";
import {
  validateFormSchema,
  validateProfileFieldKeys,
} from "@/lib/forms/validate";

export { validateFormSchema, validateProfileFieldKeys };

export function validationError(message, details, status = 400) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status },
  );
}
