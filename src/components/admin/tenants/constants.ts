export const COMPANY_TYPES = {
  FISICA: 'FISICA',
  JURIDICA: 'JURIDICA'
} as const;

export type CompanyType = typeof COMPANY_TYPES[keyof typeof COMPANY_TYPES];

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  [COMPANY_TYPES.FISICA]: 'Física',
  [COMPANY_TYPES.JURIDICA]: 'Jurídica'
};

export const COMPANY_TYPE_OPTIONS = [
  { value: COMPANY_TYPES.FISICA, label: COMPANY_TYPE_LABELS[COMPANY_TYPES.FISICA] },
  { value: COMPANY_TYPES.JURIDICA, label: COMPANY_TYPE_LABELS[COMPANY_TYPES.JURIDICA] }
]; 