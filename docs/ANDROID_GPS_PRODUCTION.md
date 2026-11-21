# DNA AUTO v2.5.6 — GPS nativo e avisos de revisão

## Regra de negócio

O APK cliente usa o serviço Android nativo `DnaMileageService`, independente da WebView, para coletar e guardar resumos de deslocamentos. A leitura confirmada do hodômetro permanece a referência; distância GPS é apenas estimativa.

- Quando restam aproximadamente **80 km para a manutenção mais próxima**, gerar pré-aviso.
- Quando restam aproximadamente **50 km**, solicitar ao cliente a quilometragem real do painel, preferencialmente na primeira tela quando o carro estiver parado.
- Quando restam aproximadamente **40 km**, disparar aviso Android de alta prioridade com **nome da manutenção**, som/vibração conforme preferências do aparelho e atalho para agendar. Ao retornar ao aplicativo, exibir um painel de destaque com borda pulsante, quilometragem estimada, nome da peça, agendamento e confirmação do hodômetro.
- Se o dispositivo indicar deslocamento, adiar a abertura do painel interno até que o carro esteja parado. O usuário deve interagir somente estacionado. O aviso é emitido uma vez por meta e leitura-base.
- Após a confirmação, recalcular previsões e reiniciar o ciclo, sem alertar em loop para o mesmo alvo. O usuário ainda precisa realizar a manutenção na oficina.
- Não somar viagens anteriores à hora da confirmação nem viagens rejeitadas.
- Só coletar dados com consentimento explícito, autenticação válida e veículo vinculado ao titular. O cliente pode desligar o rastreamento.
- Se não houver manutenção programada com quilometragem válida, não criar um prazo fictício.

## Visibilidade do alerta quando o app está fechado

Enquanto o serviço nativo de GPS estiver autorizado e em execução, o Android poderá exibir uma notificação **heads-up** de manutenção mesmo com a tela do DNA AUTO fechada. O usuário pode tocar nela para voltar ao aplicativo e ver a tela de destaque. O comportamento visual e sonoro depende das permissões, canais e preferências do celular; não é garantido em todos os fabricantes.

**O APK não força a abertura automática de uma atividade em tela cheia sobre outros aplicativos.** No Android 14+, intents de tela cheia são reservadas essencialmente a apps de chamadas e alarmes; usar esse privilégio para revisões automotivas poderia conflitar com as regras da Google Play. A borda do painel tem pulsação suave, com respeito à preferência de movimento reduzido.

## Android e limites reais

O script `scripts/dna-mileage-android.js` injeta um `ForegroundService` nativo persistente, receptor de reinicialização e plugin `DnaMileage` no build, e usa `SharedPreferences` para manter viagens até sincronização. A notificação permanente deve estar visível enquanto o serviço estiver ativo. O JavaScript do portal apenas autoriza/configura, consulta e sincroniza dados.

A coleta com tela bloqueada ou app fora do primeiro plano é possível enquanto o Android mantiver o serviço. **Não é garantida após Forçar parada**, revogação de localização, desligamento do aparelho, economia agressiva de bateria ou restrições do fabricante. Reinício automático após boot também depende das regras do Android e do fabricante.

O GPS do telefone **não consegue provar** qual veículo está sendo usado. Ônibus, carona, trem ou outro carro podem produzir trajetos parecidos; classificação de 70 pontos não é uma taxa de acurácia comprovada. A confirmação real do painel corrige o uso estimado.

## Aceitação em aparelho real

1. Compile e instale o APK cliente v2.5.6 / 256. Faça login com cliente que tenha veículo vinculado.
2. Em Privacidade & Sensores, autorize monitoramento, localização precisa e notificação (Android 13+). Quando disponível, habilite acesso à localização o tempo todo.
3. Confirme a leitura do painel inicial e crie uma meta de revisão real. Conduza acima de 20 km/h com a tela ligada e depois bloqueada.
4. Confirme a notificação Android de serviço, a fila local, o envio autenticado após reconexão e a ausência de duplicação.
5. Verifique os pontos de 80 km restantes e 50 km restantes, com chamada para confirmar hodômetro apenas quando necessário.
6. Faça uma segunda confirmação no mesmo dia, confira a reconciliação por horário. Revogue permissão de GPS e confirme que a coleta para.
7. Teste em Android 12–15 e aparelhos Samsung, Motorola e Xiaomi, incluindo reboot e encerramento pelo sistema. Documente qualquer interrupção sem declarar funcionamento 24/7.
8. Execute `npm run test:monitoring` e `npm test`; valide o build Android em PR.

## Assinatura e distribuição do APK

O workflow de release deixa de publicar APKs debug com chaves aleatórias. Para gerar atualização instalável sobre versões futuras assinadas com a **mesma chave**, configurar no repositório GitHub Actions Secrets:

- `DNA_ANDROID_KEYSTORE_BASE64`: keystore Android estável em Base64, guardado fora do repositório.
- `DNA_ANDROID_STORE_PASSWORD`: senha do keystore.
- `DNA_ANDROID_KEY_ALIAS`: alias.
- `DNA_ANDROID_KEY_PASSWORD`: senha da chave.

A compilação em PR gera APK debug apenas para testes; publicar no master exige os quatro segredos. Caso APKs antigos usem uma assinatura debug descartada, o Android poderá exigir desinstalação/reinstalação para a primeira migração assinada. Faça backup de quaisquer dados locais antes de reinstalar.

O workflow usa por padrão a origem `https://dna-auto-byin.onrender.com`; confirme a correspondência com o servidor real que recebe os deploys antes da publicação. O PR não atualiza produção automaticamente.
