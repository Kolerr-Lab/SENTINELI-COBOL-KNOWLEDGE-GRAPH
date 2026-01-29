IDENTIFICATION DIVISION.
       PROGRAM-ID. ServiceTest.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  ServiceResult      PIC X(50).
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           DISPLAY 'Testing Service Logic'.
           MOVE 'Service Logic Passed' TO ServiceResult.
           DISPLAY ServiceResult.
           STOP RUN.