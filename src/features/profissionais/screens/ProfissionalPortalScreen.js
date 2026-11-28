import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../../../components/shared/AppHeader";
import ProfissionalAgenda from "../components/ProfissionalAgenda";
import ProfissionalPerfil from "../components/ProfissionalPerfil";
import { atualizarPerfilUsuario } from "../../../lib/pacientesApi";
import { useAuth } from "../../../shared/context/AuthContext";
import { colors } from "../../../shared/theme/colors";
import { mascaraTelefone, limparDigitos } from "../../../shared/utils/masks";
import { profissionalService } from "../../../services/api";
import {
  dataDoAgendamento,
  dataIso,
  mensagemErro,
  obterDiasCalendario,
} from "../utils/profissionalUtils";

function idProfissionalDaSessao(usuario) {
  return (
    usuario?.id_profissional ||
    usuario?.Profissional?.id_profissional ||
    usuario?.profissional?.id_profissional ||
    null
  );
}

function pertenceAoUsuario(profissional, usuario, idDireto) {
  if (
    idDireto &&
    String(profissional.id_profissional) === String(idDireto)
  ) {
    return true;
  }
  if (
    usuario?.id_user &&
    String(profissional.User?.id_user || profissional.id_user) ===
      String(usuario.id_user)
  ) {
    return true;
  }
  const email = String(usuario?.email || "").trim().toLowerCase();
  return (
    email &&
    String(profissional.User?.email || "").trim().toLowerCase() === email
  );
}

