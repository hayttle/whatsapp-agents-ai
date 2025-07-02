import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/brand';
import { Filter } from 'lucide-react';

interface AdminListLayoutProps {
  icon: React.ReactNode;
  pageTitle: string;
  pageDescription: string;
  cardTitle: string;
  cardDescription: string;
  actionButton: React.ReactNode;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  children: React.ReactNode;
}

function Filters({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function List({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function AdminListLayout({
  icon,
  pageTitle,
  pageDescription,
  cardTitle,
  cardDescription,
  actionButton,
  filtersOpen,
  onToggleFilters,
  children,
}: AdminListLayoutProps) {
  // Separar slots Filters e List
  let filtersSlot: React.ReactNode = null;
  let listSlot: React.ReactNode = null;
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return;
    if (child.type === Filters && 'props' in child) filtersSlot = (child as React.ReactElement<{children: React.ReactNode}>).props.children;
    if (child.type === List && 'props' in child) listSlot = (child as React.ReactElement<{children: React.ReactNode}>).props.children;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-green-light rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-gray-dark">{pageTitle}</h1>
            <p className="text-gray-600">{pageDescription}</p>
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
          <div className="flex justify-between items-center mb-6">
            <button
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${filtersOpen ? 'bg-brand-green-light text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={onToggleFilters}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            {actionButton}
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-0">
          {filtersOpen && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              {filtersSlot}
            </div>
          )}
          {listSlot}
        </CardContent>
      </Card>
    </div>
  );
}

AdminListLayout.Filters = Filters;
AdminListLayout.List = List; 