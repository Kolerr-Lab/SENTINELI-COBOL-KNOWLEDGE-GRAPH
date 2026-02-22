IDENTIFICATION DIVISION.
       PROGRAM-ID. LintingConfig.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  LintConfig         PIC X(50) VALUE 'Linting Configuration Set'.
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           DISPLAY LintConfig.
           STOP RUN.