"use client";
import { Instance } from "./types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/brand';
import { Button } from '@/components/brand';
import { MessageSquare, ExternalLink, Eye, Power, PowerOff, Trash2 } from "lucide-react";

interface InstanceCardProps {
  instance: Instance;
  onViewDetails: (instance: Instance) => void;
  onConnect: (instanceName: string) => void;
  onDisconnect: (instanceName: string) => void;
  isLoading: boolean;
  empresaName?: string;
  agentName?: string;
  onRequestDelete: (instance: Instance) => void;
}

export function InstanceCard({ 
  instance, 
  onViewDetails, 
  onConnect, 
  onDisconnect, 
  isLoading,
  empresaName,
  agentName,
  onRequestDelete
}: InstanceCardProps) {
  const isConnected = instance.status === 'open';
  const isNative = instance.provider_type === 'nativo';

  return (
    <Card className="h-full flex flex-col min-w-[370px]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isConnected ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <MessageSquare className={`w-5 h-5 ${
                isConnected ? 'text-green-600' : 'text-gray-500'
              }`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {instance.instanceName}
              </CardTitle>
              {empresaName && (
                <p className="text-sm text-gray-500 mt-1">{empresaName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
              isNative 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {isNative ? (
                <>
                  <MessageSquare className="w-3 h-3" />
                  Nativa
                </>
              ) : (
                <>
                  <ExternalLink className="w-3 h-3" />
                  Externa
                </>
              )}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="space-y-3">
          {/* Status da conexão */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {/* Número do WhatsApp */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Número:</span>
            <span className="text-sm font-medium text-gray-900">
              {instance.phone_number || 'Não conectado'}
            </span>
          </div>

          {/* Agente vinculado */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Agente:</span>
            <span className="text-sm font-medium text-gray-900">
              {agentName ? agentName : (instance.agent_id ? 'Vinculado' : 'Não vinculado')}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-gray-100">
        <div className="flex gap-2 w-full justify-end">
          <Button
            variant="outline"
            size="sm"
            className="min-w-0 w-9 h-9 p-0 flex items-center justify-center"
            onClick={() => onViewDetails(instance)}
            leftIcon={<Eye className="w-4 h-4" />}
            aria-label="Ver Detalhes"
            title="Ver Detalhes"
          >
            {''}
          </Button>
          {isConnected ? (
            <Button
              variant="warning"
              size="sm"
              className="min-w-0 w-9 h-9 p-0 flex items-center justify-center"
              onClick={() => onDisconnect(instance.instanceName)}
              loading={isLoading}
              leftIcon={<PowerOff className="w-4 h-4" />}
              aria-label="Desconectar"
              title="Desconectar"
            >
              {''}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="min-w-0 w-9 h-9 p-0 flex items-center justify-center"
              onClick={() => onConnect(instance.instanceName)}
              loading={isLoading}
              leftIcon={<Power className="w-4 h-4" />}
              aria-label="Conectar"
              title="Conectar"
            >
              {''}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="min-w-0 w-9 h-9 p-0 flex items-center justify-center"
            onClick={() => onRequestDelete(instance)}
            loading={isLoading}
            leftIcon={<Trash2 className="w-4 h-4" />}
            aria-label="Remover"
            title="Remover"
          >
            {''}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 