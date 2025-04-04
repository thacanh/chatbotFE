import React, { useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

const SheetContext = createContext({});

const Sheet = ({ children, open, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(open || false);

  // Update internal state when props change
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (value) => {
    setIsOpen(value);
    onOpenChange?.(value);
  };

  return (
    <SheetContext.Provider value={{ isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
};

const SheetTrigger = ({ children, asChild, ...props }) => {
  const { onOpenChange } = useContext(SheetContext);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e) => {
        children.props.onClick?.(e);
        onOpenChange(true);
      },
    });
  }
  
  return (
    <button
      type="button"
      onClick={() => onOpenChange(true)}
      {...props}
    >
      {children}
    </button>
  );
};

const SheetContent = ({ children, side = "right", className, ...props }) => {
  const { isOpen, onOpenChange } = useContext(SheetContext);
  
  const sideVariants = {
    top: {
      initial: { y: "-100%" },
      animate: { y: 0 },
      exit: { y: "-100%" },
    },
    right: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
    },
    bottom: {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
    },
    left: {
      initial: { x: "-100%" },
      animate: { x: 0 },
      exit: { x: "-100%" },
    },
  };
  
  const positionClasses = {
    top: "inset-x-0 top-0 border-b",
    right: "inset-y-0 right-0 h-full border-l",
    bottom: "inset-x-0 bottom-0 border-t",
    left: "inset-y-0 left-0 h-full border-r",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className={cn(
              "fixed z-50 bg-background p-6 shadow-lg",
              positionClasses[side],
              className
            )}
            variants={sideVariants[side]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            {...props}
          >
            <div className="h-full">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SheetClose = ({ children, asChild, ...props }) => {
  const { onOpenChange } = useContext(SheetContext);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (e) => {
        children.props.onClick?.(e);
        onOpenChange(false);
      },
    });
  }
  
  return (
    <button
      type="button"
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children}
    </button>
  );
};

export { Sheet, SheetTrigger, SheetContent, SheetClose };