import React, { useEffect, useRef } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Button } from '@/components/brand/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  error?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  error,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Trap de foco e ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md" aria-modal="true" role="dialog">
      <div ref={modalRef}>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          {children}
          {error && (
            <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
            type="button"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            loading={isLoading}
            disabled={isLoading}
            variant="destructive"
            type="button"
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

export default ConfirmationModal; 