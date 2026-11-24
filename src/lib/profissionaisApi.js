import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const VINCULOS_STORAGE_KEY = '@prontovital:vinculos_especialidades';
const CATALOGO_ESP_STORAGE_KEY = '@prontovital:catalogo_especialidades';

export const LISTA_ESPECIALIDADES_PADRAO = [
  {
    id_especialidade: 1,
    nome: 'Clínica Geral',
    descricao: 'Atendimento médico preventivo, diagnóstico primário e encaminhamentos.',
    status: true,
  },
  {
    id_especialidade: 2,
    nome: 'Pediatria',
    descricao: 'Assistência médica a bebês, crianças e adolescentes.',
    status: true,
  },
  {
    id_especialidade: 3,
    nome: 'Ginecologia e Obstetrícia',
    descricao: 'Saúde da mulher, gestação e parto.',
    status: true,
  },
  {
    id_especialidade: 4,
    nome: 'Ortopedia e Traumatologia',
    descricao: 'Cuidado de ossos, músculos, articulações e traumas físicos.',
    status: true,
  },
  {
    id_especialidade: 5,
    nome: 'Cardiologia',
    descricao: 'Diagnóstico e tratamento de doenças do coração e sistema cardiovascular.',
    status: true,
  },
  {
    id_especialidade: 6,
    nome: 'Oftalmologia',
    descricao: 'Tratamento e cirurgias de doenças relacionadas aos olhos e à visão.',
    status: true,
  },
  {
    id_especialidade: 7,
    nome: 'Otorrinolaringologia',
    descricao: 'Tratamento de doenças do ouvido, nariz e garganta.',
    status: true,
  },
  {
    id_especialidade: 8,
    nome: 'Dermatologia',
    descricao: 'Diagnóstico e tratamento de doenças da pele, cabelo e unhas.',
    status: true,
  },
  {
    id_especialidade: 9,
    nome: 'Gastroenterologia',
    descricao: 'Tratamento de doenças do aparelho digestivo.',
    status: true,
  },
  {
    id_especialidade: 10,
    nome: 'Endocrinologia',
    descricao: 'Tratamento de distúrbios hormonais e metabólicos.',
    status: true,
  },
  {
    id_especialidade: 11,
    nome: 'Neurologia',
    descricao: 'Tratamento de distúrbios do sistema nervoso e cérebro.',
    status: true,
  },
  {
    id_especialidade: 12,
    nome: 'Psiquiatria',
    descricao: 'Diagnóstico e prevenção de transtornos mentais e comportamentais.',
    status: true,
  },
  {
    id_especialidade: 13,
    nome: 'Psicologia',
    descricao: 'Acompanhamento terapêutico e saúde emocional.',
    status: true,
  },
  {
    id_especialidade: 14,
    nome: 'Urologia',
    descricao: 'Tratamento do trato urinário e sistema reprodutor masculino.',
    status: true,
  },
  {
    id_especialidade: 15,
    nome: 'Odontologia',
    descricao: 'Saúde bucal, tratamento de dentes e gengivas.',
    status: true,
  },
];

async function lerJsonLocal(chave, padrao) {
  try {
    const raw = await AsyncStorage.getItem(chave);
    return raw ? JSON.parse(raw) : padrao;
  } catch {
    return padrao;
  }
}

export async function listarEspecialidades({ apenasAtivas = false } = {}) {
  const customizacoes = await lerJsonLocal(CATALOGO_ESP_STORAGE_KEY, {});
  let base = LISTA_ESPECIALIDADES_PADRAO;

  try {
    const { data } = await api.get('/especialidades');
    if (Array.isArray(data) && data.length > 0) {
      base = data.map((item) => {
        const padrao = LISTA_ESPECIALIDADES_PADRAO.find(
          (p) => String(p.id_especialidade) === String(item.id_especialidade)
        );
        return {
          id_especialidade: Number(item.id_especialidade),
          nome: item.nome || padrao?.nome || 'Especialidade',
          descricao: item.descricao || padrao?.descricao || 'Especialidade médica disponível para consulta.',
          status: item.status !== undefined ? Boolean(item.status) : true,
        };
      });
    }
  } catch {}

  const listaCompleta = base.map((esp) => {
    const override = customizacoes[String(esp.id_especialidade)];
    return override ? { ...esp, ...override } : esp;
  });

  const extras = Object.values(customizacoes).filter((c) => c.isNova);
  const unificadas = [...listaCompleta, ...extras];

  return apenasAtivas ? unificadas.filter((e) => e.status !== false) : unificadas;
}

export async function salvarEspecialidadeCatalogo(especialidade) {
  const customizacoes = await lerJsonLocal(CATALOGO_ESP_STORAGE_KEY, {});
  const id = especialidade.id_especialidade || Date.now();
  customizacoes[String(id)] = {
    id_especialidade: Number(id),
    nome: String(especialidade.nome || '').trim(),
    descricao: String(especialidade.descricao || '').trim(),
    status: Boolean(especialidade.status),
    isNova: Boolean(especialidade.isNova),
  };
  await AsyncStorage.setItem(CATALOGO_ESP_STORAGE_KEY, JSON.stringify(customizacoes));
  return customizacoes[String(id)];
}

export async function alternarStatusEspecialidade(especialidade) {
  return salvarEspecialidadeCatalogo({
    ...especialidade,
    status: !especialidade.status,
  });
}

