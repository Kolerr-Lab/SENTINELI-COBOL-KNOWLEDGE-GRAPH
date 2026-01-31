IDENTIFICATION DIVISION.
PROGRAM-ID. MainProgram.

ENVIRONMENT DIVISION.
CONFIGURATION SECTION.
*> SPECIAL-NAMES.
*>     ENVIRONMENT-NAME IS ENVIRONMENT-VALUE.

DATA DIVISION.
WORKING-STORAGE SECTION.
01 WS-USER-ID      PIC 9(5).
01 WS-USER-NAME    PIC X(20).
       01 WS-USER-AGE       PIC 9(3).
       01 WS-INCOME         PIC 9(7).
       01 WS-CREDIT-SCORE   PIC 9(3).
       01 WS-DEBT           PIC 9(7).
       01 WS-DTI            PIC 9(3)V99.
       01 WS-STATUS         PIC X(50).

       PROCEDURE DIVISION.
       MAIN-LOGIC.
           *> Read inputs from Environment Variables
           DISPLAY 'COBOL ENGINE STARTING...'.
           
           ACCEPT WS-USER-AGE FROM ENVIRONMENT 'AGE'.
           ACCEPT WS-INCOME FROM ENVIRONMENT 'INCOME'.
           ACCEPT WS-CREDIT-SCORE FROM ENVIRONMENT 'CREDIT_SCORE'.
           ACCEPT WS-DEBT FROM ENVIRONMENT 'DEBT'.

           DISPLAY 'PROCESSING INPUTS: AGE=' WS-USER-AGE ' INCOME=' WS-INCOME ' SCORE=' WS-CREDIT-SCORE.

       100-VALIDATE-USER.
           IF WS-USER-AGE < 18 THEN
               MOVE 'REJECTED (MINOR)' TO WS-STATUS
           ELSE
               IF WS-INCOME < 20000 THEN
                   MOVE 'REJECTED (LOW INCOME)' TO WS-STATUS
               ELSE
                   IF WS-CREDIT-SCORE < 600 THEN
                       MOVE 'REJECTED (BAD CREDIT)' TO WS-STATUS
                   ELSE
                       IF WS-INCOME > 0 THEN
                           COMPUTE WS-DTI = WS-DEBT / WS-INCOME
                       ELSE
                           MOVE 1 TO WS-DTI
                       END-IF

                       IF WS-DTI > 0.50 THEN
                           MOVE 'REJECTED (HIGH DTI)' TO WS-STATUS
                       ELSE
                           MOVE 'APPROVED (PRIME)' TO WS-STATUS
                       END-IF
                   END-IF
               END-IF
           END-IF.

       200-OUTPUT-RESULT.
           DISPLAY 'FINAL STATUS: ' WS-STATUS.
           STOP RUN.