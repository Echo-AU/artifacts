# Mødeagenda med vejleder

**Dato:** 4-09-2026  
**Tid:** 12:15  
**Sted eller mødelink:** Nygaard kælderen  
**Deltagere:** Rene, Lasse, Torben (vejleder)  
**Mødeleder:** Rene  
**Referent:** Lasse

## Agenda

1. **Status og opfølgning** 

2. **Review af kravsspec** 

3. **Opsamling og næste skridt** 

## Kort status siden sidste møde

- Foretaget ændringer i kravsspec 
  - Nedjusteret antal user stories, og ændret epics
  - Ny aktør kontekst diagram
  - Lavet ikke funktionelle krav
  - Lavet FURPS
  - Lavet Moscow

## Dokumenter til review

### "B-Kravspec"

- **6 sider** 
- **Reviewfokus:** ændringer i user stories samt epics 

## Spørgsmål til Torben

1. **Bør US-04 være et ikke funktionelt krav, eller andet?**
   - Kontekst: Vi ser der ikke helt som et reelt user krav, da det ikke er i brugerens interesse at blive begrænset i sine handlinger - det er i vores interesse. 
   - Kunne det være et acceptkritierie til US-01 måske?
      - "Acceptkriterie: Valget af kontotype definerer brugerens rettigheder på platformen. Systemet skal blokere adgang til endpoints og UI-elementer, der tilhører andre kontotyper"
      - Må vi i det hele taget anvende "acceptkriterier" 

2. **Bør user stories med samme scenarie, men forskellige kriterier for succes, gruperes som ex: US-8a og US-8b?**
   - Kontekst: User story 8a og 8b handler begge om at kunne se tilgengælige opgaver, bare fra forskellige udbydere. Så for samhørighedsskyld, har vi kaldt dem 8a og 8b. Men bør de være hver sin user story, så den springer fra 8 til 9?

## Notater fra møde:

- Analyse eksempel (Som Torben viste) forholdte sig meget kort. Styrker, svagheder, relevant for projekt for hvert komponent, og til sidst et resultat. En god pointe fra Torben kan være at lave en lille test på komponenter man er i tvivl om. Hellere en test på lille skala tidligt, end at gå i stå senere fordi det ikke virker som tiltænkt.

- Risikoanalyse har en fin overskuelig risikomatrix med endelige resultater
- GUI analyse er et punkt for sig efter risiko analyse, hvor man får review af sin gui. Må godt være mock i starten
- Mere begrundelse i teknisk analyse
- Det rige billede i begyndelsen må gerne være for ambitiøst, og så være mindre senere i rapporten efter en moscow analyse
- Precision må gerne

- **A1 - US4:** Flyt over til acceptkriterier for US1
- **A2 - A/B User stories:** Vi må gerne bruge US-xA og US-xB til og opdele den samme US med forskellige Users + forskellige prioritering

# Feedback

- Evt tilføj en Note! til US omkring oprettelse af Bruger (omhandler Passwork krav)
- Lav en forklaring på hvad de enkelte Epics gør/ansvar (overordnet)
- IFK2.1 - gør den mere præcis
