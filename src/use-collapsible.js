import { useCallback, useLayoutEffect, useRef, useState } from 'react';

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
} = {}) {
  const [isOpen, setOpen] = useState(Boolean(open));
  const wasOpen = useRef(Boolean(open));
  const contentRef = useRef();
  const triggerRef = useRef();

  if (typeof duration === 'number') {
    duration = [duration, duration];
  }

  useLayoutEffect(() => {
    const { dataset, style } = contentRef.current;
    if (dataset.ready) {
      return toggleCollapsible(Boolean(open));
    }
    dataset.ready = true;
    if (open) {
      style.overflow = overflow;
      style.height = 'auto';
    } else {
      style.overflow = 'hidden';
      style.height = 0;
    }
  }, [immutable || open]);

  const handleTriggerClick = useCallback(
    event => {
      event.preventDefault();
      toggleCollapsible(!isOpen);
      onToggle?.(!isOpen, event);
    },
    [disabled, duration, easing, isOpen, onOpening, onClosing, onToggle]
  );

  const handleTransitionEnd = useCallback(
    event => {
      if (event.target !== contentRef.current) {
        return;
      }
      const { dataset, style } = contentRef.current;
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
    getTriggerProps(props) {
      return {
        ...props,
        ref: triggerRef,
        onClick: handleTriggerClick,
      };
    },
    getContentProps(props) {
      return {
        ...props,
        ref: contentRef,
        onTransitionEnd: handleTransitionEnd,
      };
    },
  };

  function toggleCollapsible(shouldOpen) {
    const { dataset } = contentRef.current;
    if (shouldOpen === isOpen || disabled || dataset.inTransition) {
      return;
    }
    if (shouldOpen) {
      openCollapsible(contentRef, duration, easing);
      wasOpen.current = true;
      setOpen(true);
      onOpening?.();
    } else {
      closeCollapsible(contentRef, duration, easing);
      setOpen(false);
      onClosing?.();
    }
  }
}

function openCollapsible(contentRef, duration, easing) {
  window.requestAnimationFrame(() => {
    if (contentRef.current?.scrollHeight) {
      setTransition(contentRef, duration[0], easing);
    }
  });
}

function closeCollapsible(contentRef, duration, easing) {
  if (contentRef.current?.scrollHeight) {
    const { style } = contentRef.current;
    setTransition(contentRef, duration[1], easing);
    window.requestAnimationFrame(() => {
      style.overflow = 'hidden';
      style.height = 0;
    });
  }
}

function setTransition(contentRef, duration, easing) {
  const { dataset, scrollHeight, style } = contentRef.current;
  style.transition = `height ${duration}ms ${easing}`;
  style.height = `${scrollHeight}px`;
  dataset.inTransition = '';
}
