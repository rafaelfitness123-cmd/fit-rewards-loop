# Remix of FitFlow Rewards

IMPORTANTE: além de todo o sistema de QR Code e controle de entrada/saída descrito anteriormente, quero que o projeto seja estruturado como um aplicativo/rede social da academia, com sistema de gamificação.

O objetivo é que o aluno não entre no aplicativo apenas para registrar entrada e saída. Quero que ele tenha motivos para abrir o aplicativo todos os dias, acompanhar sua evolução, cumprir missões, ganhar pontos, participar de rankings e trocar pontos por recompensas.

Neste primeiro momento CONTINUE usando apenas localStorage.

Não utilizar Firebase, API ou banco externo ainda.

==================================================

1. ESTRUTURA DO APLICATIVO DO CLIENTE

==================================================

Depois do login, o cliente deve entrar em uma interface parecida com uma rede social/app fitness.

Criar navegação inferior no celular:

INÍCIO

MISSÕES

PONTOS

RANKING

PERFIL

==================================================

2. TELA INÍCIO

==================================================

Criar uma página inicial com:

- Nome e foto/avatar do cliente

- Quantidade atual de pontos

- Sequência de dias treinando

- Resumo do último treino

- Missões disponíveis

- Destaques da academia

- Avisos e novidades cadastrados pelo administrador

Exemplo:

Olá, Rafael! 👋

🔥 7 dias de sequência

⭐ 340 pontos

Último treino:

Hoje — 18:12 às 19:31

Missão do dia:

Treine hoje e ganhe 20 pontos

[ Ver missões ]

==================================================

3. SISTEMA DE PONTOS

==================================================

Criar sistema de pontuação.

Os pontos devem ficar associados ao cliente.

Exemplos de ações que podem gerar pontos:

- Fazer check-in

- Fazer check-out

- Completar missão

- Treinar em determinados dias

- Participar de desafios

- Outras ações configuradas pelo administrador

IMPORTANTE:

TODOS OS VALORES DE PONTOS DEVEM SER EDITÁVEIS PELO ADMINISTRADOR.

Não deixar valores fixos no código.

==================================================

4. PONTUAÇÃO DIFERENCIADA POR DIA

==================================================

Quero que o administrador consiga configurar quantos pontos o aluno ganha por treinar em cada dia da semana.

Exemplo:

Segunda: 10 pontos

Terça: 10 pontos

Quarta: 10 pontos

Quinta: 20 pontos

Sexta: 25 pontos

Sábado: 40 pontos

Domingo: 50 pontos

Esses são apenas exemplos.

O administrador deve conseguir alterar para qualquer valor.

Por exemplo:

Quinta:

[ 30 ] pontos

Sexta:

[ 40 ] pontos

Sábado:

[ 60 ] pontos

Domingo:

[ 70 ] pontos

A pontuação deve ser determinada automaticamente de acordo com o dia em que o aluno realizar o check-in.

==================================================

5. MISSÕES

==================================================

Criar uma área "Missões".

As missões podem ser:

- Diárias

- Semanais

- Mensais

- Desafios especiais

Exemplos:

"Treine 3 vezes nesta semana"

Recompensa: 100 pontos

"Treine no sábado"

Recompensa: 50 pontos

"Complete 5 treinos"

Recompensa: 150 pontos

"Treine 2 domingos"

Recompensa: 100 pontos

IMPORTANTE:

TODAS AS MISSÕES DEVEM SER CRIADAS, EDITADAS, ATIVADAS, DESATIVADAS E EXCLUÍDAS PELO ADMINISTRADOR.

Não deixar missões fixas no código.

==================================================

6. ADMINISTRADOR - GERENCIAR MISSÕES

==================================================

Criar no painel administrativo:

"Gerenciar Missões"

Botão:

+ Criar missão

Campos:

Nome da missão

Descrição

Tipo:

- Diária

- Semanal

- Mensal

- Especial

Objetivo da missão

Quantidade necessária

Recompensa em pontos

Data de início

Data de término

Ativa/Inativa

Exemplo:

Nome:

Treino de sábado

Descrição:

Venha treinar no sábado e ganhe pontos extras.

Tipo:

Semanal

Dia:

Sábado

Pontos:

50

Ativa:

SIM

O administrador pode alterar os valores depois.

==================================================

7. RECOMPENSAS / RESGATES

==================================================

Criar uma área:

"Resgatar Pontos"

O cliente poderá trocar seus pontos por recompensas cadastradas pelo administrador.

Exemplos:

500 pontos

→ 1 camiseta

300 pontos

→ 1 squeeze

200 pontos

→ Brinde

100 pontos

→ Benefício especial

IMPORTANTE:

TODAS AS RECOMPENSAS DEVEM SER EDITÁVEIS PELO ADMINISTRADOR.

O administrador deve poder:

- Criar recompensa

- Alterar recompensa

- Excluir recompensa

- Ativar/desativar recompensa

