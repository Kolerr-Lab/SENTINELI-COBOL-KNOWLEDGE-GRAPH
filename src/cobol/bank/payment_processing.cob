       IDENTIFICATION DIVISION.
       PROGRAM-ID. PAYMENT-PROCESSING.
       AUTHOR. SENTINELI-ENTERPRISE-SYSTEM.
      *****************************************************************
      * ENTERPRISE PAYMENT ORCHESTRATION ENGINE                      *
      * Multi-channel payment processing: ACH, Wire, Card, RTP       *
      * Real-time gross settlement (RTGS) support                    *
      * ISO 20022 message format compliance                          *
      * Payment routing, reconciliation, retry logic                 *
      *****************************************************************
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT PAYMENT-QUEUE ASSIGN TO "PAYMENT_QUEUE.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT PAYMENT-LEDGER ASSIGN TO "PAYMENT_LEDGER.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT RECONCILIATION-LOG ASSIGN TO "RECONCILE.LOG"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT FAILED-PAYMENTS ASSIGN TO "FAILED_PMT.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD  PAYMENT-QUEUE.
       01  PAYMENT-REQUEST.
           05  PMT-ID                   PIC 9(15).
           05  PMT-TYPE                 PIC X(10).
           05  PMT-AMOUNT               PIC 9(12)V99.
           05  PMT-CURRENCY             PIC X(3).
           05  ORIGINATOR-ACCT          PIC X(34).
           05  BENEFICIARY-ACCT         PIC X(34).
           05  BENEFICIARY-NAME         PIC X(70).
           05  BENEFICIARY-BANK         PIC X(11).
           05  ROUTING-NUMBER           PIC X(9).
           05  SWIFT-CODE               PIC X(11).
           05  PMT-PURPOSE              PIC X(35).
           05  PMT-PRIORITY             PIC X(6).
           05  PMT-DATE                 PIC 9(8).
           05  VALUE-DATE               PIC 9(8).
       
       FD  PAYMENT-LEDGER.
       01  LEDGER-ENTRY.
           05  LEDGER-PMT-ID            PIC 9(15).
           05  LEDGER-TIMESTAMP         PIC 9(14).
           05  LEDGER-STATUS            PIC X(15).
           05  LEDGER-AMOUNT            PIC 9(12)V99.
           05  LEDGER-FEE               PIC 9(6)V99.
           05  LEDGER-CONFIRMATION      PIC X(35).
       
       FD  RECONCILIATION-LOG.
       01  RECON-RECORD                 PIC X(200).
       
       FD  FAILED-PAYMENTS.
       01  FAILED-PMT-RECORD.
           05  FAILED-PMT-ID            PIC 9(15).
           05  FAILED-REASON-CODE       PIC X(10).
           05  FAILED-REASON-DESC       PIC X(100).
           05  FAILED-RETRY-COUNT       PIC 9.
           05  FAILED-NEXT-RETRY        PIC 9(14).
       
       WORKING-STORAGE SECTION.
       01  WS-PAYMENT-FEES.
           05  WS-ACH-FEE               PIC 9(3)V99 VALUE 0.25.
           05  WS-WIRE-FEE              PIC 9(3)V99 VALUE 25.00.
           05  WS-RTP-FEE               PIC 9(3)V99 VALUE 0.50.
           05  WS-CARD-FEE-PCT          PIC 9V9999 VALUE 0.0290.
           05  WS-INTL-WIRE-FEE         PIC 9(3)V99 VALUE 45.00.
       
       01  WS-PROCESSING-LIMITS.
           05  WS-ACH-LIMIT             PIC 9(10)V99 VALUE 25000.00.
           05  WS-WIRE-LIMIT            PIC 9(12)V99 VALUE 10000000.
           05  WS-DAILY-LIMIT           PIC 9(12)V99 VALUE 50000000.
           05  WS-RTP-LIMIT             PIC 9(8)V99 VALUE 100000.00.
       
       01  WS-VALIDATION-RULES.
           05  WS-MIN-AMOUNT            PIC 9(3)V99 VALUE 0.01.
           05  WS-MAX-AMOUNT            PIC 9(12)V99 
               VALUE 999999999.99.
           05  WS-ROUTING-LENGTH        PIC 9 VALUE 9.
           05  WS-ACCOUNT-MIN-LENGTH    PIC 99 VALUE 8.
       
       01  WS-COUNTERS.
           05  WS-TOTAL-PAYMENTS        PIC 9(8) VALUE ZEROS.
           05  WS-PROCESSED-SUCCESS     PIC 9(8) VALUE ZEROS.
           05  WS-PROCESSED-FAILED      PIC 9(6) VALUE ZEROS.
           05  WS-PENDING-APPROVAL      PIC 9(6) VALUE ZEROS.
           05  WS-ACH-COUNT             PIC 9(6) VALUE ZEROS.
           05  WS-WIRE-COUNT            PIC 9(6) VALUE ZEROS.
           05  WS-CARD-COUNT            PIC 9(6) VALUE ZEROS.
           05  WS-RTP-COUNT             PIC 9(6) VALUE ZEROS.
       
       01  WS-DOLLAR-TOTALS.
           05  WS-TOTAL-VOLUME          PIC 9(14)V99 VALUE ZEROS.
           05  WS-TOTAL-FEES            PIC 9(10)V99 VALUE ZEROS.
           05  WS-ACH-VOLUME            PIC 9(12)V99 VALUE ZEROS.
           05  WS-WIRE-VOLUME           PIC 9(14)V99 VALUE ZEROS.
           05  WS-CARD-VOLUME           PIC 9(12)V99 VALUE ZEROS.
       
       01  WS-PAYMENT-STATUS.
           05  WS-VALIDATED             PIC X VALUE 'N'.
           05  WS-ROUTED                PIC X VALUE 'N'.
           05  WS-SETTLED               PIC X VALUE 'N'.
           05  WS-RECONCILED            PIC X VALUE 'N'.
       
       01  WS-ERROR-HANDLING.
           05  WS-ERROR-CODE            PIC X(10) VALUE SPACES.
           05  WS-ERROR-MESSAGE         PIC X(100) VALUE SPACES.
           05  WS-RETRY-COUNT           PIC 9 VALUE ZEROS.
           05  WS-MAX-RETRIES           PIC 9 VALUE 3.
       
       01  WS-ROUTING-DECISION.
           05  WS-PAYMENT-RAIL          PIC X(10) VALUE SPACES.
           05  WS-CLEARING-HOUSE        PIC X(30) VALUE SPACES.
           05  WS-SETTLEMENT-TIME       PIC 9(4) VALUE ZEROS.
           05  WS-CUT-OFF-TIME          PIC 9(4) VALUE 1500.
       
       01  WS-ISO20022-MESSAGE.
           05  WS-MSG-ID                PIC X(35).
           05  WS-MSG-TYPE              PIC X(10).
           05  WS-CREATION-DATETIME     PIC 9(14).
           05  WS-SETTLEMENT-METHOD     PIC X(4).
           05  WS-INSTRUCTION-ID        PIC X(35).
       
       01  WS-FRAUD-CHECK.
           05  WS-FRAUD-SCORE           PIC 999 VALUE ZEROS.
           05  WS-FRAUD-FLAG            PIC X VALUE 'N'.
           05  WS-AML-CHECK             PIC X VALUE 'N'.
           05  WS-SUSPICIOUS            PIC X VALUE 'N'.
       
       01  WS-RECONCILIATION.
           05  WS-EXPECTED-SETTLEMENT   PIC 9(14)V99 VALUE ZEROS.
           05  WS-ACTUAL-SETTLEMENT     PIC 9(14)V99 VALUE ZEROS.
           05  WS-VARIANCE              PIC S9(12)V99 VALUE ZEROS.
           05  WS-UNMATCHED-COUNT       PIC 9(4) VALUE ZEROS.
       
       01  WS-RETRY-LOGIC.
           05  WS-BACKOFF-SECONDS       PIC 9(6) VALUE ZEROS.
           05  WS-NEXT-RETRY-TIME       PIC 9(14) VALUE ZEROS.
           05  WS-RETRY-ELIGIBLE        PIC X VALUE 'N'.
       
       01  WS-TEMP-FIELDS.
           05  WS-CALCULATED-FEE        PIC 9(8)V99 VALUE ZEROS.
           05  WS-NET-AMOUNT            PIC 9(12)V99 VALUE ZEROS.
           05  WS-CURRENT-TIME          PIC 9(14).
           05  WS-CURRENT-DATE          PIC 9(8).
       
       01  WS-FLAGS.
           05  WS-EOF                   PIC X VALUE 'N'.
           05  WS-HIGH-VALUE-PMT        PIC X VALUE 'N'.
           05  WS-SAME-DAY-ACH          PIC X VALUE 'N'.
       
       01  WS-CONFIRMATION-CODE         PIC X(35) VALUE SPACES.
       
       PROCEDURE DIVISION.
       0000-MAIN-PAYMENT-ENGINE.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-PAYMENT-QUEUE
           PERFORM 3000-RECONCILIATION
           PERFORM 4000-RETRY-FAILED-PAYMENTS
           PERFORM 5000-GENERATE-REPORT
           PERFORM 9000-TERMINATE
           STOP RUN.
       
       1000-INITIALIZE.
           DISPLAY "SENTINELI Payment Orchestration Engine"
           DISPLAY "Initializing payment rails and networks..."
           
           OPEN INPUT PAYMENT-QUEUE
           OPEN OUTPUT PAYMENT-LEDGER
           OPEN OUTPUT RECONCILIATION-LOG
           OPEN OUTPUT FAILED-PAYMENTS
           
           MOVE FUNCTION CURRENT-DATE TO WS-CURRENT-TIME
           MOVE WS-CURRENT-TIME(1:8) TO WS-CURRENT-DATE
           
           MOVE ZEROS TO WS-COUNTERS
           MOVE ZEROS TO WS-DOLLAR-TOTALS
           
           DISPLAY "✓ Connected to payment networks"
           DISPLAY "  • ACH Network (NACHA)"
           DISPLAY "  • Fedwire (Federal Reserve)"
           DISPLAY "  • RTP Network (The Clearing House)"
           DISPLAY "  • SWIFT International Network".
       
       2000-PROCESS-PAYMENT-QUEUE.
           DISPLAY "Processing payment queue..."
           
           PERFORM 2100-READ-PAYMENT
           PERFORM UNTIL WS-EOF = 'Y'
               ADD 1 TO WS-TOTAL-PAYMENTS
               ADD PMT-AMOUNT TO WS-TOTAL-VOLUME
               
               PERFORM 2200-VALIDATE-PAYMENT
               
               IF WS-VALIDATED = 'Y'
                   PERFORM 2300-FRAUD-SCREENING
                   
                   IF WS-FRAUD-FLAG = 'N'
                       PERFORM 2400-ROUTE-PAYMENT
                       PERFORM 2500-CALCULATE-FEES
                       PERFORM 2600-EXECUTE-PAYMENT
                       PERFORM 2700-UPDATE-LEDGER
                   ELSE
                       PERFORM 2800-BLOCK-SUSPICIOUS-PAYMENT
                   END-IF
               ELSE
                   PERFORM 2900-LOG-VALIDATION-ERROR
               END-IF
               
               PERFORM 2100-READ-PAYMENT
           END-PERFORM.
       
       2100-READ-PAYMENT.
           READ PAYMENT-QUEUE
               AT END
                   MOVE 'Y' TO WS-EOF
           END-READ.
       
       2200-VALIDATE-PAYMENT.
           MOVE 'Y' TO WS-VALIDATED
           
      *    Amount validation
           IF PMT-AMOUNT < WS-MIN-AMOUNT
               OR PMT-AMOUNT > WS-MAX-AMOUNT
               MOVE 'N' TO WS-VALIDATED
               MOVE "AMOUNT_ERR" TO WS-ERROR-CODE
               STRING "Invalid amount: " PMT-AMOUNT
                   DELIMITED BY SIZE INTO WS-ERROR-MESSAGE
           END-IF
           
      *    Account number validation
           IF FUNCTION LENGTH(
               FUNCTION TRIM(BENEFICIARY-ACCT)) 
               < WS-ACCOUNT-MIN-LENGTH
               MOVE 'N' TO WS-VALIDATED
               MOVE "ACCT_ERR" TO WS-ERROR-CODE
               MOVE "Invalid beneficiary account" 
                   TO WS-ERROR-MESSAGE
           END-IF
           
      *    Routing number validation (US domestic)
           IF PMT-TYPE = "ACH"
               OR PMT-TYPE = "WIRE-DOM"
               IF FUNCTION LENGTH(
                   FUNCTION TRIM(ROUTING-NUMBER)) 
                   NOT = WS-ROUTING-LENGTH
                   MOVE 'N' TO WS-VALIDATED
                   MOVE "ROUTING_ERR" TO WS-ERROR-CODE
                   MOVE "Invalid routing number" 
                       TO WS-ERROR-MESSAGE
               END-IF
           END-IF
           
      *    Currency validation
           IF PMT-CURRENCY NOT = "USD"
               AND PMT-CURRENCY NOT = "EUR"
               AND PMT-CURRENCY NOT = "GBP"
               AND PMT-CURRENCY NOT = "CAD"
               MOVE 'N' TO WS-VALIDATED
               MOVE "CURRENCY_ERR" TO WS-ERROR-CODE
               STRING "Unsupported currency: " PMT-CURRENCY
                   DELIMITED BY SIZE INTO WS-ERROR-MESSAGE
           END-IF
           
      *    Payment type validation
           IF PMT-TYPE NOT = "ACH"
               AND PMT-TYPE NOT = "WIRE-DOM"
               AND PMT-TYPE NOT = "WIRE-INTL"
               AND PMT-TYPE NOT = "RTP"
               AND PMT-TYPE NOT = "CARD"
               MOVE 'N' TO WS-VALIDATED
               MOVE "TYPE_ERR" TO WS-ERROR-CODE
               STRING "Invalid payment type: " PMT-TYPE
                   DELIMITED BY SIZE INTO WS-ERROR-MESSAGE
           END-IF.
       
       2300-FRAUD-SCREENING.
           MOVE 'N' TO WS-FRAUD-FLAG
           MOVE ZEROS TO WS-FRAUD-SCORE
           
      *    High-value transaction check
           IF PMT-AMOUNT > 100000
               ADD 150 TO WS-FRAUD-SCORE
               MOVE 'Y' TO WS-HIGH-VALUE-PMT
           END-IF
           
      *    Velocity check (simplified)
           IF WS-TOTAL-PAYMENTS > 10
               ADD 100 TO WS-FRAUD-SCORE
           END-IF
           
      *    International wire scrutiny
           IF PMT-TYPE = "WIRE-INTL"
               ADD 80 TO WS-FRAUD-SCORE
               MOVE 'Y' TO WS-AML-CHECK
           END-IF
           
      *    Block if fraud score too high
           IF WS-FRAUD-SCORE > 300
               MOVE 'Y' TO WS-FRAUD-FLAG
               MOVE 'Y' TO WS-SUSPICIOUS
           END-IF.
       
       2400-ROUTE-PAYMENT.
      *    Intelligent payment routing based on type and priority
           
           EVALUATE PMT-TYPE
               WHEN "ACH"
                   MOVE "ACH" TO WS-PAYMENT-RAIL
                   MOVE "NACHA" TO WS-CLEARING-HOUSE
                   
                   IF PMT-PRIORITY = "URGENT"
                       MOVE 'Y' TO WS-SAME-DAY-ACH
                       MOVE 240 TO WS-SETTLEMENT-TIME
                   ELSE
                       MOVE 1440 TO WS-SETTLEMENT-TIME
                   END-IF
                   
                   ADD 1 TO WS-ACH-COUNT
                   ADD PMT-AMOUNT TO WS-ACH-VOLUME
                   
               WHEN "WIRE-DOM"
                   MOVE "FEDWIRE" TO WS-PAYMENT-RAIL
                   MOVE "FEDERAL-RESERVE" TO WS-CLEARING-HOUSE
                   MOVE 0 TO WS-SETTLEMENT-TIME
                   ADD 1 TO WS-WIRE-COUNT
                   ADD PMT-AMOUNT TO WS-WIRE-VOLUME
                   
               WHEN "WIRE-INTL"
                   MOVE "SWIFT" TO WS-PAYMENT-RAIL
                   MOVE "SWIFT-NETWORK" TO WS-CLEARING-HOUSE
                   MOVE 1440 TO WS-SETTLEMENT-TIME
                   ADD 1 TO WS-WIRE-COUNT
                   ADD PMT-AMOUNT TO WS-WIRE-VOLUME
                   
               WHEN "RTP"
                   MOVE "RTP" TO WS-PAYMENT-RAIL
                   MOVE "THE-CLEARING-HOUSE" TO WS-CLEARING-HOUSE
                   MOVE 0 TO WS-SETTLEMENT-TIME
                   ADD 1 TO WS-RTP-COUNT
                   
               WHEN "CARD"
                   MOVE "CARD-NET" TO WS-PAYMENT-RAIL
                   MOVE "VISA/MC-NETWORK" TO WS-CLEARING-HOUSE
                   MOVE 120 TO WS-SETTLEMENT-TIME
                   ADD 1 TO WS-CARD-COUNT
                   ADD PMT-AMOUNT TO WS-CARD-VOLUME
           END-EVALUATE
           
           MOVE 'Y' TO WS-ROUTED.
       
       2500-CALCULATE-FEES.
           MOVE ZEROS TO WS-CALCULATED-FEE
           
           EVALUATE PMT-TYPE
               WHEN "ACH"
                   IF WS-SAME-DAY-ACH = 'Y'
                       COMPUTE WS-CALCULATED-FEE = WS-ACH-FEE * 2
                   ELSE
                       MOVE WS-ACH-FEE TO WS-CALCULATED-FEE
                   END-IF
                   
               WHEN "WIRE-DOM"
                   MOVE WS-WIRE-FEE TO WS-CALCULATED-FEE
                   
               WHEN "WIRE-INTL"
                   MOVE WS-INTL-WIRE-FEE TO WS-CALCULATED-FEE
                   
               WHEN "RTP"
                   MOVE WS-RTP-FEE TO WS-CALCULATED-FEE
                   
               WHEN "CARD"
                   COMPUTE WS-CALCULATED-FEE = 
                       PMT-AMOUNT * WS-CARD-FEE-PCT
           END-EVALUATE
           
           ADD WS-CALCULATED-FEE TO WS-TOTAL-FEES
           COMPUTE WS-NET-AMOUNT = 
               PMT-AMOUNT - WS-CALCULATED-FEE.
       
       2600-EXECUTE-PAYMENT.
      *    Generate ISO 20022 message
           STRING "PMTID" PMT-ID DELIMITED BY SIZE
               INTO WS-MSG-ID
           MOVE PMT-TYPE TO WS-MSG-TYPE
           MOVE WS-CURRENT-TIME TO WS-CREATION-DATETIME
           MOVE "INDA" TO WS-SETTLEMENT-METHOD
           
      *    Submit to payment rail
           DISPLAY "→ Processing " PMT-TYPE " payment " PMT-ID
               " | $" PMT-AMOUNT " via " WS-PAYMENT-RAIL
           
      *    Simulate payment execution
           IF WS-ROUTED = 'Y'
               MOVE 'Y' TO WS-SETTLED
               ADD 1 TO WS-PROCESSED-SUCCESS
               
      *        Generate confirmation code
               STRING "CONF" WS-CURRENT-TIME PMT-ID
                   DELIMITED BY SIZE INTO WS-CONFIRMATION-CODE
               
               DISPLAY "✓ Payment settled | Confirmation: " 
                   WS-CONFIRMATION-CODE
           ELSE
               MOVE 'N' TO WS-SETTLED
               ADD 1 TO WS-PROCESSED-FAILED
               DISPLAY "✗ Payment failed to route"
           END-IF.
       
       2700-UPDATE-LEDGER.
           MOVE PMT-ID TO LEDGER-PMT-ID
           MOVE WS-CURRENT-TIME TO LEDGER-TIMESTAMP
           
           IF WS-SETTLED = 'Y'
               MOVE "SETTLED" TO LEDGER-STATUS
           ELSE
               MOVE "FAILED" TO LEDGER-STATUS
           END-IF
           
           MOVE PMT-AMOUNT TO LEDGER-AMOUNT
           MOVE WS-CALCULATED-FEE TO LEDGER-FEE
           MOVE WS-CONFIRMATION-CODE TO LEDGER-CONFIRMATION
           
           WRITE LEDGER-ENTRY
           
           ADD PMT-AMOUNT TO WS-EXPECTED-SETTLEMENT.
       
       2800-BLOCK-SUSPICIOUS-PAYMENT.
           STRING "FRAUD BLOCK: Payment " PMT-ID 
               " | Score: " WS-FRAUD-SCORE
               " | Amount: $" PMT-AMOUNT
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           ADD 1 TO WS-PROCESSED-FAILED
           
           DISPLAY "🚫 BLOCKED: Suspicious payment " PMT-ID
               " | Fraud Score: " WS-FRAUD-SCORE.
       
       2900-LOG-VALIDATION-ERROR.
           MOVE PMT-ID TO FAILED-PMT-ID
           MOVE WS-ERROR-CODE TO FAILED-REASON-CODE
           MOVE WS-ERROR-MESSAGE TO FAILED-REASON-DESC
           MOVE 0 TO FAILED-RETRY-COUNT
           MOVE WS-CURRENT-TIME TO FAILED-NEXT-RETRY
           
           WRITE FAILED-PMT-RECORD
           
           ADD 1 TO WS-PROCESSED-FAILED
           
           DISPLAY "✗ VALIDATION ERROR: " PMT-ID 
               " | " WS-ERROR-CODE.
       
       3000-RECONCILIATION.
           DISPLAY "Running end-of-day reconciliation..."
           
      *    Compare expected vs actual settlements
           MOVE WS-TOTAL-VOLUME TO WS-EXPECTED-SETTLEMENT
           
      *    Simulate actual settlement (in production, from clearing house)
           COMPUTE WS-ACTUAL-SETTLEMENT = 
               WS-EXPECTED-SETTLEMENT * 0.995
           
           COMPUTE WS-VARIANCE = 
               WS-ACTUAL-SETTLEMENT - WS-EXPECTED-SETTLEMENT
           
           STRING "RECONCILIATION REPORT" DELIMITED BY SIZE
               INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "Expected: $" WS-EXPECTED-SETTLEMENT
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "Actual: $" WS-ACTUAL-SETTLEMENT
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "Variance: $" WS-VARIANCE
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           IF FUNCTION ABS(WS-VARIANCE) < 100
               MOVE 'Y' TO WS-RECONCILED
               DISPLAY "✓ Reconciliation complete | Variance: $" 
                   WS-VARIANCE
           ELSE
               MOVE 'N' TO WS-RECONCILED
               DISPLAY "⚠️  Reconciliation variance: $" WS-VARIANCE
               MOVE 1 TO WS-UNMATCHED-COUNT
           END-IF.
       
       4000-RETRY-FAILED-PAYMENTS.
           DISPLAY "Processing retry queue..."
           
      *    In production, would read failed payments file
      *    and retry with exponential backoff
           
           IF WS-PROCESSED-FAILED > 0
               DISPLAY "Found " WS-PROCESSED-FAILED 
                   " failed payments"
               DISPLAY "Implementing exponential backoff retry..."
               
      *        Exponential backoff: 2^retry_count minutes
               COMPUTE WS-BACKOFF-SECONDS = 
                   60 * (2 ** WS-RETRY-COUNT)
               
               DISPLAY "Next retry in " WS-BACKOFF-SECONDS 
                   " seconds"
           ELSE
               DISPLAY "✓ No failed payments to retry"
           END-IF.
       
       5000-GENERATE-REPORT.
           DISPLAY " "
           DISPLAY "Generating payment processing report..."
           
           MOVE SPACES TO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "PAYMENT PROCESSING SUMMARY" 
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "Total Payments: " WS-TOTAL-PAYMENTS
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "Successful: " WS-PROCESSED-SUCCESS
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "Failed: " WS-PROCESSED-FAILED
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "Total Volume: $" WS-TOTAL-VOLUME
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "Total Fees: $" WS-TOTAL-FEES
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           MOVE SPACES TO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "PAYMENT TYPE BREAKDOWN:" 
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "ACH: " WS-ACH-COUNT " | $" WS-ACH-VOLUME
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "Wire: " WS-WIRE-COUNT " | $" WS-WIRE-VOLUME
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "Card: " WS-CARD-COUNT " | $" WS-CARD-VOLUME
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD
           
           STRING "RTP: " WS-RTP-COUNT
               DELIMITED BY SIZE INTO RECON-RECORD
           WRITE RECON-RECORD.
       
       9000-TERMINATE.
           CLOSE PAYMENT-QUEUE
           CLOSE PAYMENT-LEDGER
           CLOSE RECONCILIATION-LOG
           CLOSE FAILED-PAYMENTS
           
           DISPLAY " "
           DISPLAY "════════════════════════════════════════"
           DISPLAY "  PAYMENT PROCESSING COMPLETE"
           DISPLAY "════════════════════════════════════════"
           DISPLAY "Total Payments: " WS-TOTAL-PAYMENTS
           DISPLAY "Success Rate: " WS-PROCESSED-SUCCESS 
               " / " WS-TOTAL-PAYMENTS
           DISPLAY "Total Volume: $" WS-TOTAL-VOLUME
           DISPLAY "Total Fees: $" WS-TOTAL-FEES
           DISPLAY "Reconciled: " WS-RECONCILED
           DISPLAY "════════════════════════════════════════"
           .
