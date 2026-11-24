# FE-branch: `feature/task-feedback-and-errors` – ændringer og test

Alt er **ikke committet** endnu. `ng build` og `npm run test:ci` er grønne (74 tests, 14 nye).
Version 3: opdateret efter feedback (toast også til fejl, Find opgaver, tilbagetræk kun på Task details, blå KK-chip).

## Sådan sætter du testmiljøet op

| Trin | Kommando / handling |
|---|---|
| 1. Database | `docker compose up -d` i `echo-backend` |
| 2. Backend | `dotnet run --project EchoBackend` i `echo-backend` (opretter og seeder data i Development) |
| 3. Frontend | `npm start` i `echo-frontend` (proxy `/api` → `http://localhost:5293`), åbn `http://localhost:4200` |
| 4. Log ind | Brug **rigtige** seed-brugere på login-siden (dev-brugerne rammer ikke backend). Adgangskode `EchoDev123`: `organization@echo.local` (Grønne Fingre Aarhus, 3 OPEN + 1 DRAFT Task), `anna.peer@echo.local`, `mikkel.peer@echo.local`, `sofie.peer@echo.local` |
| 5. Automatisk | `npm run test:ci` (forvent 74 grønne) og `npx ng build --configuration development` |

> Tip: brug to browservinduer (fx Org og Anna), eller to faner med samme bruger til "forældet side"-testene. Komponent-showcases (kort, toast) ses uden backend på `/peer/components` (dev-login).

## Ændringer

| # | Område / side | Hvad er ændret eller tilføjet | Sådan tester du |
|---|---|---|---|
| 1 | **Toast** (ny, fælles) | `ToastService` + `echo-toast-host` (i app-roden). Succesbeskeder er nu en toast der **svæver øverst til højre** og ikke skubber indholdet. Forsvinder efter **5 sek. eller ved klik** (første af de to). Erstatter de tidligere bannere. **Fejl fra handlinger (ansøg, publicér, træk tilbage, vælg/afvis, afslut, slet) vises også som toast (rød).** Fejl inde i selve formularen (opret/rediger) og "siden kunne ikke hentes" ligger stadig inline: dialogen ligger over toasten, og en side uden indhold skal ikke tømmes efter 5 sek. | `/peer/components` → *Toast* → *Vis success* / *Vis danger*. Opret en opgave: toasten kommer øverst til højre, siden flytter sig ikke. Klik på den, eller vent 5 sek. |
| 2 | **Opret opgave** (dialog) | Statusspecifikke fejltekster; kategorifejl vises og hentes igen ved næste åbning; feltet hedder "Belønning pr. deltager" med hjælpetekst (Peer: DKK + escrow-forklaring, Organization: "KK pr. deltager."). | Åbn dialogen som Org og som Peer (tjek label/hjælpetekst). Stop backend og åbn første gang: rød fejl i formularen. |
| 3 | **Mine opgaver** | Efter oprettelse: toast "Opgaven er oprettet som kladde…", listen genindlæses. | Opret en opgave: toast øverst til højre, kortet står som *Kladde*. |
| 4 | **Task details (Poster)** | Knappen hedder **"Publicer"**. Toast ved publicér/start/annullér/rediger/vælg deltager/afvis/afslut ("Opgaven er publiceret…", "Deltageren er valgt." osv.). Specifikke 409-tekster. Én genindlæsning efter vælg/afvis. | Org → *Se opgave* på kladde → *Publicer*: toast + status "Afventer svar". 409: publicér i fane 1, tryk *Publicer* i forældet fane 2. |
| 5 | **Afslut & overfør** | Fejl ved bedømmelse lukker dialogen, så fejlen kan ses. Egne 404/409-tekster. Toast "Opgaven er afsluttet." | IN_PROGRESS-opgave → *Afslut & overfør* → bedøm alle → toast + status *Udført*. Fejl: bedøm samme deltager i to faner. |
| 6 | **Task details (Peer)** – ansøg | 403 "kan ikke ansøge til din egen opgave", 409 "har allerede ansøgt…". Afvist/trukket-tilstande: besked i stedet for *Tilbyd hjælp*. | Anna → Find opgaver → *Se opgave* → *Tilbyd hjælp*. 409: ansøg i to faner. Efter afvisning/tilbagetrækning: besked, ingen knap. |
| 7 | **Find opgaver** – skjul og marker | **(a)** Opgaver hvor Peeren har **trukket sig tilbage (WITHDRAWN)** vises ikke længere. **(b)** Opgaver Peeren har ansøgt til får et mærke ved siden af status: **Ansøgt** (blå), **Valgt** (grøn), **Gennemført**, **Afvist** (rød), både i kort- og listevisning. Hentes via `GET /applications/mine`; fejler kaldet, vises listen uden mærker. | Anna ansøger til en opgave → *Find opgaver*: kortet har mærket "Ansøgt". Træk ansøgningen tilbage → opgaven er væk fra listen. Org afviser → mærket "Afvist". |
| 8 | **Træk tilbage** – kun Task details | Knap + bekræftelsesdialog (delt komponent) og toast ("Din anmodning er trukket tilbage." / "Du har forladt opgaven."). **Fjernet fra Mine bidrag-kortene** (to knapper ved siden af hinanden så dårligt ud); kortene har igen kun "Se opgave". | Anna ansøger → *Se opgave* → *Træk anmodning tilbage* → *Annuller* (intet sker) → igen og bekræft: toast, og opgaven viser "Du har trukket din anmodning tilbage…". Accepteret: *Forlad opgave*. |
| 9 | **KK som valuta** | "point" er erstattet af **KK** i formularen (suffix, hjælpetekst, valideringsfejl). Pris vises blå for KK og grøn for DKK (`echo-price`) på kort, liste, details og saldo. **KK-chippen i beløbsfeltet i Opret opgave er blå (DKK grøn)**, også i filterpanelets beløbsfelter (nyt `suffixTone` på `echo-text-input`). Interne navne/kommentarer opdateret (`MIN_REWARD_KK`). | Org → *Opret opgave*: chippen "KK" er blå, "Mindst 1 KK". Peer: chippen "DKK" er grøn. Kort og details for en Org-opgave viser prisen i blå, en Peer-opgave i grøn. |