- Alterar quantidade de pontos necessária

- Alterar nome

- Alterar descrição

- Alterar quantidade disponível

==================================================

8. RESGATE DE RECOMPENSA

==================================================

Quando o cliente clicar em:

"Resgatar"

O sistema deve verificar se ele possui pontos suficientes.

Exemplo:

Cliente possui:

800 pontos

Recompensa:

500 pontos

Após confirmar:

800 - 500 = 300 pontos

Registrar no histórico:

Cliente:

Rafael

Recompensa:

Camiseta

Pontos utilizados:

500

Data:

05/08/2026

Status:

Resgate solicitado

Não permitir resgate se não houver pontos suficientes.

==================================================

9. ADMINISTRADOR - RESGATES

==================================================

Criar painel:

"Resgates"

Mostrar:

Cliente

Recompensa

Pontos utilizados

Data

Status

Status possíveis:

Solicitado

Aprovado

Entregue

Cancelado

O administrador pode alterar o status.

Se o resgate for cancelado, devolver os pontos ao cliente.

==================================================

10. RANKING

==================================================

Criar uma tela:

"Ranking"

Mostrar os clientes ordenados pela quantidade de pontos.

Exemplo:

🥇 Rafael — 1.250 pontos

🥈 João — 1.100 pontos

🥉 Maria — 980 pontos

Mostrar também a posição do próprio cliente.

Exemplo:

Sua posição:

#7

Total:

620 pontos

IMPORTANTE:

O ranking deve utilizar os dados reais do localStorage.

Não utilizar nomes fictícios.

==================================================

11. PERFIL DO CLIENTE

==================================================

Criar perfil contendo:

Foto/avatar

Nome

CPF

Pontos

Posição no ranking

Total de treinos

Sequência atual

Maior sequência

Tempo total treinado

Criar também:

Histórico de treinos

Histórico de pontos

Histórico de missões

Histórico de resgates

==================================================

12. EXTRATO DE PONTOS

==================================================

Criar uma tela:

"Histórico de Pontos"

Exemplo:

+40 pontos

Treino de sábado

05/08

+100 pontos

Missão: Treine 3 vezes

05/08

-500 pontos

Resgate: Camiseta

05/08

Saldo atual:

640 pontos

Toda alteração de pontos deve gerar um registro no histórico.

==================================================

13. ADMINISTRADOR - CONFIGURAÇÕES DE PONTOS

==================================================

Criar uma área específica:

"Configurações de Gamificação"

O administrador deve conseguir editar:

Pontos por check-in

Pontos por check-out, se utilizado

Pontos por dia da semana

Pontos de missões

Pontos de desafios

Bônus de sequência

Outros bônus

Exemplo:

Segunda:

[10] pontos

Terça:

[10] pontos

Quarta:

[10] pontos

Quinta:

[20] pontos

Sexta:

[30] pontos

Sábado:

[50] pontos

Domingo:

[70] pontos

Botão:

Salvar configurações

==================================================

14. SEQUÊNCIA DE TREINOS

==================================================

Criar sistema de sequência.

Exemplo:

Aluno treinou:

Segunda

Terça

Quarta

Sequência:

🔥 3 dias

Se treinar novamente na quinta:

🔥 4 dias

O administrador deve conseguir configurar bônus de sequência.

Exemplo:

3 dias seguidos:

+20 pontos

5 dias:

+50 pontos

7 dias:

+100 pontos

Esses valores também devem ser editáveis.

==================================================

15. QR CODE + PONTOS

==================================================

Integrar o sistema de QR Code criado anteriormente com o sistema de pontos.

Quando o cliente fizer um check-in válido:

1. Validar QR

2. Registrar entrada

3. Identificar o dia da semana

4. Consultar a configuração daquele dia

5. Adicionar automaticamente os pontos configurados

6. Registrar no histórico de pontos

7. Verificar se alguma missão foi concluída

8. Atualizar ranking

9. Atualizar sequência

Exemplo:

Cliente escaneia sábado.

Configuração do administrador:

Sábado = 50 pontos

Sistema:

Entrada registrada.

+50 pontos

==================================================

16. EVITAR DUPLICAÇÃO DE PONTOS

==================================================

Muito importante:

O aluno não pode ficar ganhando pontos infinitamente escaneando o QR várias vezes.

Para cada treino:

Primeiro QR válido:

→ entrada

Segundo QR válido:

→ saída

O sistema deve conceder a pontuação daquele treino apenas uma vez.

Se o aluno escanear novamente depois de finalizar o treino, isso deve iniciar um novo treino apenas quando fizer sentido.

Criar uma identificação única para cada sessão de treino.

==================================================

17. MISSÕES AUTOMÁTICAS

==================================================

O sistema deve acompanhar automaticamente o progresso das missões.

Exemplo:

Missão:

"Treine 3 vezes nesta semana"

Aluno:

Treino 1/3

Treino 2/3

Treino 3/3

Quando completar:

