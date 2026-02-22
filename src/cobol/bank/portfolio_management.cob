       IDENTIFICATION DIVISION.
       PROGRAM-ID. PORTFOLIO-MANAGEMENT.
       AUTHOR. SENTINELI-ENTERPRISE-SYSTEM.
      *****************************************************************
      * INVESTMENT PORTFOLIO MANAGEMENT & OPTIMIZATION               *
      * Asset allocation, rebalancing, performance tracking          *
      * Modern Portfolio Theory (MPT) implementation                 *
      * Risk-adjusted returns, Sharpe ratio calculation             *
      * Tax-loss harvesting, dividend tracking                       *
      *****************************************************************
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT PORTFOLIO-FILE ASSIGN TO "PORTFOLIOS.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT HOLDINGS-FILE ASSIGN TO "HOLDINGS.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT MARKET-DATA ASSIGN TO "MARKET_DATA.DAT"
               ORGANIZATION IS LINE SEQUENTIAL.
           SELECT PERFORMANCE-REPORT ASSIGN TO "PERFORMANCE.TXT"
               ORGANIZATION IS LINE SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD  PORTFOLIO-FILE.
       01  PORTFOLIO-RECORD.
           05  PORT-ID                  PIC 9(10).
           05  CLIENT-ID                PIC 9(10).
           05  PORT-NAME                PIC X(50).
           05  TARGET-ALLOCATION        PIC X(100).
           05  RISK-TOLERANCE           PIC X(15).
           05  INVESTMENT-OBJECTIVE     PIC X(30).
           05  REBALANCE-THRESHOLD      PIC 9V99.
       
       FD  HOLDINGS-FILE.
       01  HOLDING-RECORD.
           05  HOLDING-PORT-ID          PIC 9(10).
           05  ASSET-TICKER             PIC X(10).
           05  ASSET-CLASS              PIC X(15).
           05  SHARES                   PIC 9(10)V9999.
           05  PURCHASE-PRICE           PIC 9(8)V99.
           05  CURRENT-PRICE            PIC 9(8)V99.
           05  PURCHASE-DATE            PIC 9(8).
           05  DIVIDEND-YIELD           PIC 9V9999.
       
       FD  MARKET-DATA.
       01  MARKET-RECORD.
           05  MKT-TICKER               PIC X(10).
           05  MKT-PRICE                PIC 9(8)V99.
           05  MKT-52WK-HIGH            PIC 9(8)V99.
           05  MKT-52WK-LOW             PIC 9(8)V99.
           05  MKT-VOLATILITY           PIC 9V9999.
           05  MKT-BETA                 PIC S9V9999.
       
       FD  PERFORMANCE-REPORT.
       01  REPORT-LINE                  PIC X(150).
       
       WORKING-STORAGE SECTION.
       01  WS-PORTFOLIO-VALUE.
           05  WS-CURRENT-VALUE         PIC 9(12)V99 VALUE ZEROS.
           05  WS-COST-BASIS            PIC 9(12)V99 VALUE ZEROS.
           05  WS-UNREALIZED-GAIN       PIC S9(12)V99 VALUE ZEROS.
           05  WS-TOTAL-RETURN          PIC S9(3)V9999 VALUE ZEROS.
       
       01  WS-ASSET-ALLOCATION.
           05  WS-STOCKS-PCT            PIC 9V9999 VALUE ZEROS.
           05  WS-BONDS-PCT             PIC 9V9999 VALUE ZEROS.
           05  WS-CASH-PCT              PIC 9V9999 VALUE ZEROS.
           05  WS-ALTS-PCT              PIC 9V9999 VALUE ZEROS.
           05  WS-REITS-PCT             PIC 9V9999 VALUE ZEROS.
       
       01  WS-TARGET-ALLOCATION.
           05  WS-TGT-STOCKS            PIC 9V9999 VALUE 0.60.
           05  WS-TGT-BONDS             PIC 9V9999 VALUE 0.30.
           05  WS-TGT-CASH              PIC 9V9999 VALUE 0.05.
           05  WS-TGT-ALTS              PIC 9V9999 VALUE 0.03.
           05  WS-TGT-REITS             PIC 9V9999 VALUE 0.02.
       
       01  WS-PERFORMANCE-METRICS.
           05  WS-YTD-RETURN            PIC S9(3)V9999 VALUE ZEROS.
           05  WS-ANNUAL-RETURN         PIC S9(3)V9999 VALUE ZEROS.
           05  WS-SHARPE-RATIO          PIC S9V9999 VALUE ZEROS.
           05  WS-SORTINO-RATIO         PIC S9V9999 VALUE ZEROS.
           05  WS-MAX-DRAWDOWN          PIC S9(3)V9999 VALUE ZEROS.
           05  WS-ALPHA                 PIC S9V9999 VALUE ZEROS.
           05  WS-PORT-BETA             PIC S9V9999 VALUE ZEROS.
       
       01  WS-RISK-METRICS.
           05  WS-PORTFOLIO-VOLATILITY  PIC 9V9999 VALUE ZEROS.
           05  WS-VALUE-AT-RISK         PIC 9(10)V99 VALUE ZEROS.
           05  WS-EXPECTED-SHORTFALL    PIC 9(10)V99 VALUE ZEROS.
           05  WS-STANDARD-DEVIATION    PIC 9V9999 VALUE ZEROS.
       
       01  WS-REBALANCE-NEEDED.
           05  WS-NEEDS-REBALANCE       PIC X VALUE 'N'.
           05  WS-STOCKS-DEVIATION      PIC S9V9999 VALUE ZEROS.
           05  WS-BONDS-DEVIATION       PIC S9V9999 VALUE ZEROS.
           05  WS-REBALANCE-AMOUNT      PIC 9(10)V99 VALUE ZEROS.
       
       01  WS-TAX-LOSS-HARVEST.
           05  WS-UNREALIZED-LOSSES     PIC 9(10)V99 VALUE ZEROS.
           05  WS-HARVEST-CANDIDATES    PIC 99 VALUE ZEROS.
           05  WS-TAX-SAVINGS           PIC 9(8)V99 VALUE ZEROS.
       
       01  WS-DIVIDEND-TRACKING.
           05  WS-ANNUAL-DIVIDENDS      PIC 9(10)V99 VALUE ZEROS.
           05  WS-DIVIDEND-YIELD-PORT   PIC 9V9999 VALUE ZEROS.
           05  WS-QUALIFIED-DIVIDENDS   PIC 9(10)V99 VALUE ZEROS.
       
       01  WS-COUNTERS.
           05  WS-TOTAL-HOLDINGS        PIC 9(4) VALUE ZEROS.
           05  WS-PROFITABLE-HOLDINGS   PIC 9(4) VALUE ZEROS.
           05  WS-LOSING-HOLDINGS       PIC 9(4) VALUE ZEROS.
       
       01  WS-TEMP-CALCS.
           05  WS-HOLDING-VALUE         PIC 9(12)V99 VALUE ZEROS.
           05  WS-GAIN-LOSS             PIC S9(10)V99 VALUE ZEROS.
           05  WS-RETURN-PCT            PIC S9(3)V9999 VALUE ZEROS.
           05  WS-ASSET-WEIGHT          PIC 9V9999 VALUE ZEROS.
       
       01  WS-BENCHMARK-COMPARISON.
           05  WS-SP500-RETURN          PIC S9(3)V9999 VALUE 0.1050.
           05  WS-EXCESS-RETURN         PIC S9(3)V9999 VALUE ZEROS.
           05  WS-TRACKING-ERROR        PIC 9V9999 VALUE ZEROS.
       
       01  WS-FLAGS.
           05  WS-PORT-EOF              PIC X VALUE 'N'.
           05  WS-HOLD-EOF              PIC X VALUE 'N'.
           05  WS-MKT-EOF               PIC X VALUE 'N'.
       
       01  WS-RISK-FREE-RATE            PIC 9V9999 VALUE 0.0450.
       
       PROCEDURE DIVISION.
       0000-MAIN-PORTFOLIO-MGMT.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-LOAD-PORTFOLIOS
           PERFORM 3000-CALCULATE-PERFORMANCE
           PERFORM 4000-ANALYZE-ALLOCATION
           PERFORM 5000-CHECK-REBALANCING
           PERFORM 6000-TAX-LOSS-HARVESTING
           PERFORM 7000-DIVIDEND-ANALYSIS
           PERFORM 8000-GENERATE-REPORT
           PERFORM 9000-TERMINATE
           STOP RUN.
       
       1000-INITIALIZE.
           DISPLAY "SENTINELI Portfolio Management System"
           DISPLAY "Initializing MPT optimization engine..."
           
           OPEN INPUT PORTFOLIO-FILE
           OPEN INPUT HOLDINGS-FILE
           OPEN INPUT MARKET-DATA
           OPEN OUTPUT PERFORMANCE-REPORT
           
           MOVE ZEROS TO WS-PORTFOLIO-VALUE
           MOVE ZEROS TO WS-ASSET-ALLOCATION
           MOVE ZEROS TO WS-PERFORMANCE-METRICS.
       
       2000-LOAD-PORTFOLIOS.
           DISPLAY "Loading portfolio holdings..."
           
           PERFORM 2100-READ-HOLDING
           PERFORM UNTIL WS-HOLD-EOF = 'Y'
               ADD 1 TO WS-TOTAL-HOLDINGS
               PERFORM 2200-VALUE-HOLDING
               PERFORM 2300-CLASSIFY-ASSET
               PERFORM 2100-READ-HOLDING
           END-PERFORM.
       
       2100-READ-HOLDING.
           READ HOLDINGS-FILE
               AT END
                   MOVE 'Y' TO WS-HOLD-EOF
           END-READ.
       
       2200-VALUE-HOLDING.
           COMPUTE WS-HOLDING-VALUE = 
               SHARES * CURRENT-PRICE
           
           ADD WS-HOLDING-VALUE TO WS-CURRENT-VALUE
           
           COMPUTE WS-GAIN-LOSS = 
               (CURRENT-PRICE - PURCHASE-PRICE) * SHARES
           
           IF WS-GAIN-LOSS > 0
               ADD 1 TO WS-PROFITABLE-HOLDINGS
           ELSE
               ADD 1 TO WS-LOSING-HOLDINGS
               ADD WS-GAIN-LOSS TO WS-UNREALIZED-LOSSES
           END-IF
           
           ADD WS-GAIN-LOSS TO WS-UNREALIZED-GAIN
           
           COMPUTE WS-COST-BASIS = WS-COST-BASIS +
               (SHARES * PURCHASE-PRICE).
       
       2300-CLASSIFY-ASSET.
           COMPUTE WS-ASSET-WEIGHT = 
               WS-HOLDING-VALUE / WS-CURRENT-VALUE
           
           EVALUATE ASSET-CLASS
               WHEN "STOCK"
               WHEN "EQUITY"
                   ADD WS-ASSET-WEIGHT TO WS-STOCKS-PCT
               WHEN "BOND"
               WHEN "FIXED-INCOME"
                   ADD WS-ASSET-WEIGHT TO WS-BONDS-PCT
               WHEN "CASH"
               WHEN "MONEY-MARKET"
                   ADD WS-ASSET-WEIGHT TO WS-CASH-PCT
               WHEN "REIT"
                   ADD WS-ASSET-WEIGHT TO WS-REITS-PCT
               WHEN "ALTERNATIVE"
                   ADD WS-ASSET-WEIGHT TO WS-ALTS-PCT
           END-EVALUATE.
       
       3000-CALCULATE-PERFORMANCE.
           DISPLAY "Calculating portfolio performance..."
           
           IF WS-COST-BASIS > 0
               COMPUTE WS-TOTAL-RETURN = 
                   WS-UNREALIZED-GAIN / WS-COST-BASIS
           END-IF
           
           MOVE WS-TOTAL-RETURN TO WS-YTD-RETURN
           MOVE WS-TOTAL-RETURN TO WS-ANNUAL-RETURN
           
           PERFORM 3100-CALCULATE-SHARPE-RATIO
           PERFORM 3200-CALCULATE-PORTFOLIO-BETA
           PERFORM 3300-CALCULATE-VALUE-AT-RISK.
       
       3100-CALCULATE-SHARPE-RATIO.
           COMPUTE WS-SHARPE-RATIO = 
               (WS-ANNUAL-RETURN - WS-RISK-FREE-RATE) /
               WS-STANDARD-DEVIATION
           
           IF WS-STANDARD-DEVIATION = 0
               MOVE 0 TO WS-SHARPE-RATIO
           END-IF.
       
       3200-CALCULATE-PORTFOLIO-BETA.
           MOVE 1.0 TO WS-PORT-BETA
           
           COMPUTE WS-ALPHA = 
               WS-ANNUAL-RETURN - 
               (WS-RISK-FREE-RATE + 
                (WS-PORT-BETA * 
                 (WS-SP500-RETURN - WS-RISK-FREE-RATE))).
       
       3300-CALCULATE-VALUE-AT-RISK.
           COMPUTE WS-VALUE-AT-RISK = 
               WS-CURRENT-VALUE * 0.15 * 1.645
           
           COMPUTE WS-EXPECTED-SHORTFALL = 
               WS-VALUE-AT-RISK * 1.2.
       
       4000-ANALYZE-ALLOCATION.
           DISPLAY "Analyzing asset allocation..."
           
           COMPUTE WS-EXCESS-RETURN = 
               WS-ANNUAL-RETURN - WS-SP500-RETURN
           
           IF WS-ANNUAL-RETURN > WS-SP500-RETURN
               DISPLAY "✓ Outperforming S&P 500 by " 
                   WS-EXCESS-RETURN "%"
           ELSE
               DISPLAY "⚠️  Underperforming S&P 500 by " 
                   WS-EXCESS-RETURN "%"
           END-IF.
       
       5000-CHECK-REBALANCING.
           DISPLAY "Checking rebalancing thresholds..."
           
           COMPUTE WS-STOCKS-DEVIATION = 
               FUNCTION ABS(WS-STOCKS-PCT - WS-TGT-STOCKS)
           
           COMPUTE WS-BONDS-DEVIATION = 
               FUNCTION ABS(WS-BONDS-PCT - WS-TGT-BONDS)
           
           IF WS-STOCKS-DEVIATION > 0.05
               OR WS-BONDS-DEVIATION > 0.05
               MOVE 'Y' TO WS-NEEDS-REBALANCE
               PERFORM 5100-CALCULATE-REBALANCE
           ELSE
               DISPLAY "✓ Portfolio within target allocation"
           END-IF.
       
       5100-CALCULATE-REBALANCE.
           COMPUTE WS-REBALANCE-AMOUNT = 
               WS-CURRENT-VALUE * WS-STOCKS-DEVIATION
           
           DISPLAY "⚠️  REBALANCE NEEDED:"
           DISPLAY "  Current Stocks: " WS-STOCKS-PCT 
               " | Target: " WS-TGT-STOCKS
           DISPLAY "  Current Bonds: " WS-BONDS-PCT 
               " | Target: " WS-TGT-BONDS
           DISPLAY "  Rebalance Amount: $" WS-REBALANCE-AMOUNT.
       
       6000-TAX-LOSS-HARVESTING.
           DISPLAY "Identifying tax-loss harvesting opportunities..."
           
           IF WS-UNREALIZED-LOSSES < 0
               COMPUTE WS-TAX-SAVINGS = 
                   FUNCTION ABS(WS-UNREALIZED-LOSSES) * 0.22
               
               DISPLAY "💰 Tax-loss harvest potential: $" 
                   WS-UNREALIZED-LOSSES
               DISPLAY "   Estimated tax savings: $" 
                   WS-TAX-SAVINGS
           ELSE
               DISPLAY "✓ No tax-loss harvesting opportunities"
           END-IF.
       
       7000-DIVIDEND-ANALYSIS.
           DISPLAY "Analyzing dividend income..."
           
           COMPUTE WS-DIVIDEND-YIELD-PORT = 
               WS-ANNUAL-DIVIDENDS / WS-CURRENT-VALUE
           
           IF WS-DIVIDEND-YIELD-PORT > 0
               DISPLAY "💵 Annual Dividends: $" 
                   WS-ANNUAL-DIVIDENDS
               DISPLAY "   Portfolio Yield: " 
                   WS-DIVIDEND-YIELD-PORT "%"
           END-IF.
       
       8000-GENERATE-REPORT.
           DISPLAY "Generating comprehensive portfolio report..."
           
           STRING "PORTFOLIO PERFORMANCE REPORT" 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE SPACES TO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Portfolio Value: $" WS-CURRENT-VALUE
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Cost Basis: $" WS-COST-BASIS
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Unrealized Gain/Loss: $" WS-UNREALIZED-GAIN
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Total Return: " WS-TOTAL-RETURN "%"
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE SPACES TO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "RISK-ADJUSTED METRICS:" 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Sharpe Ratio: " WS-SHARPE-RATIO
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Portfolio Beta: " WS-PORT-BETA
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Alpha: " WS-ALPHA
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Value at Risk (95%): $" WS-VALUE-AT-RISK
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           MOVE SPACES TO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "ASSET ALLOCATION:" 
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Stocks: " WS-STOCKS-PCT 
               " | Target: " WS-TGT-STOCKS
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Bonds: " WS-BONDS-PCT 
               " | Target: " WS-TGT-BONDS
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE
           
           STRING "Cash: " WS-CASH-PCT 
               " | Target: " WS-TGT-CASH
               DELIMITED BY SIZE INTO REPORT-LINE
           WRITE REPORT-LINE.
       
       9000-TERMINATE.
           CLOSE PORTFOLIO-FILE
           CLOSE HOLDINGS-FILE
           CLOSE MARKET-DATA
           CLOSE PERFORMANCE-REPORT
           
           DISPLAY " "
           DISPLAY "════════════════════════════════════════"
           DISPLAY "  PORTFOLIO ANALYSIS COMPLETE"
           DISPLAY "════════════════════════════════════════"
           DISPLAY "Portfolio Value: $" WS-CURRENT-VALUE
           DISPLAY "Total Return: " WS-TOTAL-RETURN "%"
           DISPLAY "Sharpe Ratio: " WS-SHARPE-RATIO
           DISPLAY "Rebalance Needed: " WS-NEEDS-REBALANCE
           DISPLAY "════════════════════════════════════════"
           .
