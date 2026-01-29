IDENTIFICATION DIVISION.
       PROGRAM-ID. Utils.
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-RESULT          PIC X(100).
       PROCEDURE DIVISION.
       FUNCTION-1.
           DISPLAY 'Executing Function 1...'.
           * Function logic here
           EXIT PROGRAM.
       FUNCTION-2.
           DISPLAY 'Executing Function 2...'.
           * Function logic here
           EXIT PROGRAM.