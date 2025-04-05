declare module 'bun' {
  export function serve(options: {
    routes: Record<string, any>;
    development?: boolean;
    fetch?: (req: Request) => Promise<Response> | Response;
  }): { url: string };
}

declare module '*.html' {
  const content: string;
  export default content;
}

// Add React JSX namespace for intrinsic elements
declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

// UI Component declarations - using non-relative paths
declare module '@components/ui/table' {
  import * as React from 'react';
  export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>>;
  export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>>;
  export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>>;
  export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>>;
  export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>>;
  export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>>;
}

declare module '@components/ui/button' {
  import * as React from 'react';
  export const Button: React.ForwardRefExoticComponent<any>;
}

declare module '@components/ui/input' {
  import * as React from 'react';
  export const Input: React.ForwardRefExoticComponent<any>;
}

declare module '@components/ui/textarea' {
  import * as React from 'react';
  export const Textarea: React.ForwardRefExoticComponent<any>;
}

declare module '@components/ui/label' {
  import * as React from 'react';
  export const Label: React.ForwardRefExoticComponent<any>;
}

declare module '@components/ui/card' {
  import * as React from 'react';
  export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
  export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>>;
}

declare module '@components/ui/badge' {
  import * as React from 'react';
  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline";
  }
  export const Badge: React.ForwardRefExoticComponent<BadgeProps>;
}

declare module '@components/ui/dropdown-menu' {
  import * as React from 'react';
  export const DropdownMenu: React.FC<any>;
  export const DropdownMenuTrigger: React.FC<any>;
  export const DropdownMenuContent: React.FC<any>;
  export const DropdownMenuItem: React.FC<any>;
}

declare module '@components/ui/toast' {
  import * as React from 'react';
  export interface ToastProps {
    variant?: 'default' | 'destructive';
    title?: string;
    description?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
  export type ToastActionElement = React.ReactElement<any, string | React.JSXElementConstructor<any>>;
}

declare module 'irc-framework' {
  namespace IRC {
    class Client {
      constructor(options: any);
      options: any;
      user: { nick: string };
      connected: boolean;
      connect(): void;
      on(event: string, callback: (...args: any[]) => void): void;
      match(pattern: RegExp, callback: (params: any) => void): void;
      channel(name: string): {
        join(): void;
        say(message: string): void;
      };
    }
  }
  export default IRC;
} 