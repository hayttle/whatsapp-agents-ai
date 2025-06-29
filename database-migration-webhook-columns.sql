-- Migração para renomear colunas do webhook na tabela whatsapp_instances
-- Executar esta migração para atualizar a estrutura do banco de dados

-- Renomear webhookByEvents para byEvents
ALTER TABLE whatsapp_instances 
RENAME COLUMN webhookByEvents TO byEvents;

-- Renomear webhookBase64 para base64
ALTER TABLE whatsapp_instances 
RENAME COLUMN webhookBase64 TO base64;

-- Verificar se as alterações foram aplicadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_instances' 
AND column_name IN ('byEvents', 'base64'); 