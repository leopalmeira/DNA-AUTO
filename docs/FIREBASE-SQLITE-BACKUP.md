# Firebase Storage: backup e restauracao automatica do SQLite

Esta preparacao nao substitui o SQLite por Firestore: cria backup do banco em Cloud Storage do Firebase e o restaura antes do inicio do servidor quando o disco estiver vazio.

Configuracao unica no Render:
1. Ative um bucket Cloud Storage PRIVADO no Firebase (exige plano Blaze, com possiveis cobrancas).
2. Defina FIREBASE_SERVICE_ACCOUNT_JSON como JSON da conta de servico com acesso minimo ao bucket. NUNCA salve essa chave no GitHub.
3. Defina FIREBASE_STORAGE_BUCKET como o nome real do bucket, por exemplo seu-projeto.firebasestorage.app.
4. Mantenha JWT_SECRET original e DB_PATH no diretorio desejado. Antes de configurar, salve uma copia do banco SQLite atualmente em producao.
5. Se tanto o banco local quanto o backup remoto estiverem ausentes, o servidor nao inicia para nao apagar cadastros. Somente em um projeto realmente novo, defina temporariamente FIREBASE_ALLOW_EMPTY_INIT=1 e remova essa variavel apos a primeira copia.
6. Confirme a existencia do objeto privado dna-auto/production/sqlite-latest.db no bucket.

Funcionamento:
- Restauracao do banco ANTES do modulo db.js ser carregado.
- Snapshot SQLite transacional via better-sqlite3, compativel com journal WAL.
- Backup imediato na inicializacao, a cada 30 segundos quando houver alteracoes, e tentativa final no SIGTERM/SIGINT.
- Quando as variaveis Firebase nao estao configuradas, o programa funciona como antes e registra um alerta de risco em disco efemero.

Limitacoes importantes: backups nao garantem perda zero entre gravacao e falha abrupta. Para persistencia transacional sem janela de perda, e necessario disco persistente no Render ou banco remoto gerenciado. Nao rode multiplas instancias no mesmo objeto de backup. O Cloud Storage Firebase requer plano Blaze e pode gerar custos.
