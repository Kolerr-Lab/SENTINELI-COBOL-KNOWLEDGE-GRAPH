IDENTIFICATION DIVISION.
PROGRAM-ID. LOAN-APPROVAL.
*> Commercial Loan Approval System - Black Box Edition
*> Purpose: Multi-factor loan decision engine with complex rules
*> Date: 1987 (Modernized for Sentineli Demo)
       
ENVIRONMENT DIVISION.
       
DATA DIVISION.
WORKING-STORAGE SECTION.
       
       01  APPLICANT-DATA.
           05  APPLICANT-NAME          PIC X(50).
           05  CREDIT-SCORE            PIC 9(3).
           05  ANNUAL-INCOME           PIC 9(8).
           05  LOAN-AMOUNT             PIC 9(8).
           05  EXISTING-DEBT           PIC 9(8).
           05  COLLATERAL-VALUE        PIC 9(8).
           05  EMPLOYMENT-YEARS        PIC 9(2).
           05  BANKRUPTCIES            PIC 9(1).
       
       01  CALCULATED-VALUES.
           05  DTI-RATIO               PIC 9(3)V99.
           05  LTV-RATIO               PIC 9(3)V99.
           05  INTEREST-RATE           PIC 9(2)V99.
           05  MONTHLY-PAYMENT         PIC 9(7)V99.
           05  RISK-SCORE              PIC 9(3).
       
       01  DECISION-FLAGS.
           05  CREDIT-TIER             PIC X(10).
           05  MANUAL-REVIEW-FLAG      PIC X(1).
           05  FINAL-DECISION          PIC X(10).
           05  DENIAL-REASON           PIC X(100).
       
       01  CONSTANTS.
           05  EXCELLENT-MIN           PIC 9(3) VALUE 750.
           05  GOOD-MIN                PIC 9(3) VALUE 700.
           05  FAIR-MIN                PIC 9(3) VALUE 640.
           05  DTI-EXCELLENT-MAX       PIC 9(2)V99 VALUE 30.00.
           05  DTI-GOOD-MAX            PIC 9(2)V99 VALUE 40.00.
           05  DTI-FAIR-MAX            PIC 9(2)V99 VALUE 45.00.
           05  DTI-POOR-MAX            PIC 9(2)V99 VALUE 50.00.
           05  MIN-INCOME              PIC 9(8) VALUE 30000.
           05  MAX-LOAN-EXCELLENT      PIC 9(8) VALUE 5000000.
           05  MAX-LOAN-GOOD           PIC 9(8) VALUE 2000000.
           05  MAX-LOAN-FAIR           PIC 9(8) VALUE 500000.
           05  MAX-LOAN-POOR           PIC 9(8) VALUE 100000.
       
       PROCEDURE DIVISION.
       MAIN-LOGIC.
           ACCEPT APPLICANT-NAME FROM ENVIRONMENT "NAME".
           ACCEPT CREDIT-SCORE FROM ENVIRONMENT "CREDIT_SCORE".
           ACCEPT ANNUAL-INCOME FROM ENVIRONMENT "INCOME".
           ACCEPT LOAN-AMOUNT FROM ENVIRONMENT "LOAN_AMOUNT".
           ACCEPT EXISTING-DEBT FROM ENVIRONMENT "DEBT".
           ACCEPT COLLATERAL-VALUE FROM ENVIRONMENT "COLLATERAL".
           ACCEPT EMPLOYMENT-YEARS FROM ENVIRONMENT "EMPLOYMENT_YEARS".
           ACCEPT BANKRUPTCIES FROM ENVIRONMENT "BANKRUPTCIES".
           
           MOVE "NO" TO MANUAL-REVIEW-FLAG.
           MOVE SPACES TO DENIAL-REASON.
           
           PERFORM CALCULATE-RATIOS.
           PERFORM DETERMINE-CREDIT-TIER.
           PERFORM EVALUATE-LOAN-REQUEST.
           PERFORM DISPLAY-RESULTS.
           
           STOP RUN.
       
       CALCULATE-RATIOS.
       *> Calculate Debt-to-Income Ratio
           IF ANNUAL-INCOME > 0
               COMPUTE DTI-RATIO = 
                   ((EXISTING-DEBT + (LOAN-AMOUNT * 0.08)) / 
                    ANNUAL-INCOME) * 100
           ELSE
               MOVE 999.99 TO DTI-RATIO
           END-IF.
           
       *> Calculate Loan-to-Value Ratio
           IF COLLATERAL-VALUE > 0
               COMPUTE LTV-RATIO = 
                   (LOAN-AMOUNT / COLLATERAL-VALUE) * 100
           ELSE
               MOVE 999.99 TO LTV-RATIO
           END-IF.
       
       DETERMINE-CREDIT-TIER.
           IF CREDIT-SCORE >= EXCELLENT-MIN
               MOVE "EXCELLENT" TO CREDIT-TIER
               MOVE 3.50 TO INTEREST-RATE
           ELSE
               IF CREDIT-SCORE >= GOOD-MIN
                   MOVE "GOOD" TO CREDIT-TIER
                   MOVE 4.75 TO INTEREST-RATE
               ELSE
                   IF CREDIT-SCORE >= FAIR-MIN
                       MOVE "FAIR" TO CREDIT-TIER
                       MOVE 6.25 TO INTEREST-RATE
                   ELSE
                       MOVE "POOR" TO CREDIT-TIER
                       MOVE 9.50 TO INTEREST-RATE
                   END-IF
               END-IF
           END-IF.
       
       EVALUATE-LOAN-REQUEST.
       *> Rule 1: Minimum income requirement
           IF ANNUAL-INCOME < MIN-INCOME
               MOVE "DENIED" TO FINAL-DECISION
               MOVE "INCOME BELOW MINIMUM THRESHOLD" TO DENIAL-REASON
               GO TO END-EVALUATION
           END-IF.
           
       *> Rule 2: Bankruptcy check
           IF BANKRUPTCIES > 0
               IF CREDIT-SCORE < GOOD-MIN
                   MOVE "DENIED" TO FINAL-DECISION
                   MOVE "RECENT BANKRUPTCY WITH LOW CREDIT" 
                       TO DENIAL-REASON
                   GO TO END-EVALUATION
               END-IF
               MOVE "YES" TO MANUAL-REVIEW-FLAG
           END-IF.
           
       *> Rule 3: Employment history
           IF EMPLOYMENT-YEARS < 2
               IF CREDIT-SCORE < EXCELLENT-MIN
                   MOVE "YES" TO MANUAL-REVIEW-FLAG
               END-IF
           END-IF.
           
       *> Rule 4: Credit tier-specific DTI limits
           EVALUATE CREDIT-TIER
               WHEN "EXCELLENT"
                   IF DTI-RATIO > DTI-EXCELLENT-MAX
                       MOVE "DENIED" TO FINAL-DECISION
                       MOVE "DTI EXCEEDS EXCELLENT TIER LIMIT (30%)" 
                           TO DENIAL-REASON
                       GO TO END-EVALUATION
                   END-IF
               WHEN "GOOD"
                   IF DTI-RATIO > DTI-GOOD-MAX
                       MOVE "DENIED" TO FINAL-DECISION
                       MOVE "DTI EXCEEDS GOOD TIER LIMIT (40%)" 
                           TO DENIAL-REASON
                       GO TO END-EVALUATION
                   END-IF
               WHEN "FAIR"
                   IF DTI-RATIO > DTI-FAIR-MAX
                       MOVE "DENIED" TO FINAL-DECISION
                       MOVE "DTI EXCEEDS FAIR TIER LIMIT (45%)" 
                           TO DENIAL-REASON
                       GO TO END-EVALUATION
                   END-IF
               WHEN "POOR"
                   IF DTI-RATIO > DTI-POOR-MAX
                       MOVE "DENIED" TO FINAL-DECISION
                       MOVE "DTI EXCEEDS POOR TIER LIMIT (50%)" 
                           TO DENIAL-REASON
                       GO TO END-EVALUATION
                   END-IF
           END-EVALUATE.
           
       *> Rule 5: Loan amount limits by credit tier
           EVALUATE CREDIT-TIER
               WHEN "EXCELLENT"
                   IF LOAN-AMOUNT > MAX-LOAN-EXCELLENT
                       MOVE "DENIED" TO FINAL-DECISION
                       MOVE "LOAN EXCEEDS EXCELLENT TIER MAX ($5M)" 
                           TO DENIAL-REASON
                       GO TO END-EVALUATION
                   END-IF
               WHEN "GOOD"
                   IF LOAN-AMOUNT > MAX-LOAN-GOOD
                       MOVE "DENIED" TO FINAL-DECISION
                       MOVE "LOAN EXCEEDS GOOD TIER MAX ($2M)" 
                           TO DENIAL-REASON
                       GO TO END-EVALUATION
                   END-IF
               WHEN "FAIR"
                   IF LOAN-AMOUNT > MAX-LOAN-FAIR
                       MOVE "DENIED" TO FINAL-DECISION
                       MOVE "LOAN EXCEEDS FAIR TIER MAX ($500K)" 
                           TO DENIAL-REASON
                       GO TO END-EVALUATION
                   END-IF
               WHEN "POOR"
                   IF LOAN-AMOUNT > MAX-LOAN-POOR
                       MOVE "DENIED" TO FINAL-DECISION
                       MOVE "LOAN EXCEEDS POOR TIER MAX ($100K)" 
                           TO DENIAL-REASON
                       GO TO END-EVALUATION
                   END-IF
           END-EVALUATE.
           
       *> Rule 6: Collateral requirements
           IF COLLATERAL-VALUE > 0
               IF LTV-RATIO > 80
                   IF CREDIT-SCORE < GOOD-MIN
                       MOVE "DENIED" TO FINAL-DECISION
                       MOVE "LTV > 80% REQUIRES GOOD CREDIT" 
                           TO DENIAL-REASON
                       GO TO END-EVALUATION
                   END-IF
                   MOVE "YES" TO MANUAL-REVIEW-FLAG
               END-IF
           ELSE
       *> No collateral - higher scrutiny
               IF LOAN-AMOUNT > 50000
                   IF CREDIT-SCORE < EXCELLENT-MIN
                       MOVE "DENIED" TO FINAL-DECISION
                       MOVE "UNSECURED LOAN > $50K REQUIRES EXCELLENT" 
                           TO DENIAL-REASON
                       GO TO END-EVALUATION
                   END-IF
               END-IF
           END-IF.
           
       *> Rule 7: High-value loan manual review
           IF LOAN-AMOUNT > 1000000
               MOVE "YES" TO MANUAL-REVIEW-FLAG
           END-IF.
           
       *> Rule 8: Risk score calculation
           COMPUTE RISK-SCORE = 
               (800 - CREDIT-SCORE) + 
               (DTI-RATIO * 2) + 
               (LTV-RATIO / 2) +
               (BANKRUPTCIES * 100).
           
           IF RISK-SCORE > 400
               MOVE "YES" TO MANUAL-REVIEW-FLAG
           END-IF.
           
       *> If passed all checks
           IF FINAL-DECISION = SPACES
               IF MANUAL-REVIEW-FLAG = "YES"
                   MOVE "MANUAL" TO FINAL-DECISION
               ELSE
                   MOVE "APPROVED" TO FINAL-DECISION
               END-IF
           END-IF.
       
       END-EVALUATION.
           CONTINUE.
       
       DISPLAY-RESULTS.
           DISPLAY "DECISION=" FINAL-DECISION.
           DISPLAY "CREDIT_TIER=" CREDIT-TIER.
           DISPLAY "INTEREST_RATE=" INTEREST-RATE.
           DISPLAY "DTI_RATIO=" DTI-RATIO.
           DISPLAY "LTV_RATIO=" LTV-RATIO.
           DISPLAY "RISK_SCORE=" RISK-SCORE.
           DISPLAY "MANUAL_REVIEW=" MANUAL-REVIEW-FLAG.
           IF DENIAL-REASON NOT = SPACES
               DISPLAY "DENIAL_REASON=" DENIAL-REASON
           END-IF.
