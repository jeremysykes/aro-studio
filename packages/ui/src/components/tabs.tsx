import * as React from 'react';
import { Tab } from '@headlessui/react';
import { cn } from '../utils/cn';

type TabsContextValue = {
  registerValue: (value: string) => void;
  selectedValue?: string | null;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

type TabsElementWithDisplayName = React.ReactElement & {
  type: { displayName?: string };
};

const isElementWithDisplayName = (
  child: React.ReactNode,
  displayName: string
): child is TabsElementWithDisplayName =>
  React.isValidElement(child) && (child.type as { displayName?: string }).displayName === displayName;

type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

const Tabs = ({ value, defaultValue, onValueChange, children, className, ...props }: TabsProps) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string | null | undefined>(defaultValue);
  const [registeredValues, setRegisteredValues] = React.useState<string[]>([]);

  const currentValue =
    (isControlled ? value : internalValue) ?? (registeredValues.length ? registeredValues[0] : null);

  const selectedIndex = React.useMemo(() => {
    if (!registeredValues.length || currentValue === null) return 0;
    const idx = registeredValues.indexOf(currentValue);
    return idx >= 0 ? idx : 0;
  }, [registeredValues, currentValue]);

  const handleChange = (index: number) => {
    const nextValue = registeredValues[index];
    if (nextValue === undefined) return;
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  const registerValue = React.useCallback((next: string) => {
    setRegisteredValues((prev) => (prev.includes(next) ? prev : [...prev, next]));
  }, []);

  const context: TabsContextValue = React.useMemo(
    () => ({
      registerValue,
      selectedValue: currentValue,
    }),
    [registerValue, currentValue]
  );

  const childArray = React.Children.toArray(children);
  const listNodes = childArray.filter((child) => isElementWithDisplayName(child, 'TabsList'));
  const contentNodes = childArray.filter((child) => isElementWithDisplayName(child, 'TabsContent'));
  const otherNodes = childArray.filter(
    (child) =>
      !(
        isElementWithDisplayName(child, 'TabsList') || isElementWithDisplayName(child, 'TabsContent')
      )
  );

  return (
    <TabsContext.Provider value={context}>
      <Tab.Group selectedIndex={selectedIndex} onChange={handleChange}>
        <div className={cn('flex flex-col gap-0', className)} {...props}>
          {listNodes}
          {otherNodes}
          {contentNodes.length > 0 ? <Tab.Panels>{contentNodes}</Tab.Panels> : null}
        </div>
      </Tab.Group>
    </TabsContext.Provider>
  );
};

const TabsList = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <Tab.List
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

type TabsTriggerProps = React.ComponentPropsWithoutRef<'button'> & {
  value: string;
};

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, children, value, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);

    React.useEffect(() => {
      ctx?.registerValue(value);
    }, [ctx, value]);

    return (
      <Tab
        as={React.Fragment}
        key={value}
      >
        {({ selected, disabled }) => (
          <button
            ref={ref}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
              selected && 'bg-background text-foreground shadow-sm',
              !selected && 'text-muted-foreground',
              className
            )}
            data-state={selected ? 'active' : 'inactive'}
            disabled={disabled}
            {...props}
          >
            {children}
          </button>
        )}
      </Tab>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

type TabsContentProps = React.ComponentPropsWithoutRef<'div'> & {
  value: string;
};

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, children, value, ...props }, ref) => (
    <Tab.Panel
      ref={ref}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      key={value}
      {...props}
    >
      {children}
    </Tab.Panel>
  )
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