export default function ProfissionalPortalScreen({ telaAtiva, navigation }) {
  const { usuario, atualizarUsuarioLocal } = useAuth();
  const [idProfissional, setIdProfissional] = useState(() =>
    idProfissionalDaSessao(usuario),
  );
  const [profissional, setProfissional] = useState(null);
  const [carregandoIdentidade, setCarregandoIdentidade] = useState(true);
  const [erroIdentidade, setErroIdentidade] = useState("");
  const [avisoPerfil, setAvisoPerfil] = useState("");
  const [tentativaIdentidade, setTentativaIdentidade] = useState(0);

  const [agendamentos, setAgendamentos] = useState([]);
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erroAgendamentos, setErroAgendamentos] = useState("");

  const [modoCalendario, setModoCalendario] = useState("Semana");
  const [dataSelecionada, setDataSelecionada] = useState(() => new Date());

  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [erroPerfil, setErroPerfil] = useState("");
  const [sucessoPerfil, setSucessoPerfil] = useState("");
  const [formPerfil, setFormPerfil] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
  });

  useEffect(() => {
    let ativo = true;
    const idDireto = idProfissionalDaSessao(usuario);
    setIdProfissional(idDireto);
    setErroIdentidade("");
    setAvisoPerfil("");
    setCarregandoIdentidade(true);

    async function carregarIdentidade() {
      try {
        let encontrado;
        if (idDireto) {
          const resultado = await profissionalService.obterPorId(idDireto);
          encontrado = resultado?.profissional || resultado;
        } else {
          const lista = await profissionalService.listar();
          if (!Array.isArray(lista)) {
            throw new Error("A API não devolveu a lista de profissionais.");
          }
          encontrado = lista.find((item) =>
            pertenceAoUsuario(item, usuario, idDireto),
          );
        }

        if (encontrado) {
          if (ativo) {
            setProfissional(encontrado);
            setIdProfissional(encontrado.id_profissional || idDireto);
          }
        } else if (!idDireto) {
          throw new Error(
            "Não foi possível identificar seu cadastro de profissional. Entre novamente.",
          );
        } else if (ativo) {
          setProfissional({ id_profissional: idDireto, User: usuario });
          setAvisoPerfil(
            "Os dados profissionais complementares não puderam ser carregados.",
          );
        }
      } catch (error) {
        if (!ativo) return;
        if (idDireto) {
          setProfissional({ id_profissional: idDireto, User: usuario });
          setAvisoPerfil(
            mensagemErro(
              error,
              "Os dados profissionais complementares não puderam ser carregados.",
            ),
          );
        } else {
          setErroIdentidade(
            mensagemErro(
              error,
              "Não foi possível identificar seu cadastro de profissional.",
            ),
          );
        }
      } finally {
        if (ativo) setCarregandoIdentidade(false);
      }
    }

    carregarIdentidade();
    return () => {
      ativo = false;
    };
  }, [tentativaIdentidade, usuario]);

  const carregarAgendamentos = useCallback(
    async (refresh = false) => {
      if (!idProfissional) return;
      if (refresh) setAtualizando(true);
      else setCarregandoAgendamentos(true);
      setErroAgendamentos("");
      try {
        setAgendamentos(
          await profissionalService.listarAgendamentos(idProfissional),
        );
      } catch (error) {
        setErroAgendamentos(
          mensagemErro(
            error,
            "Não foi possível carregar seus agendamentos.",
          ),
        );
      } finally {
        setCarregandoAgendamentos(false);
        setAtualizando(false);
      }
    },
    [idProfissional],
  );

  useEffect(() => {
    if (idProfissional) carregarAgendamentos();
  }, [carregarAgendamentos, idProfissional]);

  const agendamentosOrdenados = useMemo(
    () =>
      [...agendamentos].sort((a, b) => {
        const dataA = `${dataDoAgendamento(a)} ${a.horario_agendamento || ""}`;
        const dataB = `${dataDoAgendamento(b)} ${b.horario_agendamento || ""}`;
        return dataA.localeCompare(dataB);
      }),
    [agendamentos],
  );
  const diasCalendario = useMemo(
    () => obterDiasCalendario(dataSelecionada, modoCalendario),
    [dataSelecionada, modoCalendario],
  );
  const isoSelecionado = dataIso(dataSelecionada);
  const agendamentosDoDia = useMemo(
    () =>
      agendamentosOrdenados.filter(
        (item) => dataDoAgendamento(item) === isoSelecionado,
      ),
    [agendamentosOrdenados, isoSelecionado],
  );

  const usuarioPerfil = profissional?.User || usuario || {};
  const perfilBasico = {
    nome: usuarioPerfil.nome || "",
    email: usuarioPerfil.email || "",
    telefone: usuarioPerfil.telefone || "",
    endereco: usuarioPerfil.endereco || "",
    cidade: usuarioPerfil.cidade || "",
    estado: usuarioPerfil.estado || "",
  };

  function moverPeriodo(direcao) {
    setDataSelecionada((atual) => {
      const proxima = new Date(atual);
      if (modoCalendario === "Semana") {
        proxima.setDate(proxima.getDate() + direcao * 7);
      } else {
        const diaDoMes = proxima.getDate();
        proxima.setDate(1);
        proxima.setMonth(proxima.getMonth() + direcao);
        proxima.setDate(
          Math.min(
            diaDoMes,
            new Date(
              proxima.getFullYear(),
              proxima.getMonth() + 1,
              0,
            ).getDate(),
          ),
        );
      }
      return proxima;
    });
  }

  function abrirEdicaoPerfil() {
    setFormPerfil({
      ...perfilBasico,
      telefone: mascaraTelefone(perfilBasico.telefone),
    });
    setErroPerfil("");
    setSucessoPerfil("");
    setEditandoPerfil(true);
  }

  async function salvarPerfil() {
    if (!formPerfil.nome.trim() || !formPerfil.email.trim()) {
      setErroPerfil("Nome e e-mail são obrigatórios.");
      return;
    }
    setSalvandoPerfil(true);
    setErroPerfil("");
    setSucessoPerfil("");
    const payload = {
      nome: formPerfil.nome.trim(),
      email: formPerfil.email.trim(),
      telefone: limparDigitos(formPerfil.telefone),
      endereco: formPerfil.endereco.trim(),
      cidade: formPerfil.cidade.trim(),
      estado: formPerfil.estado.trim().toUpperCase(),
    };

    try {
      await atualizarPerfilUsuario(payload);
      await atualizarUsuarioLocal(payload);
      setProfissional((atual) =>
        atual
          ? {
              ...atual,
              User: { ...(atual.User || {}), ...payload },
            }
          : atual,
      );
      setFormPerfil((atual) => ({
        ...atual,
        telefone: mascaraTelefone(atual.telefone),
      }));
      setEditandoPerfil(false);
      setSucessoPerfil("Perfil atualizado com sucesso.");
    } catch (error) {
      setErroPerfil(
        mensagemErro(error, "Não foi possível atualizar seu perfil."),
      );
    } finally {
      setSalvandoPerfil(false);
    }
  }

  function cancelarEdicaoPerfil() {
    setEditandoPerfil(false);
    setErroPerfil("");
  }

  const tela = telaAtiva || "ProfissionalAgenda";
  const erroTela = erroIdentidade || erroAgendamentos;
  const carregandoTela =
    carregandoIdentidade ||
    (Boolean(idProfissional) && carregandoAgendamentos);

  return (
    <View style={styles.container}>
      <AppHeader
        telaAtiva={tela}
        onNavigate={(rota) => navigation?.navigate?.(rota)}
      />
      {tela === "ProfissionalPerfil" ? (
        carregandoIdentidade ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : erroIdentidade ? (
          <View style={styles.pageContent}>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{erroIdentidade}</Text>
              <TouchableOpacity
                onPress={() => setTentativaIdentidade((valor) => valor + 1)}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ProfissionalPerfil
            profissional={profissional}
            perfilBasico={perfilBasico}
            avisoPerfil={avisoPerfil}
            erroPerfil={erroPerfil}
            sucessoPerfil={sucessoPerfil}
            editandoPerfil={editandoPerfil}
            formPerfil={formPerfil}
            setFormPerfil={setFormPerfil}
            salvandoPerfil={salvandoPerfil}
            onEditar={abrirEdicaoPerfil}
            onSalvar={salvarPerfil}
            onCancelar={cancelarEdicaoPerfil}
          />
        )
      ) : carregandoTela ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : erroTela ? (
        <View style={styles.pageContent}>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{erroTela}</Text>
            <TouchableOpacity
              onPress={() => {
                if (erroIdentidade) {
                  setTentativaIdentidade((valor) => valor + 1);
                } else {
                  carregarAgendamentos();
                }
              }}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ProfissionalAgenda
          telaAtiva={tela}
          modoCalendario={modoCalendario}
          setModoCalendario={setModoCalendario}
          dataSelecionada={dataSelecionada}
          moverPeriodo={moverPeriodo}
          setDataSelecionada={setDataSelecionada}
          diasCalendario={diasCalendario}
          isoSelecionado={isoSelecionado}
          agendamentos={agendamentos}
          agendamentosDoDia={agendamentosDoDia}
          agendamentosOrdenados={agendamentosOrdenados}
          atualizando={atualizando}
          onRefresh={() => carregarAgendamentos(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceInput },
  pageContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorBox: {
    padding: 13,
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  retryText: { color: colors.primary, fontSize: 13, fontWeight: "700", marginTop: 10 },
});
