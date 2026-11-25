import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import PickerModal from '../../../components/shared/PickerModal';
import api from '../../../lib/api';
import { getIniciais } from '../../../lib/profissionaisApi';
import { converterDataParaISO, mascaraData } from '../../../shared/utils/masks';

const OPCOES_STATUS = [
  { value: 'Todos os status', label: 'Todos os status' },
  { value: 'Confirmado', label: 'Confirmado' },
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Concluído', label: 'Concluído' },
  { value: 'Cancelado', label: 'Cancelado' },
];

export default function AdminAgendamentosScreen() {
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos os status');
  const [agendamentos, setAgendamentos] = useState([]);

  const [modalNovo, setModalNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [clinicas, setClinicas] = useState([]);

  const [form, setForm] = useState({
    id_paciente: '',
    id_profissional: '',
    id_clinica: '',
    data: '25/11/2026',
    horario: '08:00',
    observacao: 'Consulta agendada pelo administrador',
  });

  const carregarAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/agendamentos').catch(() => ({ data: [] }));
      if (Array.isArray(data)) {
        const formatados = data.map((item) => {
          const nomePaciente = item.Paciente?.User?.nome || 'Paciente';
          const nomeProf = item.Profissional?.User?.nome || 'Profissional';
          const esp = item.Profissional?.Especialidade?.nome || '';
          let dataBr = item.data_agendamento || '';
          if (dataBr.includes('-')) {
            const [a, m, d] = dataBr.split('-');
            dataBr = `${d}/${m}/${a}`;
          }
          const st = item.status || 'Confirmado';
          return {
            id: item.id_agendamento,
            id_paciente: item.id_paciente,
            paciente: nomePaciente,
            iniciais: getIniciais(nomePaciente),
            profissional: esp ? `${nomeProf} · ${esp}` : nomeProf,
            data: dataBr,
            horario: item.horario_agendamento?.slice(0, 5) || '08:00',
            status: st.charAt(0).toUpperCase() + st.slice(1).toLowerCase(),
          };
        });
        setAgendamentos(formatados);
      } else {
        setAgendamentos([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  async function abrirModalNovo() {
    setModalNovo(true);
    const [resPac, resProf, resClin] = await Promise.all([
      api.get('/pacientes').catch(() => ({ data: [] })),
      api.get('/profissionais').catch(() => ({ data: [] })),
      api.get('/clinicas').catch(() => ({ data: [] })),
    ]);

    const lPac = Array.isArray(resPac.data) ? resPac.data : [];
    const lProf = Array.isArray(resProf.data) ? resProf.data : [];
    const lClin = Array.isArray(resClin.data) ? resClin.data : [];

    setPacientes(lPac);
    setProfissionais(lProf);
    setClinicas(lClin);

    setForm((prev) => ({
      ...prev,
      id_paciente: lPac[0] ? String(lPac[0].id_paciente) : '',
      id_profissional: lProf[0] ? String(lProf[0].id_profissional) : '',
      id_clinica: lClin[0] ? String(lClin[0].id_clinica) : '',
    }));
  }

  async function handleCriarAgendamento() {
    if (!form.id_paciente || !form.id_profissional || !form.id_clinica) {
      return Alert.alert(
        'Atenção',
        'É necessário selecionar Paciente, Profissional e Clínica cadastrados.'
      );
    }
    const dataISO = converterDataParaISO(form.data) || form.data;

    setSalvando(true);
    try {
      await api.post(`/profissionais/${form.id_profissional}/agendamentos`, {
        id_paciente: Number(form.id_paciente),
        id_clinica: Number(form.id_clinica),
        data_agendamento: dataISO,
        horario_agendamento: form.horario,
        observacao: form.observacao,
      });
      setModalNovo(false);
      await carregarAgendamentos();
    } catch (err) {
      Alert.alert(
        'Erro ao agendar',
        err.response?.data?.erro || 'Não foi possível criar o agendamento.'
      );
    } finally {
      setSalvando(false);
    }
  }

  const filtrados = agendamentos.filter((item) => {
    const t = busca.trim().toLowerCase();
    const matchBusca =
      !t ||
      item.paciente.toLowerCase().includes(t) ||
      item.profissional.toLowerCase().includes(t);
    const matchStatus =
      filtroStatus === 'Todos os status' ||
      item.status.toLowerCase() === filtroStatus.toLowerCase();
    return matchBusca && matchStatus;
  });

  const opcoesPacientes =
    pacientes.length > 0
      ? pacientes.map((p) => ({
          value: String(p.id_paciente),
          label: `${p.User?.nome || 'Paciente'} ${p.cpf ? `(CPF: ${p.cpf})` : ''}`,
        }))
      : [{ value: '', label: 'Nenhum paciente cadastrado' }];

  const opcoesProfissionais =
    profissionais.length > 0
      ? profissionais.map((p) => ({
          value: String(p.id_profissional),
          label: p.User?.nome || `Médico #${p.id_profissional}`,
        }))
      : [{ value: '', label: 'Nenhum profissional cadastrado' }];

  const opcoesClinicas =
    clinicas.length > 0
      ? clinicas.map((c) => ({
          value: String(c.id_clinica),
          label: c.User?.nome || `Clínica #${c.id_clinica}`,
        }))
      : [{ value: '', label: 'Nenhuma clínica cadastrada' }];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="always"
    >
      <Text style={styles.pageTitle}>Todos os Agendamentos</Text>
      <Text style={styles.pageSubtitle}>Visão completa da rede.</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={abrirModalNovo}
        style={styles.newBtn}
      >
        <Text style={styles.newBtnText}>+  Novo Agendamento</Text>
      </TouchableOpacity>

      <View style={styles.searchBox}>
        <Feather name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por paciente, profissional ou especialida"
          placeholderTextColor="#94A3B8"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      <PickerModal
        value={filtroStatus}
        options={OPCOES_STATUS}
        onChange={setFiltroStatus}
        darkSheet
      />

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : filtrados.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>
        </View>
      ) : (
        filtrados.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemTopRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{item.iniciais}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.paciente}</Text>
                <Text style={styles.itemSub}>{item.profissional}</Text>
              </View>
            </View>
            <View style={styles.itemFooterRow}>
              <Text style={styles.dateText}>
                {item.data} - {item.horario}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      <Modal
        visible={modalNovo}
        transparent
        animationType="fade"
        onRequestClose={() => setModalNovo(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalNovo(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
              <View style={styles.modalHeaderRow}>
                <View style={styles.flexOne}>
                  <Text style={styles.modalTitle}>Novo Agendamento</Text>
                  <Text style={styles.modalSubtitle}>
                    Criar consulta diretamente pela administração.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalNovo(false)}
                  style={styles.closeCircle}
                >
                  <Feather name="x" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>

              <PickerModal
                label="PACIENTE"
                value={form.id_paciente}
                options={opcoesPacientes}
                placeholder="Nenhum paciente cadastrado"
                onChange={(v) => setForm((p) => ({ ...p, id_paciente: v }))}
              />

              <PickerModal
                label="PROFISSIONAL DE SAÚDE"
                value={form.id_profissional}
                options={opcoesProfissionais}
                placeholder="Nenhum profissional cadastrado"
                onChange={(v) => setForm((p) => ({ ...p, id_profissional: v }))}
              />

              <PickerModal
                label="CLÍNICA DO ATENDIMENTO"
                value={form.id_clinica}
                options={opcoesClinicas}
                placeholder="Nenhuma clínica cadastrada"
                onChange={(v) => setForm((p) => ({ ...p, id_clinica: v }))}
              />

              <Text style={styles.inputLabel}>DATA DA CONSULTA</Text>
              <TextInput
                style={styles.input}
                placeholder="dd/mm/aaaa"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={10}
                value={form.data}
                onChangeText={(v) => setForm((p) => ({ ...p, data: mascaraData(v) }))}
              />

              <Text style={styles.inputLabel}>HORÁRIO</Text>
              <TextInput
                style={styles.input}
                placeholder="08:00"
                placeholderTextColor="#94A3B8"
                value={form.horario}
                onChangeText={(v) => setForm((p) => ({ ...p, horario: v }))}
              />

              <Text style={styles.inputLabel}>OBSERVAÇÕES CLÍNICAS</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Consulta agendada pelo administrador"
                placeholderTextColor="#94A3B8"
                multiline
                value={form.observacao}
                onChangeText={(v) => setForm((p) => ({ ...p, observacao: v }))}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setModalNovo(false)}
                  style={styles.btnCancel}
                >
                  <Text style={styles.btnCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCriarAgendamento}
                  disabled={salvando}
                  style={styles.btnCreate}
                >
                  <Text style={styles.btnCreateText}>
                    {salvando ? 'Criando...' : 'Criar Agendamento'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 18, paddingBottom: 40 },
  flexOne: { flex: 1 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  pageSubtitle: { fontSize: 14.5, color: '#64748B', marginTop: 4, marginBottom: 16 },
  newBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', marginLeft: 10 },
  loaderBox: { paddingVertical: 50, alignItems: 'center' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 44,
    alignItems: 'center',
    marginTop: 6,
  },
  emptyText: { fontSize: 15, color: '#64748B', fontWeight: '500' },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  itemTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#2563EB' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15.5, fontWeight: '800', color: '#0F172A' },
  itemSub: { fontSize: 12.5, color: '#64748B', marginTop: 3 },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 12,
  },
  dateText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  statusBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '800', color: '#16A34A', textTransform: 'uppercase' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '88%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  modalSubtitle: { fontSize: 12.5, color: '#64748B', marginTop: 3 },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  inputMultiline: { height: 64, textAlignVertical: 'top', paddingTop: 10 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btnCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  btnCreate: {
    flex: 1.2,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCreateText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
