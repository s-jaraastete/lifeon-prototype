import { DetailedHTMLProps, TextareaHTMLAttributes } from "react";

export interface TextAreaProps extends DetailedHTMLProps<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
> {
  label?: string;
  className?: string;
}

const TextArea = (props: TextAreaProps) => {
  const { label, className, ...textareaProps } = props;

  return (
    <div className="flex flex-col gap-2.5">
      {label && (
        <label
          htmlFor={textareaProps.id}
          className="text-lg font-medium leading-6"
        >
          {label}
        </label>
      )}

      <textarea
        className={`
          appearance-none w-full py-3 px-5
          transition duration-200 focus:ring-1 focus:ring-primary focus:outline-none
          rounded-xl ring-1 ring-gray-400 placeholder-gray-700
          min-h-21 resize-none overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:my-1
          [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-500
          ${props.disabled ? "cursor-not-allowed" : ""}
          ${className ?? ""}
        `}
        {...textareaProps}
      />
    </div>
  );
};

export default TextArea;
