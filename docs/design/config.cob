IDENTIFICATION DIVISION.
       PROGRAM-ID. CONFIGURATION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-ENV-VARS.
           05 WS-DB-URL         PIC X(100).
           05 WS-JWT-SECRET     PIC X(100).
           05 WS-PORT           PIC 9(5).
       PROCEDURE DIVISION.
       GET_ENV_VARS.
           MOVE 'DATABASE_URL' TO WS-DB-URL.
           MOVE 'JWT_SECRET' TO WS-JWT-SECRET.
           MOVE 'PORT' TO WS-PORT.
           IF WS-DB-URL = SPACES OR WS-JWT-SECRET = SPACES OR WS-PORT = SPACES
               DISPLAY 'Critical environment variables are missing!'.
               STOP RUN.
           DISPLAY "Env Vars Loaded.". successfully!'.
           STOP RUN.