export async function salvarVinculoEspecialidadeLocal(idProfissional, especialidade) {
  if (!idProfissional || !especialidade) return;
  const salvos = await lerJsonLocal(VINCULOS_STORAGE_KEY, {});
  salvos[String(idProfissional)] = {
    id_especialidade: Number(especialidade.id_especialidade),
    nome: especialidade.nome,
    descricao: especialidade.descricao,
    status: especialidade.status !== false,
  };
  await AsyncStorage.setItem(VINCULOS_STORAGE_KEY, JSON.stringify(salvos));
}

export async function vincularEspecialidade(idProfissional, idEspecialidade) {
  const catalogo = await listarEspecialidades();
  const espObj =
    catalogo.find((e) => String(e.id_especialidade) === String(idEspecialidade)) ||
    LISTA_ESPECIALIDADES_PADRAO[0];

  await salvarVinculoEspecialidadeLocal(idProfissional, espObj);

  try {
    const { data } = await api.patch(
      `/profissionais/${idProfissional}/especialidade/${idEspecialidade}`
    );
    return data;
  } catch {
    return {
      mensagem: 'Especialidade vinculada com sucesso.',
      especialidade: espObj,
    };
  }
}

export function getIniciais(nome) {
  if (!nome) return 'PR';
  const limpo = String(nome).replace(/^(Dr\.|Dra\.)\s+/i, '').trim();
  const partes = limpo.split(' ').filter(Boolean);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return limpo.slice(0, 2).toUpperCase();
}

export async function listarProfissionaisComEspecialidades(termoBusca = '') {
  const [catalogoEsp, vinculosLocais, resProf] = await Promise.all([
    listarEspecialidades(),
    lerJsonLocal(VINCULOS_STORAGE_KEY, {}),
    api.get('/profissionais').catch(() => ({ data: [] })),
  ]);

  const brutos = Array.isArray(resProf.data) ? resProf.data : [];

  const formatados = brutos.map((p) => {
    const idProf = p.id_profissional || p.id;
    const vinculoLocal = vinculosLocais[String(idProf)];
    const idEsp =
      p.Especialidade?.id_especialidade ||
      p.id_especialidade ||
      vinculoLocal?.id_especialidade ||
      1;

    const espCatalogo =
      catalogoEsp.find((e) => String(e.id_especialidade) === String(idEsp)) ||
      LISTA_ESPECIALIDADES_PADRAO[0];

    const clinicaNome =
      Array.isArray(p.Clinicas) && p.Clinicas.length > 0
        ? p.Clinicas.map((c) => c.User?.nome || `Clínica #${c.id_clinica}`).join(', ')
        : 'Sem clínica vinculada';

    const crm =
      p.uf_registro && p.registro_profissional
        ? `${p.uf_registro}-${p.registro_profissional}`
        : p.registro_profissional || 'Não informado';

    const ativo = p.User?.ativo !== false && espCatalogo.status !== false;

    return {
      id: idProf,
      id_profissional: idProf,
      nome: p.User?.nome || 'Médico(a)',
      email: p.User?.email || '',
      telefone: p.User?.telefone || '',
      crm,
      clinica: clinicaNome,
      Clinicas: p.Clinicas || [],
      iniciais: getIniciais(p.User?.nome),
      id_especialidade: espCatalogo.id_especialidade,
      especialidade: espCatalogo.nome,
      especialidadeDescricao: espCatalogo.descricao,
      especialidadeStatus: espCatalogo.status !== false ? 'Ativa' : 'Inativa',
      status: ativo ? 'Ativo' : 'Inativo',
    };
  });

  if (!termoBusca.trim()) return formatados;

  const termo = termoBusca.trim().toLowerCase();
  return formatados.filter(
    (item) =>
      item.nome.toLowerCase().includes(termo) ||
      item.especialidade.toLowerCase().includes(termo) ||
      item.especialidadeDescricao.toLowerCase().includes(termo) ||
      item.clinica.toLowerCase().includes(termo) ||
      item.crm.toLowerCase().includes(termo)
  );
}

export async function cadastrarProfissionalAdmin(form) {
  const crmLimpo = String(form.crm || '').trim();
  let uf = 'PE';
  let registro = crmLimpo;
  if (crmLimpo.includes('-')) {
    const [ufPart, regPart] = crmLimpo.split('-');
    uf = ufPart.trim().toUpperCase().slice(0, 2) || 'PE';
    registro = regPart.trim();
  }

  const payload = {
    nome: form.nome.trim(),
    email: form.email.trim().toLowerCase(),
    senha: form.senha,
    endereco: 'Polo Médico do Recife',
    cidade: 'Recife',
    estado: uf,
    telefone: String(form.telefone || '').replace(/\D/g, ''),
    perfil: 'profissional',
    profissional: {
      cpf: String(form.cpf || '').replace(/\D/g, ''),
      conselho: 'CRM',
      registro_profissional: registro,
      uf_registro: uf,
      id_especialidade: Number(form.id_especialidade) || 1,
    },
  };

  const { data: criado } = await api.post('/usuarios', payload);
  const idProf = criado?.id_profissional || criado?.profissional?.id_profissional || criado?.id;

  if (idProf && form.id_especialidade) {
    await vincularEspecialidade(idProf, form.id_especialidade);
  }

  if (idProf && form.id_clinica) {
    await api.patch(`/clinicas/${form.id_clinica}/profissionais/${idProf}`).catch(() => {});
  }

  return criado;
}
