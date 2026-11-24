# ProntoVital Mobile — React Native & Expo Go

Aplicativo mobile nativo (iOS e Android) da plataforma **ProntoVital**, conectado diretamente à API RESTful existente (`prontovital-api`) sem alterações no backend.

##  Como Rodar no Celular com Expo Go

1. Instale o aplicativo **Expo Go** no seu celular (Google Play Store ou Apple App Store).
2. No terminal, entre na pasta do projeto mobile:
   ```bash
   cd prontovital-mobile
   ```
3. Inicie o servidor de desenvolvimento do Expo:
   ```bash
   npx expo start
   ```
4. Escaneie o **QR Code** exibido no terminal:
   - **Android:** Use o leitor de QR Code dentro do próprio app **Expo Go**.
   - **iOS (iPhone):** Use a **Câmera** nativa do iOS e toque na notificação para abrir no Expo Go.

> **Dica de Rede:** Caso o celular e o computador estejam em redes Wi-Fi com isolamento (como Wi-Fi de faculdade/empresa), inicie com túnel:
> ```bash
> npx expo start --tunnel
> ```

## 🔗 Conexão com o Backend

Por padrão, o app aponta para a API em nuvem (`https://prontovital-api.onrender.com`).
Se você estiver rodando o backend localmente na porta `3000`, crie um arquivo `.env` na raiz de `prontovital-mobile/` com o **IP da sua máquina na rede Wi-Fi** (nunca use `localhost`, pois no celular `localhost` é o próprio aparelho):

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000
```
