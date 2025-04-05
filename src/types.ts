import * as React from "react";

export interface ToastProps {
  variant?: 'default' | 'destructive';
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export type ToastActionElement = React.ReactElement<any, string | React.JSXElementConstructor<any>>; 