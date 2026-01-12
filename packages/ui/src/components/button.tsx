import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export type ButtonProps<T extends React.ElementType = 'button'> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T> &
  VariantProps<typeof buttonVariants>;

type PolymorphicButton = <T extends React.ElementType = 'button'>(
  props: ButtonProps<T> & { ref?: React.Ref<Element> }
) => React.ReactElement | null;

const ButtonComponent = React.forwardRef(
  <T extends React.ElementType = 'button'>(
    { className, variant, size, as, ...props }: ButtonProps<T>,
    ref: React.Ref<Element>
  ) => {
    const Comp = as || 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...(props as React.ComponentPropsWithoutRef<T>)}
      />
    );
  }
);
ButtonComponent.displayName = 'Button';

const Button = ButtonComponent as PolymorphicButton & { displayName?: string };

export { Button, buttonVariants };

