IDENTIFICATION DIVISION.
       PROGRAM-ID. FILE-PROCESSOR.
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT INPUT-FILE ASSIGN TO 'INPUT.DAT'
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT OUTPUT-FILE ASSIGN TO 'OUTPUT.DAT'
               ORGANIZATION IS LINE SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD INPUT-FILE.
       01 INPUT-RECORD.
           05 CUST-ID       PIC 9(5).
           05 CUST-NAME     PIC X(30).
           05 CUST-BALANCE  PIC 9(7)V99.
       
       FD OUTPUT-FILE.
       01 OUTPUT-RECORD     PIC X(80).
       
       WORKING-STORAGE SECTION.
       01 WS-EOF           PIC A VALUE 'N'.
       01 WS-TOTAL         PIC 9(9)V99 VALUE ZEROS.
       
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           OPEN INPUT INPUT-FILE
                OUTPUT OUTPUT-FILE.
           
           PERFORM UNTIL WS-EOF = 'Y'
               READ INPUT-FILE
                   AT END
                       MOVE 'Y' TO WS-EOF
                   NOT AT END
                       PERFORM PROCESS-RECORD
               END-READ
           END-PERFORM.
           
           CLOSE INPUT-FILE OUTPUT-FILE.
           STOP RUN.
       
       PROCESS-RECORD.
           ADD CUST-BALANCE TO WS-TOTAL.
           MOVE INPUT-RECORD TO OUTPUT-RECORD.
           WRITE OUTPUT-RECORD.