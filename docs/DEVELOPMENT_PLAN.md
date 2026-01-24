# AI Dungeon Master POC - Piano di Sviluppo

## Executive Summary
POC di un Dungeon Master AI per gestire campagne D&D in tempo reale con interazione vocale.

## EPIC 1 - Autenticazione (21 SP)
- US 1.1: Registrazione utente (8 SP)
- - US 1.2: Login con JWT (8 SP)
  - - US 1.3: Logout (5 SP)
   
    - ## EPIC 2 - Campagne (34 SP)
    - - US 2.1: Creazione campagna con LLM (13 SP)
      - - US 2.2: Lista campagne (5 SP)
        - - US 2.3: Auto-save (8 SP)
          - - US 2.4: Ripresa sessione (8 SP)
           
            - ## EPIC 3 - Voce Real-time (55 SP) - CRITICO
            - - US 3.1: ASR con Deepgram (21 SP)
              - - US 3.2: TTS con ElevenLabs (13 SP)
                - - US 3.3: Barge-in e turni (21 SP)
                 
                  - ## EPIC 4 - Speaker ID (34 SP)
                  - - US 4.1: Multi-device (13 SP)
                    - - US 4.2: Diarizzazione (13 SP)
                      - - US 4.3: Push-to-talk (8 SP)
                       
                        - ## EPIC 5 - Game Engine (55 SP) - CRITICO
                        - - US 5.1: Gestione stato (21 SP)
                          - - US 5.2: Regole D&D 5e (21 SP)
                            - - US 5.3: Narrativa AI (13 SP)
                             
                              - ## EPIC 6-10
                              - - EPIC 6: RAG/Contenuti (21 SP)
                                - - EPIC 7: UI/Dashboard (21 SP)
                                  - - EPIC 8: Persistenza (21 SP)
                                    - - EPIC 9: Performance (21 SP)
                                      - - EPIC 10: Sicurezza (21 SP)
                                       
                                        - ## Totale: 304 SP | 5-6 mesi
