import {
  ReactEventHandler,
  RefObject,
  SyntheticEvent,
  TransitionEventHandler,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export function useCollapsible<T extends HTMLElement>({
  open,
  disabled,
  duration = 400,
  easing = 'cubic-bezier(0.45, 0, 0.55, 1)', // ease-in-out-quad
  overflow = 'hidden',
  immutable,
  onOpen,
  onOpening,
  onClose,
  onClosing,
  onToggle,
}: UseCollapsibleOptions<T> = {}): UseCollapsibleOutput<T> {
  const [isOpen, setOpen] = useState(Boolean(open));
  const wasOpen = useRef(Boolean(open));
  const triggerRef = useRef<T | null>(null);
  const contentRef = useRef<T | null>(null);

  const [openDuration, closeDuration] =
    typeof duration === 'number' ? [duration, duration] : duration;

  useLayoutEffect(() => {
    const { dataset, style } = safeRef<T>(contentRef);
    if (dataset.ready) {
      return toggleCollapsible(Boolean(open));
    }
    dataset.ready = 'true';
    if (open) {
      style.overflow = overflow;
      style.height = 'auto';
    } else {
      style.overflow = 'hidden';
      style.height = '0';
    }
  }, [immutable || open]);

  const handleTriggerClick: ReactEventHandler<T> = useCallback(
    (event) => {
      event.preventDefault();
      toggleCollapsible(!isOpen);
      onToggle?.(!isOpen, event);
    },
    [disabled, duration, easing, isOpen, onOpening, onClosing, onToggle]
  );

  const handleTransitionEnd: TransitionEventHandler<T> = useCallback(
    (event) => {
      if (event.target !== contentRef.current) {
        return;
      }
      const { dataset, style } = safeRef(contentRef);
      delete dataset.inTransition;
      if (isOpen) {
        style.overflow = overflow;
        style.height = 'auto';
        onOpen?.(event);
      } else {
        onClose?.(event);
      }
    },
    [isOpen, onOpen, onClose]
  );

  return {
    isOpen,
    shouldRender: isOpen || wasOpen.current,
    getTriggerProps() {
      return {
        ref: triggerRef,
        onClick: handleTriggerClick,
      };
    },
    getContentProps() {
      return {
        ref: contentRef,
        onTransitionEnd: handleTransitionEnd,
      };
    },
  };

  function toggleCollapsible(shouldOpen: boolean) {
    const { dataset } = safeRef<T>(contentRef);
    if (shouldOpen === isOpen || disabled || dataset.inTransition) {
      return;
    }
    if (shouldOpen) {
      openCollapsible<T>(contentRef, openDuration, easing);
      wasOpen.current = true;
      setOpen(true);
      onOpening?.();
    } else {
      closeCollapsible<T>(contentRef, closeDuration, easing);
      setOpen(false);
      onClosing?.();
    }
  }
}

function safeRef<T>(ref: RefObject<T>): T {
  if (ref.current === null) {
    throw Error('useCollapsible: contentRef cannot be undefined');
  }
  return ref.current;
}

function openCollapsible<T extends HTMLElement>(
  contentRef: RefObject<T>,
  duration: number,
  easing: string
) {
  window.requestAnimationFrame(() => {
    if (contentRef.current?.scrollHeight) {
      setTransition<T>(contentRef, duration, easing);
    }
  });
}

function closeCollapsible<T extends HTMLElement>(
  contentRef: RefObject<T>,
  duration: number,
  easing: string
) {
  if (contentRef.current?.scrollHeight) {
    const { style } = safeRef<T>(contentRef);
    setTransition<T>(contentRef, duration, easing);
    window.requestAnimationFrame(() => {
      style.overflow = 'hidden';
      style.height = '0';
    });
  }
}

function setTransition<T extends HTMLElement>(
  contentRef: RefObject<T>,
  duration: number,
  easing: string
) {
  const { dataset, scrollHeight, style } = safeRef<T>(contentRef);
  style.transition = `height ${duration}ms ${easing}`;
  style.height = `${scrollHeight}px`;
  dataset.inTransition = '';
}

export interface UseCollapsibleOptions<T> {
  open?: boolean | null;
  disabled?: boolean | null;
  duration?: number | [number, number];
  easing?: string;
  overflow?: string;
  immutable?: boolean | null;
  onOpen?: TransitionEventHandler<T>;
  onClose?: TransitionEventHandler<T>;
  onOpening?(): void;
  onClosing?(): void;
  onToggle?(wouldOpen: boolean, event: SyntheticEvent): void;
}

export interface TriggerProps<T> {
  ref: RefObject<T>;
  onClick: ReactEventHandler<T>;
}

export interface ContentProps<T> {
  ref: RefObject<T>;
  onTransitionEnd: TransitionEventHandler<T>;
}

export interface UseCollapsibleOutput<T> {
  isOpen: boolean;
  shouldRender: boolean;
  getTriggerProps(): TriggerProps<T>;
  getContentProps(): ContentProps<T>;
}
