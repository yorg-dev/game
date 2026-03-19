import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

// ─── Shared style constants ────────────────────────────────────────────────────
// Import these in any game modal so button/input styles stay consistent.

export const gameBtn =
  'px-4 py-1.5 rounded-lg border-2 border-wood-700 bg-wood-500 shadow-[inset_0_2px_0_0_var(--color-wood-300),inset_0_-3px_0_0_var(--color-wood-900)] text-soil-800 text-sm font-bold hover:brightness-110 active:shadow-[inset_0_-1px_0_0_var(--color-wood-900),inset_0_1px_0_0_#c8a060] disabled:opacity-40 disabled:cursor-not-allowed transition-[filter]'

export const gameBtnGhost =
  'px-4 py-1.5 rounded-lg border-2 border-wood-600 bg-parchment-250 text-wood-900 text-sm font-bold hover:bg-parchment-400 transition-colors'

export const gameInput =
  'w-full px-3 py-2 rounded-lg bg-parchment-50 border-2 border-wood-600 text-soil-800 text-sm placeholder:text-parchment-500 focus:outline-none focus:border-wood-900 transition-colors'

// ─── Primitives re-exported unchanged ─────────────────────────────────────────

function GameDialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="game-dialog" {...props} />
}

function GameDialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="game-dialog-trigger" {...props} />
}

function GameDialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="game-dialog-portal" {...props} />
}

function GameDialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="game-dialog-close" {...props} />
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

function GameDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="game-dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────
// Includes the game-styled close button. Use className to override max-w / flex layout.

function GameDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <GameDialogPortal>
      <GameDialogOverlay />
      <DialogPrimitive.Content
        data-slot="game-dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-lg',
          'bg-parchment-150 border-4 border-wood-700 rounded-2xl shadow-[inset_0_0_0_3px_var(--color-parchment-50)] overflow-hidden',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'duration-200',
          className,
        )}
        onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          data-slot="game-dialog-close-btn"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-xl border-2 border-wood-700 bg-wood-500 shadow-[inset_0_2px_0_0_var(--color-wood-300),inset_0_-3px_0_0_var(--color-wood-900)] text-soil-800 hover:brightness-110 transition-[filter]"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M10 2L2 10M2 2l8 8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="square"
            />
          </svg>
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </GameDialogPortal>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
// Brown header strip with bottom border. Add pr-10 on inner content to avoid overlap
// with the absolute close button when the header has a full-width title layout.

function GameDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="game-dialog-header"
      className={cn(
        'px-5 pt-5 pb-3 border-b-4 border-wood-700 bg-parchment-250 shrink-0',
        className,
      )}
      {...props}
    />
  )
}

// ─── Title ────────────────────────────────────────────────────────────────────

function GameDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="game-dialog-title"
      className={cn('text-soil-800 font-bold text-base leading-tight', className)}
      {...props}
    />
  )
}

// ─── Description ──────────────────────────────────────────────────────────────

function GameDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="game-dialog-description"
      className={cn('text-xs text-wood-700 mt-0.5', className)}
      {...props}
    />
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
// Tan footer strip with top border. Buttons go here as children.

function GameDialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="game-dialog-footer"
      className={cn(
        'flex items-center justify-end gap-2 px-5 py-4 border-t-4 border-wood-700 bg-parchment-250 shrink-0',
        className,
      )}
      {...props}
    />
  )
}

export {
  GameDialog,
  GameDialogClose,
  GameDialogContent,
  GameDialogDescription,
  GameDialogFooter,
  GameDialogHeader,
  GameDialogOverlay,
  GameDialogPortal,
  GameDialogTitle,
  GameDialogTrigger,
}
