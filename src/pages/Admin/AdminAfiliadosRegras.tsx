// /admin/afiliados/regras — as REGRAS GERAIS dos afiliados e da gamificação,
// em tela própria (pedido do João, 21/10/2026: a configuração não fica em
// cima da lista).
//
//   Comissões e cupom   ativação, recorrência, desconto do cupom, periodicidade
//                       padrão, janela do link
//   Carteira            carência, validade do saldo, teto mensal de prêmios
//   Níveis              CRUD (indicador e afiliado): nome, ícone, critério,
//                       multiplicador, ativo
//   Conquistas          CRUD: nome, descrição, ícone, público, bônus, ativa
//
// Comissões/carteira passam pela rota (op config-salvar, com log). Níveis e
// conquistas vão direto nas tabelas pela RLS de admin — o mesmo padrão da
// tela de preços. O MOTOR só reconhece as conquistas cujo código ele conhece
// (api/_lib/incentivos/gamificacao.ts); conquista nova aqui fica na vitrine
// até ganhar regra lá.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { lerConfigIncentivos, salvarConfigIncentivos, type ConfigIncentivos } from '../../lib/shop/incentivos';
import { Avisos, Botao, Campo, Chip, Grade, PaginaAdmin, Secao } from './comuns/Pagina';
import { campoEstilo, pctTexto } from './comuns/formato';
import styles from './Admin.module.css';
import ped from './AdminPedidos.module.css';

interface Nivel {
  id?: number;
  publico: 'indicador' | 'afiliado';
  ordem: number;
  nome: string;
  icone: string;
  criterio_tipo: 'indicados_12m' | 'faturamento_12m';
  criterio_valor: string;
  multiplicador: string;
  ativo: boolean;
}

interface Conquista {
  codigo: string;
  nova?: boolean;
  nome: string;
  descricao: string;
  icone: string;
  publico: 'indicador' | 'afiliado' | 'todos';
  bonus_valor: string;
  ativa: boolean;
  ordem: number;
}

const CODIGOS_DO_MOTOR = ['primeira_indicacao', 'primeiro_aprovado', 'primeira_venda', 'primeiro_saque', 'tres_no_mes', 'indicou_platinum', 'sequencia_3', 'nivel_campeao'];

const num = (s: string | undefined) => {
  const t = (s ?? '').trim().replace(',', '.');
  return t === '' ? null : Number(t);
};

