       IDENTIFICATION DIVISION.
       PROGRAM-ID. CREDIT-CARD-PROCESSING.
       AUTHOR. SENTINELI-ENTERPRISE-SYSTEM.
      *****************************************************************
      * CREDIT CARD TRANSACTION PROCESSING ENGINE                    *
      * Authorization, capture, settlement, chargeback handling      *
      * EMV chip, contactless (NFC), card-not-present processing     *
      * PCI-DSS compliance, tokenization, 3D Secure                  *
      *****************************************************************
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT TRANSACTION-FILE ASSIGN TO "CC_TRANSACTIONS.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT AUTH-LOG ASSIGN TO "AUTH_LOG.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT SETTLEMENT-FILE ASSIGN TO "SETTLEMENT.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD  TRANSACTION-FILE.
       01  TRANSACTION-RECORD.
           05  TXN-ID                   PIC 9(15).
           05  CARD-TOKEN               PIC X(20).
           05  TXN-AMOUNT               PIC 9(8)V99.
           05  TXN-CURRENCY             PIC X(3).
           05  MERCHANT-ID              PIC 9(10).
           05  MERCHANT-NAME            PIC X(40).
           05  MCC-CODE                 PIC X(4).
           05  TXN-TYPE                 PIC X(15).
           05  ENTRY-METHOD             PIC X(20).
           05  CARD-PRESENT             PIC X.
           05  CVV-PROVIDED             PIC X.
           05  AVS-DATA                 PIC X(20).
       
       FD  AUTH-LOG.
       01  AUTH-RECORD.
           05  AUTH-TXN-ID              PIC 9(15).
           05  AUTH-CODE                PIC X(6).
           05  AUTH-TIMESTAMP           PIC 9(14).
           05  AUTH-STATUS              PIC X(10).
           05  DECLINE-REASON           PIC X(30).
       
       FD  SETTLEMENT-FILE.
       01  SETTLEMENT-RECORD            PIC X(100).
       
       WORKING-STORAGE SECTION.
       01  WS-AUTHORIZATION.
           05  WS-AVAILABLE-CREDIT      PIC 9(8)V99 VALUE 10000.
           05  WS-CREDIT-LIMIT          PIC 9(8)V99 VALUE 15000.
           05  WS-CURRENT-BALANCE       PIC 9(8)V99 VALUE 5000.
           05  WS-AUTH-APPROVED         PIC X VALUE 'N'.
           05  WS-AUTH-CODE-GEN         PIC X(6) VALUE SPACES.
       
       01  WS-FRAUD-DETECTION.
           05  WS-VELOCITY-CHECK        PIC X VALUE 'N'.
           05  WS-GEO-MISMATCH          PIC X VALUE 'N'.
           05  WS-CVV-MISMATCH          PIC X VALUE 'N'.
           05  WS-AVS-FAIL              PIC X VALUE 'N'.
           05  WS-FRAUD-SCORE           PIC 999 VALUE ZEROS.
       
       01  WS-COUNTERS.
           05  WS-TOTAL-TXN             PIC 9(8) VALUE ZEROS.
           05  WS-APPROVED-TXN          PIC 9(8) VALUE ZEROS.
           05  WS-DECLINED-TXN          PIC 9(6) VALUE ZEROS.
           05  WS-FRAUD-BLOCKED         PIC 9(4) VALUE ZEROS.
       
       01  WS-SETTLEMENT.
           05  WS-BATCH-TOTAL           PIC 9(12)V99 VALUE ZEROS.
           05  WS-INTERCHANGE-FEE       PIC 9(8)V99 VALUE ZEROS.
           05  WS-NET-SETTLEMENT        PIC 9(12)V99 VALUE ZEROS.
       
       01  WS-FLAGS.
           05  WS-EOF                   PIC X VALUE 'N'.
           05  WS-3DS-REQUIRED          PIC X VALUE 'N'.
           05  WS-EMV-CHIP              PIC X VALUE 'N'.
           05  WS-CONTACTLESS           PIC X VALUE 'N'.
       
       01  WS-CARD-NETWORK.
           05  WS-VISA-COUNT            PIC 9(6) VALUE ZEROS.
           05  WS-MASTERCARD-COUNT      PIC 9(6) VALUE ZEROS.
           05 WS-AMEX-COUNT            PIC 9(6) VALUE ZEROS.
           05  WS-DISCOVER-COUNT        PIC 9(6) VALUE ZEROS.
       
       01  WS-CHARGEBACK-TRACKING.
           05  WS-CHARGEBACK-COUNT      PIC 9(4) VALUE ZEROS.
           05  WS-CHARGEBACK-AMOUNT     PIC 9(10)V99 VALUE ZEROS.
           05  WS-DISPUTE-RATIO         PIC 9V9999 VALUE ZEROS.
       
       01  WS-PCI-COMPLIANCE.
           05  WS-TOKEN-USED            PIC X VALUE 'N'.
           05  WS-P2PE-ENCRYPTED        PIC X VALUE 'N'.
           05  WS-TLS-SECURED           PIC X VALUE 'Y'.
       
       01  WS-MERCHANT-FEE.
           05  WS-DISCOUNT-RATE         PIC 9V9999 VALUE 0.0250.
           05  WS-TXN-FEE               PIC 9V99 VALUE 0.10.
           05  WS-TOTAL-MERCHANT-FEE    PIC 9(8)V99 VALUE ZEROS.
       
       PROCEDURE DIVISION.
       0000-MAIN-PROCESSING.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-TRANSACTIONS
           PERFORM 2500-FRAUD-ANALYSIS
           PERFORM 3000-BATCH-SETTLEMENT
           PERFORM 3500-CHARGEBACK-MONITORING
           PERFORM 4000-COMPLIANCE-CHECK
           PERFORM 9000-TERMINATE
           STOP RUN.
       
       1000-INITIALIZE.
           DISPLAY "Credit Card Processing Engine"
           OPEN INPUT TRANSACTION-FILE
           OPEN OUTPUT AUTH-LOG
           OPEN OUTPUT SETTLEMENT-FILE.
       
       2000-PROCESS-TRANSACTIONS.
           PERFORM 2100-READ-TXN
           PERFORM UNTIL WS-EOF = 'Y'
               ADD 1 TO WS-TOTAL-TXN
               PERFORM 2200-AUTHORIZE-TXN
               PERFORM 2100-READ-TXN
           END-PERFORM.
       
       2100-READ-TXN.
           READ TRANSACTION-FILE
               AT END
                   MOVE 'Y' TO WS-EOF
           END-READ.
       
       2200-AUTHORIZE-TXN.
           IF TXN-AMOUNT <= WS-AVAILABLE-CREDIT
               MOVE 'Y' TO WS-AUTH-APPROVED
               ADD 1 TO WS-APPROVED-TXN
               STRING "A" TXN-ID DELIMITED BY SIZE
                   INTO WS-AUTH-CODE-GEN
           ELSE
               MOVE 'N' TO WS-AUTH-APPROVED
               ADD 1 TO WS-DECLINED-TXN
           END-IF
           
           MOVE TXN-ID TO AUTH-TXN-ID
           MOVE WS-AUTH-CODE-GEN TO AUTH-CODE
           
           IF WS-AUTH-APPROVED = 'Y'
               MOVE "APPROVED" TO AUTH-STATUS
               ADD TXN-AMOUNT TO WS-BATCH-TOTAL
           ELSE
               MOVE "DECLINED" TO AUTH-STATUS
               MOVE "INSUFFICIENT FUNDS" TO DECLINE-REASON
           END-IF
           
           WRITE AUTH-RECORD.
       
       2500-FRAUD-ANALYSIS.
           DISPLAY "Running fraud detection algorithms..."
           
      *    Velocity check - multiple transactions in short time
           IF WS-TOTAL-TXN > 3
               MOVE 'Y' TO WS-VELOCITY-CHECK
               ADD 100 TO WS-FRAUD-SCORE
           END-IF
           
      *    High-value transaction scrutiny
           IF TXN-AMOUNT > 5000
               ADD 150 TO WS-FRAUD-SCORE
           END-IF
           
      *    Card-not-present risk
           IF CARD-PRESENT = 'N'
               ADD 80 TO WS-FRAUD-SCORE
               
      *        Require 3D Secure for CNP
               MOVE 'Y' TO WS-3DS-REQUIRED
           END-IF
           
      *    CVV verification
           IF CVV-PROVIDED = 'N'
               MOVE 'Y' TO WS-CVV-MISMATCH
               ADD 120 TO WS-FRAUD-SCORE
           END-IF
           
      *    Block if fraud score exceeds threshold
           IF WS-FRAUD-SCORE > 300
               ADD 1 TO WS-FRAUD-BLOCKED
               DISPLAY "BLOCKED: High fraud score " WS-FRAUD-SCORE
           END-IF.
       
       3000-BATCH-SETTLEMENT.
           DISPLAY "Processing batch settlement..."
           
           COMPUTE WS-INTERCHANGE-FEE = WS-BATCH-TOTAL * 0.0175
           COMPUTE WS-NET-SETTLEMENT = 
               WS-BATCH-TOTAL - WS-INTERCHANGE-FEE
           
           STRING "Batch Total: $" WS-BATCH-TOTAL
               DELIMITED BY SIZE INTO SETTLEMENT-RECORD
           WRITE SETTLEMENT-RECORD
           
           STRING "Approved: " WS-APPROVED-TXN
               " | Declined: " WS-DECLINED-TXN
               DELIMITED BY SIZE INTO SETTLEMENT-RECORD
           WRITE SETTLEMENT-RECORD.
       
       3500-CHARGEBACK-MONITORING.
           DISPLAY "Monitoring chargeback activity..."
           
      *    Calculate chargeback rate
           IF WS-TOTAL-TXN > 0
               COMPUTE WS-CHARGEBACK-RATE = 
                   WS-CHARGEBACK-COUNT / WS-TOTAL-TXN
           END-IF
           
      *    Visa/Mastercard threshold is 1%
           IF WS-CHARGEBACK-RATE > 0.01
               DISPLAY "WARNING: Chargeback rate above threshold"
               DISPLAY "Rate: " WS-CHARGEBACK-RATE 
                   " | Count: " WS-CHARGEBACK-COUNT
           ELSE
               DISPLAY "Chargeback rate: " WS-CHARGEBACK-RATE 
                   " - within limits"
           END-IF.
       
       9000-TERMINATE.
           CLOSE TRANSACTION-FILE
           CLOSE AUTH-LOG
           CLOSE SETTLEMENT-FILE
           
           DISPLAY "Processing Complete"
           DISPLAY "Total Transactions: " WS-TOTAL-TXN
           DISPLAY "Approved: " WS-APPROVED-TXN
           DISPLAY "Declined: " WS-DECLINED-TXN
           DISPLAY "Batch Total: $" WS-BATCH-TOTAL
           .
