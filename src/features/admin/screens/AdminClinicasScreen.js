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
import api from '../../../lib/api';
import { mascaraTelefone } from '../../../shared/utils/masks';

function mascaraCNPJ(value = '') {
  return String(value)
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export default function AdminClinicasScreen() {
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [clinicas, setClinicas] = useState([]);
  const [modalNovo, setModalNovo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    email: '',
    senha: '',
    endereco: '',
    bairro: '',
    telefone: '',
  });

  const carregarClinicas = useCallback(async (termo = '') => {
    setLoading(true);
    try {
      const params = termo.trim() ? { busca: termo.trim() } : {};
      const [resClinicas, resProfs] = await Promise.all([
        api.get('/clinicas', { params }).catch(() => ({ data: [] })),
        api.get('/profissionais').catch(() => ({ data: [] })),
      ]);

      const listaProfs = Array.isArray(resProfs.data) ? resProfs.data : [];
      const lista = Array.isArray(resClinicas.data)
        ? resClinicas.data.map((c) => {
            const totalProfs = listaProfs.filter((p) =>
              p.Clinicas?.some((cl) => String(cl.id_clinica) === String(c.id_clinica))
            ).length;
            return {
              id: c.id_clinica,
              nome: c.User?.nome || 'Clínica Sem Nome',
              localizacao: c.bairro || c.User?.cidade || 'Recife',
              telefone: c.User?.telefone || 'Não informado',
              profissionais: totalProfs,
              status: c.User?.ativo !== false ? 'Ativo' : 'Inativo',
            };
          })
        : [];
      setClinicas(lista);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => carregarClinicas(busca), 250);
    return () => clearTimeout(timer);
  }, [busca, carregarClinicas]);

  function setCampo(campo, valor) {
    let formatado = valor;
    if (campo === 'cnpj') formatado = mascaraCNPJ(valor);
    if (campo === 'telefone') formatado = mascaraTelefone(valor);
    setForm((prev) => ({ ...prev, [campo]: formatado }));
  }

  function fecharModal() {
    setModalNovo(false);
    setForm({
      nome: '',
      cnpj: '',
      email: '',
      senha: '',
      endereco: '',
      bairro: '',
      telefone: '',
    });
  }

  async function handleSalvarClinica() {
    if (!form.nome.trim() || !form.cnpj.trim() || !form.email.includes('@') || form.senha.length < 6) {
      return Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
    }

    setSalvando(true);
    try {
      await api.post('/usuarios', {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        endereco: form.endereco.trim() || 'Endereço não informado',
        cidade: 'Recife',
        estado: 'PE',
        telefone: form.telefone.replace(/\D/g, ''),
        perfil: 'clinica',
        clinica: {
          cnpj: form.cnpj.replace(/\D/g, ''),
          bairro: form.bairro.trim() || 'Centro',
        },
      });
      fecharModal();
      await carregarClinicas(busca);
    } catch (err) {
      Alert.alert(
        'Erro ao cadastrar',
        err.response?.data?.mensagem ||
          err.response?.data?.erro ||
          'Não foi possível cadastrar a clínica.'
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="always"
    >
      <Text style={styles.pageTitle}>Clínicas</Text>
      <Text style={styles.pageSubtitle}>Gerencie as unidades parceiras da rede.</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setModalNovo(true)}
        style={styles.primaryActionBtn}
      >
        <Text style={styles.primaryActionText}>+  Nova Clínica</Text>
      </TouchableOpacity>

      <View style={styles.searchBox}>
        <Feather name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome da clínica ou bairro..."
          placeholderTextColor="#94A3B8"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : clinicas.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhuma clínica encontrada.</Text>
        </View>
      ) : (
        clinicas.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemTopRow}>
              <View style={styles.iconBoxTeal}>
                <Feather name="home" size={20} color="#0D9488" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.nome}</Text>
                <Text style={styles.itemMeta}>
                  {item.localizacao} · {item.telefone}
                </Text>
              </View>
            </View>

            <View style={styles.itemFooterRow}>
              <View style={styles.countWrap}>
                <Text style={styles.countNum}>{item.profissionais}</Text>
                <Text style={styles.countLabel}>PROFIS.</Text>
              </View>

              <View style={styles.rightActions}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setClinicas((prev) => prev.filter((c) => c.id !== item.id))
                  }
                  style={styles.trashBtn}
                >
                  <Feather name="trash-2" size={17} color="#F87171" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}

      <Modal
        visible={modalNovo}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={fecharModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
              <Text style={styles.modalHeader}>CADASTRAR NOVA CLÍNICA</Text>

              <Text style={styles.inputLabel}>NOME</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome da clínica"
                placeholderTextColor="#94A3B8"
                value={form.nome}
                onChangeText={(v) => setCampo('nome', v)}
              />

              <Text style={styles.inputLabel}>CNPJ</Text>
              <TextInput
                style={styles.input}
                placeholder="00.000.000/0001-00"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={18}
                value={form.cnpj}
                onChangeText={(v) => setCampo('cnpj', v)}
              />

              <Text style={styles.inputLabel}>E-MAIL DE ACESSO</Text>
              <TextInput
                style={styles.input}
                placeholder="contato@clinica.com"
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

              <Text style={styles.inputLabel}>ENDEREÇO</Text>
              <TextInput
                style={styles.input}
                placeholder="Rua, número"
                placeholderTextColor="#94A3B8"
                value={form.endereco}
                onChangeText={(v) => setCampo('endereco', v)}
              />

              <Text style={styles.inputLabel}>BAIRRO / CIDADE</Text>
              <TextInput
                style={styles.input}
                placeholder="Bairro"
                placeholderTextColor="#94A3B8"
                value={form.bairro}
                onChangeText={(v) => setCampo('bairro', v)}
              />

              <Text style={styles.inputLabel}>TELEFONE</Text>
              <TextInput
                style={styles.input}
                placeholder="(81) 3000-0000"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={15}
                value={form.telefone}
                onChangeText={(v) => setCampo('telefone', v)}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSalvarClinica}
                  disabled={salvando}
                  style={styles.btnSubmit}
                >
                  <Text style={styles.btnSubmitText}>
                    {salvando ? 'Cadastrando...' : 'Cadastrar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={fecharModal}
                  style={styles.btnCancelOutline}
                >
                  <Text style={styles.btnCancelOutlineText}>Cancelar</Text>
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
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  pageSubtitle: { fontSize: 14.5, color: '#64748B', marginTop: 4 },
  primaryActionBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 18,
  },
  primaryActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 18,
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
  iconBoxTeal: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15.5, fontWeight: '800', color: '#0F172A' },
  itemMeta: { fontSize: 12.5, color: '#64748B', marginTop: 3 },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 12,
  },
  countWrap: { alignItems: 'center' },
  countNum: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  countLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.6 },
  rightActions: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  statusText: { fontSize: 11, fontWeight: '800', color: '#16A34A', textTransform: 'uppercase' },
  trashBtn: { padding: 6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    maxHeight: '88%',
  },
  modalHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.9,
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
  modalButtons: { flexDirection: 'row', marginTop: 8 },
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
});
