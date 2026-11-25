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
import {
  cadastrarProfissionalAdmin,
  listarEspecialidades,
  listarProfissionaisComEspecialidades,
  salvarEspecialidadeCatalogo,
  vincularEspecialidade,
} from '../../../lib/profissionaisApi';
import { mascaraCPF, mascaraTelefone } from '../../../shared/utils/masks';

export default function AdminProfissionaisScreen() {
  const [loading, setLoading] = useState(true);
  const [visao, setVisao] = useState('profissionais');
  const [busca, setBusca] = useState('');
  const [profissionais, setProfissionais] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);

  const [mostraForm, setMostraForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    crm: '',
    cpf: '',
    telefone: '',
    email: '',
    senha: '',
    id_clinica: '',
    id_especialidade: '1',
  });

  const [medicoModal, setMedicoModal] = useState(null);
  const [espModalId, setEspModalId] = useState('1');
  const [salvandoVinculo, setSalvandoVinculo] = useState(false);

  const [modalNovaEsp, setModalNovaEsp] = useState(false);
  const [formEsp, setFormEsp] = useState({
    id_especialidade: null,
    nome: '',
    descricao: '',
    status: true,
    isNova: true,
  });

  const carregarDados = useCallback(async (termo = '') => {
    setLoading(true);
    try {
      const [listaProf, listaEsp, resClinicas] = await Promise.all([
        listarProfissionaisComEspecialidades(termo),
        listarEspecialidades(),
        api.get('/clinicas').catch(() => ({ data: [] })),
      ]);

      setProfissionais(listaProf);
      setEspecialidades(listaEsp);

      const clFormatadas = Array.isArray(resClinicas.data)
        ? resClinicas.data.map((c) => ({
            id_clinica: String(c.id_clinica),
            nome: c.User?.nome || `Clínica #${c.id_clinica}`,
          }))
        : [];
      setClinicas(clFormatadas);

      if (clFormatadas.length > 0) {
        setForm((prev) => ({
          ...prev,
          id_clinica: prev.id_clinica || clFormatadas[0].id_clinica,
        }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => carregarDados(busca), 250);
    return () => clearTimeout(timer);
  }, [busca, carregarDados]);

  function setCampo(campo, valor) {
    let formatado = valor;
    if (campo === 'cpf') formatado = mascaraCPF(valor);
    if (campo === 'telefone') formatado = mascaraTelefone(valor);
    setForm((prev) => ({ ...prev, [campo]: formatado }));
  }

  function resetForm() {
    setForm({
      nome: '',
      crm: '',
      cpf: '',
      telefone: '',
      email: '',
      senha: '',
      id_clinica: clinicas[0]?.id_clinica || '',
      id_especialidade: String(especialidades[0]?.id_especialidade || '1'),
    });
    setMostraForm(false);
  }

  async function handleCadastrarProfissional() {
    if (!form.nome.trim() || !form.crm.trim() || !form.email.includes('@') || form.senha.length < 6) {
      return Alert.alert(
        'Campos obrigatórios',
        'Preencha Nome, CRM, CPF, Telefone, E-mail e Senha (mínimo 6 caracteres).'
      );
    }

    setSalvando(true);
    try {
      await cadastrarProfissionalAdmin(form);
      resetForm();
      await carregarDados(busca);
    } catch (err) {
      Alert.alert(
        'Erro ao cadastrar',
        err.response?.data?.mensagem ||
          err.response?.data?.erro ||
          'Não foi possível cadastrar o profissional.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleConfirmarVinculo() {
    if (!medicoModal) return;
    setSalvandoVinculo(true);
    try {
      await vincularEspecialidade(medicoModal.id_profissional, espModalId);
      setMedicoModal(null);
      await carregarDados(busca);
    } finally {
      setSalvandoVinculo(false);
    }
  }

  async function handleSalvarEspecialidadeCatalogo() {
    if (!formEsp.nome.trim() || !formEsp.descricao.trim()) {
      return Alert.alert('Atenção', 'Informe o nome da especialidade e sua descrição.');
    }
    await salvarEspecialidadeCatalogo(formEsp);
    setModalNovaEsp(false);
    await carregarDados(busca);
  }

  const opcoesClinicas =
    clinicas.length > 0
      ? clinicas.map((c) => ({ value: c.id_clinica, label: c.nome }))
      : [{ value: '', label: 'Nenhuma clínica cadastrada' }];

  const opcoesEspecialidades = especialidades.map((e) => ({
    value: String(e.id_especialidade),
    label: e.nome,
    subtitle: e.descricao,
  }));

  const especialidadesFiltradas = especialidades.filter((e) => {
    if (!busca.trim()) return true;
    const t = busca.trim().toLowerCase();
    return (
      e.nome.toLowerCase().includes(t) ||
      e.descricao.toLowerCase().includes(t)
    );
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="always"
    >
      <Text style={styles.pageTitle}>Profissionais</Text>
      <Text style={styles.pageSubtitle}>
        Vincule médicos às clínicas parceiras e gerencie suas especialidades.
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setMostraForm((v) => !v)}
        style={styles.primaryActionBtn}
      >
        <Text style={styles.primaryActionText}>+  Novo Profissional</Text>
      </TouchableOpacity>

      {mostraForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formCardHeader}>VINCULAR PROFISSIONAL</Text>

          <Text style={styles.inputLabel}>NOME COMPLETO</Text>
          <TextInput
            style={styles.input}
            placeholder="Dr. Nome Sobrenome"
            placeholderTextColor="#94A3B8"
            value={form.nome}
            onChangeText={(v) => setCampo('nome', v)}
          />

          <Text style={styles.inputLabel}>CRM</Text>
          <TextInput
            style={styles.input}
            placeholder="PE-00000"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            value={form.crm}
            onChangeText={(v) => setCampo('crm', v)}
          />

          <Text style={styles.inputLabel}>CPF</Text>
          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={14}
            value={form.cpf}
            onChangeText={(v) => setCampo('cpf', v)}
          />

          <Text style={styles.inputLabel}>TELEFONE</Text>
          <TextInput
            style={styles.input}
            placeholder="(81) 98888-0000"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={15}
            value={form.telefone}
            onChangeText={(v) => setCampo('telefone', v)}
          />

          <Text style={styles.inputLabel}>E-MAIL DE ACESSO</Text>
          <TextInput
            style={styles.input}
            placeholder="medico@prontovital.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => setCampo('email', v)}
          />

          <Text style={styles.inputLabel}>SENHA DE ACESSO</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoComplete="off"
            textContentType="oneTimeCode"
            value={form.senha}
            onChangeText={(v) => setCampo('senha', v)}
          />

          <PickerModal
            label="CLÍNICA VINCULADA"
            value={form.id_clinica}
            options={opcoesClinicas}
            placeholder="Nenhuma clínica cadastrada"
            onChange={(v) => setCampo('id_clinica', v)}
          />

          <PickerModal
            label="ESPECIALIDADE DO MÉDICO"
            value={form.id_especialidade}
            options={opcoesEspecialidades}
            onChange={(v) => setCampo('id_especialidade', v)}
          />

          <View style={styles.formButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCadastrarProfissional}
              disabled={salvando}
              style={styles.btnSubmit}
            >
              {salvando ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.btnSubmitText}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={resetForm}
              style={styles.btnCancelOutline}
            >
              <Text style={styles.btnCancelOutlineText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.searchBox}>
        <Feather name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome do profissional, especialidade"
          placeholderTextColor="#94A3B8"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      <View style={styles.subTabsRow}>
        <TouchableOpacity
          onPress={() => setVisao('profissionais')}
          style={[styles.subTab, visao === 'profissionais' && styles.subTabActive]}
        >
          <Text
            style={[
              styles.subTabText,
              visao === 'profissionais' && styles.subTabTextActive,
            ]}
          >
            Profissionais ({profissionais.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setVisao('especialidades')}
          style={[styles.subTab, visao === 'especialidades' && styles.subTabActive]}
        >
          <Text
            style={[
              styles.subTabText,
              visao === 'especialidades' && styles.subTabTextActive,
            ]}
          >
            Especialidades ({especialidades.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : visao === 'profissionais' ? (
        profissionais.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum profissional encontrado.</Text>
          </View>
        ) : (
          profissionais.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{item.iniciais}</Text>
                </View>

                <View style={styles.itemMainInfo}>
                  <Text style={styles.itemName}>{item.nome}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.crmText}>CRM: {item.crm}</Text>
                    <View style={styles.espBadge}>
                      <Text style={styles.espBadgeText}>{item.especialidade}</Text>
                    </View>
                  </View>
                  <Text style={styles.espDescText} numberOfLines={2}>
                    {item.especialidadeDescricao}
                  </Text>
                  <Text style={styles.clinicaText}>{item.clinica}</Text>
                </View>
              </View>

              <View style={styles.itemFooterRow}>
                <TouchableOpacity
                  onPress={() => {
                    setMedicoModal(item);
                    setEspModalId(String(item.id_especialidade || '1'));
                  }}
                  style={styles.vincularBtn}
                >
                  <Feather name="link" size={13} color="#1D4ED8" />
                  <Text style={styles.vincularBtnText}>Vincular Especialidade</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setProfissionais((prev) => prev.filter((p) => p.id !== item.id))
                  }
                  style={styles.trashBtn}
                >
                  <Feather name="trash-2" size={17} color="#F87171" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )
      ) : (
        <View>
          {especialidadesFiltradas.map((esp) => (
            <View key={esp.id_especialidade} style={styles.itemCard}>
              <Text style={styles.itemName}>{esp.nome}</Text>
              <Text style={styles.espCatalogDesc}>{esp.descricao}</Text>

              <View style={styles.espCardFooter}>
                <TouchableOpacity
                  onPress={() => {
                    setFormEsp({
                      id_especialidade: esp.id_especialidade,
                      nome: esp.nome,
                      descricao: esp.descricao,
                      status: true,
                      isNova: Boolean(esp.isNova),
                    });
                    setModalNovaEsp(true);
                  }}
                  style={styles.editEspLink}
                >
                  <Feather name="edit-2" size={13} color="#2563EB" />
                  <Text style={styles.editEspLinkText}>Editar atributos</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal
        visible={Boolean(medicoModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setMedicoModal(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMedicoModal(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Vincular Especialidade</Text>
            <Text style={styles.modalSubtitle}>{medicoModal?.nome}</Text>

            <PickerModal
              label="SELECIONE A ESPECIALIDADE MÉDICA"
              value={espModalId}
              options={opcoesEspecialidades}
              onChange={setEspModalId}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setMedicoModal(null)}
                style={styles.btnCancelOutline}
              >
                <Text style={styles.btnCancelOutlineText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmarVinculo}
                disabled={salvandoVinculo}
                style={styles.btnSubmit}
              >
                <Text style={styles.btnSubmitText}>
                  {salvandoVinculo ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={modalNovaEsp}
        transparent
        animationType="fade"
        onRequestClose={() => setModalNovaEsp(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalNovaEsp(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {formEsp.id_especialidade ? 'Editar Especialidade' : 'Nova Especialidade'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Informe o nome e a descrição da especialidade médica.
            </Text>

            <Text style={styles.inputLabel}>NOME DA ESPECIALIDADE</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Cardiologia"
              placeholderTextColor="#94A3B8"
              value={formEsp.nome}
              onChangeText={(v) => setFormEsp((p) => ({ ...p, nome: v }))}
            />

            <Text style={styles.inputLabel}>DESCRIÇÃO</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Descreva o escopo de atendimento da especialidade..."
              placeholderTextColor="#94A3B8"
              multiline
              value={formEsp.descricao}
              onChangeText={(v) => setFormEsp((p) => ({ ...p, descricao: v }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalNovaEsp(false)}
                style={styles.btnCancelOutline}
              >
                <Text style={styles.btnCancelOutlineText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSalvarEspecialidadeCatalogo}
                style={styles.btnSubmit}
              >
                <Text style={styles.btnSubmitText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 18, paddingBottom: 40 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  pageSubtitle: { fontSize: 14.5, color: '#64748B', marginTop: 4, lineHeight: 21 },
  primaryActionBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 18,
    elevation: 2,
  },
  primaryActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 20,
  },
  formCardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.1,
    marginBottom: 18,
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
  inputMultiline: { height: 76, textAlignVertical: 'top', paddingTop: 10 },
  formButtonsRow: { flexDirection: 'row', marginTop: 6 },
  btnSubmit: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  btnSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnCancelOutline: {
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelOutlineText: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A', marginLeft: 10 },
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  subTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  subTabActive: { backgroundColor: '#FFFFFF' },
  subTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  subTabTextActive: { color: '#0F172A', fontWeight: '800' },
  loaderBox: { paddingVertical: 50, alignItems: 'center' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 44,
    alignItems: 'center',
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
  itemTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
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
  itemMainInfo: { flex: 1 },
  itemName: { fontSize: 15.5, fontWeight: '800', color: '#0F172A' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  crmText: { fontSize: 12.5, color: '#64748B', fontWeight: '600', marginRight: 8 },
  espBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  espBadgeText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  espDescText: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 17 },
  clinicaText: { fontSize: 12.5, color: '#94A3B8', marginTop: 3 },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 12,
  },
  vincularBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
  },
  vincularBtnText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8', marginLeft: 5 },
  trashBtn: { padding: 6 },
  espCatalogDesc: { fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 19 },
  espCardFooter: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' },
  editEspLink: { flexDirection: 'row', alignItems: 'center' },
  editEspLinkText: { fontSize: 12.5, fontWeight: '700', color: '#2563EB', marginLeft: 5 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 10 },
});
