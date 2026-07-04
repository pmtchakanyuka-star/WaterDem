"use client";

import { forwardRef, useId } from "react";

type GlassInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  /** Inline helper text under the field (Nielsen #10). */
  hint?: string;
  /** Error message — replaces hint, tints the border. */
  error?: string;
  /** Success note (e.g. "handle is available"). */
  success?: string;
};

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  function GlassInput(
    { label, hint, error, success, className = "", id, ...rest },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const messageId = `${inputId}-msg`;
    const message = error ?? success ?? hint;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-leaf-2nd"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={message ? messageId : undefined}
          className={[
            "w-full rounded-xl px-4 py-2.5 text-leaf-100 placeholder:text-leaf-mut",
            "bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border transition-colors duration-150",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]",
            error
              ? "border-[rgba(248,113,113,0.5)]"
              : "border-glass-edge focus:border-[rgba(110,231,168,0.5)]",
            "outline-none focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2",
            className,
          ].join(" ")}
          {...rest}
        />
        {message && (
          <p
            id={messageId}
            role={error ? "alert" : undefined}
            className={[
              "text-xs",
              error
                ? "text-[#F8B4B4]"
                : success
                  ? "text-sage"
                  : "text-leaf-mut",
            ].join(" ")}
          >
            {message}
          </p>
        )}
      </div>
    );
  },
);

export default GlassInput;