Missão concluída!

+100 pontos

IMPORTANTE:

Não conceder a recompensa duas vezes para a mesma missão.

==================================================

18. ADMINISTRADOR - VISÃO GERAL

==================================================

O painel administrativo deve ter um dashboard mostrando:

Total de clientes

Clientes treinando agora

Treinos de hoje

Pontos distribuídos

Missões ativas

Resgates pendentes

Criar atalhos para:

QR Code

Clientes

Pontuação

Missões

Recompensas

Resgates

Ranking

Configurações

==================================================

19. TUDO EDITÁVEL PELO ADMINISTRADOR

==================================================

Essa é uma regra muito importante.

Sempre que houver:

- Pontuação

- Missão

- Recompensa

- Valor de resgate

- Bônus

- Pontos por dia

- Sequência

- Desafio

NÃO deixar o valor fixo no código.

Tudo deve ser configurável através do painel administrativo e salvo no localStorage.

Se o administrador alterar:

Sábado:

50 pontos

para:

Sábado:

100 pontos

O próximo treino de sábado deve valer 100 pontos automaticamente.

==================================================

20. LOCALSTORAGE

==================================================

Criar estruturas separadas no localStorage para:

academia_admin

academia_clientes

academia_treinos

academia_qr

academia_pontos

academia_missoes

academia_progresso_missoes

academia_recompensas

academia_resgates

academia_config_gamificacao

academia_config_dias

academia_historico_pontos

Não perder dados ao atualizar a página.

==================================================

21. DESIGN

==================================================

Quero que o aplicativo tenha aparência de uma rede social fitness moderna.

Não quero aparência de sistema administrativo antigo.

O cliente deve sentir que está entrando em um aplicativo da academia.

Criar:

- Cards

- Avatar

- Pontos em destaque

- Ranking

- Missões

- Progresso

- Badges/conquistas

- Feed/avisos

- Navegação inferior no celular

Tela inicial:

Olá, Rafael! 👋

🔥 7 dias seguidos

⭐ 340 pontos

🏆 #8 no ranking

Missões de hoje

[ Treinar hoje +50 pts ]

[ Ver todas as missões ]

==================================================

22. ADMINISTRADOR NÃO DEVE TER AS MESMAS TELAS DO CLIENTE

==================================================

Cliente:

Início

Missões

Pontos

Ranking

Perfil

Administrador:

Dashboard

QR Code

Clientes

Treinos

Pontuação

Missões

Recompensas

Resgates

Ranking

Configurações

==================================================

23. DADOS DE TESTE

==================================================

Criar somente um usuário inicial para facilitar o primeiro teste:

Administrador:

admin

123

Cliente:

Nome: Cliente Teste

CPF: 12345678900

Senha: 123

Não criar dezenas de clientes fictícios.

Depois que o sistema estiver funcionando, o administrador deverá cadastrar os demais.

==================================================

24. IMPORTANTE

==================================================

Quero que você implemente as funcionalidades de verdade.

Não criar botões que não fazem nada.

Não criar informações falsas apenas para preencher a interface.

Não simular pontos visualmente.

Os pontos precisam realmente ser armazenados.

As missões precisam realmente acompanhar o progresso.

Os resgates precisam realmente descontar os pontos.

O ranking precisa realmente calcular os pontos.

O QR Code precisa realmente validar a entrada e saída.

O histórico precisa realmente ser persistente.

Tudo deve funcionar usando localStorage neste primeiro protótipo.

Não utilizar Firebase ou API ainda.

==================================================

25. TESTE FINAL OBRIGATÓRIO

==================================================

Antes de finalizar, testar o seguinte fluxo:

1. Entrar como admin.

2. Cadastrar um cliente.

3. Configurar:

   Quinta = 20 pontos

   Sexta = 30 pontos

   Sábado = 50 pontos

   Domingo = 70 pontos

4. Criar uma missão.

5. Criar uma recompensa.

6. Criar QR Code.

7. Entrar como cliente.

8. Escanear QR.

9. Registrar entrada.

10. Confirmar que os pontos foram adicionados.

11. Confirmar que o histórico registrou os pontos.

12. Confirmar que o ranking mudou.

13. Escanear novamente.

14. Registrar saída.

15. Confirmar o tempo de permanência.

16. Confirmar que os pontos não foram duplicados.

17. Atualizar a página.

18. Confirmar que tudo continua salvo.

19. Entrar novamente como administrador.

20. Alterar os pontos de sábado.

21. Confirmar que a nova configuração passa a ser utilizada.

Se qualquer uma dessas funções não estiver funcionando, corrija antes de considerar o projeto concluído.

O objetivo é ter um protótipo funcional de um aplicativo de academia gamificado, com QR Code, check-in/check-out, pontos, missões, ranking e recompensas, totalmente administrável e usando localStorage neste primeiro estágio.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fit-rewards-loop.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/712434c7-5eab-424d-b467-f90ce709a680).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
