import {DetailedHTMLProps, InputHTMLAttributes} from "react";

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
        className={`
          appearance-none w-full py-3 px-5
          transition duration-200 focus:ring-1 focus:outline-none
          rounded-xl ring-1 placeholder-gray-700
          ${error ? "ring-primary focus:ring-primary" : "ring-gray-400 focus:ring-gray-600"}
          ${props.disabled ? "cursor-not-allowed" : ""}
          ${className ?? ""}
        `}
        {...inputProps}
      />

      {error && (
        <p className="text-sm text-primary leading-tight">{error}</p>
      )}
    </div>
  );
}

export default TextInput
