IDENTIFICATION DIVISION.
       PROGRAM-ID. AUTH_SECURITY.
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT USER-FILE ASSIGN TO 'USER.DAT'
               ORGANIZATION IS LINE SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD USER-FILE.
       01 USER-RECORD.
           05 USER-ID       PIC 9(5).
           05 USER-EMAIL    PIC X(50).
           05 USER-PASSWORD  PIC X(100).
           05 USER-ROLE     PIC X(10).
       
       WORKING-STORAGE SECTION.
       01 WS-EMAIL         PIC X(50).
       01 WS-PASSWORD      PIC X(100).
       01 WS-USER-ROLE     PIC X(10).
       01 WS-ACCESS-TOKEN  PIC X(256).
       01 WS-REFRESH-TOKEN  PIC X(256).
       01 WS-VALIDATION-ERROR PIC X(100).
       01 WS-EOF           PIC A VALUE 'N'.
       
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           DISPLAY 'Welcome to the Authentication System'.
           PERFORM USER-REGISTRATION.
           PERFORM USER-LOGIN.
           STOP RUN.
       
       USER-REGISTRATION.
           DISPLAY 'Enter Email: '.
           ACCEPT WS-EMAIL.
           DISPLAY 'Enter Password: '.
           ACCEPT WS-PASSWORD.
           IF FUNCTION LENGTH(WS-PASSWORD) < 8 THEN
               MOVE 'Password must be at least 8 characters.' TO WS-VALIDATION-ERROR.
               DISPLAY WS-VALIDATION-ERROR.
               EXIT.
           END-IF.
           MOVE 'user' TO WS-USER-ROLE.
           WRITE USER-RECORD FROM WS-EMAIL, WS-PASSWORD, WS-USER-ROLE.
           DISPLAY 'User registered successfully!'.
       
       USER-LOGIN.
           DISPLAY 'Enter Email: '.
           ACCEPT WS-EMAIL.
           DISPLAY 'Enter Password: '.
           ACCEPT WS-PASSWORD.
           OPEN INPUT USER-FILE.
           PERFORM UNTIL WS-EOF = 'Y'
               READ USER-FILE
                   AT END
                       MOVE 'Y' TO WS-EOF
                   NOT AT END
                       IF WS-EMAIL = USER-RECORD(2:50) AND WS-PASSWORD = USER-RECORD(51:100) THEN
                           MOVE 'Login successful!' TO WS-VALIDATION-ERROR.
                           DISPLAY WS-VALIDATION-ERROR.
                           MOVE 'generated_access_token' TO WS-ACCESS-TOKEN.
                           MOVE 'generated_refresh_token' TO WS-REFRESH-TOKEN.
                           DISPLAY 'Access Token: ' WS-ACCESS-TOKEN.
                           DISPLAY 'Refresh Token: ' WS-REFRESH-TOKEN.
                       END-IF.
               END-READ
           END-PERFORM.
           CLOSE USER-FILE.
           IF WS-EOF = 'Y' THEN
               DISPLAY 'Invalid email or password!'.
           END-IF.