       IDENTIFICATION DIVISION.
       PROGRAM-ID. MORTGAGE-SERVICING.
       AUTHOR. SENTINELI-ENTERPRISE-SYSTEM.
      *****************************************************************
      * COMPREHENSIVE MORTGAGE LOAN SERVICING SYSTEM                 *
      * Payment processing, escrow management, amortization          *
      * Delinquency tracking, foreclosure prevention                 *
      * Property tax & insurance management                          *
      * TILA-RESPA compliance, loss mitigation                       *
      *****************************************************************
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT LOAN-FILE ASSIGN TO "MORTGAGES.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT PAYMENT-FILE ASSIGN TO "MTG_PAYMENTS.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT ESCROW-FILE ASSIGN TO "ESCROW.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT DELINQUENCY-LOG ASSIGN TO "DELINQUENT.LOG"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT SERVICING-REPORT ASSIGN TO "SERVICING_RPT.TXT"
               ORGANIZATION IS LINE SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD  LOAN-FILE.
       01  LOAN-RECORD.
           05  LOAN-NUMBER              PIC 9(12).
           05  BORROWER-NAME            PIC X(60).
           05  PROPERTY-ADDRESS         PIC X(100).
           05  LOAN-AMOUNT              PIC 9(9)V99.
           05  INTEREST-RATE            PIC 9V9999.
           05  LOAN-TERM-MONTHS         PIC 9(3).
           05  ORIGINATION-DATE         PIC 9(8).
           05  FIRST-PAYMENT-DATE       PIC 9(8).
           05  CURRENT-BALANCE          PIC 9(9)V99.
           05  MONTHLY-PAYMENT          PIC 9(6)V99.
           05  ESCROW-MONTHLY           PIC 9(5)V99.
           05  LOAN-STATUS              PIC X(15).
           05  DAYS-DELINQUENT          PIC 9(3).
           05  MODIFICATION-FLAG        PIC X.
       
       FD  PAYMENT-FILE.
       01  PAYMENT-RECORD.
           05  PMT-LOAN-NUMBER          PIC 9(12).
           05  PMT-DATE                 PIC 9(8).
           05  PMT-AMOUNT               PIC 9(6)V99.
           05  PMT-PRINCIPAL            PIC 9(6)V99.
           05  PMT-INTEREST             PIC 9(6)V99.
           05  PMT-ESCROW               PIC 9(5)V99.
           05  PMT-LATE-FEE             PIC 9(4)V99.
           05  PMT-METHOD               PIC X(15).
       
       FD  ESCROW-FILE.
       01  ESCROW-RECORD.
           05  ESC-LOAN-NUMBER          PIC 9(12).
           05  ESC-BALANCE              PIC 9(7)V99.
           05  ESC-PROPERTY-TAX         PIC 9(6)V99.
           05  ESC-HOMEOWNERS-INS       PIC 9(5)V99.
           05  ESC-PMI                  PIC 9(4)V99.
           05  ESC-HOA-DUES             PIC 9(4)V99.
           05  ESC-ANALYSIS-DATE        PIC 9(8).
           05  ESC-SHORTAGE             PIC S9(5)V99.
       
       FD  DELINQUENCY-LOG.
       01  DELINQUENCY-ENTRY            PIC X(200).
       
       FD  SERVICING-REPORT.
       01  REPORT-LINE                  PIC X(150).
       
       WORKING-STORAGE SECTION.
       01  WS-LOAN-METRICS.
           05  WS-TOTAL-LOANS           PIC 9(6) VALUE ZEROS.
           05  WS-ACTIVE-LOANS          PIC 9(6) VALUE ZEROS.
           05  WS-DELINQUENT-LOANS      PIC 9(5) VALUE ZEROS.
           05  WS-FORECLOSURE-LOANS     PIC 9(4) VALUE ZEROS.
           05  WS-MODIFIED-LOANS        PIC 9(4) VALUE ZEROS.
       
       01  WS-PORTFOLIO-VALUE.
           05  WS-TOTAL-BALANCE         PIC 9(12)V99 VALUE ZEROS.
           05  WS-DELINQUENT-BALANCE    PIC 9(12)V99 VALUE ZEROS.
           05  WS-ESCROW-BALANCE        PIC 9(10)V99 VALUE ZEROS.
           05  WS-SERVICING-INCOME      PIC 9(10)V99 VALUE ZEROS.
       
       01  WS-AMORTIZATION-CALC.
           05  WS-MONTHLY-RATE          PIC 9V999999 VALUE ZEROS.
           05  WS-PRINCIPAL-PAYMENT     PIC 9(6)V99 VALUE ZEROS.
           05  WS-INTEREST-PAYMENT      PIC 9(6)V99 VALUE ZEROS.
           05  WS-REMAINING-BALANCE     PIC 9(9)V99 VALUE ZEROS.
           05  WS-PAYMENTS-REMAINING    PIC 9(3) VALUE ZEROS.
       
       01  WS-ESCROW-ANALYSIS.
           05  WS-ANNUAL-TAXES          PIC 9(6)V99 VALUE ZEROS.
           05  WS-ANNUAL-INSURANCE      PIC 9(5)V99 VALUE ZEROS.
           05  WS-REQUIRED-ESCROW       PIC 9(7)V99 VALUE ZEROS.
           05  WS-ESCROW-SURPLUS        PIC S9(5)V99 VALUE ZEROS.
           05  WS-ESCROW-CUSHION        PIC 9(5)V99 VALUE ZEROS.
       
       01  WS-DELINQUENCY-TRACKING.
           05  WS-30-DAY-DELINQUENT     PIC 9(4) VALUE ZEROS.
           05  WS-60-DAY-DELINQUENT     PIC 9(4) VALUE ZEROS.
           05  WS-90-DAY-DELINQUENT     PIC 9(4) VALUE ZEROS.
           05  WS-120-PLUS-DELINQUENT   PIC 9(4) VALUE ZEROS.
           05  WS-DELINQUENCY-RATE      PIC 9V9999 VALUE ZEROS.
       
       01  WS-LOSS-MITIGATION.
           05  WS-MODIFICATION-ELIGIBLE PIC X VALUE 'N'.
           05  WS-FORBEARANCE-ELIGIBLE  PIC X VALUE 'N'.
           05  WS-SHORT-SALE-CANDIDATE  PIC X VALUE 'N'.
           05  WS-DIL-CANDIDATE         PIC X VALUE 'N'.
       
       01  WS-PAYMENT-PROCESSING.
           05  WS-PAYMENT-RECEIVED      PIC 9(6)V99 VALUE ZEROS.
           05  WS-PAYMENT-DUE           PIC 9(6)V99 VALUE ZEROS.
           05  WS-PAYMENT-SHORTAGE      PIC S9(6)V99 VALUE ZEROS.
           05  WS-LATE-FEE-ASSESSED     PIC 9(4)V99 VALUE ZEROS.
           05  WS-GRACE-PERIOD-DAYS     PIC 99 VALUE 15.
       
       01  WS-FORECLOSURE-TRACKING.
           05  WS-FORECLOSURE-ELIGIBLE  PIC X VALUE 'N'.
           05  WS-NOD-SENT              PIC X VALUE 'N'.
           05  WS-FORECLOSURE-STARTED   PIC X VALUE 'N'.
           05  WS-FORECLOSURE-SALE-DATE PIC 9(8) VALUE ZEROS.
       
       01  WS-REGULATORY-COMPLIANCE.
           05  WS-RESPA-COMPLIANT       PIC X VALUE 'Y'.
           05  WS-TILA-COMPLIANT        PIC X VALUE 'Y'.
           05  WS-SCRA-ELIGIBLE         PIC X VALUE 'N'.
           05  WS-BANKRUPTCY-FLAG       PIC X VALUE 'N'.
       
       01  WS-SERVICING-FEES.
           05  WS-BASE-SERVICING-FEE    PIC 9V9999 VALUE 0.0025.
           05  WS-LATE-FEE-RATE         PIC 9V9999 VALUE 0.05.
           05  WS-NSF-FEE               PIC 9(3)V99 VALUE 35.00.
           05  WS-MODIFICATION-FEE      PIC 9(4)V99 VALUE 500.00.
       
       01  WS-PAYMENT-APPLICATION.
           05  WS-UNAPPLIED-FUNDS       PIC 9(6)V99 VALUE ZEROS.
           05  WS-SUSPENSE-ACCOUNT      PIC 9(7)V99 VALUE ZEROS.
           05  WS-PAYOFF-REQUESTED      PIC X VALUE 'N'.
       
       01  WS-PROPERTY-VALUATION.
           05  WS-ORIGINAL-VALUE        PIC 9(9)V99 VALUE ZEROS.
           05  WS-CURRENT-VALUE         PIC 9(9)V99 VALUE ZEROS.
           05  WS-LTV-RATIO             PIC 9V9999 VALUE ZEROS.
           05  WS-EQUITY                PIC S9(9)V99 VALUE ZEROS.
       
       01  WS-COUNTERS.
           05  WS-PAYMENTS-PROCESSED    PIC 9(6) VALUE ZEROS.
           05  WS-LATE-PAYMENTS         PIC 9(5) VALUE ZEROS.
           05  WS-NSF-COUNT             PIC 9(4) VALUE ZEROS.
           05  WS-ESCROW-SHORTAGES      PIC 9(4) VALUE ZEROS.
       
       01  WS-TEMP-FIELDS.
           05  WS-CURRENT-DATE          PIC 9(8).
           05  WS-DAYS-SINCE-DUE        PIC 9(3) VALUE ZEROS.
           05  WS-MONTHS-REMAINING      PIC 9(3) VALUE ZEROS.
       
       01  WS-FLAGS.
           05  WS-LOAN-EOF              PIC X VALUE 'N'.
           05  WS-PMT-EOF               PIC X VALUE 'N'.
           05  WS-ESC-EOF               PIC X VALUE 'N'.
           05  WS-PAYMENT-CURRENT       PIC X VALUE 'Y'.
       
       01  WS-NOTIFICATION.
           05  WS-NOTICE-TYPE           PIC X(30).
           05  WS-NOTICE-SENT           PIC X VALUE 'N'.
       
       PROCEDURE DIVISION.
       0000-MAIN-SERVICING.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-LOAN-PORTFOLIO
           PERFORM 3000-PAYMENT-PROCESSING
           PERFORM 4000-ESCROW-ANALYSIS
           PERFORM 5000-DELINQUENCY-MANAGEMENT
           PERFORM 6000-LOSS-MITIGATION
           PERFORM 7000-GENERATE-REPORTS
           PERFORM 9000-TERMINATE
           STOP RUN.
       
       1000-INITIALIZE.
           DISPLAY "SENTINELI Mortgage Servicing System"
           DISPLAY "Initializing loan servicing platform..."
           
           OPEN INPUT LOAN-FILE
           OPEN INPUT PAYMENT-FILE
           OPEN INPUT ESCROW-FILE
           OPEN OUTPUT DELINQUENCY-LOG
           OPEN OUTPUT SERVICING-REPORT
           
           MOVE FUNCTION CURRENT-DATE TO WS-CURRENT-DATE
           
           MOVE ZEROS TO WS-LOAN-METRICS
           MOVE ZEROS TO WS-PORTFOLIO-VALUE
           MOVE ZEROS TO WS-DELINQUENCY-TRACKING.
       
       2000-PROCESS-LOAN-PORTFOLIO.
           DISPLAY "Loading mortgage loan portfolio..."
           
           PERFORM 2100-READ-LOAN
           PERFORM UNTIL WS-LOAN-EOF = 'Y'
               ADD 1 TO WS-TOTAL-LOANS
               ADD CURRENT-BALANCE TO WS-TOTAL-BALANCE
               
               PERFORM 2200-CALCULATE-AMORTIZATION
               PERFORM 2300-CHECK-LOAN-STATUS
               PERFORM 2400-CALCULATE-SERVICING-FEE
               
               PERFORM 2100-READ-LOAN
           END-PERFORM.
       
       2100-READ-LOAN.
           READ LOAN-FILE
               AT END
                   MOVE 'Y' TO WS-LOAN-EOF
           END-READ.
       
       2200-CALCULATE-AMORTIZATION.
      *    Calculate monthly payment components
           COMPUTE WS-MONTHLY-RATE = INTEREST-RATE / 12
           
           COMPUTE WS-INTEREST-PAYMENT = 
               CURRENT-BALANCE * WS-MONTHLY-RATE
           
           COMPUTE WS-PRINCIPAL-PAYMENT = 
               MONTHLY-PAYMENT - WS-INTEREST-PAYMENT
           
           COMPUTE WS-REMAINING-BALANCE = 
               CURRENT-BALANCE - WS-PRINCIPAL-PAYMENT
           
      *    Calculate remaining term
           COMPUTE WS-PAYMENTS-REMAINING = 
               LOAN-TERM-MONTHS - 
               ((WS-CURRENT-DATE - ORIGINATION-DATE) / 100).
       
       2300-CHECK-LOAN-STATUS.
           EVALUATE LOAN-STATUS
               WHEN "CURRENT"
                   ADD 1 TO WS-ACTIVE-LOANS
                   MOVE 'Y' TO WS-PAYMENT-CURRENT
               WHEN "DELINQUENT"
                   ADD 1 TO WS-DELINQUENT-LOANS
                   ADD CURRENT-BALANCE TO WS-DELINQUENT-BALANCE
                   MOVE 'N' TO WS-PAYMENT-CURRENT
                   PERFORM 2310-CLASSIFY-DELINQUENCY
               WHEN "FORECLOSURE"
                   ADD 1 TO WS-FORECLOSURE-LOANS
                   MOVE 'Y' TO WS-FORECLOSURE-STARTED
               WHEN "MODIFIED"
                   ADD 1 TO WS-MODIFIED-LOANS
           END-EVALUATE.
       
       2310-CLASSIFY-DELINQUENCY.
           IF DAYS-DELINQUENT >= 30 AND < 60
               ADD 1 TO WS-30-DAY-DELINQUENT
           ELSE IF DAYS-DELINQUENT >= 60 AND < 90
               ADD 1 TO WS-60-DAY-DELINQUENT
           ELSE IF DAYS-DELINQUENT >= 90 AND < 120
               ADD 1 TO WS-90-DAY-DELINQUENT
           ELSE IF DAYS-DELINQUENT >= 120
               ADD 1 TO WS-120-PLUS-DELINQUENT
               MOVE 'Y' TO WS-FORECLOSURE-ELIGIBLE
           END-IF.
       
       2400-CALCULATE-SERVICING-FEE.
           COMPUTE WS-SERVICING-INCOME = WS-SERVICING-INCOME +
               (CURRENT-BALANCE * WS-BASE-SERVICING-FEE).
       
       3000-PAYMENT-PROCESSING.
           DISPLAY "Processing mortgage payments..."
           
           PERFORM 3100-READ-PAYMENT
           PERFORM UNTIL WS-PMT-EOF = 'Y'
               ADD 1 TO WS-PAYMENTS-PROCESSED
               PERFORM 3200-VALIDATE-PAYMENT
               PERFORM 3300-APPLY-PAYMENT
               PERFORM 3400-UPDATE-BALANCE
               PERFORM 3100-READ-PAYMENT
           END-PERFORM.
       
       3100-READ-PAYMENT.
           READ PAYMENT-FILE
               AT END
                   MOVE 'Y' TO WS-PMT-EOF
           END-READ.
       
       3200-VALIDATE-PAYMENT.
      *    Check if payment is sufficient
           MOVE PMT-AMOUNT TO WS-PAYMENT-RECEIVED
           
           IF WS-PAYMENT-RECEIVED < WS-PAYMENT-DUE
               COMPUTE WS-PAYMENT-SHORTAGE = 
                   WS-PAYMENT-DUE - WS-PAYMENT-RECEIVED
               MOVE WS-PAYMENT-RECEIVED TO WS-UNAPPLIED-FUNDS
               ADD 1 TO WS-LATE-PAYMENTS
           END-IF
           
      *    Check for NSF
           IF PMT-METHOD = "CHECK"
               AND PMT-AMOUNT = 0
               ADD 1 TO WS-NSF-COUNT
               DISPLAY "⚠️  NSF: Loan " PMT-LOAN-NUMBER
           END-IF.
       
       3300-APPLY-PAYMENT.
      *    RESPA payment application hierarchy:
      *    1. Principal & Interest
      *    2. Escrow
      *    3. Late fees
      *    4. Other charges
           
           IF WS-PAYMENT-RECEIVED >= WS-PAYMENT-DUE
               MOVE PMT-PRINCIPAL TO WS-PRINCIPAL-PAYMENT
               MOVE PMT-INTEREST TO WS-INTEREST-PAYMENT
               MOVE PMT-ESCROW TO WS-REQUIRED-ESCROW
               
               DISPLAY "✓ Full payment applied: Loan " 
                   PMT-LOAN-NUMBER " | $" PMT-AMOUNT
           ELSE
      *        Partial payment - hold in suspense
               ADD WS-UNAPPLIED-FUNDS TO WS-SUSPENSE-ACCOUNT
               DISPLAY "⚠️  Partial payment - suspense: Loan " 
                   PMT-LOAN-NUMBER " | $" PMT-AMOUNT
           END-IF.
       
       3400-UPDATE-BALANCE.
           IF WS-PAYMENT-RECEIVED >= WS-PAYMENT-DUE
               COMPUTE WS-REMAINING-BALANCE = 
                   WS-REMAINING-BALANCE - WS-PRINCIPAL-PAYMENT
           END-IF.
       
       4000-ESCROW-ANALYSIS.
           DISPLAY "Performing annual escrow analysis..."
           
           PERFORM 4100-READ-ESCROW
           PERFORM UNTIL WS-ESC-EOF = 'Y'
               PERFORM 4200-CALCULATE-ESCROW-REQUIREMENT
               PERFORM 4300-IDENTIFY-SHORTAGES
               PERFORM 4400-GENERATE-ESCROW-STATEMENT
               PERFORM 4100-READ-ESCROW
           END-PERFORM.
       
       4100-READ-ESCROW.
           READ ESCROW-FILE
               AT END
                   MOVE 'Y' TO WS-ESC-EOF
           END-READ.
       
       4200-CALCULATE-ESCROW-REQUIREMENT.
      *    Calculate required escrow based on disbursements
           COMPUTE WS-ANNUAL-TAXES = ESC-PROPERTY-TAX * 12
           COMPUTE WS-ANNUAL-INSURANCE = ESC-HOMEOWNERS-INS * 12
           
      *    Add 2-month cushion (RESPA maximum)
           COMPUTE WS-ESCROW-CUSHION = 
               (WS-ANNUAL-TAXES + WS-ANNUAL-INSURANCE) * 0.1667
           
           COMPUTE WS-REQUIRED-ESCROW = 
               WS-ANNUAL-TAXES + 
               WS-ANNUAL-INSURANCE + 
               WS-ESCROW-CUSHION
           
           ADD ESC-BALANCE TO WS-ESCROW-BALANCE.
       
       4300-IDENTIFY-SHORTAGES.
           IF ESC-BALANCE < WS-REQUIRED-ESCROW
               COMPUTE WS-ESCROW-SURPLUS = 
                   ESC-BALANCE - WS-REQUIRED-ESCROW
               MOVE WS-ESCROW-SURPLUS TO ESC-SHORTAGE
               ADD 1 TO WS-ESCROW-SHORTAGES
               
               DISPLAY "⚠️  Escrow shortage: Loan " 
                   ESC-LOAN-NUMBER " | $" ESC-SHORTAGE
           ELSE
               COMPUTE WS-ESCROW-SURPLUS = 
                   ESC-BALANCE - WS-REQUIRED-ESCROW
               
               IF WS-ESCROW-SURPLUS > 50
                   DISPLAY "💰 Escrow surplus: Loan " 
                       ESC-LOAN-NUMBER " | $" WS-ESCROW-SURPLUS
               END-IF
           END-IF.
       
       4400-GENERATE-ESCROW-STATEMENT.
           STRING "ESCROW ANALYSIS: Loan " ESC-LOAN-NUMBER
               DELIMITED BY SIZE INTO DELINQUENCY-ENTRY
           WRITE DELINQUENCY-ENTRY
           
           STRING "  Balance: $" ESC-BALANCE
               " | Required: $" WS-REQUIRED-ESCROW
               DELIMITED BY SIZE INTO DELINQUENCY-ENTRY
           WRITE DELINQUENCY-ENTRY
           
           IF ESC-SHORTAGE < 0
               STRING "  Shortage: $" ESC-SHORTAGE
                   " - Payment increase required"
                   DELIMITED BY SIZE INTO DELINQUENCY-ENTRY
               WRITE DELINQUENCY-ENTRY
           END-IF.
       
       5000-DELINQUENCY-MANAGEMENT.
           DISPLAY "Managing delinquent accounts..."
           
           IF WS-DELINQUENT-LOANS > 0
               PERFORM 5100-CALCULATE-DELINQUENCY-RATE
               PERFORM 5200-SEND-NOTICES
               PERFORM 5300-LOSS-MITIGATION-SCREENING
           ELSE
               DISPLAY "✓ No delinquent loans"
           END-IF.
       
       5100-CALCULATE-DELINQUENCY-RATE.
           IF WS-TOTAL-LOANS > 0
               COMPUTE WS-DELINQUENCY-RATE = 
                   WS-DELINQUENT-LOANS / WS-TOTAL-LOANS
           END-IF
           
           DISPLAY "Delinquency Rate: " WS-DELINQUENCY-RATE "%".
       
       5200-SEND-NOTICES.
      *    RESPA-compliant delinquency notices
           IF WS-30-DAY-DELINQUENT > 0
               MOVE "LATE PAYMENT NOTICE" TO WS-NOTICE-TYPE
               DISPLAY "Sending " WS-30-DAY-DELINQUENT 
                   " late payment notices"
           END-IF
           
           IF WS-60-DAY-DELINQUENT > 0
               MOVE "DEMAND LETTER" TO WS-NOTICE-TYPE
               DISPLAY "Sending " WS-60-DAY-DELINQUENT 
                   " demand letters"
           END-IF
           
           IF WS-90-DAY-DELINQUENT > 0
               MOVE "NOTICE OF DEFAULT" TO WS-NOTICE-TYPE
               DISPLAY "Sending " WS-90-DAY-DELINQUENT 
                   " notices of default"
           END-IF
           
           IF WS-120-PLUS-DELINQUENT > 0
               MOVE "FORECLOSURE WARNING" TO WS-NOTICE-TYPE
               DISPLAY "Sending " WS-120-PLUS-DELINQUENT 
                   " foreclosure warnings"
           END-IF.
       
       5300-LOSS-MITIGATION-SCREENING.
           IF WS-DELINQUENT-LOANS > 0
               DISPLAY "Screening for loss mitigation options..."
               
               IF WS-60-DAY-DELINQUENT > 0
                   MOVE 'Y' TO WS-MODIFICATION-ELIGIBLE
                   DISPLAY "  → Modification eligible: " 
                       WS-60-DAY-DELINQUENT " loans"
               END-IF
           END-IF.
       
       6000-LOSS-MITIGATION.
           DISPLAY "Evaluating loss mitigation strategies..."
           
           IF WS-FORECLOSURE-ELIGIBLE = 'Y'
               PERFORM 6100-LOAN-MODIFICATION-REVIEW
               PERFORM 6200-FORBEARANCE-EVALUATION
               PERFORM 6300-SHORT-SALE-ASSESSMENT
           END-IF.
       
       6100-LOAN-MODIFICATION-REVIEW.
      *    Review for HAMP/proprietary modification
           IF WS-MODIFICATION-ELIGIBLE = 'Y'
               DISPLAY "Reviewing modification eligibility..."
               DISPLAY "  → Waterfall analysis initiated"
           END-IF.
       
       6200-FORBEARANCE-EVALUATION.
      *    Temporary payment suspension/reduction
           IF WS-60-DAY-DELINQUENT > 0
               MOVE 'Y' TO WS-FORBEARANCE-ELIGIBLE
               DISPLAY "Forbearance options available for " 
                   WS-60-DAY-DELINQUENT " loans"
           END-IF.
       
       6300-SHORT-SALE-ASSESSMENT.
      *    Property value < loan balance
           IF WS-EQUITY < 0
               MOVE 'Y' TO WS-SHORT-SALE-CANDIDATE
               DISPLAY "Short sale candidates identified"
           END-IF.
       
       7000-GENERATE-REPORTS.
           DISPLAY "Generating servicing reports..."
           
           STRING "MORTGAGE SERVICING REPORT" 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE SPACES TO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "PORTFOLIO SUMMARY:" 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Total Loans: " WS-TOTAL-LOANS
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Total Balance: $" WS-TOTAL-BALANCE
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Active Loans: " WS-ACTIVE-LOANS
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Delinquent Loans: " WS-DELINQUENT-LOANS
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Delinquency Rate: " WS-DELINQUENCY-RATE "%"
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Foreclosures: " WS-FORECLOSURE-LOANS
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE SPACES TO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "DELINQUENCY BREAKDOWN:" 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "30-59 Days: " WS-30-DAY-DELINQUENT
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "60-89 Days: " WS-60-DAY-DELINQUENT
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "90+ Days: " WS-90-DAY-DELINQUENT
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE SPACES TO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "SERVICING INCOME: $" WS-SERVICING-INCOME
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "ESCROW BALANCE: $" WS-ESCROW-BALANCE
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE.
       
       9000-TERMINATE.
           CLOSE LOAN-FILE
           CLOSE PAYMENT-FILE
           CLOSE ESCROW-FILE
           CLOSE DELINQUENCY-LOG
           CLOSE SERVICING-REPORT
           
           DISPLAY " "
           DISPLAY "════════════════════════════════════════"
           DISPLAY "  MORTGAGE SERVICING COMPLETE"
           DISPLAY "════════════════════════════════════════"
           DISPLAY "Total Loans: " WS-TOTAL-LOANS
           DISPLAY "Portfolio Balance: $" WS-TOTAL-BALANCE
           DISPLAY "Delinquency Rate: " WS-DELINQUENCY-RATE "%"
           DISPLAY "Servicing Income: $" WS-SERVICING-INCOME
           DISPLAY "════════════════════════════════════════"
           .
