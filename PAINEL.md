# Administração do Sermões Reformados

Painel: /admin. Envio: /enviar. A conta administrativa é definida por ADMIN_EMAILS no ambiente Sites. A publicação mantém a audiência anterior; o formulário só pode ser acessado por quem tem acesso ao site. A interface pública do painel não contém registros; cada API administrativa exige identidade e autorização no servidor.

O conteúdo original continua em public/data. Novos cadastros e alterações ficam no D1, e anexos e imagens ficam no R2. Não há uso de localStorage para conteúdo administrativo. Não apague os recursos D1/R2 ao atualizar o visual.

Sermões, pastores e textos têm situação Rascunho, Publicado ou Arquivado. Arquivar é reversível e não exclui o registro. Os envios ficam pendentes até serem revisados. Preparar sermão abre o cadastro, sem publicação automática. Arquivos PDF e DOCX são recebidos como anexos para download e revisão; a publicação exige texto preenchido no editor.

Imagens: JPG, PNG e WebP, até 5 MB. Anexos de envio: PDF, DOCX, TXT e MD, até 10 MB. Contatos e anexos recebidos só estão disponíveis ao administrador. O formulário não envia notificações por e-mail.

Desenvolvimento: pnpm install, pnpm dev. Mock de login local do starter: /signin-with-chatgpt?return_to=/admin; configurar ADMIN_EMAILS=seedy@sites.test em .dev.vars, que não deve ser versionado. Em produção usar apenas a conta autorizada no ambiente Sites. As páginas e scripts atuais ficam em public/; dist/ é gerado pelo build Vinext. Scripts históricos de migração e redesign não devem ser executados sobre o build atual.

Testes: node --test tests/cms.test.mjs. Migrations Drizzle em drizzle/ são aplicadas pelo Sites na publicação. Não há dados de teste no banco de produção.
