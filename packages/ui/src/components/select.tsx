import * as React from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

type SelectContextValue<T> = {
  value: T | null | undefined;
};

const SelectContext = React.createContext<SelectContextValue<unknown> | null>(null);

type SelectProps<T extends string | number | boolean = string> = {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  children: React.ReactNode;
  disabled?: boolean;
  name?: string;
};

function SelectComponent<T extends string | number | boolean = string>({
  value,
  defaultValue,
  onValueChange,
  children,
  disabled,
  name,
}: SelectProps<T>) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<T | undefined>(defaultValue);
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (next: T) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  return (
    <SelectContext.Provider value={{ value: currentValue }}>
      <Listbox
        value={currentValue ?? undefined}
        onChange={handleChange}
        disabled={disabled}
        name={name}
        as="div"
        className="relative"
      >
        {children}
      </Listbox>
    </SelectContext.Provider>
  );
}

const Select = SelectComponent as <T extends string | number | boolean = string>(
  props: SelectProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement | null;

const SelectGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-1 space-y-1', className)} role="group" {...props} />
);

const SelectValue = React.forwardRef<HTMLSpanElement, { placeholder?: string; className?: string }>(
  ({ placeholder, className, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    const renderedValue =
      context?.value ?? (placeholder !== undefined ? placeholder : '');
    const text =
      typeof renderedValue === 'string' || typeof renderedValue === 'number'
        ? renderedValue
        : String(renderedValue ?? '');
    return (
      <span ref={ref} className={cn('truncate', className)} {...props}>
        {text}
      </span>
    );
  }
);
SelectValue.displayName = 'SelectValue';

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  ({ className, children, ...props }, ref) => (
    <Listbox.Button
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className
      )}
      {...props}
    >
      <span className="flex-1 text-left">{children}</span>
      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
    </Listbox.Button>
  )
);
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = React.forwardRef<HTMLUListElement, React.ComponentPropsWithoutRef<'ul'>>(
  ({ className, children, ...props }, ref) => (
    <Transition
      as={React.Fragment}
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Listbox.Options
        as="ul"
        ref={ref}
        className={cn(
          'absolute left-0 right-0 z-50 mt-1 max-h-96 min-w-[8rem] overflow-auto rounded-md border border-border bg-background text-foreground shadow-lg focus:outline-none',
          className
        )}
        {...props}
      >
        {children}
      </Listbox.Options>
    </Transition>
  )
);
SelectContent.displayName = 'SelectContent';

const SelectLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('py-1.5 pl-3 pr-2 text-sm font-semibold text-muted-foreground', className)}
      {...props}
    />
  )
);
SelectLabel.displayName = 'SelectLabel';

type SelectItemProps = React.ComponentPropsWithoutRef<'li'> & {
  value: string;
};

const SelectItem = React.forwardRef<HTMLLIElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => (
    <Listbox.Option value={value} as={React.Fragment} {...props}>
      {({ active, selected, disabled }) => (
        <li
          ref={ref}
          className={cn(
            'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-sm outline-none',
            selected && 'bg-muted text-foreground',
            active && 'bg-muted text-foreground',
            disabled && 'pointer-events-none opacity-50',
            className
          )}
        >
          <span className="truncate">{children}</span>
        </li>
      )}
    </Listbox.Option>
  )
);
SelectItem.displayName = 'SelectItem';

const SelectSeparator = React.forwardRef<HTMLHRElement, React.ComponentPropsWithoutRef<'hr'>>(
  ({ className, ...props }, ref) => (
    <hr ref={ref} className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
  )
);
SelectSeparator.displayName = 'SelectSeparator';

const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
