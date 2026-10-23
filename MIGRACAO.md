# Migração do Toda Escritura

Origem: https://todaescritura.org/ — coleta em 22/10/2026.

## Conteúdo público importado

- 647 publicações, com títulos, autores, datas, referências, marcadores e texto integral.
- 160 páginas, incluindo livros bíblicos, 52 Dias do Senhor, perfis, privacidade e orientações de envio.
- 28 contas públicas de autores, 122 categorias e 238 marcadores.
- O endpoint de comentários públicos retornou zero comentários.
- 92 arquivos de mídia baixados; as 25 fotos de pastores já usadas também permanecem locais.

Todos os 647 URLs do sitemap de publicações e os 160 URLs do sitemap de páginas foram conferidos com a API. Nove URLs da origem coincidem entre páginas e publicações; os novos caminhos `/sermoes/` e `/paginas/` preservam as duas versões sem ambiguidade.

A extração remove a estrutura do Elementor, CSS, scripts e controles de compartilhamento. Os textos dos blocos de conteúdo são comparados antes e depois da limpeza. O relatório registra um hash por publicação.

## Limites da origem

A API informa 94 mídias, porém devolve 93 registros públicos únicos com paginação em lotes de 100 e 25. Uma imagem antiga de Abram de Graaf não está disponível na origem; foi substituída pela foto atual do mesmo pastor, que já existia no acervo. Quatro páginas estão vazias no original e permanecem identificadas como tal.

## Recebimento de arquivos

Os canais originais de contribuição foram mantidos: formulário em `https://todaescritura.org/envia-sermao/` e a pasta Google Drive publicada naquela página. Esta cópia pública não inclui o painel administrativo WordPress, credenciais, banco privado, mensagens recebidas, e-mail ou armazenamento do servidor original. Não há envio fictício de formulários na nova interface.

## Organização e reprodução

- `dist/`: publicação estática completa, incluindo páginas permanentes para cada sermão.
- `dist/data/catalog.json`: índice de busca e filtros.
- `dist/data/sermons/`: texto integral por publicação.
- `dist/data/pages/`: páginas originais extraídas.
- `dist/authors.json`: perfis e biografias.
- `outputs/migration/raw/`: respostas originais da API e sitemaps.
- `outputs/migration/report.json`: cobertura e pendências.
- `outputs/migration/verification.json`: verificação de integridade e links locais.

Para repetir a coleta e a construção, instale as dependências de `tooling/` e execute `node import-wordpress.mjs`, `node build-migration.mjs` e `node verify-migration.mjs`. Os scripts `update-migration-ui.mjs` e `finalize-migration.mjs` são transformações únicas já aplicadas à interface.

Para visualizar localmente: `node preview.cjs` e abra `http://127.0.0.1:4178/`.
