# ⚡ CryptoStream Pro Dashboard

Un dashboard financiero de alto rendimiento en tiempo real construido con React, TypeScript y WebSockets de Binance. Diseñado para manejar flujos de datos intensivos sin sacrificar la fluidez de la interfaz.

![Dashboard Preview](https://via.placeholder.com/800x450?text=CryptoStream+Pro+Dashboard)

## 🚀 Características Clave

*   **Tiempo Real Real:** Conexión directa a los WebSockets de Binance (`aggTrade` y `kline`) para actualizaciones con latencia < 50ms.
*   **Alto Rendimiento:**
    *   **Throttling Inteligente:** Buffering de datos usando `useRef` para desacoplar la ingesta de datos del renderizado de React.
    *   **Virtualización:** Renderizado de listas infinitas de trades con `react-window` (0 lag con miles de items).
    *   **Renderizado Eficiente:** Gráficos optimizados con `recharts` y memoización agresiva (`React.memo`) para minimizar repintados.
*   **Datos Híbridos:** Sistema dual que carga historial vía API REST y continúa actualizando vía WebSocket sin cortes.
*   **Multi-Intervalo:** Soporte para marcos de tiempo de 1m, 15m, 1h, 4h y 1d.

## 🛠️ Stack Tecnológico

*   **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Gráficos:** [Recharts](https://recharts.org/)
*   **Virtualización:** [react-window](https://github.com/bvaughn/react-window)
*   **Utilidades:** `lodash` (tbd), `clsx`, `lucide-react`.

## 📦 Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repo>
    cd crypto-dashboard
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Iniciar servidor de desarrollo:**
    ```bash
    npm run dev
    ```

## 🏗️ Arquitectura de Datos

El hook `useBinanceData` implementa un patrón de "hidratación + stream":

1.  **Fase Fetch:** Pide las últimas 100 velas a la API REST `/api/v3/klines`.
2.  **Fase Socket:** Se suscribe a `wss://stream.binance.com:9443/ws/...`.
3.  **Merge:** Las actualizaciones del socket reemplazan la última vela en tiempo real si el timestamp coincide, o añaden una nueva si el intervalo ha cerrado.

## 📝 Licencia

MIT