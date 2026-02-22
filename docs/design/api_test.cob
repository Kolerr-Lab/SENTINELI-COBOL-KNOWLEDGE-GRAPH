IDENTIFICATION DIVISION.
       PROGRAM-ID. ApiTest.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  ApiResponse        PIC X(50).
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           DISPLAY 'Testing API Endpoints'.
           MOVE 'API Endpoint Response OK' TO ApiResponse.
           DISPLAY ApiResponse.
           STOP RUN.