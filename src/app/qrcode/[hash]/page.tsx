"use client";
import { use, useEffect, useState } from "react";
import { RenderQrCode } from '@/components/admin/instances/QRCodeComponents';

const getInstanceNameByHash = async (hash: string) => {
  const res = await fetch('/api/public/qrcode?hash=' + encodeURIComponent(hash));
  if (!res.ok) throw new Error('Link invalido!');
  const data = await res.json();
  if (!data.instanceName) throw new Error('Link invalido!');
  return { instanceName: data.instanceName, status: data.status };
};

const getInstanceStatus = async (instanceName: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = `${baseUrl}/api/whatsapp-instances/status?instanceName=${encodeURIComponent(instanceName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro ao consultar status da instância');
  const data = await res.json();
  return data.status;
};

export default function QrCodePage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(20);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1. Buscar nome da instância e status pelo hash
        const { instanceName: name, status } = await getInstanceNameByHash(hash);
        if (cancelled) return;
        setInstanceName(name);
        // 2. Se status for 'open', exibir mensagem amigável
        if (status === 'open') {
          setError('QR Code inválido ou instância já conectada.');
          return;
        }
        // 3. Consultar status na Evolution API (opcional, pode remover se confiar no banco)
        // const statusEvolution = await getInstanceStatus(name);
        // if (cancelled) return;
        // if (statusEvolution === 'open') {
        //   setError('QR Code inválido ou instância já conectada.');
        //   return;
        // }
        // 4. Gerar QR Code normalmente
        const res = await fetch('/api/public/whatsapp-instances/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hash }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro desconhecido');
        }
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
      } catch (err: any) {
        // Se a mensagem de erro for exatamente a de instância conectada, exibe amigável
        if (err.message && err.message.includes('instância já conectada')) {
          setError('QR Code inválido ou instância já conectada.');
        } else {
          setError(err.message || 'Link invalido!');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [hash]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (qrcode && !expired) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setExpired(true);
            clearInterval(interval);
            if (instanceName) {
              fetch(`/api/whatsapp-instances/status?instanceName=${encodeURIComponent(instanceName)}`);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [qrcode, expired, instanceName]);

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
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Conectar Instância</h1>
        <p className="text-gray-600 text-center mb-4">Abra o WhatsApp, vá em Aparelhos Conectados e escaneie o QR Code.</p>
        <RenderQrCode qrCode={qrcode} />
        <div className="mt-4 text-lg font-semibold text-gray-700">
          Essa janela será fechada em <span className="text-blue-600">{timer}s</span>.
        </div>
      </div>
    </div>
  );
} 