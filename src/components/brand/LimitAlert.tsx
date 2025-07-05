import React from 'react';
import { Alert } from './Alert';
import { Button } from './Button';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface LimitAlertProps {
  message: string;
  onUpgrade?: () => void;
  className?: string;
}

export const LimitAlert: React.FC<LimitAlertProps> = ({
  message,
  onUpgrade,
  className = '',
}) => {
  return (
    <Alert variant="warning" className={className}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800 mb-1">Limite Atingido</h4>
          <p className="text-yellow-700 text-sm mb-3">{message}</p>
          {onUpgrade && (
            <Button
              variant="primary"
              size="sm"
              onClick={onUpgrade}
              className="flex items-center gap-2"
            >
              Ver Planos
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}; 