# 🌿 EcoRoute AI — Green Transit Optimizer

> **An AI-powered multi-objective routing & emissions optimization dashboard for green public transit in Bengaluru.**

EcoRoute AI is a full-stack decision-support dashboard designed for municipal transit operators. It leverages Google Gemini AI and real-world geocoded routing APIs to identify route alternatives that reduce vehicular emissions, manage active fleet telemetry, and measure environmental impacts.

---

## 🚀 Key Features

*   **AI-Powered Route Optimization (`/api/optimize`):**
    *   Utilizes the Google Gemini API (`gemini-2.5-flash` model via the official `@google/genai` SDK) to evaluate transit paths.
    *   Performs multi-objective optimization balancing travel duration, route length, traffic bottlenecks, and environmental footprint.
    *   Factores in real-time adjustments for vehicle specifications (weight, type) and local ambient meteorological conditions (temperature, rain/monsoon) to estimate secondary auxiliary loads (A/C).
    *   **Robust Local Fallback:** Emulates emissions metrics and generates route shapes locally if API keys are missing or offline.

*   **Interactive Spatial Mapping:**
    *   Renders interactive routes and live vehicle markers on a map using **Leaflet** (`react-leaflet`).
    *   Integrates with **OpenRouteService (ORS)** to fetch real road-following route polylines and geocode custom location addresses.

*   **Operator Fleet Telematics Tracker:**
    *   Monitors simulated transit dispatches in real time (e.g., speed, fuel burn rate, delay metrics, passenger load).
    *   Highlights optimization states such as `OPTIMAL_WAVE`, `GREEN_PATH`, `IDLE_TRAP`, or `STOP_GO_QUEUE`.

*   **Aesthetic & Responsive Analytics Console:**
    *   Vibrant, glassmorphic dark-mode interface styled with **TailwindCSS v4** and **Motion** for smooth animation transitions.
    *   Provides high-impact metrics cards tracking net fuel savings, carbon avoided (kg CO₂), equivalent tree-day absorption rates, and overall congestion efficiency.

---

## 📁 Project Architecture

The codebase is organized as follows:

```text
ENV_EL/
├── .env                  # Environment configurations for Gemini + ORS API keys (git-ignored)
├── .env.example          # Sanitized template for environment variables
├── .gitignore            # Version control exclusions (node_modules, build output, secret keys)
├── index.html            # Main HTML entry point loading Leaflet assets & fonts
├── metadata.json         # Application descriptor metadata
├── package.json          # Script commands, dependencies (React 19, Express, Tailwind v4, Leaflet)
├── server.ts             # Express backend + Vite dev middleware, fallback estimators, & Gemini handler
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite builder config configured with TailwindCSS v4 and React support
└── src/
    ├── App.tsx           # Primary React frontend dashboard layout, states, and map components
    ├── main.tsx          # SPA React mount script
    └── index.css         # TailwindCSS v4 imports & custom typography
```

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
ORS_API_KEY=your_open_route_service_key_here
```

> [!NOTE]
> *   **Gemini API Key:** Obtain from [Google AI Studio](https://aistudio.google.com/).
> *   **ORS API Key:** Obtain from [OpenRouteService](https://openrouteservice.org/) to enable real road-following routing and geocoding. If not supplied, the application will fallback to simulated coordinate paths.

### 3. Installation
Install all dependencies declared in the project:
```bash
npm install
```

### 4. Running the Development Server
Launch the Express backend integrated with the Vite build pipeline:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser to access the dashboard.

### 5. Build for Production
To bundle the frontend application assets and compile the server for high-performance deployment:
```bash
# Clean previous builds and bundle both client + server
npm run build

# Start the compiled production server
npm run start
```

---

## 📡 API Endpoints

### `POST /api/optimize`
Computes standard fastest routing versus environmental eco-routing based on vehicle specs and environment parameters.
*   **Request Body Parameters:**
    *   `origin` (string): The start address (e.g. "Koramangala 8th Block").
    *   `destination` (string): The target address (e.g. "Indiranagar 100 Feet Road").
    *   `vehicleType` (string): `SUV` | `Sedan` | `Hatchback` | `Sports`.
    *   `vehicleWeight` (number): Vehicle mass in kg (e.g., 1400).
    *   `weather` (string): `Sunny` | `Overcast` | `Monsoon Rain`.
    *   `tempCelsius` (number): Ambient temperature.
    *   `congestionLevel` (string): `Low` | `Moderate` | `Heavy`.

*   **JSON Response Structure:**
    ```json
    {
      "summary": "Summary of optimization findings...",
      "weatherImpact": "Explanation of A/C cargo and thermal load impacts...",
      "standardRoute": {
        "name": "Route Name",
        "distanceKm": 8.5,
        "durationMinutes": 32,
        "estCO2Kg": 1.57,
        "estFuelLiters": 0.68,
        "congestionScore": 9,
        "hotspots": ["Hotspot 1", "Hotspot 2"]
      },
      "ecoRoute": {
        "name": "Eco Bypass Route Name",
        "distanceKm": 9.2,
        "durationMinutes": 24,
        "estCO2Kg": 1.25,
        "estFuelLiters": 0.54,
        "congestionScore": 2,
        "bypassDetails": "How it avoids chokepoints...",
        "alternativeStops": ["Bypass stop 1", "Bypass stop 2"]
      },
      "metrics": {
        "fuelSavedLiters": 0.14,
        "fuelSavingsPercent": 21,
        "co2ReducedKg": 0.32,
        "co2SavingsPercent": 21,
        "equivalentTreesPlanted": 0.05
      },
      "insights": [
        "Insight recommendation 1",
        "Insight recommendation 2"
      ],
      "fromAI": true,
      "coordinates": {
        "standard": [{ "lat": 12.9176, "lng": 77.6244 }, ...],
        "eco": [{ "lat": 12.9176, "lng": 77.6244 }, ...]
      }
    }
    ```

### `GET /api/buses`
Returns real-time locations and metrics for active fleet vehicles dispatched across Bengaluru transit lines.

---

## 🌍 SDG Alignment
This application aligns with United Nations Sustainable Development Goals:
*   **SDG 11 (Sustainable Cities and Communities):** Promotes accessible, low-carbon transit alternatives and optimal congestion patterns.
*   **SDG 13 (Climate Action):** Directly quantifies and minimizes transportation fuel consumption and carbon footprints.
