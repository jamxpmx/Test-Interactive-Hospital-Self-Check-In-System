# PatientConnect

PatientConnect is a fictional hospital self-check-in kiosk for university usability research. It is a client-only research simulation, not a real hospital service. Do not enter real patient information.

## Run locally

Requirements: Node.js 20.19+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). To verify a production build, run `npm run build`; to serve that build locally, run `npm run preview`.

## GitHub Codespaces

1. Open this repository in a Codespace.
2. In the terminal, run `npm install` and then `npm run dev`.
3. Open forwarded port `5173` from the **Ports** panel. Vite listens on `0.0.0.0` so Codespaces can forward it.

## Fictional demo accounts

Use either the patient ID and date of birth, or the six-digit quick code:

| Fictional patient | Patient ID | Date of birth | Appointment code |
| --- | --- | --- | --- |
| Jordan Lee | `PC-10482` | `1988-04-17` | `381624` |
| Avery Morgan | `PC-20937` | `1975-11-02` | `725903` |

The login screen also has buttons to fill these demo details. All profiles, appointment details, care teams, and directions are fictional.

## Study features

- English and Spanish interface copy, including localized dates and page titles.
- Easy-access mode is on by default; the header toggle switches to standard mode. Both modes share the same check-in workflow.
- The workflow covers login, appointment review, patient-detail confirmation, check-in confirmation, and fictional wayfinding.
- The research dashboard records a random participant ID, interface mode, elapsed seconds, navigation errors, assistance requests, and completion status.
- Research records are stored in this browser's `localStorage` under `patientconnect.research.v1`, separately from the in-memory demo patient session. Records are written when a task is completed or restarted. Use the dashboard to export CSV or clear records from this device.

No backend, hospital database, EHR, insurance, or healthcare authentication is connected. Demo patient details are not included in research records or CSV exports. A browser refresh clears the active demo session; anonymous research records remain until cleared in the dashboard.