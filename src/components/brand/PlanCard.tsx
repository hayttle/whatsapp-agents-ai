import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';

interface PlanCardProps {
  name: string;
  price: string;
  description?: string;
  features: string[];
  highlight?: boolean;
  onSubscribe?: () => void;
  subscribeLabel?: string;
  disabled?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  name,
  price,
  description,
  features,
  highlight,
  onSubscribe,
  subscribeLabel = 'Assinar',
  disabled = false,
}) => {
  return (
    <Card variant={highlight ? 'brand' : 'default'} className={highlight ? 'border-2 border-green-500 scale-105' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {name}
          {highlight && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">MAIS POPULAR</span>
          )}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-2">{price}</div>
        <ul className="mb-4 space-y-1 text-sm">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-green-600">●</span> {f}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={onSubscribe} disabled={disabled} className="w-full" variant={highlight ? 'primary' : 'outline'}>
          {subscribeLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}; 