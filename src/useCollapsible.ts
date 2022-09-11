import {
  MutableRefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export function useCollapsible({
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
}: UseCollapsibleOptions = {}): UseCollapsibleOutput {
  const [isOpen, setOpen] = useState(Boolean(open));
  const wasOpen = useRef(Boolean(open));
  const contentRef = useRef<HTMLElement>();
  const triggerRef = useRef<HTMLElement>();

  const [openDuration, closeDuration] =
    typeof duration === 'number' ? [duration, duration] : duration;

  useLayoutEffect(() => {
    const { dataset, style } = safeRef(contentRef);
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

  const handleTriggerClick = useCallback(
    (event) => {
      event.preventDefault();
      toggleCollapsible(!isOpen);
      onToggle?.(!isOpen, event);
    },
    [disabled, duration, easing, isOpen, onOpening, onClosing, onToggle]
  );

  const handleTransitionEnd = useCallback(
    (event) => {
      if (event.target !== contentRef.current) {
        return;
      }
      const { dataset, style } = event.target;
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
    const { dataset } = safeRef(contentRef);
    if (shouldOpen === isOpen || disabled || dataset.inTransition) {
      return;
    }
    if (shouldOpen) {
      openCollapsible(contentRef, openDuration, easing);
      wasOpen.current = true;
      setOpen(true);
      onOpening?.();
    } else {
      closeCollapsible(contentRef, closeDuration, easing);
      setOpen(false);
      onClosing?.();
    }
  }
}

function safeRef(ref: MutableRefObject<HTMLElement | undefined>): HTMLElement {
  if (typeof ref.current === 'undefined') {
    throw Error('useCollapsible: contentRef cannot be undefined');
  }
  return ref.current;
}

function openCollapsible(
  contentRef: MutableRefObject<HTMLElement | undefined>,
  duration: number,
  easing: string
) {
  window.requestAnimationFrame(() => {
    if (contentRef.current?.scrollHeight) {
      setTransition(contentRef, duration, easing);
    }
  });
}

function closeCollapsible(
  contentRef: MutableRefObject<HTMLElement | undefined>,
  duration: number,
  easing: string
) {
  if (contentRef.current?.scrollHeight) {
    const { style } = safeRef(contentRef);
    setTransition(contentRef, duration, easing);
    window.requestAnimationFrame(() => {
      style.overflow = 'hidden';
      style.height = '0';
    });
  }
}

function setTransition(
  contentRef: MutableRefObject<HTMLElement | undefined>,
  duration: number,
  easing: string
) {
  const { dataset, scrollHeight, style } = safeRef(contentRef);
  style.transition = `height ${duration}ms ${easing}`;
  style.height = `${scrollHeight}px`;
  dataset.inTransition = '';
}

export interface UseCollapsibleOptions {
  open?: boolean | null;
  disabled?: boolean | null;
  duration?: number | [number, number];
  easing?: string;
  overflow?: string;
  immutable?: boolean | null;
  onOpen?(event: Event): void;
  onOpening?(): void;
  onClose?(event: Event): void;
  onClosing?(): void;
  onToggle?(wouldOpen: boolean, event: Event): void;
}

export interface TriggerProps {
  ref: MutableRefObject<HTMLElement | undefined>;
  onClick(event: Event): void;
}

export interface ContentProps {
  ref: MutableRefObject<HTMLElement | undefined>;
  onTransitionEnd(event: Event): void;
}

export interface UseCollapsibleOutput {
  isOpen: boolean;
  shouldRender: boolean;
  getTriggerProps(): TriggerProps;
  getContentProps(): ContentProps;
}
