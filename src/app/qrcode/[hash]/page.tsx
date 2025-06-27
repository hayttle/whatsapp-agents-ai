"use client";
import { use, useEffect, useState } from "react";
import { RenderQrCode } from '@/components/admin/instances/QRCodeComponents';

export default function QrCodePage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(20);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (qrcode && !expired) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setExpired(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [qrcode, expired]);

  useEffect(() => {
    fetch('/api/public/whatsapp-instances/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
        if (typeof data.qrcode === 'string' && data.qrcode.startsWith('data:image/')) {
          setQrcode(data.qrcode);
        } else {
          try {
            const qrData = typeof data.qrcode === 'string' ? JSON.parse(data.qrcode) : data.qrcode;
            const qrCodeBase64 =
              qrData.qrcode ||
              qrData.qr ||
              qrData.base64 ||
              qrData.code ||
              '';
            setQrcode(qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : '');
          } catch {
            setQrcode('');
          }
        }
      })
      .catch((err) => {
        setError(err.message || 'Link invalido!');
      });
  }, [hash]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-xl font-semibold text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!qrcode || expired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-lg font-medium text-gray-700">
          {expired ? 'Essa janela expirou. Recarregue a página para gerar um novo QR Code.' : 'Carregando QR Code...'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <RenderQrCode qrCode={qrcode} />
        <div className="mt-4 text-lg font-semibold text-gray-700">
          Essa janela será fechada em <span className="text-blue-600">{timer}s</span>.
        </div>
      </div>
    </div>
  );
} 