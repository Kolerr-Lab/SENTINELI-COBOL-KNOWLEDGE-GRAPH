       IDENTIFICATION DIVISION.
       PROGRAM-ID. CREDIT-SCORING.
       AUTHOR. SENTINELI-ENTERPRISE-SYSTEM.
      *****************************************************************
      * ADVANCED CREDIT SCORING & UNDERWRITING ENGINE                *
      * FICO-style scoring with 300-850 range                        *
      * Payment history, utilization, credit age, mix, inquiries    *
      * Predictive default probability modeling                      *
      * Alternative data integration (rent, utilities, etc.)         *
      *****************************************************************
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT APPLICANT-FILE ASSIGN TO "APPLICANTS.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT CREDIT-BUREAU ASSIGN TO "CREDIT_REPORT.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT SCORE-OUTPUT ASSIGN TO "CREDIT_SCORES.TXT"
               ORGANIZATION IS LINE SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD  APPLICANT-FILE.
       01  APPLICANT-RECORD.
           05  APP-ID                   PIC 9(10).
           05  APP-NAME                 PIC X(60).
           05  APP-INCOME               PIC 9(8)V99.
           05  APP-EMPLOYMENT-YEARS     PIC 99.
           05  APP-RENT-PAYMENT         PIC 9(6)V99.
           05  APP-UTILITY-PAYMENT      PIC 9(4)V99.
       
       FD  CREDIT-BUREAU.
       01  BUREAU-RECORD.
           05  BUREAU-APP-ID            PIC 9(10).
           05  PAYMENT-HISTORY-MONTHS   PIC 999.
           05  ON-TIME-PAYMENTS         PIC 999.
           05  LATE-30-DAYS             PIC 999.
           05  LATE-60-DAYS             PIC 999.
           05  LATE-90-PLUS             PIC 999.
           05  TOTAL-ACCOUNTS           PIC 999.
           05  OPEN-ACCOUNTS            PIC 999.
           05  CREDIT-LIMIT-TOTAL       PIC 9(8)V99.
           05  CREDIT-USED-TOTAL        PIC 9(8)V99.
           05  REVOLVING-UTILIZATION    PIC 9V9999.
           05  OLDEST-ACCOUNT-MONTHS    PIC 9(4).
           05  NEWEST-ACCOUNT-MONTHS    PIC 9(3).
           05  HARD-INQUIRIES-6M        PIC 99.
           05  HARD-INQUIRIES-12M       PIC 99.
           05  DEROGATORY-MARKS         PIC 99.
           05  BANKRUPTCIES             PIC 9.
           05  TAX-LIENS                PIC 99.
           05  CHARGE-OFFS              PIC 99.
           05  COLLECTIONS              PIC 99.
           05  MORTGAGE-ACCOUNTS        PIC 99.
           05  AUTO-LOAN-ACCOUNTS       PIC 99.
           05  STUDENT-LOAN-ACCOUNTS    PIC 99.
           05  CREDIT-CARD-ACCOUNTS     PIC 99.
           05  INSTALLMENT-ACCOUNTS     PIC 99.
       
       FD  SCORE-OUTPUT.
       01  SCORE-RECORD                 PIC X(150).
       
       WORKING-STORAGE SECTION.
       01  WS-FICO-COMPONENTS.
           05  WS-PAYMENT-HISTORY-PCT   PIC 9V99 VALUE 0.35.
           05  WS-UTILIZATION-PCT       PIC 9V99 VALUE 0.30.
           05  WS-CREDIT-AGE-PCT        PIC 9V99 VALUE 0.15.
           05  WS-CREDIT-MIX-PCT        PIC 9V99 VALUE 0.10.
           05  WS-NEW-CREDIT-PCT        PIC 9V99 VALUE 0.10.
       
       01  WS-COMPONENT-SCORES.
           05  WS-PAYMENT-SCORE         PIC 999 VALUE ZEROS.
           05  WS-UTILIZATION-SCORE     PIC 999 VALUE ZEROS.
           05  WS-AGE-SCORE             PIC 999 VALUE ZEROS.
           05  WS-MIX-SCORE             PIC 999 VALUE ZEROS.
           05  WS-INQUIRY-SCORE         PIC 999 VALUE ZEROS.
       
       01  WS-FINAL-SCORE.
           05  WS-BASE-SCORE            PIC 999 VALUE 300.
           05  WS-CALCULATED-SCORE      PIC 999 VALUE ZEROS.
           05  WS-ADJUSTED-SCORE        PIC 999 VALUE ZEROS.
           05  WS-SCORE-TIER            PIC X(20) VALUE SPACES.
       
       01  WS-RISK-METRICS.
           05  WS-DEFAULT-PROBABILITY   PIC 9V9999 VALUE ZEROS.
           05  WS-CREDIT-LIMIT-SUGGEST  PIC 9(8)V99 VALUE ZEROS.
           05  WS-INTEREST-RATE         PIC 9V9999 VALUE ZEROS.
           05  WS-APPROVAL-RECOMMEND    PIC X VALUE 'N'.
       
       01  WS-ALTERNATIVE-DATA.
           05  WS-RENT-CONSISTENCY      PIC 999 VALUE ZEROS.
           05  WS-UTILITY-CONSISTENCY   PIC 999 VALUE ZEROS.
           05  WS-INCOME-STABILITY      PIC 999 VALUE ZEROS.
           05  WS-ALT-DATA-BOOST        PIC S999 VALUE ZEROS.
       
       01  WS-DEROGATORY-IMPACT.
           05  WS-BANKRUPTCY-PENALTY    PIC S999 VALUE -150.
           05  WS-LIEN-PENALTY          PIC S999 VALUE -80.
           05  WS-CHARGEOFF-PENALTY     PIC S999 VALUE -100.
           05  WS-COLLECTION-PENALTY    PIC S999 VALUE -60.
       
       01  WS-TEMP-CALCS.
           05  WS-ON-TIME-RATIO         PIC 9V9999 VALUE ZEROS.
           05  WS-UTIL-RATIO            PIC 9V9999 VALUE ZEROS.
           05  WS-AVG-ACCOUNT-AGE       PIC 9(4) VALUE ZEROS.
           05  WS-ACCOUNT-DIVERSITY     PIC 9 VALUE ZEROS.
           05  WS-DEROG-COUNT           PIC 99 VALUE ZEROS.
       
       01  WS-COUNTERS.
           05  WS-TOTAL-APPLICANTS      PIC 9(6) VALUE ZEROS.
           05  WS-EXCELLENT-COUNT       PIC 9(6) VALUE ZEROS.
           05  WS-GOOD-COUNT            PIC 9(6) VALUE ZEROS.
           05  WS-FAIR-COUNT            PIC 9(6) VALUE ZEROS.
           05  WS-POOR-COUNT            PIC 9(6) VALUE ZEROS.
           05  WS-APPROVED-COUNT        PIC 9(6) VALUE ZEROS.
           05  WS-DECLINED-COUNT        PIC 9(6) VALUE ZEROS.
       
       01  WS-FLAGS.
           05  WS-APP-EOF               PIC X VALUE 'N'.
           05  WS-BUREAU-EOF            PIC X VALUE 'N'.
           05  WS-THIN-FILE             PIC X VALUE 'N'.
       
       PROCEDURE DIVISION.
       0000-MAIN-SCORING.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-APPLICANTS
           PERFORM 3000-GENERATE-SUMMARY
           PERFORM 9000-TERMINATE
           STOP RUN.
       
       1000-INITIALIZE.
           DISPLAY "SENTINELI Advanced Credit Scoring Engine"
           DISPLAY "Initializing ML-enhanced FICO model..."
           
           OPEN INPUT APPLICANT-FILE
           OPEN INPUT CREDIT-BUREAU
           OPEN OUTPUT SCORE-OUTPUT
           
           MOVE ZEROS TO WS-COUNTERS
           MOVE 300 TO WS-BASE-SCORE.
       
       2000-PROCESS-APPLICANTS.
           PERFORM 2100-READ-APPLICANT
           PERFORM UNTIL WS-APP-EOF = 'Y'
               ADD 1 TO WS-TOTAL-APPLICANTS
               PERFORM 2200-READ-BUREAU-DATA
               PERFORM 2300-CALCULATE-PAYMENT-SCORE
               PERFORM 2400-CALCULATE-UTILIZATION-SCORE
               PERFORM 2500-CALCULATE-AGE-SCORE
               PERFORM 2600-CALCULATE-MIX-SCORE
               PERFORM 2700-CALCULATE-INQUIRY-SCORE
               PERFORM 2800-APPLY-DEROGATORY-PENALTIES
               PERFORM 2900-ALTERNATIVE-DATA-SCORING
               PERFORM 3000-COMPUTE-FINAL-SCORE
               PERFORM 3100-ASSIGN-TIER-AND-RISK
               PERFORM 3200-OUTPUT-SCORE
               PERFORM 2100-READ-APPLICANT
           END-PERFORM.
       
       2100-READ-APPLICANT.
           READ APPLICANT-FILE
               AT END
                   MOVE 'Y' TO WS-APP-EOF
           END-READ.
       
       2200-READ-BUREAU-DATA.
           READ CREDIT-BUREAU
               AT END
                   MOVE 'Y' TO WS-BUREAU-EOF
           END-READ
           
           IF PAYMENT-HISTORY-MONTHS < 6
               MOVE 'Y' TO WS-THIN-FILE
           END-IF.
       
       2300-CALCULATE-PAYMENT-SCORE.
      *    Payment History: 35% of FICO score
           MOVE ZEROS TO WS-PAYMENT-SCORE
           
      *    Calculate on-time payment ratio
           IF PAYMENT-HISTORY-MONTHS > 0
               COMPUTE WS-ON-TIME-RATIO = 
                   ON-TIME-PAYMENTS / PAYMENT-HISTORY-MONTHS
           END-IF
           
      *    Score based on payment performance
           IF WS-ON-TIME-RATIO >= 0.98
               MOVE 300 TO WS-PAYMENT-SCORE
           ELSE IF WS-ON-TIME-RATIO >= 0.95
               MOVE 280 TO WS-PAYMENT-SCORE
           ELSE IF WS-ON-TIME-RATIO >= 0.90
               MOVE 250 TO WS-PAYMENT-SCORE
           ELSE IF WS-ON-TIME-RATIO >= 0.80
               MOVE 200 TO WS-PAYMENT-SCORE
           ELSE
               MOVE 150 TO WS-PAYMENT-SCORE
           END-IF
           
      *    Penalty for late payments
           COMPUTE WS-PAYMENT-SCORE = WS-PAYMENT-SCORE -
               (LATE-30-DAYS * 5) -
               (LATE-60-DAYS * 15) -
               (LATE-90-PLUS * 30)
           
           IF WS-PAYMENT-SCORE < 0
               MOVE 0 TO WS-PAYMENT-SCORE
           END-IF.
       
       2400-CALCULATE-UTILIZATION-SCORE.
      *    Credit Utilization: 30% of FICO score
           MOVE ZEROS TO WS-UTILIZATION-SCORE
           
           IF CREDIT-LIMIT-TOTAL > 0
               COMPUTE WS-UTIL-RATIO = 
                   CREDIT-USED-TOTAL / CREDIT-LIMIT-TOTAL
           ELSE
               MOVE 0 TO WS-UTIL-RATIO
           END-IF
           
      *    Optimal utilization: < 10%
           IF WS-UTIL-RATIO <= 0.10
               MOVE 260 TO WS-UTILIZATION-SCORE
           ELSE IF WS-UTIL-RATIO <= 0.30
               MOVE 230 TO WS-UTILIZATION-SCORE
           ELSE IF WS-UTIL-RATIO <= 0.50
               MOVE 180 TO WS-UTILIZATION-SCORE
           ELSE IF WS-UTIL-RATIO <= 0.75
               MOVE 120 TO WS-UTILIZATION-SCORE
           ELSE
               MOVE 60 TO WS-UTILIZATION-SCORE
           END-IF.
       
       2500-CALCULATE-AGE-SCORE.
      *    Credit History Length: 15% of FICO score
           MOVE ZEROS TO WS-AGE-SCORE
           
      *    Calculate average account age
           IF TOTAL-ACCOUNTS > 0
               COMPUTE WS-AVG-ACCOUNT-AGE = 
                   OLDEST-ACCOUNT-MONTHS / TOTAL-ACCOUNTS
           END-IF
           
      *    Score based on credit history depth
           IF OLDEST-ACCOUNT-MONTHS >= 120
               MOVE 130 TO WS-AGE-SCORE
           ELSE IF OLDEST-ACCOUNT-MONTHS >= 60
               MOVE 100 TO WS-AGE-SCORE
           ELSE IF OLDEST-ACCOUNT-MONTHS >= 24
               MOVE 70 TO WS-AGE-SCORE
           ELSE IF OLDEST-ACCOUNT-MONTHS >= 12
               MOVE 40 TO WS-AGE-SCORE
           ELSE
               MOVE 20 TO WS-AGE-SCORE
           END-IF
           
      *    Bonus for aged accounts
           IF OLDEST-ACCOUNT-MONTHS > 180
               ADD 20 TO WS-AGE-SCORE
           END-IF.
       
       2600-CALCULATE-MIX-SCORE.
      *    Credit Mix: 10% of FICO score
           MOVE ZEROS TO WS-MIX-SCORE
           MOVE 0 TO WS-ACCOUNT-DIVERSITY
           
      *    Count different account types
           IF MORTGAGE-ACCOUNTS > 0
               ADD 1 TO WS-ACCOUNT-DIVERSITY
           END-IF
           
           IF AUTO-LOAN-ACCOUNTS > 0
               ADD 1 TO WS-ACCOUNT-DIVERSITY
           END-IF
           
           IF CREDIT-CARD-ACCOUNTS > 0
               ADD 1 TO WS-ACCOUNT-DIVERSITY
           END-IF
           
           IF INSTALLMENT-ACCOUNTS > 0
               ADD 1 TO WS-ACCOUNT-DIVERSITY
           END-IF
           
           IF STUDENT-LOAN-ACCOUNTS > 0
               ADD 1 TO WS-ACCOUNT-DIVERSITY
           END-IF
           
      *    Score based on diversity
           EVALUATE WS-ACCOUNT-DIVERSITY
               WHEN 5
               WHEN 4
                   MOVE 85 TO WS-MIX-SCORE
               WHEN 3
                   MOVE 70 TO WS-MIX-SCORE
               WHEN 2
                   MOVE 50 TO WS-MIX-SCORE
               WHEN 1
                   MOVE 30 TO WS-MIX-SCORE
               WHEN OTHER
                   MOVE 0 TO WS-MIX-SCORE
           END-EVALUATE.
       
       2700-CALCULATE-INQUIRY-SCORE.
      *    New Credit / Inquiries: 10% of FICO score
           MOVE 85 TO WS-INQUIRY-SCORE
           
      *    Penalty for hard inquiries
           COMPUTE WS-INQUIRY-SCORE = WS-INQUIRY-SCORE -
               (HARD-INQUIRIES-6M * 8) -
               (HARD-INQUIRIES-12M * 3)
           
      *    Penalty for new accounts
           IF NEWEST-ACCOUNT-MONTHS < 6
               SUBTRACT 15 FROM WS-INQUIRY-SCORE
           END-IF
           
           IF WS-INQUIRY-SCORE < 0
               MOVE 0 TO WS-INQUIRY-SCORE
           END-IF.
       
       2800-APPLY-DEROGATORY-PENALTIES.
      *    Severe penalties for major derogatory marks
           
           MOVE 0 TO WS-DEROG-COUNT
           
           IF BANKRUPTCIES > 0
               ADD BANKRUPTCIES TO WS-DEROG-COUNT
               COMPUTE WS-CALCULATED-SCORE = WS-CALCULATED-SCORE +
                   (BANKRUPTCIES * WS-BANKRUPTCY-PENALTY)
           END-IF
           
           IF TAX-LIENS > 0
               ADD TAX-LIENS TO WS-DEROG-COUNT
               COMPUTE WS-CALCULATED-SCORE = WS-CALCULATED-SCORE +
                   (TAX-LIENS * WS-LIEN-PENALTY)
           END-IF
           
           IF CHARGE-OFFS > 0
               ADD CHARGE-OFFS TO WS-DEROG-COUNT
               COMPUTE WS-CALCULATED-SCORE = WS-CALCULATED-SCORE +
                   (CHARGE-OFFS * WS-CHARGEOFF-PENALTY)
           END-IF
           
           IF COLLECTIONS > 0
               ADD COLLECTIONS TO WS-DEROG-COUNT
               COMPUTE WS-CALCULATED-SCORE = WS-CALCULATED-SCORE +
                   (COLLECTIONS * WS-COLLECTION-PENALTY)
           END-IF.
       
       2900-ALTERNATIVE-DATA-SCORING.
      *    Alternative data for thin-file applicants
           IF WS-THIN-FILE = 'Y'
               DISPLAY "Using alternative data for " APP-ID
               
      *        Rent payment consistency
               IF APP-RENT-PAYMENT > 0
                   MOVE 50 TO WS-RENT-CONSISTENCY
               END-IF
               
      *        Utility payment consistency
               IF APP-UTILITY-PAYMENT > 0
                   MOVE 30 TO WS-UTILITY-CONSISTENCY
               END-IF
               
      *        Employment/income stability
               IF APP-EMPLOYMENT-YEARS >= 2
                   MOVE 40 TO WS-INCOME-STABILITY
               ELSE IF APP-EMPLOYMENT-YEARS >= 1
                   MOVE 20 TO WS-INCOME-STABILITY
               END-IF
               
      *        Total alternative data boost
               COMPUTE WS-ALT-DATA-BOOST = 
                   WS-RENT-CONSISTENCY +
                   WS-UTILITY-CONSISTENCY +
                   WS-INCOME-STABILITY
           END-IF.
       
       3000-COMPUTE-FINAL-SCORE.
      *    Weighted FICO calculation
           COMPUTE WS-CALCULATED-SCORE = 
               WS-BASE-SCORE +
               (WS-PAYMENT-SCORE * WS-PAYMENT-HISTORY-PCT) +
               (WS-UTILIZATION-SCORE * WS-UTILIZATION-PCT) +
               (WS-AGE-SCORE * WS-CREDIT-AGE-PCT) +
               (WS-MIX-SCORE * WS-CREDIT-MIX-PCT) +
               (WS-INQUIRY-SCORE * WS-NEW-CREDIT-PCT) +
               WS-ALT-DATA-BOOST
           
      *    Ensure score is within FICO range (300-850)
           IF WS-CALCULATED-SCORE > 850
               MOVE 850 TO WS-ADJUSTED-SCORE
           ELSE IF WS-CALCULATED-SCORE < 300
               MOVE 300 TO WS-ADJUSTED-SCORE
           ELSE
               MOVE WS-CALCULATED-SCORE TO WS-ADJUSTED-SCORE
           END-IF.
       
       3100-ASSIGN-TIER-AND-RISK.
      *    Credit score tiers and risk assessment
           
           IF WS-ADJUSTED-SCORE >= 800
               MOVE "EXCEPTIONAL" TO WS-SCORE-TIER
               ADD 1 TO WS-EXCELLENT-COUNT
               MOVE 0.01 TO WS-DEFAULT-PROBABILITY
               MOVE 0.0399 TO WS-INTEREST-RATE
               MOVE 50000 TO WS-CREDIT-LIMIT-SUGGEST
               MOVE 'Y' TO WS-APPROVAL-RECOMMEND
               
           ELSE IF WS-ADJUSTED-SCORE >= 740
               MOVE "VERY-GOOD" TO WS-SCORE-TIER
               ADD 1 TO WS-EXCELLENT-COUNT
               MOVE 0.03 TO WS-DEFAULT-PROBABILITY
               MOVE 0.0599 TO WS-INTEREST-RATE
               MOVE 35000 TO WS-CREDIT-LIMIT-SUGGEST
               MOVE 'Y' TO WS-APPROVAL-RECOMMEND
               
           ELSE IF WS-ADJUSTED-SCORE >= 670
               MOVE "GOOD" TO WS-SCORE-TIER
               ADD 1 TO WS-GOOD-COUNT
               MOVE 0.08 TO WS-DEFAULT-PROBABILITY
               MOVE 0.0899 TO WS-INTEREST-RATE
               MOVE 20000 TO WS-CREDIT-LIMIT-SUGGEST
               MOVE 'Y' TO WS-APPROVAL-RECOMMEND
               
           ELSE IF WS-ADJUSTED-SCORE >= 580
               MOVE "FAIR" TO WS-SCORE-TIER
               ADD 1 TO WS-FAIR-COUNT
               MOVE 0.20 TO WS-DEFAULT-PROBABILITY
               MOVE 0.1499 TO WS-INTEREST-RATE
               MOVE 5000 TO WS-CREDIT-LIMIT-SUGGEST
               MOVE 'Y' TO WS-APPROVAL-RECOMMEND
               
           ELSE
               MOVE "POOR" TO WS-SCORE-TIER
               ADD 1 TO WS-POOR-COUNT
               MOVE 0.45 TO WS-DEFAULT-PROBABILITY
               MOVE 0.2499 TO WS-INTEREST-RATE
               MOVE 1000 TO WS-CREDIT-LIMIT-SUGGEST
               MOVE 'N' TO WS-APPROVAL-RECOMMEND
           END-IF
           
           IF WS-APPROVAL-RECOMMEND = 'Y'
               ADD 1 TO WS-APPROVED-COUNT
           ELSE
               ADD 1 TO WS-DECLINED-COUNT
           END-IF.
       
       3200-OUTPUT-SCORE.
           STRING "Applicant: " APP-ID " | " APP-NAME
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "Credit Score: " WS-ADJUSTED-SCORE 
               " | Tier: " WS-SCORE-TIER
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "Default Probability: " WS-DEFAULT-PROBABILITY
               " | Interest Rate: " WS-INTEREST-RATE
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "Suggested Limit: $" WS-CREDIT-LIMIT-SUGGEST
               " | Approval: " WS-APPROVAL-RECOMMEND
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           MOVE SPACES TO SCORE-RECORD
           WRITE SCORE-RECORD
           
           DISPLAY "✓ Scored: " APP-ID " | Score: " 
               WS-ADJUSTED-SCORE " | " WS-SCORE-TIER.
       
       3000-GENERATE-SUMMARY.
           DISPLAY " "
           DISPLAY "Generating credit scoring summary..."
           
           MOVE SPACES TO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "CREDIT SCORING SUMMARY REPORT"
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "Total Applicants: " WS-TOTAL-APPLICANTS
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "Excellent (740+): " WS-EXCELLENT-COUNT
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "Good (670-739): " WS-GOOD-COUNT
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "Fair (580-669): " WS-FAIR-COUNT
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "Poor (<580): " WS-POOR-COUNT
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "Approved: " WS-APPROVED-COUNT
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD
           
           STRING "Declined: " WS-DECLINED-COUNT
               DELIMITED BY SIZE INTO SCORE-RECORD
           WRITE SCORE-RECORD.
       
       9000-TERMINATE.
           CLOSE APPLICANT-FILE
           CLOSE CREDIT-BUREAU
           CLOSE SCORE-OUTPUT
           
           DISPLAY " "
           DISPLAY "════════════════════════════════════════"
           DISPLAY "  CREDIT SCORING COMPLETE"
           DISPLAY "════════════════════════════════════════"
           DISPLAY "Total Scored: " WS-TOTAL-APPLICANTS
           DISPLAY "Approved: " WS-APPROVED-COUNT
           DISPLAY "Auto-Approval Rate: " 
               WS-APPROVED-COUNT " / " WS-TOTAL-APPLICANTS
           DISPLAY "════════════════════════════════════════"
           .
