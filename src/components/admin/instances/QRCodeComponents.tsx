import React from 'react';
import { Modal, ModalHeader, ModalBody } from '@/components/ui';
import Image from 'next/image';

interface RenderQrCodeProps {
  qrCode: string;
}

export const RenderQrCode: React.FC<RenderQrCodeProps> = ({ qrCode }) => {
  // Verificar se o QR code é uma string válida
  if (!qrCode || typeof qrCode !== 'string') {
    return (
      <div className="w-56 h-56 border rounded flex items-center justify-center bg-gray-100">
        <p className="text-red-500 text-sm">Erro: QR Code inválido</p>
      </div>
    );
  }
  
  // Verificar se é um base64 válido
  if (!qrCode.startsWith('data:image/') && !qrCode.startsWith('http')) {
    // Tentar adicionar o prefixo data:image/png;base64, se não estiver presente
    const qrCodeWithPrefix = qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`;
    
    return (
      <Image 
        src={qrCodeWithPrefix} 
        alt="QR Code" 
        className="w-56 h-56 border rounded"
        width={224}
        height={224}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }
  
  return (
    <Image 
      src={qrCode} 
      alt="QR Code" 
      className="w-56 h-56 border rounded"
      width={224}
      height={224}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        e.currentTarget.nextElementSibling?.classList.remove('hidden');
      }}
    />
  );
};

interface RenderPairedProps {
  pairingCode: string;
}

export const RenderPaired: React.FC<RenderPairedProps> = ({ pairingCode }) => {
  if (!pairingCode || typeof pairingCode !== 'string') {
    return null;
  }
  
  return (
    <div className="text-center mt-2">
      <p className="text-lg font-semibold">Código de Pareamento:</p>
      <p 
        className="text-2xl font-bold tracking-widest bg-gray-100 p-2 rounded mt-1"
      >
        {pairingCode}
      </p>
    </div>
  );
};

interface ConnectionModalProps {
  qr: string | null;
  code: string | null;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ qr, code, onClose }) => {
  return (
    <Modal isOpen={true} onClose={onClose} className="w-full max-w-sm">
      <ModalHeader>Conectar Instância</ModalHeader>
      <ModalBody>
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-600 mb-4 text-center">
            Abra o WhatsApp, vá em Aparelhos Conectados e use um dos métodos abaixo.
          </p>
          
          {qr && <RenderQrCode qrCode={qr} />}
          
          {qr && code && (
            <div className="my-4 text-center">
              <p className="text-sm text-gray-500">OU</p>
            </div>
          )}
          
          {code && <RenderPaired pairingCode={code} />}
          
          {!qr && !code && (
            <div className="w-56 h-56 border rounded flex items-center justify-center bg-gray-100">
              <p className="text-gray-500 text-sm">Carregando dados de conexão...</p>
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}; 