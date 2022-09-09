import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useCollapsible } from './use-collapsible';

function Collapsible({
  open,
  easing,
  onOpen,
  onClose,
  onOpening,
  onClosing,
  transitionTime,
  transitionCloseTime,
  containerElementProps,
  triggerElementProps,
  contentElementId,
  className,
  classParentString,
  openedClassName,
  triggerStyle,
  triggerClassName,
  triggerOpenedClassName,
  contentOuterClassName,
  contentInnerClassName,
  accordionPosition,
  handleTriggerClick,
  onTriggerOpening,
  onTriggerClosing,
  trigger,
  triggerWhenOpen,
  triggerDisabled,
  lazyRender,
  overflowWhenOpen,
  contentHiddenWhenClosed,
  triggerSibling,
  tabIndex,
  triggerTagName,
  contentContainerTagName,
  children,
}) {
  const Trigger = triggerTagName;
  const Container = contentContainerTagName;

  const [inTransition, setInTransition] = useState(false);

  const { contentId, triggerId } = useMemo(
    () => ({
      contentId: contentElementId || `collapsible-content-${Date.now()}`,
      triggerId: triggerElementProps.id || `collapsible-trigger-${Date.now()}`,
    }),
    []
  );

  const { getContentProps, getTriggerProps, shouldRender, isOpen } =
    useCollapsible({
      open,
      easing,
      overflow: overflowWhenOpen,
      duration: [transitionTime, transitionCloseTime ?? transitionTime],
      onOpen: useCallback(
        (event) => {
          setInTransition(false);
          onOpen?.(event);
        },
        [onOpen]
      ),
      onClose: useCallback(
        (event) => {
          setInTransition(false);
          onClose?.(event);
        },
        [onClose]
      ),
      onOpening: useCallback(() => {
        setInTransition(true);
        onOpening?.();
        onTriggerOpening?.();
      }, [onOpening, onTriggerOpening]),
      onClosing: useCallback(() => {
        setInTransition(true);
        onClosing?.();
        onTriggerClosing?.();
      }, [onClosing, onTriggerClosing]),
    });

  const contentProps = getContentProps();
  const triggerProps = getTriggerProps();

  if (handleTriggerClick) {
    triggerProps.onClick = (event) => {
      event.preventDefault();
      if (!triggerDisabled && !inTransition) {
        handleTriggerClick(accordionPosition);
      }
    };
  }

  return (
    <Container
      className={classNames(
        classParentString,
        isOpen ? openedClassName : className
      )}
      {...containerElementProps}
    >
      <Trigger
        id={triggerId}
        className={classNames(
          `${classParentString}__trigger`,
          isOpen ? 'is-open' : 'is-closed',
          triggerDisabled && 'is-disabled',
          isOpen ? triggerOpenedClassName : triggerClassName
        )}
        {...triggerProps}
        style={triggerStyle}
        onKeyPress={(event) => {
          const { key } = event;
          if (
            (key === ' ' && triggerTagName.toLowerCase() !== 'button') ||
            key === 'Enter'
          ) {
            triggerProps.onClick(event);
          }
        }}
        tabIndex={tabIndex}
        aria-expanded={isOpen}
        aria-disabled={triggerDisabled}
        aria-controls={contentId}
        role="button" // Since our default TriggerElement is not a button
        {...triggerElementProps}
      >
        {isOpen && typeof triggerWhenOpen !== 'undefined'
          ? triggerWhenOpen
          : trigger}
      </Trigger>

      {renderTriggerSibling(triggerSibling, classParentString)}

      <div
        id={contentId}
        className={classNames(
          `${classParentString}__contentOuter`,
          contentOuterClassName
        )}
        {...contentProps}
        hidden={contentHiddenWhenClosed && !isOpen && !inTransition}
        role="region"
        aria-labelledby={triggerId}
      >
        <div
          className={classNames(
            `${classParentString}__contentInner`,
            contentInnerClassName
          )}
        >
          {(!lazyRender || shouldRender) && children}
        </div>
      </div>
    </Container>
  );
}

Collapsible.propTypes = {
  transitionTime: PropTypes.number,
  transitionCloseTime: PropTypes.number,
  triggerTagName: PropTypes.string,
  easing: PropTypes.string,
  open: PropTypes.bool,
  containerElementProps: PropTypes.object,
  triggerElementProps: PropTypes.object,
  contentElementId: PropTypes.string,
  classParentString: PropTypes.string,
  className: PropTypes.string,
  openedClassName: PropTypes.string,
  triggerStyle: PropTypes.object,
  triggerClassName: PropTypes.string,
  triggerOpenedClassName: PropTypes.string,
  contentOuterClassName: PropTypes.string,
  contentInnerClassName: PropTypes.string,
  accordionPosition: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  handleTriggerClick: PropTypes.func,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  onOpening: PropTypes.func,
  onClosing: PropTypes.func,
  onTriggerOpening: PropTypes.func,
  onTriggerClosing: PropTypes.func,
  trigger: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  triggerWhenOpen: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  triggerDisabled: PropTypes.bool,
  lazyRender: PropTypes.bool,
  overflowWhenOpen: PropTypes.oneOf([
    'hidden',
    'visible',
    'auto',
    'scroll',
    'inherit',
    'initial',
    'unset',
  ]),
  contentHiddenWhenClosed: PropTypes.bool,
  triggerSibling: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.func,
  ]),
  tabIndex: PropTypes.number,
  contentContainerTagName: PropTypes.string,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};

Collapsible.defaultProps = {
  transitionTime: 400,
  transitionCloseTime: null,
  triggerTagName: 'span',
  easing: 'linear',
  open: false,
  classParentString: 'Collapsible',
  triggerDisabled: false,
  lazyRender: false,
  overflowWhenOpen: 'hidden',
  contentHiddenWhenClosed: false,
  openedClassName: '',
  triggerStyle: null,
  triggerClassName: '',
  triggerOpenedClassName: '',
  contentOuterClassName: '',
  contentInnerClassName: '',
  className: '',
  triggerSibling: null,
  onOpen: () => {},
  onClose: () => {},
  onOpening: () => {},
  onClosing: () => {},
  onTriggerOpening: () => {},
  onTriggerClosing: () => {},
  tabIndex: null,
  contentContainerTagName: 'div',
  triggerElementProps: {},
};

export default Collapsible;

function classNames(...classNames) {
  return classNames.filter(Boolean).join(' ');
}

function renderTriggerSibling(triggerSibling, classParentString) {
  switch (typeof triggerSibling) {
    case 'string':
      return (
        <span className={`${classParentString}__trigger-sibling`}>
          {triggerSibling}
        </span>
      );
    case 'function':
      return triggerSibling();
    case 'object':
      return triggerSibling;
    default:
      return null;
  }
}
