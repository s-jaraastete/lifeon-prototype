import {DetailedHTMLProps, InputHTMLAttributes} from "react";
import clsx from "clsx";

export interface TextInputProps extends DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> {
  label?: string;
  className?: string;
  error?: string;
}

const TextInput = (props: TextInputProps) => {
  const { label, className, error, ...inputProps } = props;

  return (
    <div className="flex flex-col gap-2.5">
      {label && (
        <label
          htmlFor={inputProps.id}
          className="text-lg font-medium leading-6"
        >
          {label}
        </label>
      )}

      <input
        className={clsx(
          "input-base input-ring input-focus input-disabled",
          error && "input-error",
          className,
        )}
        aria-invalid={!!error || undefined}
        {...inputProps}
      />

      {error && (
        <p className="text-sm text-primary leading-tight">{error}</p>
      )}
    </div>
  );
}

export default TextInput
