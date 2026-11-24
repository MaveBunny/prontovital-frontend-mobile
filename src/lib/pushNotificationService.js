import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

export const PUSH_TOKEN_STORAGE_KEY = "@prontovital:push_token";

// Configura o alerta visual e sonoro caso a notificação chegue com o app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registrarPushNotification() {
  try {
    if (!Device.isDevice) {
      console.log("Push notifications exigem um dispositivo físico.");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Notificações ProntoVital",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1B2438",
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log(
        "Push token ignorado: projectId do EAS ainda não configurado.",
      );
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const expoPushToken = tokenResponse.data;

    // Envia para a rota POST /dispositivos do seu back-end
    await api.post("/dispositivos", {
      expo_push_token: expoPushToken,
      plataforma: Platform.OS,
    });

    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, expoPushToken);
    return expoPushToken;
  } catch (error) {
    console.warn("Falha ao registrar push notification:", error?.message);
    return null;
  }
}

export async function desativarPushNoBackend(expoPushToken) {
  try {
    await api.patch("/dispositivos/desativar", {
      expo_push_token: expoPushToken,
    });
  } catch {}
}
