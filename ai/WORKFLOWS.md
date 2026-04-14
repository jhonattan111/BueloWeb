# Workflows do projeto

## 1. Workflow de execução por agentes
1. ler `TASKS.md` e escolher uma task aberta
2. confirmar dependências da task
3. implementar somente o escopo definido
4. validar localmente
5. registrar entrega e próximos bloqueios

## 2. Workflow de autenticação
1. usuário acessa `/login`
2. informa `email` e `senha`
3. service mocka o login e retorna perfil + token
4. token é salvo em estado/local storage preparado para JWT
5. usuário é redirecionado para `/`

## 3. Workflow da home
1. carregar dados do usuário autenticado
2. exibir mensagem `Bem-vindo, <Nome do Usuário>`
3. renderizar atalhos úteis no conteúdo principal

## 4. Workflow de navegação shell
1. carregar configuração do menu lateral
2. renderizar grupos pai/filho como accordion
3. manter footer fixo na base da tela
4. permitir scroll apenas no conteúdo principal

## 5. Workflow de atendimentos
1. carregar lista de tickets do usuário
2. exibir grid com protocolo, tempo e nota
3. clicar em ação para ver detalhes
4. abrir modal com conversa completa
5. opcionalmente avaliar o atendimento
6. enviar nota pela API/mock service

## 6. Workflow de relatórios
1. carregar cards de relatórios da API
2. clicar em um card
3. buscar detalhes e parâmetros do relatório
4. abrir modal dinâmica
5. renderizar inputs conforme o tipo de parâmetro
6. montar payload simples `{ chave: valor }`
7. solicitar emissão e iniciar download
8. manter a arquitetura pronta para futura pré-visualização