export default function AdminAfiliadosRegras() {
  const [config, setConfig] = useState<ConfigIncentivos | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState('');
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [{ config: c }, n, q] = await Promise.all([lerConfigIncentivos(), supabase.from('niveis_programa').select('*').order('publico').order('ordem'), supabase.from('conquistas').select('*').order('ordem')]);
      setConfig(c);
      setForm({
        pctAtivacaoAfiliado: pctTexto(c.pctAtivacaoAfiliado),
        pctRecorrenciaAfiliado: pctTexto(c.pctRecorrenciaAfiliado),
        descontoCupomAfiliadoPct: pctTexto(c.descontoCupomAfiliadoPct),
        periodicidadePadrao: c.periodicidadePadrao,
        diasAtribuicao: String(c.diasAtribuicao),
        diasLiberacao: String(c.diasLiberacao),
        mesesValidade: String(c.mesesValidade),
        tetoMensalPremios: c.tetoMensalPremios == null ? '' : pctTexto(c.tetoMensalPremios),
        estornarConquistaCancelamento: c.estornarConquistaCancelamento ? '1' : '',
        saldoNoCheckout: c.saldoNoCheckout ? '1' : '',
        cobrancaMinima: pctTexto(c.cobrancaMinima),
      });
      setNiveis(((n.data ?? []) as Record<string, unknown>[]).map((x) => ({ id: Number(x.id), publico: x.publico as Nivel['publico'], ordem: Number(x.ordem), nome: String(x.nome), icone: String(x.icone ?? ''), criterio_tipo: x.criterio_tipo as Nivel['criterio_tipo'], criterio_valor: pctTexto(Number(x.criterio_valor)), multiplicador: pctTexto(Number(x.multiplicador)), ativo: x.ativo !== false })));
      setConquistas(((q.data ?? []) as Record<string, unknown>[]).map((x) => ({ codigo: String(x.codigo), nome: String(x.nome), descricao: String(x.descricao ?? ''), icone: String(x.icone ?? ''), publico: x.publico as Conquista['publico'], bonus_valor: pctTexto(Number(x.bonus_valor)), ativa: x.ativa !== false, ordem: Number(x.ordem ?? 0) })));
      setErro(n.error?.message ?? q.error?.message ?? '');
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const salvarComissoes = async () => {
    const patch: Partial<ConfigIncentivos> = {
      pctAtivacaoAfiliado: num(form.pctAtivacaoAfiliado) ?? 0,
      pctRecorrenciaAfiliado: num(form.pctRecorrenciaAfiliado) ?? 0,
      descontoCupomAfiliadoPct: num(form.descontoCupomAfiliadoPct) ?? 0,
      periodicidadePadrao: form.periodicidadePadrao === 'quinzenal' ? 'quinzenal' : 'mensal',
      diasAtribuicao: num(form.diasAtribuicao) ?? 30,
      diasLiberacao: num(form.diasLiberacao) ?? 7,
      mesesValidade: num(form.mesesValidade) ?? 12,
      tetoMensalPremios: num(form.tetoMensalPremios),
      estornarConquistaCancelamento: form.estornarConquistaCancelamento === '1',
      saldoNoCheckout: form.saldoNoCheckout === '1',
      cobrancaMinima: num(form.cobrancaMinima) ?? 5,
    };
    if (Object.values(patch).some((v) => typeof v === 'number' && (!Number.isFinite(v) || v < 0))) {
      setErro('Percentuais, dias e valores precisam ser números maiores ou iguais a zero.');
      return;
    }
    setSalvando('config');
    setErro('');
    setMsg('');
    try {
      const r = await salvarConfigIncentivos(patch);
      setConfig(r.config);
      setMsg('Regras salvas. Valem para o próximo pedido faturado.');
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando('');
    }
  };

  // ------------------------------------------------------------- níveis
  const salvarNiveis = async () => {
    setSalvando('niveis');
    setErro('');
    setMsg('');
    const falhas: string[] = [];
    for (const n of niveis) {
      const linha = { publico: n.publico, ordem: n.ordem, nome: n.nome.trim(), icone: n.icone.trim() || null, criterio_tipo: n.criterio_tipo, criterio_valor: num(n.criterio_valor) ?? 0, multiplicador: num(n.multiplicador) ?? 1, ativo: n.ativo };
      if (!linha.nome) {
        falhas.push(`nível ${n.ordem} sem nome`);
        continue;
      }
      const { error } = n.id ? await supabase.from('niveis_programa').update(linha).eq('id', n.id) : await supabase.from('niveis_programa').insert(linha);
      if (error) falhas.push(`${linha.nome}: ${error.message}`);
    }
    setSalvando('');
    if (falhas.length) setErro(`Não salvou tudo: ${falhas.join(' · ')}`);
    else setMsg('Níveis salvos.');
    await carregar();
  };

  const excluirNivel = async (n: Nivel) => {
    if (!n.id) {
      setNiveis((l) => l.filter((x) => x !== n));
      return;
    }
    if (!window.confirm(`Excluir o nível "${n.nome}"? Quem estava nele cai para o nível anterior.`)) return;
    const { error } = await supabase.from('niveis_programa').delete().eq('id', n.id);
    if (error) setErro(error.message);
    await carregar();
  };

  const novoNivel = (publico: Nivel['publico']) => {
    const dos = niveis.filter((n) => n.publico === publico);
    const ordem = dos.length ? Math.max(...dos.map((n) => n.ordem)) + 1 : 1;
    setNiveis((l) => [...l, { publico, ordem, nome: '', icone: '🏅', criterio_tipo: publico === 'afiliado' ? 'faturamento_12m' : 'indicados_12m', criterio_valor: '0', multiplicador: '1', ativo: true }]);
  };

  // --------------------------------------------------------- conquistas
  const salvarConquistas = async () => {
    setSalvando('conquistas');
    setErro('');
    setMsg('');
    const falhas: string[] = [];
    for (const c of conquistas) {
      const codigo = c.codigo.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (!codigo || !c.nome.trim()) {
        falhas.push('conquista sem código ou nome');
        continue;
      }
      const linha = { codigo, nome: c.nome.trim(), descricao: c.descricao.trim() || null, icone: c.icone.trim() || null, publico: c.publico, bonus_valor: num(c.bonus_valor) ?? 0, ativa: c.ativa, ordem: c.ordem };
      const { error } = await supabase.from('conquistas').upsert(linha, { onConflict: 'codigo' });
      if (error) falhas.push(`${linha.nome}: ${error.message}`);
    }
    setSalvando('');
    if (falhas.length) setErro(`Não salvou tudo: ${falhas.join(' · ')}`);
    else setMsg('Conquistas salvas.');
    await carregar();
  };

  const excluirConquista = async (c: Conquista) => {
    if (c.nova) {
      setConquistas((l) => l.filter((x) => x !== c));
      return;
    }
    if (!window.confirm(`Excluir a conquista "${c.nome}"? Quem já tinha perde o registro dela.`)) return;
    const { error } = await supabase.from('conquistas').delete().eq('codigo', c.codigo);
    if (error) setErro(error.message);
    await carregar();
  };

  if (carregando && !config) return <p className={ped.mudo}>Carregando…</p>;

  const tabelaNiveis = (publico: Nivel['publico']) => {
    const lista = niveis.filter((n) => n.publico === publico).sort((a, b) => a.ordem - b.ordem);
    return (
      <div className={styles.tableScroll} style={{ marginBottom: '0.75rem' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Ordem</th>
              <th>Nome</th>
              <th style={{ width: 70 }}>Ícone</th>
              <th>Critério</th>
              <th style={{ width: 130 }}>{publico === 'afiliado' ? 'R$ em 12 meses' : 'Indicados em 12 meses'}</th>
              <th style={{ width: 120 }}>Multiplicador</th>
              <th style={{ width: 70 }}>Ativo</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((n) => {
              const set = (patch: Partial<Nivel>) => setNiveis((l) => l.map((x) => (x === n ? { ...x, ...patch } : x)));
              return (
                <tr key={n.id ?? `novo-${n.ordem}`}>
                  <td>
                    <input style={campoEstilo} inputMode="numeric" value={n.ordem} onChange={(e) => set({ ordem: Number(e.target.value) || 0 })} />
                  </td>
                  <td>
                    <input style={campoEstilo} value={n.nome} onChange={(e) => set({ nome: e.target.value })} />
                  </td>
                  <td>
                    <input style={campoEstilo} value={n.icone} onChange={(e) => set({ icone: e.target.value })} />
                  </td>
                  <td>
                    <select style={campoEstilo} value={n.criterio_tipo} onChange={(e) => set({ criterio_tipo: e.target.value as Nivel['criterio_tipo'] })}>
                      <option value="indicados_12m">indicados que compraram (12 meses)</option>
                      <option value="faturamento_12m">R$ gerado (12 meses)</option>
                    </select>
                  </td>
                  <td>
                    <input style={campoEstilo} inputMode="decimal" value={n.criterio_valor} onChange={(e) => set({ criterio_valor: e.target.value })} />
                  </td>
                  <td>
                    <input style={campoEstilo} inputMode="decimal" value={n.multiplicador} onChange={(e) => set({ multiplicador: e.target.value })} />
                  </td>
                  <td>
                    <input type="checkbox" checked={n.ativo} onChange={(e) => set({ ativo: e.target.checked })} />
                  </td>
                  <td>
                    <Botao variante="perigo" onClick={() => void excluirNivel(n)}>
                      Excluir
                    </Botao>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <PaginaAdmin
      titulo="Regras gerais dos afiliados"
      voltar={{ para: '/admin/afiliados', rotulo: 'Afiliados' }}
      descricao="Valem para quem não tem valor próprio na tela do afiliado. Valores iniciais são fictícios: ajuste depois de fazer as contas. Cada bloco tem o seu botão de salvar."
    >
      <Avisos erro={erro} msg={msg} />

      <Secao
        titulo="Comissões e cupom do afiliado"
        descricao="Ativação = 1ª compra faturada de cada filiado. Recorrência = compras seguintes, somadas por período e liberadas no fim dele. O cupom do afiliado pode dar desconto a quem usa (0 = só identifica)."
        acoes={
          <Botao variante="principal" disabled={salvando === 'config'} onClick={() => void salvarComissoes()}>
            {salvando === 'config' ? 'Salvando…' : 'Salvar comissões e carteira'}
          </Botao>
        }
      >
        <Grade min={180}>
          <Campo label="Ativação (%)">
            <input style={campoEstilo} inputMode="decimal" value={form.pctAtivacaoAfiliado ?? ''} onChange={(e) => setForm((f) => ({ ...f, pctAtivacaoAfiliado: e.target.value }))} />
          </Campo>
          <Campo label="Recorrência (%)">
            <input style={campoEstilo} inputMode="decimal" value={form.pctRecorrenciaAfiliado ?? ''} onChange={(e) => setForm((f) => ({ ...f, pctRecorrenciaAfiliado: e.target.value }))} />
          </Campo>
          <Campo label="Desconto do cupom do afiliado (%)">
            <input style={campoEstilo} inputMode="decimal" value={form.descontoCupomAfiliadoPct ?? ''} onChange={(e) => setForm((f) => ({ ...f, descontoCupomAfiliadoPct: e.target.value }))} />
          </Campo>
          <Campo label="Periodicidade padrão" dica="o afiliado pode trocar a dele">
            <select style={campoEstilo} value={form.periodicidadePadrao ?? 'mensal'} onChange={(e) => setForm((f) => ({ ...f, periodicidadePadrao: e.target.value }))}>
              <option value="mensal">mensal</option>
              <option value="quinzenal">quinzenal</option>
            </select>
          </Campo>
          <Campo label="Janela do link (dias)" dica="último clique em ?ref= sem cadastro">
            <input style={campoEstilo} inputMode="numeric" value={form.diasAtribuicao ?? ''} onChange={(e) => setForm((f) => ({ ...f, diasAtribuicao: e.target.value }))} />
          </Campo>
        </Grade>
        <h4 className={styles.tableSectionTitle} style={{ marginTop: '1.25rem' }}>
          Carteira (vale para afiliados e super cupom)
        </h4>
        <Grade min={180}>
          <Campo label="Carência (dias)" dica="do faturamento até o saldo ficar disponível">
            <input style={campoEstilo} inputMode="numeric" value={form.diasLiberacao ?? ''} onChange={(e) => setForm((f) => ({ ...f, diasLiberacao: e.target.value }))} />
          </Campo>
          <Campo label="Validade do saldo (meses)" dica="o que vence volta para a NZ">
            <input style={campoEstilo} inputMode="numeric" value={form.mesesValidade ?? ''} onChange={(e) => setForm((f) => ({ ...f, mesesValidade: e.target.value }))} />
          </Campo>
          <Campo label="Teto mensal de prêmios (R$)" dica="bônus das conquistas; vazio = sem bônus em dinheiro">
            <input style={campoEstilo} inputMode="decimal" value={form.tetoMensalPremios ?? ''} onChange={(e) => setForm((f) => ({ ...f, tetoMensalPremios: e.target.value }))} />
          </Campo>
          <Campo label="Pedido cancelado devolve a conquista" dica="e estorna o bônus dela, se o fato deixou de valer">
            <select style={campoEstilo} value={form.estornarConquistaCancelamento ?? '1'} onChange={(e) => setForm((f) => ({ ...f, estornarConquistaCancelamento: e.target.value }))}>
              <option value="1">sim</option>
              <option value="">não</option>
            </select>
          </Campo>
          <Campo label="Usar o saldo no checkout" dica="o cliente abate o pedido com a carteira">
            <select style={campoEstilo} value={form.saldoNoCheckout ?? '1'} onChange={(e) => setForm((f) => ({ ...f, saldoNoCheckout: e.target.value }))}>
              <option value="1">sim</option>
              <option value="">não</option>
            </select>
          </Campo>
          <Campo label="Cobrança mínima no Asaas (R$)" dica="o que sobra após o saldo nunca fica abaixo disso">
            <input style={campoEstilo} inputMode="decimal" value={form.cobrancaMinima ?? ''} onChange={(e) => setForm((f) => ({ ...f, cobrancaMinima: e.target.value }))} />
          </Campo>
        </Grade>
      </Secao>

      <Secao
        titulo="Níveis"
        descricao="Tema de corrida (Largada → Campeão). O nível sobe pelo critério dos últimos 12 meses e dá um multiplicador ao cashback/comissão. Indicador = quem usa o super cupom; afiliado = o parceiro aprovado."
        acoes={
          <>
            <Botao onClick={() => novoNivel('indicador')}>+ nível de indicador</Botao>
            <Botao onClick={() => novoNivel('afiliado')}>+ nível de afiliado</Botao>
            <Botao variante="principal" disabled={salvando === 'niveis'} onClick={() => void salvarNiveis()}>
              {salvando === 'niveis' ? 'Salvando…' : 'Salvar níveis'}
            </Botao>
          </>
        }
      >
        <p className={ped.mudo}>Indicadores</p>
        {tabelaNiveis('indicador')}
        <p className={ped.mudo}>Afiliados</p>
        {tabelaNiveis('afiliado')}
      </Secao>

      <Secao
        titulo="Conquistas"
        descricao="Medalhas colecionáveis. O bônus em R$ entra na carteira dentro do teto mensal; passou do teto, a conquista sai sem bônus. Conquista nova fica visível no painel, mas só é concedida quando o motor tiver a regra dela."
        acoes={
          <>
            <Botao onClick={() => setConquistas((l) => [...l, { codigo: '', nova: true, nome: '', descricao: '', icone: '🏅', publico: 'todos', bonus_valor: '0', ativa: true, ordem: l.length + 1 }])}>+ conquista</Botao>
            <Botao variante="principal" disabled={salvando === 'conquistas'} onClick={() => void salvarConquistas()}>
              {salvando === 'conquistas' ? 'Salvando…' : 'Salvar conquistas'}
            </Botao>
          </>
        }
      >
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Ordem</th>
                <th style={{ width: 170 }}>Código</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th style={{ width: 70 }}>Ícone</th>
                <th style={{ width: 120 }}>Para</th>
                <th style={{ width: 110 }}>Bônus (R$)</th>
                <th style={{ width: 70 }}>Ativa</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {conquistas.map((c) => {
                const set = (patch: Partial<Conquista>) => setConquistas((l) => l.map((x) => (x === c ? { ...x, ...patch } : x)));
                return (
                  <tr key={c.codigo || `nova-${c.ordem}`}>
                    <td>
                      <input style={campoEstilo} inputMode="numeric" value={c.ordem} onChange={(e) => set({ ordem: Number(e.target.value) || 0 })} />
                    </td>
                    <td>
                      <input style={campoEstilo} value={c.codigo} disabled={!c.nova} onChange={(e) => set({ codigo: e.target.value })} />
                      {!CODIGOS_DO_MOTOR.includes(c.codigo) && c.codigo ? (
                        <small className={ped.mudo}>sem regra no motor</small>
                      ) : null}
                    </td>
                    <td>
                      <input style={campoEstilo} value={c.nome} onChange={(e) => set({ nome: e.target.value })} />
                    </td>
                    <td>
                      <input style={campoEstilo} value={c.descricao} onChange={(e) => set({ descricao: e.target.value })} />
                    </td>
                    <td>
                      <input style={campoEstilo} value={c.icone} onChange={(e) => set({ icone: e.target.value })} />
                    </td>
                    <td>
                      <select style={campoEstilo} value={c.publico} onChange={(e) => set({ publico: e.target.value as Conquista['publico'] })}>
                        <option value="todos">todos</option>
                        <option value="indicador">indicador</option>
                        <option value="afiliado">afiliado</option>
                      </select>
                    </td>
                    <td>
                      <input style={campoEstilo} inputMode="decimal" value={c.bonus_valor} onChange={(e) => set({ bonus_valor: e.target.value })} />
                    </td>
                    <td>
                      <input type="checkbox" checked={c.ativa} onChange={(e) => set({ ativa: e.target.checked })} />
                    </td>
                    <td>
                      <Botao variante="perigo" onClick={() => void excluirConquista(c)}>
                        Excluir
                      </Botao>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={ped.mudo} style={{ marginTop: '0.5rem' }}>
          Teto mensal atual: {config?.tetoMensalPremios == null ? <Chip tom="atencao">sem teto (nenhum bônus em dinheiro)</Chip> : <Chip tom="ok">R$ {pctTexto(config.tetoMensalPremios)}</Chip>}
        </p>
      </Secao>
    </PaginaAdmin>
  );
}
