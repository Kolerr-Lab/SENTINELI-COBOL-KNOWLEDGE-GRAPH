IDENTIFICATION DIVISION.
       PROGRAM-ID. TestConfig.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  ConfigSetting      PIC X(50) VALUE 'Test Runner Configured'.
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           DISPLAY ConfigSetting.
           STOP RUN.