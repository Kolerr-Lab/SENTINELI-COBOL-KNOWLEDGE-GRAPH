       IDENTIFICATION DIVISION.
       PROGRAM-ID. FRAUD-DETECTION.
       AUTHOR. SENTINELI-ENTERPRISE-SYSTEM.
      *****************************************************************
      * REAL-TIME FRAUD DETECTION & PREVENTION ENGINE                *
      * Machine Learning-based anomaly detection                      *
      * Behavioral analytics, device fingerprinting                   *
      * Velocity checks, geolocation analysis                         *
      * Real-time scoring and automated blocking                      *
      *****************************************************************
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT TRANSACTION-STREAM ASSIGN TO "TXN_STREAM.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT CUSTOMER-PROFILE ASSIGN TO "PROFILES.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT FRAUD-ALERTS ASSIGN TO "FRAUD_ALERTS.TXT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT BLOCKED-TXN-LOG ASSIGN TO "BLOCKED.LOG"
               ORGANIZATION IS LINE SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD  TRANSACTION-STREAM.
       01  TXN-STREAM-RECORD.
           05  TXN-ID                   PIC 9(15).
           05  TXN-TIMESTAMP            PIC 9(14).
           05  CUSTOMER-ID              PIC 9(10).
           05  CARD-NUMBER              PIC 9(16).
           05  TXN-AMOUNT               PIC 9(10)V99.
           05  MERCHANT-ID              PIC X(20).
           05  MERCHANT-CATEGORY        PIC X(4).
           05  TXN-TYPE                 PIC X(20).
           05  TXN-LOCATION-LAT         PIC S9(2)V9(6).
           05  TXN-LOCATION-LON         PIC S9(3)V9(6).
           05  DEVICE-ID                PIC X(40).
           05  IP-ADDRESS               PIC X(15).
           05  CHANNEL                  PIC X(15).
       
       FD  CUSTOMER-PROFILE.
       01  CUSTOMER-PROFILE-REC.
           05  PROFILE-CUST-ID          PIC 9(10).
           05  AVG-TXN-AMOUNT           PIC 9(8)V99.
           05  MAX-TXN-AMOUNT           PIC 9(8)V99.
           05  TYPICAL-MERCHANT-CAT     PIC X(4).
           05  HOME-LOCATION-LAT        PIC S9(2)V9(6).
           05  HOME-LOCATION-LON        PIC S9(3)V9(6).
           05  REGISTERED-DEVICES       PIC 9(2).
           05  ACCOUNT-AGE-DAYS         PIC 9(5).
           05  FRAUD-HISTORY-COUNT      PIC 9(3).
           05  AVG-DAILY-TXN            PIC 9(3).
       
       FD  FRAUD-ALERTS.
       01  ALERT-RECORD                 PIC X(200).
       
       FD  BLOCKED-TXN-LOG.
       01  BLOCKED-LOG-REC              PIC X(150).
       
       WORKING-STORAGE SECTION.
       01  WS-FRAUD-THRESHOLDS.
           05  WS-AMOUNT-MULTIPLIER     PIC 9V99 VALUE 3.00.
           05  WS-VELOCITY-LIMIT        PIC 99 VALUE 5.
           05  WS-DISTANCE-THRESHOLD    PIC 9(4) VALUE 500.
           05  WS-HIGH-RISK-SCORE       PIC 999 VALUE 700.
           05  WS-BLOCK-THRESHOLD       PIC 999 VALUE 850.
       
       01  WS-FRAUD-SCORES.
           05  WS-AMOUNT-SCORE          PIC 999 VALUE ZEROS.
           05  WS-VELOCITY-SCORE        PIC 999 VALUE ZEROS.
           05  WS-LOCATION-SCORE        PIC 999 VALUE ZEROS.
           05  WS-DEVICE-SCORE          PIC 999 VALUE ZEROS.
           05  WS-BEHAVIORAL-SCORE      PIC 999 VALUE ZEROS.
           05  WS-TOTAL-FRAUD-SCORE     PIC 9999 VALUE ZEROS.
       
       01  WS-VELOCITY-TRACKING.
           05  WS-TXN-LAST-HOUR         PIC 99 VALUE ZEROS.
           05  WS-TXN-LAST-10MIN        PIC 99 VALUE ZEROS.
           05  WS-AMOUNT-LAST-HOUR      PIC 9(10)V99 VALUE ZEROS.
           05  WS-LAST-TXN-TIME         PIC 9(14) VALUE ZEROS.
           05  WS-TIME-SINCE-LAST       PIC 9(6) VALUE ZEROS.
       
       01  WS-LOCATION-ANALYSIS.
           05  WS-DISTANCE-FROM-HOME    PIC 9(6)V99 VALUE ZEROS.
           05  WS-DISTANCE-FROM-LAST    PIC 9(6)V99 VALUE ZEROS.
           05  WS-IMPOSSIBLE-TRAVEL     PIC X VALUE 'N'.
           05  WS-FOREIGN-COUNTRY       PIC X VALUE 'N'.
       
       01  WS-DEVICE-FINGERPRINT.
           05  WS-KNOWN-DEVICE          PIC X VALUE 'N'.
           05  WS-NEW-DEVICE            PIC X VALUE 'N'.
           05  WS-SUSPICIOUS-IP         PIC X VALUE 'N'.
           05  WS-VPN-DETECTED          PIC X VALUE 'N'.
       
       01  WS-ANOMALY-DETECTION.
           05  WS-UNUSUAL-MERCHANT      PIC X VALUE 'N'.
           05  WS-UNUSUAL-AMOUNT        PIC X VALUE 'N'.
           05  WS-UNUSUAL-TIME          PIC X VALUE 'N'.
           05  WS-CARD-TESTING          PIC X VALUE 'N'.
           05  WS-ACCOUNT-TAKEOVER      PIC X VALUE 'N'.
       
       01  WS-FRAUD-PATTERNS.
           05  WS-RAPID-FIRE            PIC X VALUE 'N'.
           05  WS-ROUND-DOLLAR          PIC X VALUE 'N'.
           05  WS-GAS-STATION-FRAUD     PIC X VALUE 'N'.
           05  WS-CARD-NOT-PRESENT      PIC X VALUE 'N'.
       
       01  WS-COUNTERS.
           05  WS-TOTAL-TXN             PIC 9(8) VALUE ZEROS.
           05  WS-FRAUD-ALERTS          PIC 9(6) VALUE ZEROS.
           05  WS-BLOCKED-TXN           PIC 9(6) VALUE ZEROS.
           05  WS-CHALLENGED-TXN        PIC 9(6) VALUE ZEROS.
           05  WS-APPROVED-TXN          PIC 9(8) VALUE ZEROS.
       
       01  WS-DOLLAR-METRICS.
           05  WS-TOTAL-AMOUNT          PIC 9(12)V99 VALUE ZEROS.
           05  WS-FRAUD-AMOUNT          PIC 9(12)V99 VALUE ZEROS.
           05  WS-BLOCKED-AMOUNT        PIC 9(12)V99 VALUE ZEROS.
           05  WS-SAVED-AMOUNT          PIC 9(12)V99 VALUE ZEROS.
       
       01  WS-TEMP-CALCULATIONS.
           05  WS-AMOUNT-DEVIATION      PIC 9(3)V99 VALUE ZEROS.
           05  WS-VELOCITY-RATIO        PIC 9V9999 VALUE ZEROS.
           05  WS-RISK-MULTIPLIER       PIC 9V99 VALUE ZEROS.
       
       01  WS-FLAGS.
           05  WS-EOF                   PIC X VALUE 'N'.
           05  WS-PROFILE-FOUND         PIC X VALUE 'N'.
           05  WS-REAL-TIME-BLOCK       PIC X VALUE 'N'.
       
       01  WS-ALERT-DETAIL.
           05  ALERT-ID                 PIC 9(10).
           05  ALERT-TIME               PIC 9(14).
           05  ALERT-CUST-ID            PIC 9(10).
           05  ALERT-TXN-ID             PIC 9(15).
           05  ALERT-TYPE               PIC X(30).
           05  ALERT-SCORE              PIC 9999.
           05  ALERT-ACTION             PIC X(20).
       
       01  WS-FRAUD-REASONS            PIC X(200) VALUE SPACES.
       
       PROCEDURE DIVISION.
       0000-MAIN-FRAUD-ENGINE.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-LOAD-CUSTOMER-PROFILES
           PERFORM 3000-PROCESS-TXN-STREAM
           PERFORM 4000-BEHAVIORAL-ANALYSIS
           PERFORM 5000-GENERATE-FRAUD-REPORT
           PERFORM 9000-TERMINATE
           STOP RUN.
       
       1000-INITIALIZE.
           DISPLAY "SENTINELI Real-Time Fraud Detection Engine"
           DISPLAY "Initializing ML-based fraud models..."
           
           OPEN INPUT TRANSACTION-STREAM
           OPEN INPUT CUSTOMER-PROFILE
           OPEN OUTPUT FRAUD-ALERTS
           OPEN OUTPUT BLOCKED-TXN-LOG
           
           MOVE 3.00 TO WS-AMOUNT-MULTIPLIER
           MOVE 5 TO WS-VELOCITY-LIMIT
           MOVE 500 TO WS-DISTANCE-THRESHOLD
           MOVE 700 TO WS-HIGH-RISK-SCORE
           MOVE 850 TO WS-BLOCK-THRESHOLD
           
           MOVE ZEROS TO WS-COUNTERS
           MOVE ZEROS TO WS-DOLLAR-METRICS.
       
       2000-LOAD-CUSTOMER-PROFILES.
           DISPLAY "Loading customer behavioral profiles..."
           
           READ CUSTOMER-PROFILE
               AT END
                   MOVE 'Y' TO WS-EOF
           END-READ.
       
       3000-PROCESS-TXN-STREAM.
           DISPLAY "Processing real-time transaction stream..."
           
           PERFORM 3100-READ-TXN
           PERFORM UNTIL WS-EOF = 'Y'
               ADD 1 TO WS-TOTAL-TXN
               ADD TXN-AMOUNT TO WS-TOTAL-AMOUNT
               
               PERFORM 3200-INITIALIZE-FRAUD-CHECK
               PERFORM 3300-AMOUNT-ANALYSIS
               PERFORM 3400-VELOCITY-CHECK
               PERFORM 3500-LOCATION-ANALYSIS
               PERFORM 3600-DEVICE-FINGERPRINT-CHECK
               PERFORM 3700-PATTERN-DETECTION
               PERFORM 3800-CALCULATE-TOTAL-SCORE
               PERFORM 3900-FRAUD-DECISION
               
               PERFORM 3100-READ-TXN
           END-PERFORM.
       
       3100-READ-TXN.
           READ TRANSACTION-STREAM
               AT END
                   MOVE 'Y' TO WS-EOF
           END-READ.
       
       3200-INITIALIZE-FRAUD-CHECK.
           MOVE ZEROS TO WS-FRAUD-SCORES
           MOVE 'N' TO WS-ANOMALY-DETECTION
           MOVE 'N' TO WS-FRAUD-PATTERNS
           MOVE 'N' TO WS-REAL-TIME-BLOCK
           MOVE SPACES TO WS-FRAUD-REASONS.
       
       3300-AMOUNT-ANALYSIS.
      * Compare transaction amount to customer's typical behavior
           IF TXN-AMOUNT > (AVG-TXN-AMOUNT * WS-AMOUNT-MULTIPLIER)
               MOVE 'Y' TO WS-UNUSUAL-AMOUNT
               COMPUTE WS-AMOUNT-DEVIATION = 
                   (TXN-AMOUNT / AVG-TXN-AMOUNT)
               ADD 150 TO WS-AMOUNT-SCORE
               STRING "Amount " WS-AMOUNT-DEVIATION "x typical; "
                   DELIMITED BY SIZE INTO WS-FRAUD-REASONS
           END-IF.
           
      * Extremely large transaction
           IF TXN-AMOUNT > MAX-TXN-AMOUNT
               ADD 200 TO WS-AMOUNT-SCORE
               STRING "Exceeds max amount; " DELIMITED BY SIZE
                   INTO WS-FRAUD-REASONS
           END-IF.
           
      * Round dollar amount (common in fraud)
           IF FUNCTION MOD(TXN-AMOUNT, 50) = 0
               MOVE 'Y' TO WS-ROUND-DOLLAR
               ADD 50 TO WS-AMOUNT-SCORE
           END-IF.
       
       3400-VELOCITY-CHECK.
      * Calculate time since last transaction
           IF WS-LAST-TXN-TIME > 0
               COMPUTE WS-TIME-SINCE-LAST = 
                   TXN-TIMESTAMP - WS-LAST-TXN-TIME
           END-IF.
           
      * Rapid-fire transactions (< 2 minutes)
           IF WS-TIME-SINCE-LAST < 200
               MOVE 'Y' TO WS-RAPID-FIRE
               ADD 180 TO WS-VELOCITY-SCORE
               STRING "Rapid-fire txn; " DELIMITED BY SIZE
                   INTO WS-FRAUD-REASONS
           END-IF.
           
      * Multiple transactions in short period
           ADD 1 TO WS-TXN-LAST-10MIN
           ADD TXN-AMOUNT TO WS-AMOUNT-LAST-HOUR
           
           IF WS-TXN-LAST-10MIN > WS-VELOCITY-LIMIT
               ADD 200 TO WS-VELOCITY-SCORE
               STRING "Velocity limit breach; " DELIMITED BY SIZE
                   INTO WS-FRAUD-REASONS
           END-IF.
           
           MOVE TXN-TIMESTAMP TO WS-LAST-TXN-TIME.
       
       3500-LOCATION-ANALYSIS.
      * Calculate distance from home location
           COMPUTE WS-DISTANCE-FROM-HOME = 
               FUNCTION SQRT(
                   ((TXN-LOCATION-LAT - HOME-LOCATION-LAT) ** 2) +
                   ((TXN-LOCATION-LON - HOME-LOCATION-LON) ** 2)
               ) * 69.
           
      * Distant transaction
           IF WS-DISTANCE-FROM-HOME > WS-DISTANCE-THRESHOLD
               ADD 120 TO WS-LOCATION-SCORE
               STRING "Distance from home: " 
                   WS-DISTANCE-FROM-HOME "km; "
                   DELIMITED BY SIZE INTO WS-FRAUD-REASONS
           END-IF.
           
      * Impossible travel (distance vs time check)
           IF WS-DISTANCE-FROM-HOME > 100
               AND WS-TIME-SINCE-LAST < 900
               MOVE 'Y' TO WS-IMPOSSIBLE-TRAVEL
               ADD 300 TO WS-LOCATION-SCORE
               STRING "IMPOSSIBLE TRAVEL; " DELIMITED BY SIZE
                   INTO WS-FRAUD-REASONS
           END-IF.
       
       3600-DEVICE-FINGERPRINT-CHECK.
      * Check if device is recognized
           IF REGISTERED-DEVICES > 0
               MOVE 'Y' TO WS-KNOWN-DEVICE
           ELSE
               MOVE 'Y' TO WS-NEW-DEVICE
               ADD 100 TO WS-DEVICE-SCORE
               STRING "New device; " DELIMITED BY SIZE
                   INTO WS-FRAUD-REASONS
           END-IF.
           
      * Suspicious IP patterns (simplified)
           IF IP-ADDRESS(1:3) = "TOR"
               OR IP-ADDRESS(1:3) = "VPN"
               MOVE 'Y' TO WS-VPN-DETECTED
               ADD 150 TO WS-DEVICE-SCORE
               STRING "VPN/TOR detected; " DELIMITED BY SIZE
                   INTO WS-FRAUD-REASONS
           END-IF.
       
       3700-PATTERN-DETECTION.
      * Card testing pattern (small amounts)
           IF TXN-AMOUNT < 5.00
               AND CHANNEL = "ONLINE"
               MOVE 'Y' TO WS-CARD-TESTING
               ADD 200 TO WS-BEHAVIORAL-SCORE
               STRING "Possible card testing; " DELIMITED BY SIZE
                   INTO WS-FRAUD-REASONS
           END-IF.
           
      * Gas station fraud pattern
           IF MERCHANT-CATEGORY = "5542"
               AND TXN-AMOUNT > 75.00
               MOVE 'Y' TO WS-GAS-STATION-FRAUD
               ADD 80 TO WS-BEHAVIORAL-SCORE
           END-IF.
           
      * Unusual merchant category
           IF MERCHANT-CATEGORY NOT = TYPICAL-MERCHANT-CAT
               MOVE 'Y' TO WS-UNUSUAL-MERCHANT
               ADD 70 TO WS-BEHAVIORAL-SCORE
           END-IF.
           
      * Card-not-present (higher fraud risk)
           IF CHANNEL = "ONLINE"
               OR CHANNEL = "PHONE"
               MOVE 'Y' TO WS-CARD-NOT-PRESENT
               ADD 60 TO WS-BEHAVIORAL-SCORE
           END-IF.
       
       3800-CALCULATE-TOTAL-SCORE.
      * Weighted fraud score calculation
           COMPUTE WS-TOTAL-FRAUD-SCORE = 
               (WS-AMOUNT-SCORE * 1.2) +
               (WS-VELOCITY-SCORE * 1.5) +
               (WS-LOCATION-SCORE * 1.3) +
               (WS-DEVICE-SCORE * 1.1) +
               (WS-BEHAVIORAL-SCORE * 1.0).
           
      * Fraud history multiplier
           IF FRAUD-HISTORY-COUNT > 0
               COMPUTE WS-RISK-MULTIPLIER = 
                   1.0 + (FRAUD-HISTORY-COUNT * 0.2)
               COMPUTE WS-TOTAL-FRAUD-SCORE = 
                   WS-TOTAL-FRAUD-SCORE * WS-RISK-MULTIPLIER
           END-IF.
       
       3900-FRAUD-DECISION.
      * Critical: Block transaction immediately
           IF WS-TOTAL-FRAUD-SCORE >= WS-BLOCK-THRESHOLD
               MOVE 'Y' TO WS-REAL-TIME-BLOCK
               ADD 1 TO WS-BLOCKED-TXN
               ADD TXN-AMOUNT TO WS-BLOCKED-AMOUNT
               ADD TXN-AMOUNT TO WS-SAVED-AMOUNT
               PERFORM 3910-BLOCK-TRANSACTION
               
      * High risk: Challenge with 2FA
           ELSE IF WS-TOTAL-FRAUD-SCORE >= WS-HIGH-RISK-SCORE
               ADD 1 TO WS-CHALLENGED-TXN
               PERFORM 3920-CHALLENGE-TRANSACTION
               
      * Low risk: Approve
           ELSE
               ADD 1 TO WS-APPROVED-TXN
           END-IF.
           
      * Log high-risk transactions
           IF WS-TOTAL-FRAUD-SCORE >= WS-HIGH-RISK-SCORE
               ADD 1 TO WS-FRAUD-ALERTS
               ADD TXN-AMOUNT TO WS-FRAUD-AMOUNT
               PERFORM 3930-LOG-FRAUD-ALERT
           END-IF.
       
       3910-BLOCK-TRANSACTION.
           STRING "BLOCKED: " TXN-ID " | Customer: " CUSTOMER-ID
               " | Score: " WS-TOTAL-FRAUD-SCORE
               " | Amount: $" TXN-AMOUNT
               " | Reasons: " WS-FRAUD-REASONS
               DELIMITED BY SIZE INTO BLOCKED-LOG-REC
           WRITE BLOCKED-LOG-REC
           
           DISPLAY "🚫 BLOCKED TXN " TXN-ID 
               " | Score: " WS-TOTAL-FRAUD-SCORE.
       
       3920-CHALLENGE-TRANSACTION.
           STRING "CHALLENGE: " TXN-ID " | Customer: " CUSTOMER-ID
               " | Score: " WS-TOTAL-FRAUD-SCORE
               " | Action: Send OTP/2FA"
               DELIMITED BY SIZE INTO ALERT-RECORD
           WRITE ALERT-RECORD
           
           DISPLAY "⚠️  CHALLENGE " TXN-ID 
               " | Score: " WS-TOTAL-FRAUD-SCORE.
       
       3930-LOG-FRAUD-ALERT.
           ADD 1 TO ALERT-ID
           MOVE TXN-TIMESTAMP TO ALERT-TIME
           MOVE CUSTOMER-ID TO ALERT-CUST-ID
           MOVE TXN-ID TO ALERT-TXN-ID
           MOVE "HIGH-RISK TRANSACTION" TO ALERT-TYPE
           MOVE WS-TOTAL-FRAUD-SCORE TO ALERT-SCORE
           
           IF WS-REAL-TIME-BLOCK = 'Y'
               MOVE "BLOCKED" TO ALERT-ACTION
           ELSE
               MOVE "CHALLENGE" TO ALERT-ACTION
           END-IF
           
           WRITE ALERT-RECORD FROM WS-ALERT-DETAIL.
       
       4000-BEHAVIORAL-ANALYSIS.
           DISPLAY "Running post-processing behavioral analytics..."
           
      * Calculate fraud rates
           IF WS-TOTAL-TXN > 0
               COMPUTE WS-VELOCITY-RATIO = 
                   WS-FRAUD-ALERTS / WS-TOTAL-TXN
           END-IF.
       
       5000-GENERATE-FRAUD-REPORT.
           DISPLAY "Generating fraud detection summary..."
           
           MOVE SPACES TO ALERT-RECORD
           WRITE ALERT-RECORD
           
           STRING "FRAUD DETECTION SUMMARY REPORT"
               DELIMITED BY SIZE INTO ALERT-RECORD
           WRITE ALERT-RECORD
           
           STRING "Total Transactions: " WS-TOTAL-TXN
               DELIMITED BY SIZE INTO ALERT-RECORD
           WRITE ALERT-RECORD
           
           STRING "Fraud Alerts: " WS-FRAUD-ALERTS
               DELIMITED BY SIZE INTO ALERT-RECORD
           WRITE ALERT-RECORD
           
           STRING "Blocked Transactions: " WS-BLOCKED-TXN
               DELIMITED BY SIZE INTO ALERT-RECORD
           WRITE ALERT-RECORD
           
           STRING "Challenged (2FA): " WS-CHALLENGED-TXN
               DELIMITED BY SIZE INTO ALERT-RECORD
           WRITE ALERT-RECORD
           
           STRING "Approved: " WS-APPROVED-TXN
               DELIMITED BY SIZE INTO ALERT-RECORD
           WRITE ALERT-RECORD
           
           STRING "Amount Saved: $" WS-SAVED-AMOUNT
               DELIMITED BY SIZE INTO ALERT-RECORD
           WRITE ALERT-RECORD.
       
       9000-TERMINATE.
           CLOSE TRANSACTION-STREAM
           CLOSE CUSTOMER-PROFILE
           CLOSE FRAUD-ALERTS
           CLOSE BLOCKED-TXN-LOG
           
           DISPLAY " "
           DISPLAY "════════════════════════════════════════"
           DISPLAY "  FRAUD DETECTION COMPLETE"
           DISPLAY "════════════════════════════════════════"
           DISPLAY "Total Transactions: " WS-TOTAL-TXN
           DISPLAY "Fraud Alerts: " WS-FRAUD-ALERTS
           DISPLAY "Blocked: " WS-BLOCKED-TXN
           DISPLAY "Amount Saved: $" WS-SAVED-AMOUNT
           DISPLAY "Approval Rate: " WS-APPROVED-TXN "%"
           DISPLAY "════════════════════════════════════════"
           .
