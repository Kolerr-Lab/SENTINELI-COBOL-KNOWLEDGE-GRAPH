IDENTIFICATION DIVISION.
       PROGRAM-ID. MIDDLEWARE.
       
       WORKING-STORAGE SECTION.
       01 WS-LOGGING-ENABLED PIC X(1) VALUE 'Y'.
       01 WS-CORS-ENABLED PIC X(1) VALUE 'Y'.
       01 WS-REQUEST-ID PIC X(36).
       
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           IF WS-LOGGING-ENABLED = 'Y'
               PERFORM LOG-REQUEST
           END-IF.
           IF WS-CORS-ENABLED = 'Y'
               PERFORM HANDLE-CORS
           END-IF.
           STOP RUN.
       
       LOG-REQUEST.
           DISPLAY 'Logging request with ID: ' WS-REQUEST-ID.
       
       HANDLE-CORS.
           DISPLAY 'Handling CORS'.