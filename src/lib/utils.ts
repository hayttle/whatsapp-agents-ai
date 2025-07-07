import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { NextApiRequest } from 'next'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Função para fazer requisições autenticadas para a API
 * Usa cookies automaticamente (não precisa enviar tokens manualmente)
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<unknown> {
  const defaultOptions: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Importante: inclui cookies na requisição
    ...options,
  };

  // Se há body, certifique-se de que está como JSON
  if (options.body && typeof options.body === 'object') {
    defaultOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Validação de CPF
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanCPF.charAt(9)) === digit1 && parseInt(cleanCPF.charAt(10)) === digit2;
}

// Validação de CNPJ
export function validateCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Validação do segundo dígito verificador
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(cleanCNPJ.charAt(12)) === digit1 && parseInt(cleanCNPJ.charAt(13)) === digit2;
}

// Formatação de CPF
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Formatação de CNPJ
export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Formatação de CEP
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// Formatação de telefone
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return cleanPhone;
}

// Retorna o papel do usuário a partir do request (exemplo simplificado)
export async function getUserRole(req: NextApiRequest): Promise<string> {
  // Exemplo: role no header (em produção, use JWT ou sessão)
  const role = req.headers['x-user-role'] as string | undefined;
  if (role) return role;
  // TODO: integrar com autenticação real
  return 'user';
}

// Comparação profunda de objetos (deepEqual)
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;
  if (
    typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null
  ) return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    // Type guard para acesso seguro
    if (
      !deepEqual(
        (obj1 as Record<string, unknown>)[key],
        (obj2 as Record<string, unknown>)[key]
      )
    ) return false;
  }
  return true;
}

// Para exibir datas no formato DD/MM/YYYY
export function formatDateToDisplay(dateString: string): string {
  if (!dateString) return '';
  // Extrai apenas a parte da data se vier um timestamp
  const onlyDate = dateString.split('T')[0];
  const [year, month, day] = onlyDate.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

// Para converter Date para YYYY-MM-DD em um timezone específico
export function formatDateToISO(date: Date, timeZone = 'America/Sao_Paulo'): string {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [day, month, year] = formatter.format(date).split('/');
  return `${year}-${month}-${day}`;
}
