import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconeCasinha, IconeTelefone } from './Icons';

/**
 * Card de Clínica com design fiel ao protótipo visual do ProntoVital.
 *
 * @param {Object} props
 * @param {Object} props.clinica - Dados da clínica retornados pela API
 * @param {number} props.totalProfissionais - Quantidade real de profissionais vinculados
 * @param {Function} props.onVerProfissionais - Callback de navegação
 */
export default function ClinicaCard({ clinica, totalProfissionais = 0, onVerProfissionais }) {
  const nomeClinica = clinica.User?.nome || 'Clínica';
  const bairro = clinica.bairro || '';
  const endereco = clinica.User?.endereco || '';
  const telefone = clinica.User?.telefone || '';

  // Formato: "Bairro — endereço" conforme a imagem
  let localizacao = '';
  if (bairro && endereco) {
    localizacao = `${bairro} — ${endereco}`;
  } else if (bairro) {
    localizacao = bairro;
  } else if (endereco) {
    localizacao = endereco;
  }

  // Especialidade exibida na tag verde (padrão Clínica Geral ou retornada da API)
  const especialidade = clinica.especialidade || 'Clínica Geral';

  return (
    <View style={styles.card}>
      {/* Bloco Superior: Avatar da Casa + Nome e Endereço */}
      <View style={styles.headerRow}>
        <View style={styles.avatarContainer}>
          <IconeCasinha size={26} color="#2563EB" />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.nomeClinica} numberOfLines={2}>
            {nomeClinica}
          </Text>
          {localizacao ? (
            <Text style={styles.enderecoText} numberOfLines={2}>
              {localizacao}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Badge Verde Suave */}
      <View style={styles.badgeEspecialidade}>
        <Text style={styles.badgeText}>{especialidade}</Text>
      </View>

      {/* Linha com Telefone */}
      {telefone ? (
        <View style={styles.telefoneContainer}>
          <IconeTelefone size={14} color="#64748B" />
          <Text style={styles.telefoneText}>{telefone}</Text>
        </View>
      ) : null}

      {/* Botão de Largura Total na Base */}
      <TouchableOpacity
        style={styles.botaoProfissionais}
        activeOpacity={0.7}
        onPress={() => onVerProfissionais && onVerProfissionais(clinica)}
        accessibilityRole="button"
        accessibilityLabel={`Ver profissionais da clínica ${nomeClinica}`}
      >
        <Text style={styles.botaoProfissionaisTexto}>
          Ver profissionais ({totalProfissionais})
        </Text>
        <Text style={styles.botaoSeta}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E0EDFF', // Azul claro suave da imagem
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  nomeClinica: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 4,
  },
  enderecoText: {
    fontSize: 13,
    color: '#94A3B8', // Cinza suave do subtítulo
    lineHeight: 18,
  },
  badgeEspecialidade: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F8F0', // Fundo verde suave da imagem
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginTop: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669', // Verde da especialidade
  },
  telefoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  telefoneText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginLeft: 8,
  },
  botaoProfissionais: {
    width: '100%',
    backgroundColor: '#E0EDFF', // Azul suave da imagem
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  botaoProfissionaisTexto: {
    color: '#2563EB', // Azul vibrante da imagem
    fontSize: 14,
    fontWeight: '600',
  },
  botaoSeta: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
    lineHeight: 16,
  },
});