## Nye/ændrede filer (overblik)

- Nye: `shared/components/toast/*` (+ showcase `testing/toast/*`), `features/tasks/task-errors.ts`, `features/tasks/withdraw-dialog/*`, specs `task-errors.spec.ts`, `task.mapper.spec.ts`, `toast.service.spec.ts`.
- Ændrede: `app.component.ts`, `task-card` og `task-list-item` (mærke, footer), `find-tasks` (+ spec med 3 nye tests), `my-tasks`, `posted-tasks`, `task-details`, `task-form-dialog`, `task.model.ts`, `task.mapper.ts`, showcase for `task-card`.

## Åbne punkter til din feedback

- Fejl i selve formularen (opret/rediger) er stadig inline, fordi toasten ligger bag dialogen. Skal det laves om, fx ved at lukke dialogen ved fejl?
- Mærket i Find opgaver hedder *Ansøgt / Valgt / Afvist / Gennemført* (farver: info, success, danger); tekst og farver kan justeres frit i `TASK_PARTICIPATION` (`task.model.ts`).
- *Træk tilbage* findes kun på Task details (ikke på kortene i Mine bidrag eller Find opgaver).
- Efter tilbagetrækning kan Peeren ikke ansøge igen (backendens unikke indeks); opgaven skjules derfor i Find opgaver.
- Ansøgningen sendes uden besked (API'et understøtter en; ikke i scope).
- *Mine opgaver* kalder `GET /tasks/{id}/applications?status=PENDING` én gang pr. OPEN/IN_PROGRESS Task for at vise tallet på kortene.
- Poster-rollen på Task details udledes stadig af ruten (`isPoster`), indtil der findes et `/me`-endpoint.
