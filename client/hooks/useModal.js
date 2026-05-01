import { useState, useCallback } from "react";

export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [modalData, setModalData] = useState(null);

  const open = useCallback((data = null) => {
    setModalData(data);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setModalData(null), 300); // clear data after animation
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    modalData,
    setModalData,
  };
}
