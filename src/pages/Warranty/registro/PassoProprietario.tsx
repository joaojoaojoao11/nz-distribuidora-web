// Passo 4 — proprietário. Os rótulos falam "do proprietário" porque quem
// preenche pode ser o dono ou o aplicador no balcão.
//
// Logado, a pessoa ganha um atalho "usar meus dados" — e não um preenchimento
// automático: o aplicador logado registrando o carro de um cliente não pode
// ver os próprios dados entrarem no certificado de outra pessoa.

import { useRef } from 'react';
import Campo from './Campo';
import { ariaDoCampo } from './aria';
import { formatarCpfCnpj } from '../../../lib/documento';
import { formatarTelefone, UFS } from '../../../lib/shop/conta';
import { buscarCep, formatarCep } from '../../../lib/shop/checkout';
import type { Rascunho } from '../../../lib/garantia';
import type { PropsDoPasso } from './tipos';
import styles from './Registro.module.css';

export interface MeusDados {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
}

interface Props extends PropsDoPasso {
  meusDados?: MeusDados | null;
}

export default function PassoProprietario({ r, mudar, erros, mostrar, meusDados }: Props) {
  const busca = useRef<AbortController | null>(null);
  const a = (campo: keyof Rascunho, dica = false) => ariaDoCampo(`g-${campo}`, erros[campo], mostrar, dica);

  const mudarCep = (bruto: string) => {
    const cep = formatarCep(bruto);
    mudar({ cep });
    busca.current?.abort();
    const digitos = cep.replace(/\D/g, '');
    if (digitos.length !== 8) return;
    const ctrl = new AbortController();
    busca.current = ctrl;
    void buscarCep(digitos, ctrl.signal).then((achou) => {
      if (!achou || ctrl.signal.aborted) return;
      mudar({
        cidade: achou.localidade,
        uf: achou.uf,
        ...(achou.logradouro ? { rua: achou.logradouro } : {}),
        ...(achou.bairro ? { bairro: achou.bairro } : {}),
      });
    });
  };

  const usarMeus = () => {
    if (!meusDados) return;
    mudar({
      nome: meusDados.nome || r.nome,
      cpf: meusDados.cpf ? formatarCpfCnpj(meusDados.cpf) : r.cpf,
      email: meusDados.email || r.email,
      telefone: meusDados.telefone ? formatarTelefone(meusDados.telefone) : r.telefone,
    });
  };

  return (
    <>
      {meusDados && (meusDados.nome || meusDados.cpf) && r.nome.trim() !== meusDados.nome.trim() && (
        <div className={styles.usarDados}>
          <span>A garantia é sua?</span>
          <button type="button" className={styles.atalho} onClick={usarMeus}>
            Usar meus dados
          </button>
        </div>
      )}

      <div className={styles.form}>
        <Campo id="g-cpf" rotulo="CPF ou CNPJ do proprietário" erro={erros.cpf} mostrar={mostrar}>
          <input
            {...a('cpf')}
            name="cpf"
            value={r.cpf}
            onChange={(e) => mudar({ cpf: e.target.value.replace(/[^\d./-]/g, '').slice(0, 18) })}
            onBlur={() => mudar({ cpf: formatarCpfCnpj(r.cpf) })}
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            enterKeyHint="next"
          />
        </Campo>

        <Campo id="g-nome" rotulo="Nome completo" erro={erros.nome} mostrar={mostrar}>
          <input
            {...a('nome')}
            name="nome"
            value={r.nome}
            onChange={(e) => mudar({ nome: e.target.value })}
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            maxLength={120}
          />
        </Campo>

        <Campo id="g-email" rotulo="E-mail" opcional erro={erros.email} mostrar={mostrar} dica="É por ele (ou pelo CPF) que a garantia aparece no painel do proprietário.">
          <input
            {...a('email', true)}
            name="email"
            type="email"
            value={r.email}
            onChange={(e) => mudar({ email: e.target.value })}
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="nome@exemplo.com"
            enterKeyHint="next"
          />
        </Campo>

        <Campo id="g-telefone" rotulo="Telefone / WhatsApp" opcional erro={erros.telefone} mostrar={mostrar}>
          <input
            {...a('telefone')}
            name="telefone"
            value={r.telefone}
            onChange={(e) => mudar({ telefone: formatarTelefone(e.target.value) })}
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            maxLength={15}
            enterKeyHint="next"
          />
        </Campo>

        <Campo id="g-cep" rotulo="CEP" opcional={!r.impresso} erro={erros.cep} mostrar={mostrar} dica="Preenche a cidade e o estado.">
          <input
            {...a('cep', true)}
            name="cep"
            value={r.cep}
            onChange={(e) => mudarCep(e.target.value)}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            maxLength={9}
            enterKeyHint="next"
          />
        </Campo>

        <div className={styles.form}>
          <Campo id="g-cidade" rotulo="Cidade" opcional={!r.impresso} erro={erros.cidade} mostrar={mostrar}>
            <input {...a('cidade')} name="cidade" value={r.cidade} onChange={(e) => mudar({ cidade: e.target.value })} autoComplete="address-level2" maxLength={80} />
          </Campo>
          <Campo id="g-uf" rotulo="UF" opcional={!r.impresso} erro={erros.uf} mostrar={mostrar}>
            <select {...a('uf')} name="uf" value={r.uf} onChange={(e) => mudar({ uf: e.target.value })} autoComplete="address-level1">
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <label className={`${styles.marcar} ${styles.campoLargo}`}>
          <input type="checkbox" checked={r.impresso} onChange={(e) => mudar({ impresso: e.target.checked })} />
          <span>
            <strong>Quero o certificado impresso</strong>
            Enviamos uma via pelos Correios para o endereço abaixo.
          </span>
        </label>

        {r.impresso && (
          <>
            <Campo id="g-rua" rotulo="Rua" largo erro={erros.rua} mostrar={mostrar}>
              <input {...a('rua')} name="rua" value={r.rua} onChange={(e) => mudar({ rua: e.target.value })} autoComplete="address-line1" maxLength={160} />
            </Campo>
            <Campo id="g-numero" rotulo="Número" erro={erros.numero} mostrar={mostrar}>
              <input {...a('numero')} name="numero" value={r.numero} onChange={(e) => mudar({ numero: e.target.value })} inputMode="numeric" maxLength={20} />
            </Campo>
            <Campo id="g-complemento" rotulo="Complemento" opcional>
              <input id="g-complemento" name="complemento" value={r.complemento} onChange={(e) => mudar({ complemento: e.target.value })} autoComplete="address-line2" maxLength={80} />
            </Campo>
            <Campo id="g-bairro" rotulo="Bairro" opcional largo>
              <input id="g-bairro" name="bairro" value={r.bairro} onChange={(e) => mudar({ bairro: e.target.value })} maxLength={80} />
            </Campo>
          </>
        )}
      </div>
    </>
  );
}
