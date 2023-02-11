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

export function useCollapsible<
  ContentType extends HTMLElement,
  TriggerType extends HTMLElement
>({
  open,
  disabled,
  duration = 400,
  easing = 'cubic-bezier(0.45, 0, 0.55, 1)', // ease-in-out-quad
  overflow = 'hidden',
  controlled,
  onOpen,
  onOpening,
  onClose,
  onClosing,
  onToggle,
}: UseCollapsibleOptions = {}): UseCollapsibleOutput<ContentType, TriggerType> {
  const [isOpen, setOpen] = useState(Boolean(open));
  const wasOpen = useRef(Boolean(open));
  const triggerRef = useRef<TriggerType | null>(null);
  const contentRef = useRef<ContentType | null>(null);

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
  }, [controlled || open]);

  const handleTriggerClick: ReactEventHandler<HTMLElement> = useCallback(
    (event) => {
      event.preventDefault();
      toggleCollapsible(!isOpen);
      onToggle?.(!isOpen, event);
    },
    [disabled, duration, easing, isOpen, onOpening, onClosing, onToggle]
  );

  const handleTransitionEnd: TransitionEventHandler<HTMLElement> = useCallback(
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

function safeRef(ref: RefObject<HTMLElement>): HTMLElement {
  if (ref.current === null) {
    throw Error('useCollapsible: contentRef cannot be undefined');
  }
  return ref.current;
}

function openCollapsible(
  contentRef: RefObject<HTMLElement>,
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
  contentRef: RefObject<HTMLElement>,
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
  contentRef: RefObject<HTMLElement>,
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
  controlled?: boolean | null;
  onOpen?: TransitionEventHandler<HTMLElement>;
  onClose?: TransitionEventHandler<HTMLElement>;
  onOpening?(): void;
  onClosing?(): void;
  onToggle?(wouldOpen: boolean, event: SyntheticEvent): void;
}

export interface TriggerProps<T extends HTMLElement> {
  ref: RefObject<T>;
  onClick: ReactEventHandler<T>;
}

export interface ContentProps<T extends HTMLElement> {
  ref: RefObject<T>;
  onTransitionEnd: TransitionEventHandler<T>;
}

export interface UseCollapsibleOutput<
  ContentType extends HTMLElement,
  TriggerType extends HTMLElement
> {
  isOpen: boolean;
  shouldRender: boolean;
  getTriggerProps(): TriggerProps<TriggerType>;
  getContentProps(): ContentProps<ContentType>;
}
