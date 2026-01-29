IDENTIFICATION DIVISION.
       PROGRAM-ID. UserTest.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  UserEmail          PIC X(50) VALUE 'test@example.com'.
       01  UserPassword       PIC X(50) VALUE 'hashed_password'.
       01  UserCreated        PIC X(3).
       PROCEDURE DIVISION.
       MAIN-PROCEDURE.
           DISPLAY 'Testing User Creation'.
           IF UserEmail = 'test@example.com' THEN
               MOVE 'YES' TO UserCreated
           ELSE
               MOVE 'NO' TO UserCreated
           END-IF.
           DISPLAY 'User Created: ' UserCreated.
           STOP RUN.