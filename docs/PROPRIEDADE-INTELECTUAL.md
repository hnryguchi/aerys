# Checklist de propriedade intelectual

_Preparado em 14/10/2026. Este documento é um roteiro de verificação, **não é aconselhamento
jurídico**. Para decisões, consulte um advogado ou agente de propriedade industrial._

Nada aqui indica que o nome ou o software já estejam registrados. Nenhum registro protege
de forma absoluta contra cópia; registros ajudam a **comprovar** autoria e anterioridade.

## Marca “AERYS”

- [ ] Busca de anterioridade no INPI (classes prováveis: 9 — software/equipamentos; 42 — serviços
      de tecnologia/SaaS) e busca de nomes semelhantes em uso
- [ ] Verificar disponibilidade de domínio e perfis com o nome
- [ ] Avaliar depósito do pedido de registro de marca no INPI (e acompanhar o processo)

## Programa de computador

- [ ] Avaliar o registro de programa de computador no INPI (Lei 9.609/1998; o registro é
      declaratório e usa o resumo digital *hash* do código — o código não fica público)
- [ ] Definir qual versão registrar (ex.: tag `v0.1.0`) e guardar o *hash* gerado

## Evidências de autoria

- [ ] Manter o repositório privado com commits datados sob sua identidade pessoal
- [ ] Tags de versão em marcos (`v0.1.0` — MVP)
- [ ] Guardar este diretório `docs/` (decisões datadas) e fotos datadas dos protótipos
- [ ] Backup do repositório em local pessoal adicional

## Dependências e licenças

- [ ] Revisar licenças das dependências (`npx license-checker --summary` ou equivalente).
      Principais atuais: Next.js (MIT), React (MIT), Zod (MIT), qrcode (MIT), PGlite (Apache-2.0,
      só desenvolvimento), bibliotecas Adafruit do firmware (BSD/MIT — conferir cada uma)
- [ ] Manter avisos de licença exigidos por terceiros em eventuais distribuições

## Questões contratuais (importante)

- [ ] Ler o contrato de trabalho e políticas internas do empregador sobre **invenções/software
      desenvolvidos durante o vínculo**, uso de equipamentos e horário de trabalho
      (ver também art. 4º da Lei 9.609/1998 sobre programas desenvolvidos na vigência de contrato)
- [ ] Registrar que parte do desenvolvimento inicial (14/10/2026) foi feita **em equipamento e com
      conta de ferramenta vinculados ao empregador**. Avaliar com orientação jurídica se isso tem
      implicação e, se necessário, migrar o desenvolvimento para equipamento e contas exclusivamente pessoais
- [ ] Evitar desenvolver o projeto em horário de trabalho ou com recursos do empregador daqui em diante
- [ ] Se houver dúvida, considerar obter do empregador uma declaração de não interesse no projeto

## Licença do projeto

- [ ] Decidir a licença. Atualmente: proprietária, todos os direitos reservados (`UNLICENSED`).
      Não adotar licença open source sem decisão explícita.
