# DNA AUTO — Push Android de manutenção e testes no Admin

## O que foi implementado no código

- APK cliente: `FirebaseMessagingService` nativo para receber mensagens FCM de prioridade alta mesmo com a WebView fechada (desde que o Android permita entrega, não haja force-stop e o dispositivo tenha internet); som, vibração e notificação expansível.
- Ao tocar na notificação, o aplicativo abre um agendamento com **serviço, veículo, oficina, data e hora**. Confirmação direta: `POST /api/v1/workshops/:id/client-appointments` com titular autenticado, horário livre e nome/WhatsApp extraídos do cadastro.
- Alternativa WhatsApp: o cliente abre **seu próprio WhatsApp**, com mensagem preenchida para a oficina e confirma o envio; nenhuma chamada de mensagem é feita pela API WhatsApp da empresa.
- O app registra o token FCM via `POST /api/v1/push/register`, e o Android confirma a chegada via `POST /api/v1/push/ack` com segredo de evento.
- Admin `/admin` → **Alertas Preventivos**: selecionar veículo, serviço e km restantes → botão **Enviar notificação de teste** → histórico com status.
- Scheduler do Render: consulta a cada cinco minutos os registros de previsão de manutenção sincronizados e envia push nos marcos 80/40 km, deduplicando por veículo, item, quilometragem de vencimento, marco e aparelho. O GPS local no APK continua independente do servidor.

## Configuração obrigatória para produção

1. Criar um projeto Firebase e cadastrar o Android com identificador exato `br.com.dnaauto.cliente`.
2. No GitHub Actions, configurar os secrets `DNA_FCM_ANDROID_APP_ID`, `DNA_FCM_API_KEY`, `DNA_FCM_PROJECT_ID`, `DNA_FCM_SENDER_ID`. Todos devem pertencer ao **mesmo** projeto Firebase. Esses parâmetros identificam o app, não são a chave privada do servidor.
3. No Render, definir `FCM_SERVICE_ACCOUNT_JSON` com o JSON completo de uma conta de serviço do Firebase com permissão para Firebase Cloud Messaging HTTP v1 (ou seu conteúdo em base64). **Não publicar esse JSON no GitHub.** Ativar a API FCM HTTP v1 no projeto Google.
4. Configurar armazenamento persistente para o banco SQLite (`DB_PATH`). Em plano com disco efêmero, os registros de aparelhos e confirmações podem se perder em novos deploys.
5. Compilar o APK por GitHub Actions com os secrets acima. Publicar somente APK de produção assinado com a **mesma keystore dos APKs já instalados**, mantendo o package ID e versão superior.
6. Instalar ou atualizar o APK no telefone de teste, conceder permissão de notificações e fazer login com um cliente **ligado a um veículo real**. O telefone deve ter Google Play Services e acesso à internet.

## Roteiro de teste

1. No Admin → Alertas Preventivos, conferir que o veículo aparece com **1 aparelho** ou mais e que Firebase está configurado.
2. Escolher o veículo, por exemplo, Troca das pastilhas de freio e `5` km. Clicar em **Enviar notificação de teste**.
3. Deixar o app fechado de forma normal (não executar **Forçar parada** nas Configurações Android), com internet ativa e permissão de notificações.
4. Aguardar a notificação do Android. Som/vibração e heads-up dependem do canal, modo Não Perturbe, bateria e configurações do aparelho. **A tela inteira automática sobre outros apps não é garantida.**
5. Consultar o histórico no Admin:
   - `ACCEPTED_BY_FCM`: servidor Google aceitou, **não** prova entrega.
   - `RECEIVED`: serviço Android processou a mensagem e respondeu ao Render.
   - `OPENED`: clique no alerta levou ao aplicativo e o evento de abertura foi enviado.
   - `FAILED`: erro informado pelo FCM ou conexão.
6. Tocar no alerta, escolher oficina credenciada, data e hora. Confirmar direto no DNA AUTO para registrar no banco (sem WhatsApp) e verificar a agenda da oficina e o PDF diário da agenda.

## Limitações importantes

- Nenhuma funcionalidade Android pode garantir abertura automática de tela cheia em qualquer situação; o sistema usa um canal de **alta importância**, que pode produzir heads-up quando permitido.
- Se o app foi explicitamente **forçado a parar**, o Android normalmente não entrega push até ser aberto novamente.
- O monitoramento por GPS estima quilômetros; ele não equivale ao hodômetro real. O push automático no servidor depende de registros de quilometragem/predição **sincronizados**.
- Sem configurar as credenciais e validar um APK assinado em um dispositivo físico, **não** afirmar que o push está funcionando em produção.
