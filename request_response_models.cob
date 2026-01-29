IDENTIFICATION DIVISION.
       PROGRAM-ID. REQUEST-RESPONSE-MODELS.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-INPUT-DTO.
           05 QUESTION-TEXT PIC X(255).
           05 BUSINESS-RULE-ID PIC 9(5).
       
       01 WS-OUTPUT-DTO.
           05 RESPONSE-TEXT PIC X(255).
           05 STATUS-CODE PIC 9(3).
       
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           DISPLAY 'Creating Request and Response Models'.
           STOP RUN.