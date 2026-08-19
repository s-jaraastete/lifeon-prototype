import { DetailedHTMLProps, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

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
        className={clsx(
          "input-base input-ring input-focus input-disabled",
          "min-h-21 resize-none overflow-y-auto",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:my-1",
          "[&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-gray-500",
          className,
        )}
        {...textareaProps}
      />
    </div>
  );
};

export default TextArea;
