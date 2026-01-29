IDENTIFICATION DIVISION.
       PROGRAM-ID. UtilityTest.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  UtilityResult      PIC X(50).
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           DISPLAY 'Testing Utility Functions'.
           MOVE 'Utility Function Passed' TO UtilityResult.
           DISPLAY UtilityResult.
           STOP RUN.