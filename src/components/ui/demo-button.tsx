'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Button (or anchor) that's aware of demo mode.  Shows a tooltip in
 * both states:
 *   - disabled-due-to-demo: "Disabled in demo mode" (or custom text)
 *   - enabled: short description of what the button does
 *
 * Pass `readOnly={true}` to flip into the demo-disabled visual + the
 * disabled-tooltip text.  Passing `href` makes it render as an `<a>`
 * (so we can use it for the OAuth-redirect "Reconnect" button); pass
 * `onClick` to render as a `<button>`.
 */
interface BaseProps {
  readOnly?: boolean;
  disabled?: boolean;
  tooltipEnabled: string;
  tooltipDisabled?: string;
  className?: string;
  children: React.ReactNode;
}

interface ButtonProps extends BaseProps {
  onClick?: () => void;
  href?: undefined;
  type?: 'button' | 'submit';
}

interface AnchorProps extends BaseProps {
  href?: string;
  onClick?: undefined;
}

export function DemoButton(props: ButtonProps | AnchorProps) {
  const isDemoDisabled = !!props.readOnly;
  const isOtherwiseDisabled = !!('disabled' in props && props.disabled);
  const blocked = isDemoDisabled || isOtherwiseDisabled;
  const tip =
    isDemoDisabled
      ? props.tooltipDisabled ?? 'Disabled in demo mode'
      : props.tooltipEnabled;

  const inner = props.href !== undefined ? (
    <a
      href={blocked ? undefined : props.href}
      onClick={(e) => {
        if (blocked) e.preventDefault();
      }}
      aria-disabled={blocked}
      role="button"
      tabIndex={blocked ? -1 : 0}
      className={`${props.className ?? ''} ${blocked ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
    >
      {props.children}
    </a>
  ) : (
    <button
      type={(props as ButtonProps).type ?? 'button'}
      onClick={blocked ? undefined : (props as ButtonProps).onClick}
      disabled={blocked}
      className={`${props.className ?? ''} ${blocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {props.children}
    </button>
  );

  // Wrap in a span so disabled buttons (which don't fire pointer events)
  // still trigger the tooltip on hover.
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{inner}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[260px]">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
