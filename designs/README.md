# Echo – simpel UI/UX-prototype

Åbn **index.html** direkte i en moderne browser. Ingen installation eller build er nødvendig. Alle ressourcer er lokale, og prototypen kan bruges offline.

## Afprøv et helt forløb

1. Start som **Contributor**, vælg “Giv strandparken en frisk start”, og klik **Tilbyd hjælp**.
2. Skift til **Organization** med **Afprøv som** i sidemenuen. Åbn samme aktivitet under **Mine aktiviteter**, gå til **Deltagere**, og vælg Alex Jensen.
3. Klik **Afslut og overfør**, og bekræft. Beløbet er pr. valgt deltager.
4. Skift tilbage til **Contributor**. Se opgaven under **Mine opgaver → Udførte** og overførslen under **Saldo og historik**. Åbn opgaven for at skrive en anmeldelse.
5. Åbn **Belønninger → En god kop kaffe**, og indløs den. Saldo og historik opdateres, og belønningssiden viser en demokvittering.

Andre flows:

- **Requester:** Vælg Sara på “Hjælp med at flytte en reol”, og afslut opgaven med betaling i DKK. Opret også en ny opgave med forhåndsvisning.
- **Reward Partner:** Opret en belønning, og skift til Contributor for at finde den i kataloget.
- **Profiler:** Redigér din profil, og åbn offentlige profiler fra opgaver eller deltagerlisten.
- **Konto:** Log ud for at se login og konto-oprettelse. Brug kun opdigtede oplysninger. Adgangskoden gemmes aldrig.
- **Tomtilstand:** Søg efter noget, der ikke findes.
- **Utilstrækkelig saldo:** Åbn “Brunch for to”, før du har optjent flere Karma Koins.
- **Overførselsfejl:** Opret en aktivitet med et beløb over organisationens saldo, tilbyd hjælp som Contributor, vælg deltageren som Organization, og forsøg at afslutte. Handlingen afvises uden at ændre saldo eller opgavestatus.

## Sider fra analysen

| View | Side / hash-rute |
| --- | --- |
| V01 | Login og konto-oprettelse: `#auth` (via Log ud) |
| V02 | Min profil: `#profile` |
| V03 | Offentlig profil og omdømme: `#user/me`, `#user/org` osv. |
| V04 | Find opgaver: `#discover` |
| V05 | Opgavedetaljer, deltagere, afslutning og anmeldelser: `#task/t1` osv. |
| V06 | Opret opgave / aktivitet: `#new-task` |
| V07 | Mine opgaver / aktiviteter: `#tasks` |
| V08 | Saldo og transaktionshistorik: `#wallet` |
| V09 | Belønningskatalog: `#rewards` |
| V10 | Belønningsdetaljer og indløsning: `#reward/r1` osv. |
| V11 | Partneroversigt: `#partner`; oprettelse: `#new-reward` |

## Afgrænsning og antagelser

- Dette er en lokal prototype med simuleret login, roller, betaling og indløsning. Ingen backend eller rigtig adgangskontrol. Rollevalget er et værktøj til afprøvning.
- Contributor og Requester bruger samme private demoprofil (Alex), men har adskilte arbejdsområder. Organization og Reward Partner er separate demoidentiteter.
- Tilbud kræver ejerens valg. Ejeren bekræfter udførelsen for alle valgte deltagere og overfører det angivne beløb til hver deltager.
- DKK er valgt som demovaluta. Betaling, organisationssaldo og partnerens modtagelse af Karma Koins er antagelser til prototypen, ikke nye vedtagne krav.
- En belønning kan indløses én gang pr. demoprofil for at gøre dobbeltklik og kvittering tydelige. Fysisk udlevering er ikke implementeret; kvitteringen er ikke en butikskode.
- Ratings bruger 1–5 stjerner mellem ejeren og de valgte deltagere efter udførelse. Én anmeldelse pr. modtager pr. opgave.
- Data gemmes i browserens `localStorage` under `echo-ui-prototype-v1`. Brug **Nulstil demo** under rollevalget for at gendanne startdata. Hvis browseren blokerer lagring, fungerer ændringer kun i den aktuelle session.
- Layoutet tilpasser sig mobil og desktop. Ingen eksterne skrifttyper, billeder eller biblioteker.
- Loading, sessionsudløb og netværksfejl er ikke simuleret; alle handlinger foregår lokalt. Backend-krav kan ikke valideres med denne prototype.

## Filer

- `index.html`: indgangspunkt.
- `styles.css`: layout, farver og responsive regler.
- `app.js`: views, navigation, formularer og dialoger.
- `model.js`: demodata og lokale handlinger.
- `prototype.test.cjs`: automatiske checks af brugerflows og rendering uden browser.

Kør checks med `node prototype.test.cjs` fra denne mappe. Ingen pakker kræves.
