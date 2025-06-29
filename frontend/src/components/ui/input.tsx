import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const [value, setValue] = React.useState(props.value ?? "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (props.value !== undefined) setValue(props.value as string);
  }, [props.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    props.onChange?.(e);
  };

  const handleClear = () => {
    setValue("");
    if (inputRef.current) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeInputValueSetter?.call(inputRef.current, "");
      inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    }
    props.onChange?.({
      ...({} as React.ChangeEvent<HTMLInputElement>),
      target: inputRef.current!,
    });
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type={type}
        data-slot="input"
        className={cn(
          "flex h-10 w-full rounded-base border-2 border-border bg-secondary-background selection:bg-main selection:text-main-foreground px-3 py-2 text-sm font-base text-foreground file:border-0 file:bg-transparent file:text-sm file:font-heading placeholder:text-foreground/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10",
          className
        )}
        value={value}
        onChange={handleChange}
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear input"
          onClick={handleClear}
          className="absolute hover:cursor-pointer right-2 top-1/2 -translate-y-1/2 p-1 text-foreground/50 hover:text-foreground focus:outline-none"
          tabIndex={-1}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export { Input };
