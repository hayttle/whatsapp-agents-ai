'use client';

import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  Button,
  Badge,
  StatusIndicator
} from '@/components/brand';
import { Settings, MessageSquare, QrCode, Power, Edit, Trash2 } from 'lucide-react';

interface WhatsAppInstance {
  id: string;
  name: string;
  number: string;
  status: 'online' | 'offline' | 'connecting' | 'error';
  type: 'business' | 'personal';
  isActive: boolean;
  lastActivity?: string;
}

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
  onConnect?: (id: string) => void;
  onDisconnect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onShowQR?: (id: string) => void;
}

export function WhatsAppInstanceCard({
  instance,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
  onShowQR
}: WhatsAppInstanceCardProps) {
  const getStatusColor = (status: WhatsAppInstance['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'offline':
        return 'text-gray-500';
      case 'connecting':
        return 'text-brand-green-dark';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTypeLabel = (type: WhatsAppInstance['type']) => {
    return type === 'business' ? 'Business' : 'Pessoal';
  };

  const getTypeVariant = (type: WhatsAppInstance['type']) => {
    return type === 'business' ? 'brand' : 'info';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-green-light rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{instance.name}</CardTitle>
              <CardDescription className="text-sm">
                {instance.number}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator status={instance.status} showLabel />
            <Badge variant={getTypeVariant(instance.type)} size="sm">
              {getTypeLabel(instance.type)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={getStatusColor(instance.status)}>
              {instance.status === 'online' && 'Conectado'}
              {instance.status === 'offline' && 'Desconectado'}
              {instance.status === 'connecting' && 'Conectando...'}
              {instance.status === 'error' && 'Erro'}
            </span>
          </div>
          
          {instance.lastActivity && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Última atividade:</span>
              <span className="text-gray-900">{instance.lastActivity}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Ativo:</span>
            <Badge variant={instance.isActive ? 'success' : 'default'} size="sm">
              {instance.isActive ? 'Sim' : 'Não'}
            </Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="flex gap-2 w-full">
          {instance.status === 'offline' && (
            <Button 
              size="sm" 
              onClick={() => onConnect?.(instance.id)}
              className="flex-1"
            >
              <Power className="w-4 h-4 mr-1" />
              Conectar
            </Button>
          )}
          
          {instance.status === 'online' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDisconnect?.(instance.id)}
              className="flex-1"
            >
              <Power className="w-4 h-4 mr-1" />
              Desconectar
            </Button>
          )}
          
          {instance.status === 'connecting' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onShowQR?.(instance.id)}
              className="flex-1"
            >
              <QrCode className="w-4 h-4 mr-1" />
              QR Code
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit?.(instance.id)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete?.(instance.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export type { WhatsAppInstance, WhatsAppInstanceCardProps }; 