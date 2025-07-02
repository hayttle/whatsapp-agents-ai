-- Adicionar foreign key entre agents.agent_model_id e prompt_models.id
ALTER TABLE public.agents 
ADD CONSTRAINT agents_agent_model_id_fkey 
FOREIGN KEY (agent_model_id) 
REFERENCES public.prompt_models(id) 
ON DELETE SET NULL; 