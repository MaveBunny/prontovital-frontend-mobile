export function limparDigitos(value = '') {
  return String(value).replace(/\D/g, '');
}

export function mascaraCPF(value = '') {
  return limparDigitos(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function mascaraCNPJ(value = '') {
  return limparDigitos(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function mascaraTelefone(value = '') {
  const d = limparDigitos(value).slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function mascaraData(value = '') {
  const d = limparDigitos(value).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
}

export function converterDataParaISO(dataBr = '') {
  const match = String(dataBr).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, diaStr, mesStr, anoStr] = match;
  const dia = Number(diaStr);
  const mes = Number(mesStr);
  const ano = Number(anoStr);

  if (ano < 1900 || ano > new Date().getFullYear() || mes < 1 || mes > 12) {
    return null;
  }

  const dataObj = new Date(ano, mes - 1, dia);
  const dataValida =
    dataObj.getFullYear() === ano &&
    dataObj.getMonth() === mes - 1 &&
    dataObj.getDate() === dia;

  return dataValida ? `${anoStr}-${mesStr}-${diaStr}` : null;
}
