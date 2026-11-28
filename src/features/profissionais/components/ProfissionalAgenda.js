import React, { useRef } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../shared/theme/colors";
import {
  dataDoAgendamento,
  dataIso,
  DIAS_SEMANA,
  formatarData,
  MODOS_AGENDA,
  statusAgendamento,
  tituloPeriodo,
} from "../utils/profissionalUtils";

function CartaoAgendamento({ agendamento }) {
  const paciente =
    agendamento.Paciente?.User?.nome ||
    agendamento.Paciente?.nome ||
    agendamento.paciente?.nome ||
    agendamento.nome_paciente ||
    "Paciente";
  const clinica =
    agendamento.Clinica?.User?.nome ||
    agendamento.Clinica?.nome ||
    agendamento.clinica ||
    "Clínica não informada";
  const data = dataDoAgendamento(agendamento);
  const horario = String(agendamento.horario_agendamento || "").slice(0, 5);
  const status = statusAgendamento(agendamento.status);
  const observacao = String(
    agendamento.observacao ||
      agendamento.obvervacao ||
      agendamento.resumoTriagem ||
      "",
  ).trim();

  return (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentPatientInfo}>
          <Text style={styles.appointmentPatient}>{paciente}</Text>
          <Text style={styles.appointmentDate}>Paciente</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            status === "Cancelado"
              ? styles.statusCancelled
              : status === "Concluído"
                ? styles.statusCompleted
                : status === "Pendente"
                  ? styles.statusPending
                  : styles.statusConfirmed,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              status === "Cancelado"
                ? styles.statusCancelledText
                : status === "Concluído"
                  ? styles.statusCompletedText
                  : status === "Pendente"
                    ? styles.statusPendingText
                    : styles.statusConfirmedText,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.detailsList}>
        <View style={styles.detailRow}>
          <Ionicons
            name="business-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.detailText}>{clinica}</Text>
        </View>
        <View style={styles.dateTimeRow}>
          <View style={styles.detailRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.detailText}>{formatarData(data)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={styles.detailText}>{horario || "--:--"}</Text>
          </View>
        </View>
      </View>
      {observacao ? (
        <View style={styles.observationCard}>
          <View style={styles.observationHeading}>
            <Ionicons
              name="document-text-outline"
              size={16}
              color={colors.primary}
            />
            <View>
              <Text style={styles.observationLabel}>
                Motivo da consulta
              </Text>
              <Text style={styles.observationCaption}>
                Informado pelo paciente
              </Text>
            </View>
          </View>
          <Text style={styles.observationText} selectable>
            {observacao}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Calendario({
  modoCalendario,
  dataSelecionada,
  moverPeriodo,
  onSelectDate,
  diasCalendario,
  isoSelecionado,
  agendamentos,
}) {
  const temConsulta = (dia) =>
    agendamentos.some(
      (item) =>
        dataDoAgendamento(item) === dataIso(dia) &&
        statusAgendamento(item.status) !== "Cancelado",
    );

  return (
    <>
      <View style={styles.calendarCard}>
        <View style={styles.calendarNav}>
          <TouchableOpacity
            onPress={() => moverPeriodo(-1)}
            accessibilityRole="button"
            accessibilityLabel="Período anterior"
            style={styles.calendarArrow}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>
            {tituloPeriodo(dataSelecionada, modoCalendario)}
          </Text>
          <TouchableOpacity
            onPress={() => moverPeriodo(1)}
            accessibilityRole="button"
            accessibilityLabel="Próximo período"
            style={styles.calendarArrow}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {modoCalendario === "Semana" ? (
          <View style={styles.weekGrid}>
            {diasCalendario.map((dia) => {
              const isoDia = dataIso(dia);
              const selecionado = isoDia === isoSelecionado;
              const temAgendamento = temConsulta(dia);
              return (
                <TouchableOpacity
                  key={isoDia}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selecionado }}
                  accessibilityLabel={formatarData(isoDia, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  onPress={() => onSelectDate(dia, temAgendamento)}
                  style={styles.weekDay}
                >
                  <View
                    style={[
                      styles.weekDayHeader,
                      selecionado && styles.weekDayHeaderSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.weekDayLabel,
                        selecionado && styles.weekDayTextSelected,
                      ]}
                    >
                      {DIAS_SEMANA[dia.getDay() === 0 ? 6 : dia.getDay() - 1]}
                    </Text>
                    <Text
                      style={[
                        styles.weekDayNumber,
                        selecionado && styles.weekDayTextSelected,
                      ]}
                    >
                      {dia.getDate()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.weekDayBody,
                      selecionado && styles.weekDayBodySelected,
                    ]}
                  >
                    {temAgendamento ? (
                      <View style={styles.calendarDot} />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.monthGrid}>
            <View style={styles.monthWeekdays}>
              {DIAS_SEMANA.map((dia) => (
                <Text key={dia} style={styles.calendarWeekday}>
                  {dia}
                </Text>
              ))}
            </View>
            <View style={styles.monthDays}>
              {diasCalendario.map((dia) => {
                const isoDia = dataIso(dia);
                const selecionado = isoDia === isoSelecionado;
                const outroMes =
                  dia.getMonth() !== dataSelecionada.getMonth();
                const temAgendamento = temConsulta(dia);
                return (
                  <TouchableOpacity
                    key={isoDia}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selecionado }}
                    accessibilityLabel={formatarData(isoDia, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    onPress={() => onSelectDate(dia, temAgendamento)}
                    style={styles.calendarDay}
                  >
                    <View
                      style={[
                        styles.calendarDayNumber,
                        selecionado && styles.calendarDaySelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          outroMes && styles.calendarDayOutside,
                          selecionado && styles.calendarDayTextSelected,
                        ]}
                      >
                        {dia.getDate()}
                      </Text>
                    </View>
                    {temAgendamento ? (
                      <View style={styles.calendarDot} />
                    ) : (
                      <View style={styles.calendarDotSpace} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </>
  );
}

export default function ProfissionalAgenda({
  telaAtiva,
  modoCalendario,
  setModoCalendario,
  dataSelecionada,
  moverPeriodo,
  setDataSelecionada,
  diasCalendario,
  isoSelecionado,
  agendamentos,
  agendamentosDoDia,
  agendamentosOrdenados,
  atualizando,
  onRefresh,
}) {
  const isAgenda = telaAtiva === "ProfissionalAgenda";
  const lista = isAgenda ? agendamentosDoDia : agendamentosOrdenados;
  const scrollRef = useRef(null);
  const consultasY = useRef(0);

  function selecionarData(dia, temConsulta) {
    setDataSelecionada(dia);
    if (temConsulta) {
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({
          y: Math.max(0, consultasY.current - 8),
          animated: true,
        }),
      );
    }
  }

  return (
    <>
      <View style={styles.pageHeadingOutside}>
        <View style={styles.headingText}>
          <Text style={styles.pageTitle}>
            {isAgenda ? "Calendário" : "Agendamentos"}
          </Text>
          <Text style={styles.pageSubtitle}>
            {isAgenda
              ? "Veja suas consultas por semana ou mês."
              : "Suas consultas em ordem de data e horário."}
          </Text>
        </View>
        {isAgenda ? (
          <View style={styles.segmentRow}>
            {MODOS_AGENDA.map((modo) => (
              <TouchableOpacity
                key={modo}
                accessibilityRole="button"
                accessibilityState={{ selected: modoCalendario === modo }}
                style={[
                  styles.segmentButton,
                  modoCalendario === modo && styles.segmentButtonActive,
                ]}
                onPress={() => setModoCalendario(modo)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    modoCalendario === modo && styles.segmentTextActive,
                  ]}
                >
                  {modo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isAgenda ? (
          <>
            <Calendario
              modoCalendario={modoCalendario}
              dataSelecionada={dataSelecionada}
              moverPeriodo={moverPeriodo}
              onSelectDate={selecionarData}
              diasCalendario={diasCalendario}
              isoSelecionado={isoSelecionado}
              agendamentos={agendamentos}
            />
            <View
              onLayout={(event) => {
                consultasY.current = event.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionTitle}>
                Consultas em{" "}
                {formatarData(isoSelecionado, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
                {" "}({agendamentosDoDia.length})
              </Text>
              {lista.length ? (
                lista.map((item, indice) => (
                  <CartaoAgendamento
                    key={item.id_agendamento || item.id || indice}
                    agendamento={item}
                  />
                ))
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>
                    Nenhuma consulta para este dia.
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : lista.length ? (
          lista.map((item, indice) => (
            <CartaoAgendamento
              key={item.id_agendamento || item.id || indice}
              agendamento={item}
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  pageHeadingOutside: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 8,
  },
  headingText: { flex: 1, paddingRight: 8 },
  pageTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: "800" },
  pageSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  pageContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36 },
  segmentRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 22,
    padding: 3,
  },
  segmentButton: {
    minWidth: 58,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  segmentButtonActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  segmentTextActive: { color: "#FFFFFF", fontWeight: "800" },
  calendarCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 22,
  },
  calendarNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 42,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  calendarArrow: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "capitalize",
  },
  weekGrid: { flexDirection: "row" },
  weekDay: {
    width: "14.2857%",
    borderRightWidth: 1,
    borderColor: colors.borderLight,
  },
  weekDayHeader: {
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  weekDayHeaderSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekDayLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 4,
  },
  weekDayNumber: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  weekDayTextSelected: { color: "#FFFFFF" },
  weekDayBody: {
    minHeight: 112,
    alignItems: "center",
    paddingTop: 12,
    backgroundColor: colors.surface,
  },
  weekDayBodySelected: { backgroundColor: colors.primarySoft },
  monthGrid: { paddingHorizontal: 8, paddingBottom: 8 },
  monthWeekdays: { flexDirection: "row" },
  monthDays: { flexDirection: "row", flexWrap: "wrap" },
  calendarWeekday: {
    width: "14.2857%",
    color: colors.textPlaceholder,
    fontSize: 11,
    fontWeight: "700",
    paddingVertical: 8,
    textAlign: "center",
  },
  calendarDay: {
    width: "14.2857%",
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDaySelected: { backgroundColor: colors.primary },
  calendarDayText: { color: colors.textPrimary, fontSize: 12, fontWeight: "600" },
  calendarDayOutside: { color: colors.textPlaceholder },
  calendarDayTextSelected: { color: "#FFFFFF" },
  calendarDot: {
    position: "absolute",
    bottom: 7,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  calendarDotSpace: { position: "absolute", bottom: 7, width: 5, height: 5 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  appointmentPatientInfo: { flex: 1 },
  appointmentPatient: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  appointmentDate: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  statusBadge: {
    overflow: "hidden",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  statusConfirmedText: { color: colors.success },
  statusCompletedText: { color: colors.textMuted },
  statusPendingText: { color: colors.primary },
  statusCancelledText: { color: colors.error },
  statusConfirmed: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  statusCompleted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderLight,
  },
  statusPending: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
  },
  statusCancelled: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 14,
  },
  detailsList: { gap: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  dateTimeRow: { flexDirection: "row", gap: 20 },
  observationCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    padding: 11,
    marginTop: 12,
  },
  observationHeading: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 7 },
  observationLabel: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
  observationCaption: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  observationText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  emptyBox: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 20,
    alignItems: "center",
  },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20 },
});
