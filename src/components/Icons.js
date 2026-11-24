import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';

/**
 * Ícone da Lupa desenhado com componentes nativos para fidelidade pixel-perfect.
 */
export function IconeLupa({ size = 16, color = '#94A3B8' }) {
  const circleSize = size * 0.75;
  const borderWidth = 1.8;
  const handleLength = size * 0.45;
  const handleWidth = 1.8;

  return (
    <View style={[styles.lupaContainer, { width: size + 2, height: size + 2 }]}>
      <View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          borderWidth: borderWidth,
          borderColor: color,
        }}
      />
      <View
        style={{
          width: handleWidth,
          height: handleLength,
          backgroundColor: color,
          borderRadius: handleWidth / 2,
          position: 'absolute',
          bottom: 1,
          right: 2,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

/**
 * Ícone de Casinha / Clínica (estilo contorno azul da imagem).
 */
export function IconeCasinha({ size = 24, color = '#2563EB' }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Telhado */}
      <View
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
          position: 'absolute',
          top: 3,
        }}
      />
      {/* Corpo da casa */}
      <View
        style={{
          width: size * 0.68,
          height: size * 0.52,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          position: 'absolute',
          bottom: 2,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {/* Porta */}
        <View
          style={{
            width: size * 0.22,
            height: size * 0.28,
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
            borderTopWidth: 2,
            borderLeftWidth: 2,
            borderRightWidth: 2,
            borderColor: color,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Ícone de Telefone.
 */
export function IconeTelefone({ size = 15, color = '#64748B' }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size - 1, color: color, transform: [{ rotate: '15deg' }] }}>
        📞
      </Text>
    </View>
  );
}

/**
 * Ícone do Menu Hambúrguer.
 */
export function IconeMenu({ color = '#1E293B' }) {
  return (
    <View style={styles.menuContainer}>
      <View style={[styles.menuBarra, { backgroundColor: color }]} />
      <View style={[styles.menuBarra, { backgroundColor: color }]} />
      <View style={[styles.menuBarra, { backgroundColor: color }]} />
    </View>
  );
}

/**
 * Logo oficial do ProntoVital (Imagem em anexo + "Pronto" + "Vital").
 */
export function LogoProntoVital() {
  return (
    <View style={styles.logoWrapper}>
      <Image
        source={require('../../assets/logo-prontovital.jpg')}
        style={styles.logoImagem}
        resizeMode="contain"
      />

      {/* Tipografia da marca */}
      <View style={styles.marcaTextoContainer}>
        <Text style={styles.marcaPronto}>Pronto</Text>
        <Text style={styles.marcaVital}>Vital</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lupaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  menuBarra: {
    width: 22,
    height: 2.2,
    borderRadius: 2,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImagem: {
    width: 30,
    height: 30,
    borderRadius: 6,
    marginRight: 8,
  },
  marcaTextoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marcaPronto: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  marcaVital: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: -0.5,
  },
});
