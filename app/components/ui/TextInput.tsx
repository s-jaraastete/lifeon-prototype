import {DetailedHTMLProps, InputHTMLAttributes} from "react";

export interface TextInputProps extends DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> {
  label?: string;
  className?: string;
}

const TextInput = (props: TextInputProps) => {
  const { label, className, ...inputProps } = props;

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
          transition duration-200 focus:ring-1 focus:ring-primary focus:outline-none
          rounded-xl ring-1 ring-gray-400 placeholder-gray-700
          ${props.disabled ? "cursor-not-allowed" : ""}
          ${className ?? ""}
        `}
        {...inputProps}
      />
    </div>
  );
}

export default TextInput
