import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div 
        className={`bg-white rounded-lg shadow-lg p-6 relative ${className}`}
        onClick={(e) => e.stopPropagation()} // Evita que o clique dentro do modal o feche
      >
        <button 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl" 
          onClick={onClose}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

// Subcomponentes para estrutura
export const ModalHeader: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-xl font-bold mb-4 ${className}`}>{children}</h2>
);

export const ModalBody: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

export const ModalFooter: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`flex justify-end gap-4 ${className}`}>{children}</div>
);

export default Modal; 