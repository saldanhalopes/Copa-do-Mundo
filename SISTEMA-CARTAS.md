# Sistema de Cartas — CryptoÁlbum Copa (estilo FIFA Ultimate Team)

Cada figurinha é uma **carta de jogador** com atributos fixos gravados on-chain.
Inspirado no FIFA Ultimate Team: OVR (overall) + 6 atributos + química de time.

---

## 1. Os 6 atributos (escala 1–99)

| Sigla | Atributo | O que mede |
|---|---|---|
| **PAC** | Pace (Ritmo) | Velocidade e aceleração |
| **SHO** | Shooting (Finalização) | Chute, potência, posicionamento |
| **PAS** | Passing (Passe) | Passe curto/longo, cruzamento |
| **DRI** | Dribbling (Drible) | Controle de bola, agilidade |
| **DEF** | Defending (Defesa) | Desarme, marcação, interceptação |
| **PHY** | Physical (Físico) | Força, resistência, agressividade |

**OVR (Overall)** = média ponderada dos atributos conforme a posição.
Ex.: um atacante pondera mais SHO+PAC; um zagueiro, DEF+PHY.

---

## 2. Raridades = faixas de qualidade (como no FIFA)

| Raridade | OVR | Supply | Visual da carta | Equivalente FIFA |
|---|---|---|---|---|
| **Comum** | 60–69 | 50.000 | Bronze fosco | Bronze / Prata |
| **Rara** | 70–79 | 10.000 | Prata metálica | Ouro não-raro |
| **Épica** | 80–86 | 2.500 | Ouro brilhante | Ouro raro |
| **Lendária** | 87–92 | 500 | Holográfica animada | TOTW / Inform |
| **Mítica** | 93–99 | 10–50 | Vídeo + aura | Icon / TOTY |

A raridade **não é só estética** — ela determina a faixa de OVR. Uma carta lendária sempre será melhor que uma comum no modo Fantasy.

---

## 3. Atributos por posição (perfis)

Cada posição tem um "perfil" que define como os atributos são distribuídos:

| Posição | Atributos fortes | Atributos fracos |
|---|---|---|
| **GOL** (Goleiro) | DEF, PHY (reflexos) | PAC, DRI |
| **ZAG** (Zagueiro) | DEF, PHY | SHO, DRI |
| **LD/LE** (Laterais) | PAC, DEF, PAS | SHO |
| **VOL** (Volante) | DEF, PAS, PHY | PAC |
| **MEI** (Meia) | PAS, DRI, SHO | DEF |
| **PD/PE** (Pontas) | PAC, DRI | DEF, PHY |
| **CAM** (Camisa 10) | DRI, PAS, SHO | DEF |

---

## 4. Como os atributos chegam à blockchain (imutável)

```
1. Gerador cria 680 cartas → atributos + raridade + OVR
2. Atributos codificados em uint256 (packed) por tokenId
3. setStatsBatch() grava no contrato CardStats.sol
4. freezeStats() congela PARA SEMPRE
   → ninguém (nem a plataforma) pode alterar os stats depois
```

Cada carta ocupa apenas **48 bits** no contrato (6 atributos × 8 bits),
tornando barato gravar os 680 conjuntos de stats on-chain.

```
stats = PAC | (SHO<<8) | (PAS<<16) | (DRI<<24) | (DEF<<32) | (PHY<<40)
```

---

## 5. Modo Fantasy — para que servem os atributos

1. Usuário escala 11 cartas (formação 4-3-3, 4-4-2, etc.)
2. **Química**: cartas da mesma seleção ganham bônus (como no FIFA UT)
3. Pontuação Fantasy baseada em:
   - OVR do time escalado
   - Química total (jogadores do mesmo país/posição certa)
   - Desempenho real dos jogadores no torneio (via oráculo)
4. Ranking semanal → prêmios do fundo de royalties

### Química (Chemistry)
- Carta na posição certa: +química
- 2+ cartas da mesma seleção: +química
- Time 100% de uma seleção: química máxima (boost de pontos)

---

## 6. Recebimento e validação (respostas diretas)

### Como RECEBER as figurinhas?
- Ao abrir um pacote, o `PackStore` chama `mintBatch()` e os NFTs vão
  **direto para a carteira** do usuário (ERC-1155).
- Sem custódia: a figurinha é do usuário no instante do mint.
- Aparecem automaticamente no álbum (lê `balanceOfBatch` da carteira).

### Como VALIDAR uma figurinha?
- **Autenticidade**: cada carta tem `tokenId` único e atributos gravados no
  `CardStats.sol`. Qualquer um verifica os stats on-chain — impossível falsificar.
- **Raridade real**: o supply é fixado no deploy. Se diz "Lendária 500/500",
  é porque o contrato só permite 500 mints daquele id.
- **Propriedade**: `balanceOf(carteira, tokenId)` prova que você tem.
- **Metadados congelados**: após `freezeMetadata()` e `freezeStats()`,
  a arte e os atributos não podem mudar — garantia eterna ao colecionador.
- No marketplace (OpenSea/Binance NFT), o selo de coleção verificada +
  o endereço do contrato confirmam que é uma figurinha oficial.
