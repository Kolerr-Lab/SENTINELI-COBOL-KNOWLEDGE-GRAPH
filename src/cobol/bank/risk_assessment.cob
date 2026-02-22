       IDENTIFICATION DIVISION.
       PROGRAM-ID. RISK-ASSESSMENT.
       AUTHOR. SENTINELI-ENTERPRISE-SYSTEM.
      *****************************************************************
      * ENTERPRISE RISK ASSESSMENT MODULE                            *
      * Evaluates credit risk, market risk, operational risk          *
      * VaR calculation, stress testing, risk scoring                 *
      * Implements Basel III capital adequacy requirements            *
      *****************************************************************
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT CUSTOMER-FILE ASSIGN TO "CUSTOMER.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT RISK-REPORT ASSIGN TO "RISK_REPORT.TXT"
               ORGANIZATION IS LINE SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD  CUSTOMER-FILE.
       01  CUSTOMER-RECORD.
           05  CUST-ID                  PIC 9(10).
           05  CUST-NAME                PIC X(50).
           05  CUST-TYPE                PIC X(20).
           05  CREDIT-SCORE             PIC 9(3).
           05  TOTAL-EXPOSURE           PIC 9(12)V99.
           05  DEFAULT-PROBABILITY      PIC 9V9999.
           05  COLLATERAL-VALUE         PIC 9(12)V99.
           05  INDUSTRY-SECTOR          PIC X(30).
           05  GEOGRAPHIC-REGION        PIC X(30).
           05  RELATIONSHIP-YEARS       PIC 99.
       
       FD  RISK-REPORT.
       01  REPORT-LINE                  PIC X(132).
       
       WORKING-STORAGE SECTION.
       01  WS-RISK-METRICS.
           05  WS-CREDIT-RISK           PIC 9(10)V99 VALUE ZEROS.
           05  WS-MARKET-RISK           PIC 9(10)V99 VALUE ZEROS.
           05  WS-OPERATIONAL-RISK      PIC 9(10)V99 VALUE ZEROS.
           05  WS-TOTAL-RISK            PIC 9(10)V99 VALUE ZEROS.
           05  WS-RISK-SCORE            PIC 999 VALUE ZEROS.
           05  WS-RISK-RATING           PIC X(20) VALUE SPACES.
       
       01  WS-VAR-CALCULATION.
           05  WS-VAR-95                PIC 9(10)V99 VALUE ZEROS.
           05  WS-VAR-99                PIC 9(10)V99 VALUE ZEROS.
           05  WS-EXPECTED-LOSS         PIC 9(10)V99 VALUE ZEROS.
           05  WS-UNEXPECTED-LOSS       PIC 9(10)V99 VALUE ZEROS.
       
       01  WS-STRESS-TEST.
           05  WS-RECESSION-SCENARIO    PIC 9(10)V99 VALUE ZEROS.
           05  WS-MARKET-CRASH          PIC 9(10)V99 VALUE ZEROS.
           05  WS-INTEREST-SPIKE        PIC 9(10)V99 VALUE ZEROS.
           05  WS-WORST-CASE            PIC 9(10)V99 VALUE ZEROS.
       
       01  WS-CAPITAL-ADEQUACY.
           05  WS-TIER1-CAPITAL         PIC 9(10)V99 VALUE ZEROS.
           05  WS-TOTAL-CAPITAL         PIC 9(10)V99 VALUE ZEROS.
           05  WS-RISK-WEIGHTED-ASSETS  PIC 9(12)V99 VALUE ZEROS.
           05  WS-CAPITAL-RATIO         PIC 9V9999 VALUE ZEROS.
           05  WS-BASEL-COMPLIANT       PIC X VALUE 'N'.
       
       01  WS-CONCENTRATION-RISK.
           05  WS-SECTOR-CONCENTRATION  PIC 9V9999 VALUE ZEROS.
           05  WS-GEO-CONCENTRATION     PIC 9V9999 VALUE ZEROS.
           05  WS-SINGLE-NAME-LIMIT     PIC 9(10)V99 VALUE ZEROS.
       
       01  WS-PORTFOLIO-METRICS.
           05  WS-TOTAL-PORTFOLIO       PIC 9(12)V99 VALUE ZEROS.
           05  WS-DEFAULT-RATE          PIC 9V9999 VALUE ZEROS.
           05  WS-RECOVERY-RATE         PIC 9V9999 VALUE ZEROS.
           05  WS-LOSS-GIVEN-DEFAULT    PIC 9V9999 VALUE ZEROS.
       
       01  WS-RISK-LIMITS.
           05  WS-MAX-SINGLE-EXPOSURE   PIC 9(10)V99 VALUE 50000000.
           05  WS-MAX-SECTOR-EXPOSURE   PIC 9V9999 VALUE 0.25.
           05  WS-MIN-CAPITAL-RATIO     PIC 9V9999 VALUE 0.08.
           05  WS-MAX-VAR-LIMIT         PIC 9(10)V99 VALUE 10000000.
       
       01  WS-COUNTERS.
           05  WS-TOTAL-CUSTOMERS       PIC 9(6) VALUE ZEROS.
           05  WS-HIGH-RISK-COUNT       PIC 9(6) VALUE ZEROS.
           05  WS-MEDIUM-RISK-COUNT     PIC 9(6) VALUE ZEROS.
           05  WS-LOW-RISK-COUNT        PIC 9(6) VALUE ZEROS.
       
       01  WS-FLAGS.
           05  WS-EOF                   PIC X VALUE 'N'.
           05  WS-LIMIT-BREACH          PIC X VALUE 'N'.
           05  WS-COMPLIANCE-FLAG       PIC X VALUE 'Y'.
       
       01  WS-TEMP-FIELDS.
           05  WS-CREDIT-MULTIPLIER     PIC 9V9999 VALUE ZEROS.
           05  WS-SECTOR-RISK           PIC 9V9999 VALUE ZEROS.
           05  WS-TENURE-DISCOUNT       PIC 9V9999 VALUE ZEROS.
           05  WS-COLLATERAL-COVERAGE   PIC 9V9999 VALUE ZEROS.
       
       01  WS-REPORT-HEADER.
           05  FILLER                   PIC X(50) 
               VALUE "ENTERPRISE RISK ASSESSMENT REPORT".
           05  FILLER                   PIC X(82) VALUE ALL "=".
       
       01  WS-DETAIL-LINE.
           05  FILLER                   PIC X(10) VALUE "Customer: ".
           05  DL-CUST-ID               PIC 9(10).
           05  FILLER                   PIC X(12) VALUE " | Score: ".
           05  DL-RISK-SCORE            PIC ZZ9.
           05  FILLER                   PIC X(12) VALUE " | Rating: ".
           05  DL-RISK-RATING           PIC X(20).
           05  FILLER                   PIC X(10) VALUE " | VaR: $".
           05  DL-VAR                   PIC ZZZ,ZZZ,ZZ9.99.
       
       PROCEDURE DIVISION.
       0000-MAIN-PROCESS.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-CUSTOMERS
           PERFORM 3000-CALCULATE-PORTFOLIO-RISK
           PERFORM 4000-STRESS-TESTING
           PERFORM 5000-CAPITAL-ADEQUACY-CHECK
           PERFORM 6000-CONCENTRATION-ANALYSIS
           PERFORM 7000-GENERATE-REPORT
           PERFORM 9000-TERMINATE
           STOP RUN.
       
       1000-INITIALIZE.
           DISPLAY "SENTINELI Risk Assessment System Starting..."
           OPEN INPUT CUSTOMER-FILE
           OPEN OUTPUT RISK-REPORT
           
           MOVE ZEROS TO WS-RISK-METRICS
           MOVE ZEROS TO WS-VAR-CALCULATION
           MOVE ZEROS TO WS-STRESS-TEST
           MOVE ZEROS TO WS-COUNTERS
           
           MOVE 50000000 TO WS-MAX-SINGLE-EXPOSURE
           MOVE 0.25 TO WS-MAX-SECTOR-EXPOSURE
           MOVE 0.08 TO WS-MIN-CAPITAL-RATIO
           MOVE 10000000 TO WS-MAX-VAR-LIMIT.
       
       2000-PROCESS-CUSTOMERS.
           PERFORM 2100-READ-CUSTOMER
           PERFORM 2200-ASSESS-CUSTOMER-RISK
               UNTIL WS-EOF = 'Y'.
       
       2100-READ-CUSTOMER.
           READ CUSTOMER-FILE
               AT END
                   MOVE 'Y' TO WS-EOF
               NOT AT END
                   ADD 1 TO WS-TOTAL-CUSTOMERS
           END-READ.
       
       2200-ASSESS-CUSTOMER-RISK.
           IF WS-EOF = 'N'
               PERFORM 2210-CALCULATE-CREDIT-RISK
               PERFORM 2220-CALCULATE-VAR
               PERFORM 2230-ASSIGN-RISK-RATING
               PERFORM 2240-CHECK-RISK-LIMITS
               PERFORM 2100-READ-CUSTOMER
           END-IF.
       
       2210-CALCULATE-CREDIT-RISK.
      * Credit Risk = Exposure × PD × LGD × Risk Multipliers
           
           MOVE 1.0 TO WS-CREDIT-MULTIPLIER
           
      * Credit score impact
           IF CREDIT-SCORE < 580
               MULTIPLY WS-CREDIT-MULTIPLIER BY 2.5
           ELSE IF CREDIT-SCORE < 670
               MULTIPLY WS-CREDIT-MULTIPLIER BY 1.8
           ELSE IF CREDIT-SCORE < 740
               MULTIPLY WS-CREDIT-MULTIPLIER BY 1.2
           ELSE
               MULTIPLY WS-CREDIT-MULTIPLIER BY 0.7
           END-IF.
           
      * Sector risk adjustment
           EVALUATE INDUSTRY-SECTOR
               WHEN "REAL-ESTATE"
                   MOVE 1.5 TO WS-SECTOR-RISK
               WHEN "CONSTRUCTION"
                   MOVE 1.7 TO WS-SECTOR-RISK
               WHEN "RETAIL"
                   MOVE 1.3 TO WS-SECTOR-RISK
               WHEN "TECHNOLOGY"
                   MOVE 1.1 TO WS-SECTOR-RISK
               WHEN "HEALTHCARE"
                   MOVE 0.9 TO WS-SECTOR-RISK
               WHEN OTHER
                   MOVE 1.0 TO WS-SECTOR-RISK
           END-EVALUATE.
           
           MULTIPLY WS-CREDIT-MULTIPLIER BY WS-SECTOR-RISK.
           
      * Relationship tenure discount
           IF RELATIONSHIP-YEARS > 10
               MOVE 0.85 TO WS-TENURE-DISCOUNT
           ELSE IF RELATIONSHIP-YEARS > 5
               MOVE 0.92 TO WS-TENURE-DISCOUNT
           ELSE
               MOVE 1.0 TO WS-TENURE-DISCOUNT
           END-IF.
           
           MULTIPLY WS-CREDIT-MULTIPLIER BY WS-TENURE-DISCOUNT.
           
      * Collateral coverage
           IF COLLATERAL-VALUE > TOTAL-EXPOSURE
               MOVE 0.6 TO WS-COLLATERAL-COVERAGE
           ELSE IF COLLATERAL-VALUE > (TOTAL-EXPOSURE * 0.7)
               MOVE 0.8 TO WS-COLLATERAL-COVERAGE
           ELSE
               MOVE 1.0 TO WS-COLLATERAL-COVERAGE
           END-IF.
           
           MULTIPLY WS-CREDIT-MULTIPLIER BY WS-COLLATERAL-COVERAGE.
           
      * Calculate expected loss
           COMPUTE WS-EXPECTED-LOSS = 
               TOTAL-EXPOSURE * DEFAULT-PROBABILITY * 
               WS-CREDIT-MULTIPLIER.
           
           ADD WS-EXPECTED-LOSS TO WS-CREDIT-RISK.
       
       2220-CALCULATE-VAR.
      * Value at Risk calculation (95% and 99% confidence)
      * VaR = Portfolio × Volatility × Z-score
           
           COMPUTE WS-VAR-95 = 
               TOTAL-EXPOSURE * 0.15 * 1.645.
           
           COMPUTE WS-VAR-99 = 
               TOTAL-EXPOSURE * 0.15 * 2.326.
           
           ADD WS-VAR-95 TO WS-MARKET-RISK.
       
       2230-ASSIGN-RISK-RATING.
      * Risk score: 0-1000 scale
           COMPUTE WS-RISK-SCORE = 
               (CREDIT-SCORE / 8.5) + 
               ((1 - DEFAULT-PROBABILITY) * 150) +
               ((COLLATERAL-VALUE / TOTAL-EXPOSURE) * 100).
           
           IF WS-RISK-SCORE >= 750
               MOVE "LOW-RISK" TO WS-RISK-RATING
               ADD 1 TO WS-LOW-RISK-COUNT
           ELSE IF WS-RISK-SCORE >= 500
               MOVE "MEDIUM-RISK" TO WS-RISK-RATING
               ADD 1 TO WS-MEDIUM-RISK-COUNT
           ELSE
               MOVE "HIGH-RISK" TO WS-RISK-RATING
               ADD 1 TO WS-HIGH-RISK-COUNT
           END-IF.
       
       2240-CHECK-RISK-LIMITS.
      * Single name concentration limit
           IF TOTAL-EXPOSURE > WS-MAX-SINGLE-EXPOSURE
               MOVE 'Y' TO WS-LIMIT-BREACH
               DISPLAY "WARNING: Single name limit breach for "
                   CUST-ID
           END-IF.
           
      * VaR limit check
           IF WS-VAR-95 > WS-MAX-VAR-LIMIT
               MOVE 'Y' TO WS-LIMIT-BREACH
               DISPLAY "WARNING: VaR limit exceeded for " CUST-ID
           END-IF.
       
       3000-CALCULATE-PORTFOLIO-RISK.
           DISPLAY "Calculating portfolio-level risk metrics..."
           
      * Portfolio default rate
           IF WS-TOTAL-CUSTOMERS > 0
               COMPUTE WS-DEFAULT-RATE = 
                   WS-HIGH-RISK-COUNT / WS-TOTAL-CUSTOMERS
           END-IF.
           
      * Loss given default assumption
           MOVE 0.45 TO WS-LOSS-GIVEN-DEFAULT.
           
      * Operational risk (Basel II standardized approach)
           COMPUTE WS-OPERATIONAL-RISK = 
               WS-TOTAL-PORTFOLIO * 0.15 * 0.12.
           
      * Total risk
           COMPUTE WS-TOTAL-RISK = 
               WS-CREDIT-RISK + 
               WS-MARKET-RISK + 
               WS-OPERATIONAL-RISK.
       
       4000-STRESS-TESTING.
           DISPLAY "Running stress test scenarios..."
           
      * Recession scenario: 30% increase in defaults
           COMPUTE WS-RECESSION-SCENARIO = 
               WS-CREDIT-RISK * 1.30.
           
      * Market crash: 40% increase in VaR
           COMPUTE WS-MARKET-CRASH = 
               WS-TOTAL-RISK * 1.40.
           
      * Interest rate spike: 25% increase in losses
           COMPUTE WS-INTEREST-SPIKE = 
               WS-TOTAL-RISK * 1.25.
           
      * Worst case: Combined severe scenario
           COMPUTE WS-WORST-CASE = 
               WS-CREDIT-RISK * 1.50 + 
               WS-MARKET-RISK * 1.60 + 
               WS-OPERATIONAL-RISK * 1.30.
       
       5000-CAPITAL-ADEQUACY-CHECK.
           DISPLAY "Checking Basel III capital adequacy..."
           
      * Simulate capital levels (normally from balance sheet)
           COMPUTE WS-TIER1-CAPITAL = 
               WS-TOTAL-PORTFOLIO * 0.10.
           
           COMPUTE WS-TOTAL-CAPITAL = 
               WS-TOTAL-PORTFOLIO * 0.13.
           
      * Risk-weighted assets calculation
           COMPUTE WS-RISK-WEIGHTED-ASSETS = 
               WS-TOTAL-PORTFOLIO * 0.75.
           
      * Capital adequacy ratio
           IF WS-RISK-WEIGHTED-ASSETS > 0
               COMPUTE WS-CAPITAL-RATIO = 
                   WS-TOTAL-CAPITAL / WS-RISK-WEIGHTED-ASSETS
           END-IF.
           
      * Basel III minimum is 8%
           IF WS-CAPITAL-RATIO >= WS-MIN-CAPITAL-RATIO
               MOVE 'Y' TO WS-BASEL-COMPLIANT
               DISPLAY "✓ Basel III compliant. Ratio: " 
                   WS-CAPITAL-RATIO
           ELSE
               MOVE 'N' TO WS-BASEL-COMPLIANT
               MOVE 'N' TO WS-COMPLIANCE-FLAG
               DISPLAY "✗ Capital inadequate! Ratio: " 
                   WS-CAPITAL-RATIO
           END-IF.
       
       6000-CONCENTRATION-ANALYSIS.
           DISPLAY "Analyzing concentration risk..."
           
      * Sector concentration (simplified)
           COMPUTE WS-SECTOR-CONCENTRATION = 
               WS-TOTAL-PORTFOLIO * 0.22.
           
      * Geographic concentration
           COMPUTE WS-GEO-CONCENTRATION = 
               WS-TOTAL-PORTFOLIO * 0.18.
           
      * Check concentration limits
           IF WS-SECTOR-CONCENTRATION > 
               (WS-TOTAL-PORTFOLIO * WS-MAX-SECTOR-EXPOSURE)
               DISPLAY "WARNING: Sector concentration exceeds 25% limit"
               MOVE 'N' TO WS-COMPLIANCE-FLAG
           END-IF.
       
       7000-GENERATE-REPORT.
           DISPLAY "Generating enterprise risk report..."
           
           WRITE REPORT-LINE FROM WS-REPORT-HEADER
           
           MOVE SPACES TO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "PORTFOLIO SUMMARY:" DELIMITED BY SIZE
               INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Total Customers: " 
               WS-TOTAL-CUSTOMERS DELIMITED BY SIZE
               INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "High Risk: " WS-HIGH-RISK-COUNT 
               " | Medium: " WS-MEDIUM-RISK-COUNT
               " | Low: " WS-LOW-RISK-COUNT DELIMITED BY SIZE
               INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE SPACES TO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "RISK METRICS:" DELIMITED BY SIZE
               INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Credit Risk: $" WS-CREDIT-RISK DELIMITED BY SIZE
               INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Market Risk (VaR 95%): $" WS-MARKET-RISK 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Operational Risk: $" WS-OPERATIONAL-RISK 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Total Risk Exposure: $" WS-TOTAL-RISK 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE SPACES TO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "STRESS TEST RESULTS:" DELIMITED BY SIZE
               INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Recession Scenario: $" WS-RECESSION-SCENARIO 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Market Crash: $" WS-MARKET-CRASH 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Worst Case: $" WS-WORST-CASE 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE SPACES TO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "CAPITAL ADEQUACY (Basel III):" 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Capital Ratio: " WS-CAPITAL-RATIO 
               " | Compliant: " WS-BASEL-COMPLIANT 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE.
       
       9000-TERMINATE.
           CLOSE CUSTOMER-FILE
           CLOSE RISK-REPORT
           
           DISPLAY " "
           DISPLAY "════════════════════════════════════════"
           DISPLAY "  RISK ASSESSMENT COMPLETE"
           DISPLAY "════════════════════════════════════════"
           DISPLAY "Total Customers Analyzed: " WS-TOTAL-CUSTOMERS
           DISPLAY "Total Risk Exposure: $" WS-TOTAL-RISK
           DISPLAY "Capital Adequacy: " WS-CAPITAL-RATIO
           DISPLAY "Basel III Compliant: " WS-BASEL-COMPLIANT
           DISPLAY "════════════════════════════════════════"
           .
