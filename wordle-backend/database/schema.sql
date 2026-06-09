/*
 * Wordle Database Schema & Stored Procedures
 * 
 * Provides anonymous user tracking, game session management, and statistics.
 * Designed for Kull.GenericBackend.
 */

-- ==========================================================================================
-- Section 1: Tables
-- ==========================================================================================

/*
 * Stores anonymous user identities identified by a unique DeviceId.
 */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Users (
        UserId          INT IDENTITY(1,1) PRIMARY KEY,
        DeviceId        UNIQUEIDENTIFIER NOT NULL UNIQUE,
        CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        LastActiveAt    DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_Users_DeviceId ON dbo.Users(DeviceId);
END;
GO

/*
 * Contains the list of valid 5-letter words.
 */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WordDictionary' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.WordDictionary (
        WordId          INT IDENTITY(1,1) PRIMARY KEY,
        Word            CHAR(5) NOT NULL UNIQUE,
    );

    CREATE INDEX IX_WordDictionary_Word ON dbo.WordDictionary(Word);
END;
GO

/*
 * Records individual game sessions and links users to target words.
 */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Games' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Games (
        GameId          INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
        WordId          INT NOT NULL FOREIGN KEY REFERENCES dbo.WordDictionary(WordId),
        GameStatus      VARCHAR(10) NOT NULL DEFAULT 'playing',
        AttemptsUsed    TINYINT NOT NULL DEFAULT 0,
        StartedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CompletedAt     DATETIME2 NULL,
        
        CONSTRAINT CK_Games_GameStatus CHECK (GameStatus IN ('playing', 'won', 'lost')),
        CONSTRAINT CK_Games_AttemptsUsed CHECK (AttemptsUsed >= 0 AND AttemptsUsed <= 6)
    );

    CREATE INDEX IX_Games_UserId ON dbo.Games(UserId);
    CREATE INDEX IX_Games_Status ON dbo.Games(UserId, GameStatus);
END;
GO

/*
 * Stores every guess made within a game session.
 */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Attempts' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Attempts (
        AttemptId       INT IDENTITY(1,1) PRIMARY KEY,
        GameId          INT NOT NULL FOREIGN KEY REFERENCES dbo.Games(GameId),
        AttemptNumber   TINYINT NOT NULL,
        GuessWord       CHAR(5) NOT NULL,
        Result          VARCHAR(5) NOT NULL,
        CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        
        CONSTRAINT CK_Attempts_AttemptNumber CHECK (AttemptNumber >= 1 AND AttemptNumber <= 6),
        CONSTRAINT UQ_Attempts_GameAttempt UNIQUE (GameId, AttemptNumber)
    );

    CREATE INDEX IX_Attempts_GameId ON dbo.Attempts(GameId);
END;
GO


-- ==========================================================================================
-- Section 2: Stored Procedures (API Endpoints)
-- ==========================================================================================


/*
 * Retrieves an existing user or registers a new one based on the provided DeviceId.
 * Endpoint: POST /api/User/GetOrCreate
 */
CREATE OR ALTER PROCEDURE dbo.spUser_GetOrCreate
    @DeviceId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserId INT;
    
    -- Attempt to find existing user
    SELECT @UserId = UserId 
    FROM dbo.Users 
    WHERE DeviceId = @DeviceId;
    
    -- Register new user if not found
    IF @UserId IS NULL
    BEGIN
        INSERT INTO dbo.Users (DeviceId)
        VALUES (@DeviceId);
        
        SET @UserId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- Update activity timestamp for existing user
        UPDATE dbo.Users 
        SET LastActiveAt = GETUTCDATE() 
        WHERE UserId = @UserId;
    END
    
    SELECT 
        UserId,
        DeviceId,
        CreatedAt,
        LastActiveAt
    FROM dbo.Users 
    WHERE UserId = @UserId;
END;
GO


/*
 * Starts a new game or resumes an existing active game for the user.
 * Returns game state and previous attempts. TargetWord is hidden unless game over.
 * Endpoint: POST /api/Game/Start
 */
CREATE OR ALTER PROCEDURE dbo.spGame_Start
    @DeviceId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserId INT;
    DECLARE @GameId INT;
    DECLARE @WordId INT;
    DECLARE @TargetWord CHAR(5);
    DECLARE @GameStatus VARCHAR(10);
    
    -- 1. Resolve User Identity
    SELECT @UserId = UserId FROM dbo.Users WHERE DeviceId = @DeviceId;
    
    IF @UserId IS NULL
    BEGIN
        INSERT INTO dbo.Users (DeviceId) VALUES (@DeviceId);
        SET @UserId = SCOPE_IDENTITY();
    END

    -- 2. Check for an existing ACTIVE game
    SELECT TOP 1 
        @GameId = g.GameId, 
        @WordId = g.WordId,
        @GameStatus = g.GameStatus
    FROM dbo.Games g
    WHERE g.UserId = @UserId AND g.GameStatus = 'playing'
    ORDER BY g.StartedAt DESC;
    
    -- 3. Create a NEW game if no active one exists
    IF @GameId IS NULL
    BEGIN
        -- Select a random target word
        SELECT TOP 1 @WordId = WordId
        FROM dbo.WordDictionary
        ORDER BY NEWID();
        
        IF @WordId IS NULL
        BEGIN
            ;THROW 51000, 'Dictionary is empty. Cannot start game.', 1;
        END

        INSERT INTO dbo.Games (UserId, WordId, GameStatus, AttemptsUsed)
        VALUES (@UserId, @WordId, 'playing', 0);
        
        SET @GameId = SCOPE_IDENTITY();
        SET @GameStatus = 'playing';
    END
    ELSE
    BEGIN
        SELECT @WordId = WordId FROM dbo.Games WHERE GameId = @GameId;
    END
    
    -- 4. Retrieve Target Word (Hidden unless game over)
    SELECT @TargetWord = Word FROM dbo.WordDictionary WHERE WordId = @WordId;
    
    -- Return Single Result Set with Join (Game State + History)
    SELECT 
        g.GameId,
        g.GameStatus,
        g.AttemptsUsed,
        g.StartedAt,
        CASE 
            WHEN g.GameStatus IN ('won', 'lost') THEN @TargetWord 
            ELSE NULL 
        END AS TargetWord,
        a.AttemptNumber,
        a.GuessWord,
        a.Result
    FROM dbo.Games g
    LEFT JOIN dbo.Attempts a ON g.GameId = a.GameId
    WHERE g.GameId = @GameId
    ORDER BY a.AttemptNumber;
END;
GO


/*
 * Validates and processes a player's guess.
 * Calculates letter matches (Correct/Present/Absent) and updates game status.
 * Endpoint: POST /api/Game/SubmitGuess
 */
CREATE OR ALTER PROCEDURE dbo.spGame_SubmitGuess
    @DeviceId UNIQUEIDENTIFIER,
    @GameId INT,
    @GuessWord CHAR(5)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserId INT;
    DECLARE @ActualGameId INT;
    DECLARE @TargetWord CHAR(5);
    DECLARE @CurrentAttempts TINYINT;
    DECLARE @GameStatus VARCHAR(10);
    
    SET @GuessWord = UPPER(@GuessWord);
    
    -- 1. Validate User
    SELECT @UserId = UserId FROM dbo.Users WHERE DeviceId = @DeviceId;
    IF @UserId IS NULL
    BEGIN
        SELECT 
            CAST('error' AS VARCHAR(10)) AS Status, 
            CAST('User not found' AS VARCHAR(100)) AS Message, 
            CAST(NULL AS CHAR(5)) AS GuessWord, 
            CAST(NULL AS VARCHAR(5)) AS Result, 
            CAST(0 AS TINYINT) AS AttemptsUsed, 
            CAST('playing' AS VARCHAR(10)) AS GameStatus, 
            CAST(NULL AS CHAR(5)) AS TargetWord;
        RETURN;
    END

    -- 2. Validate Game Ownership and Status
    SELECT 
        @ActualGameId = g.GameId,
        @GameStatus = g.GameStatus,
        @CurrentAttempts = g.AttemptsUsed,
        @TargetWord = wd.Word
    FROM dbo.Games g
    JOIN dbo.WordDictionary wd ON g.WordId = wd.WordId
    WHERE g.GameId = @GameId AND g.UserId = @UserId;

    IF @ActualGameId IS NULL
    BEGIN
        SELECT 
            CAST('error' AS VARCHAR(10)) AS Status, 
            CAST('Game not found' AS VARCHAR(100)) AS Message, 
            CAST(NULL AS CHAR(5)) AS GuessWord, 
            CAST(NULL AS VARCHAR(5)) AS Result, 
            CAST(0 AS TINYINT) AS AttemptsUsed, 
            CAST('playing' AS VARCHAR(10)) AS GameStatus, 
            CAST(NULL AS CHAR(5)) AS TargetWord;
        RETURN;
    END

    IF @GameStatus <> 'playing'
    BEGIN
        SELECT 
            CAST('error' AS VARCHAR(10)) AS Status, 
            CAST('Game finished' AS VARCHAR(100)) AS Message, 
            CAST(NULL AS CHAR(5)) AS GuessWord, 
            CAST(NULL AS VARCHAR(5)) AS Result, 
            CAST(@CurrentAttempts AS TINYINT) AS AttemptsUsed, 
            CAST(@GameStatus AS VARCHAR(10)) AS GameStatus, 
            CAST(NULL AS CHAR(5)) AS TargetWord;
        RETURN;
    END
    
    IF @CurrentAttempts >= 6
    BEGIN
        SELECT 
            CAST('error' AS VARCHAR(10)) AS Status, 
            CAST('No attempts left' AS VARCHAR(100)) AS Message, 
            CAST(NULL AS CHAR(5)) AS GuessWord, 
            CAST(NULL AS VARCHAR(5)) AS Result, 
            CAST(@CurrentAttempts AS TINYINT) AS AttemptsUsed, 
            CAST(@GameStatus AS VARCHAR(10)) AS GameStatus, 
            CAST(NULL AS CHAR(5)) AS TargetWord;
        RETURN;
    END

    -- 3. Validate Dictionary Existence
    IF NOT EXISTS (SELECT 1 FROM dbo.WordDictionary WHERE Word = @GuessWord)
    BEGIN
        SELECT 
            CAST('error' AS VARCHAR(10)) AS Status, 
            CAST('Invalid word' AS VARCHAR(100)) AS Message, 
            CAST(NULL AS CHAR(5)) AS GuessWord, 
            CAST(NULL AS VARCHAR(5)) AS Result, 
            CAST(@CurrentAttempts AS TINYINT) AS AttemptsUsed, 
            CAST(@GameStatus AS VARCHAR(10)) AS GameStatus, 
            CAST(NULL AS CHAR(5)) AS TargetWord;
        RETURN;
    END

    -- 4. Calculate Match Logic (C=Correct, P=Present, ?=Absent)
    DECLARE @Result VARCHAR(5) = '';
    DECLARE @TargetRemaining VARCHAR(5) = @TargetWord;
    DECLARE @i INT = 1;
    DECLARE @MatchTable TABLE (Pos INT, Letter CHAR(1), Status CHAR(1));

    -- First pass: identify correct positions (Green)
    WHILE @i <= 5
    BEGIN
        DECLARE @GChar CHAR(1) = SUBSTRING(@GuessWord, @i, 1);
        DECLARE @TChar CHAR(1) = SUBSTRING(@TargetWord, @i, 1);
        
        IF @GChar = @TChar
        BEGIN
            INSERT INTO @MatchTable VALUES (@i, @GChar, 'C');
            SET @TargetRemaining = STUFF(@TargetRemaining, @i, 1, '_'); 
        END
        ELSE
        BEGIN
            INSERT INTO @MatchTable VALUES (@i, @GChar, '?');
        END
        SET @i = @i + 1;
    END
    
    -- Second pass: identify present letters (Yellow)
    SET @i = 1;
    WHILE @i <= 5
    BEGIN
        DECLARE @CurrentStatus CHAR(1);
        DECLARE @CurrentLetter CHAR(1);
        
        SELECT @CurrentStatus = Status, @CurrentLetter = Letter FROM @MatchTable WHERE Pos = @i;

        IF @CurrentStatus = '?'
        BEGIN
             DECLARE @CharIndex INT = CHARINDEX(@CurrentLetter, @TargetRemaining);
             IF @CharIndex > 0
             BEGIN
                 UPDATE @MatchTable SET Status = 'P' WHERE Pos = @i;
                 SET @TargetRemaining = STUFF(@TargetRemaining, @CharIndex, 1, '_');
             END
             ELSE
             BEGIN
                 UPDATE @MatchTable SET Status = 'A' WHERE Pos = @i;
             END
        END
        SET @i = @i + 1;
    END

    SELECT @Result = STRING_AGG(Status, '') WITHIN GROUP (ORDER BY Pos) FROM @MatchTable;

    -- 5. Update Game Status
    DECLARE @NewAttempts TINYINT = @CurrentAttempts + 1;
    DECLARE @NewStatus VARCHAR(10) = 'playing';

    IF @Result = 'CCCCC' SET @NewStatus = 'won';
    ELSE IF @NewAttempts >= 6 SET @NewStatus = 'lost';

    INSERT INTO dbo.Attempts (GameId, AttemptNumber, GuessWord, Result)
    VALUES (@GameId, @NewAttempts, @GuessWord, @Result);

    UPDATE dbo.Games
    SET AttemptsUsed = @NewAttempts, GameStatus = @NewStatus, CompletedAt = CASE WHEN @NewStatus <> 'playing' THEN GETUTCDATE() ELSE NULL END
    WHERE GameId = @GameId;

    -- 6. Return Result
    SELECT 
        CAST('success' AS VARCHAR(10)) AS Status,
        CAST(NULL AS VARCHAR(100)) AS Message,
        CAST(@GuessWord AS CHAR(5)) AS GuessWord,
        CAST(@Result AS VARCHAR(5)) AS Result,
        CAST(@NewAttempts AS TINYINT) AS AttemptsUsed,
        CAST(@NewStatus AS VARCHAR(10)) AS GameStatus,
        CAST(CASE WHEN @NewStatus IN ('won', 'lost') THEN @TargetWord ELSE NULL END AS CHAR(5)) AS TargetWord;
END;
GO


/*
 * Retrieves aggregate statistics for the user (Win rate, streaks, guess distribution).
 * Endpoint: GET /api/Stats/Get
 */
CREATE OR ALTER PROCEDURE dbo.spStats_Get
    @DeviceId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @UserId INT;
    SELECT @UserId = UserId FROM dbo.Users WHERE DeviceId = @DeviceId;

    -- Default Return Values
    DECLARE @GamesPlayed INT = 0;
    DECLARE @GamesWon INT = 0;
    DECLARE @WinRate FLOAT = 0.0;
    DECLARE @CurrentStreak INT = 0;
    DECLARE @MaxStreak INT = 0;
    DECLARE @Guess1 INT = 0;
    DECLARE @Guess2 INT = 0;
    DECLARE @Guess3 INT = 0;
    DECLARE @Guess4 INT = 0;
    DECLARE @Guess5 INT = 0;
    DECLARE @Guess6 INT = 0;

    IF @UserId IS NOT NULL
    BEGIN
        -- 1. General Stats
        SELECT 
            @GamesPlayed = COUNT(*),
            @GamesWon = SUM(CASE WHEN GameStatus = 'won' THEN 1 ELSE 0 END)
        FROM dbo.Games
        WHERE UserId = @UserId AND GameStatus IN ('won', 'lost');

        IF @GamesPlayed > 0
            SET @WinRate = CAST(@GamesWon AS FLOAT) * 100.0 / CAST(@GamesPlayed AS FLOAT);

        -- 2. Current Streak
        ;WITH OrderedGames AS (
            SELECT GameStatus, ROW_NUMBER() OVER(ORDER BY CompletedAt DESC) as rn
            FROM dbo.Games
            WHERE UserId = @UserId AND GameStatus IN ('won', 'lost')
        )
        SELECT @CurrentStreak = ISNULL(COUNT(*), 0)
        FROM OrderedGames
        WHERE GameStatus = 'won' 
        AND rn < ISNULL((SELECT TOP 1 rn FROM OrderedGames WHERE GameStatus = 'lost'), 999999);

        -- 3. Max Streak (Gaps and Islands)
        ;WITH GradedGames AS (
            SELECT 
                GameStatus,
                ROW_NUMBER() OVER(ORDER BY CompletedAt) - 
                ROW_NUMBER() OVER(PARTITION BY GameStatus ORDER BY CompletedAt) AS Grp
            FROM dbo.Games
            WHERE UserId = @UserId AND GameStatus IN ('won', 'lost')
        ),
        StreakLengths AS (
            SELECT COUNT(*) as Streak
            FROM GradedGames
            WHERE GameStatus = 'won'
            GROUP BY Grp
        )
        SELECT @MaxStreak = ISNULL(MAX(Streak), 0)
        FROM StreakLengths;

        -- 4. Guess Distribution (Pivot)
        SELECT 
            @Guess1 = SUM(CASE WHEN AttemptsUsed = 1 THEN 1 ELSE 0 END),
            @Guess2 = SUM(CASE WHEN AttemptsUsed = 2 THEN 1 ELSE 0 END),
            @Guess3 = SUM(CASE WHEN AttemptsUsed = 3 THEN 1 ELSE 0 END),
            @Guess4 = SUM(CASE WHEN AttemptsUsed = 4 THEN 1 ELSE 0 END),
            @Guess5 = SUM(CASE WHEN AttemptsUsed = 5 THEN 1 ELSE 0 END),
            @Guess6 = SUM(CASE WHEN AttemptsUsed = 6 THEN 1 ELSE 0 END)
        FROM dbo.Games
        WHERE UserId = @UserId AND GameStatus = 'won';
    END

    -- 5. Return Single Result Set
    SELECT 
        @GamesPlayed AS GamesPlayed,
        @GamesWon AS GamesWon,
        @WinRate AS WinRate,
        @CurrentStreak AS CurrentStreak,
        @MaxStreak AS MaxStreak,
        ISNULL(@Guess1, 0) AS Guess1,
        ISNULL(@Guess2, 0) AS Guess2,
        ISNULL(@Guess3, 0) AS Guess3,
        ISNULL(@Guess4, 0) AS Guess4,
        ISNULL(@Guess5, 0) AS Guess5,
        ISNULL(@Guess6, 0) AS Guess6;
END;
GO


/*
 * Retrieves global advanced analytics across all players.
 * Returns top starting words, average guesses, hardest words, and global distribution.
 * Endpoint: GET /api/Stats/Advanced
 */
CREATE OR ALTER PROCEDURE dbo.spStats_GetAdvanced
AS
BEGIN
    SET NOCOUNT ON;

    -- Global summary stats
    DECLARE @TotalGamesPlayed INT = 0;
    DECLARE @TotalGamesWon INT = 0;
    DECLARE @GlobalWinRate FLOAT = 0.0;
    DECLARE @AvgGuessesToWin DECIMAL(4,2) = 0;

    -- Global guess distribution
    DECLARE @GlobalGuess1 INT = 0;
    DECLARE @GlobalGuess2 INT = 0;
    DECLARE @GlobalGuess3 INT = 0;
    DECLARE @GlobalGuess4 INT = 0;
    DECLARE @GlobalGuess5 INT = 0;
    DECLARE @GlobalGuess6 INT = 0;

    -- Top 10 starting words
    DECLARE @TopWord1 VARCHAR(5) = NULL, @TopWordCount1 INT = 0;
    DECLARE @TopWord2 VARCHAR(5) = NULL, @TopWordCount2 INT = 0;
    DECLARE @TopWord3 VARCHAR(5) = NULL, @TopWordCount3 INT = 0;
    DECLARE @TopWord4 VARCHAR(5) = NULL, @TopWordCount4 INT = 0;
    DECLARE @TopWord5 VARCHAR(5) = NULL, @TopWordCount5 INT = 0;
    DECLARE @TopWord6 VARCHAR(5) = NULL, @TopWordCount6 INT = 0;
    DECLARE @TopWord7 VARCHAR(5) = NULL, @TopWordCount7 INT = 0;
    DECLARE @TopWord8 VARCHAR(5) = NULL, @TopWordCount8 INT = 0;
    DECLARE @TopWord9 VARCHAR(5) = NULL, @TopWordCount9 INT = 0;
    DECLARE @TopWord10 VARCHAR(5) = NULL, @TopWordCount10 INT = 0;

    -- Top 5 hardest words
    DECLARE @HardWord1 VARCHAR(5) = NULL, @HardWordWinRate1 DECIMAL(5,1) = 0, @HardWordGames1 INT = 0;
    DECLARE @HardWord2 VARCHAR(5) = NULL, @HardWordWinRate2 DECIMAL(5,1) = 0, @HardWordGames2 INT = 0;
    DECLARE @HardWord3 VARCHAR(5) = NULL, @HardWordWinRate3 DECIMAL(5,1) = 0, @HardWordGames3 INT = 0;
    DECLARE @HardWord4 VARCHAR(5) = NULL, @HardWordWinRate4 DECIMAL(5,1) = 0, @HardWordGames4 INT = 0;
    DECLARE @HardWord5 VARCHAR(5) = NULL, @HardWordWinRate5 DECIMAL(5,1) = 0, @HardWordGames5 INT = 0;

    -- 1. Global Summary
    SELECT
        @TotalGamesPlayed = COUNT(*),
        @TotalGamesWon = SUM(CASE WHEN GameStatus = 'won' THEN 1 ELSE 0 END)
    FROM dbo.Games
    WHERE GameStatus IN ('won', 'lost');

    IF @TotalGamesPlayed > 0
        SET @GlobalWinRate = CAST(@TotalGamesWon AS FLOAT) * 100.0 / CAST(@TotalGamesPlayed AS FLOAT);

    -- 2. Average Guesses to Win
    SELECT @AvgGuessesToWin = ISNULL(AVG(CAST(AttemptsUsed AS DECIMAL(4,2))), 0)
    FROM dbo.Games
    WHERE GameStatus = 'won';

    -- 3. Global Guess Distribution
    SELECT
        @GlobalGuess1 = SUM(CASE WHEN AttemptsUsed = 1 THEN 1 ELSE 0 END),
        @GlobalGuess2 = SUM(CASE WHEN AttemptsUsed = 2 THEN 1 ELSE 0 END),
        @GlobalGuess3 = SUM(CASE WHEN AttemptsUsed = 3 THEN 1 ELSE 0 END),
        @GlobalGuess4 = SUM(CASE WHEN AttemptsUsed = 4 THEN 1 ELSE 0 END),
        @GlobalGuess5 = SUM(CASE WHEN AttemptsUsed = 5 THEN 1 ELSE 0 END),
        @GlobalGuess6 = SUM(CASE WHEN AttemptsUsed = 6 THEN 1 ELSE 0 END)
    FROM dbo.Games
    WHERE GameStatus = 'won';

    -- 4. Top 10 Starting Words (AttemptNumber = 1)
    ;WITH TopWords AS (
        SELECT TOP 10
            UPPER(RTRIM(a.GuessWord)) AS Word,
            COUNT(*) AS Cnt,
            ROW_NUMBER() OVER(ORDER BY COUNT(*) DESC) AS Rn
        FROM dbo.Attempts a
        WHERE a.AttemptNumber = 1
        GROUP BY UPPER(RTRIM(a.GuessWord))
        ORDER BY COUNT(*) DESC
    )
    SELECT
        @TopWord1 = MAX(CASE WHEN Rn = 1 THEN Word END), @TopWordCount1 = MAX(CASE WHEN Rn = 1 THEN Cnt END),
        @TopWord2 = MAX(CASE WHEN Rn = 2 THEN Word END), @TopWordCount2 = MAX(CASE WHEN Rn = 2 THEN Cnt END),
        @TopWord3 = MAX(CASE WHEN Rn = 3 THEN Word END), @TopWordCount3 = MAX(CASE WHEN Rn = 3 THEN Cnt END),
        @TopWord4 = MAX(CASE WHEN Rn = 4 THEN Word END), @TopWordCount4 = MAX(CASE WHEN Rn = 4 THEN Cnt END),
        @TopWord5 = MAX(CASE WHEN Rn = 5 THEN Word END), @TopWordCount5 = MAX(CASE WHEN Rn = 5 THEN Cnt END),
        @TopWord6 = MAX(CASE WHEN Rn = 6 THEN Word END), @TopWordCount6 = MAX(CASE WHEN Rn = 6 THEN Cnt END),
        @TopWord7 = MAX(CASE WHEN Rn = 7 THEN Word END), @TopWordCount7 = MAX(CASE WHEN Rn = 7 THEN Cnt END),
        @TopWord8 = MAX(CASE WHEN Rn = 8 THEN Word END), @TopWordCount8 = MAX(CASE WHEN Rn = 8 THEN Cnt END),
        @TopWord9 = MAX(CASE WHEN Rn = 9 THEN Word END), @TopWordCount9 = MAX(CASE WHEN Rn = 9 THEN Cnt END),
        @TopWord10 = MAX(CASE WHEN Rn = 10 THEN Word END), @TopWordCount10 = MAX(CASE WHEN Rn = 10 THEN Cnt END)
    FROM TopWords;

    -- 5. Top 5 Hardest Words (lowest win rate, minimum 3 games played)
    ;WITH WordStats AS (
        SELECT TOP 5
            UPPER(RTRIM(wd.Word)) AS Word,
            COUNT(*) AS TotalGames,
            CAST(SUM(CASE WHEN g.GameStatus = 'won' THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(*) AS WinRate,
            ROW_NUMBER() OVER(ORDER BY CAST(SUM(CASE WHEN g.GameStatus = 'won' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) ASC) AS Rn
        FROM dbo.Games g
        JOIN dbo.WordDictionary wd ON g.WordId = wd.WordId
        WHERE g.GameStatus IN ('won', 'lost')
        GROUP BY wd.Word
        HAVING COUNT(*) >= 3
        ORDER BY CAST(SUM(CASE WHEN g.GameStatus = 'won' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) ASC
    )
    SELECT
        @HardWord1 = MAX(CASE WHEN Rn = 1 THEN Word END), @HardWordWinRate1 = MAX(CASE WHEN Rn = 1 THEN WinRate END), @HardWordGames1 = MAX(CASE WHEN Rn = 1 THEN TotalGames END),
        @HardWord2 = MAX(CASE WHEN Rn = 2 THEN Word END), @HardWordWinRate2 = MAX(CASE WHEN Rn = 2 THEN WinRate END), @HardWordGames2 = MAX(CASE WHEN Rn = 2 THEN TotalGames END),
        @HardWord3 = MAX(CASE WHEN Rn = 3 THEN Word END), @HardWordWinRate3 = MAX(CASE WHEN Rn = 3 THEN WinRate END), @HardWordGames3 = MAX(CASE WHEN Rn = 3 THEN TotalGames END),
        @HardWord4 = MAX(CASE WHEN Rn = 4 THEN Word END), @HardWordWinRate4 = MAX(CASE WHEN Rn = 4 THEN WinRate END), @HardWordGames4 = MAX(CASE WHEN Rn = 4 THEN TotalGames END),
        @HardWord5 = MAX(CASE WHEN Rn = 5 THEN Word END), @HardWordWinRate5 = MAX(CASE WHEN Rn = 5 THEN WinRate END), @HardWordGames5 = MAX(CASE WHEN Rn = 5 THEN TotalGames END)
    FROM WordStats;

    -- 6. Return Single Flattened Result Set
    SELECT
        @TotalGamesPlayed AS TotalGamesPlayed,
        @TotalGamesWon AS TotalGamesWon,
        @GlobalWinRate AS GlobalWinRate,
        @AvgGuessesToWin AS AvgGuessesToWin,
        ISNULL(@GlobalGuess1, 0) AS GlobalGuess1,
        ISNULL(@GlobalGuess2, 0) AS GlobalGuess2,
        ISNULL(@GlobalGuess3, 0) AS GlobalGuess3,
        ISNULL(@GlobalGuess4, 0) AS GlobalGuess4,
        ISNULL(@GlobalGuess5, 0) AS GlobalGuess5,
        ISNULL(@GlobalGuess6, 0) AS GlobalGuess6,
        @TopWord1 AS TopWord1, ISNULL(@TopWordCount1, 0) AS TopWordCount1,
        @TopWord2 AS TopWord2, ISNULL(@TopWordCount2, 0) AS TopWordCount2,
        @TopWord3 AS TopWord3, ISNULL(@TopWordCount3, 0) AS TopWordCount3,
        @TopWord4 AS TopWord4, ISNULL(@TopWordCount4, 0) AS TopWordCount4,
        @TopWord5 AS TopWord5, ISNULL(@TopWordCount5, 0) AS TopWordCount5,
        @TopWord6 AS TopWord6, ISNULL(@TopWordCount6, 0) AS TopWordCount6,
        @TopWord7 AS TopWord7, ISNULL(@TopWordCount7, 0) AS TopWordCount7,
        @TopWord8 AS TopWord8, ISNULL(@TopWordCount8, 0) AS TopWordCount8,
        @TopWord9 AS TopWord9, ISNULL(@TopWordCount9, 0) AS TopWordCount9,
        @TopWord10 AS TopWord10, ISNULL(@TopWordCount10, 0) AS TopWordCount10,
        @HardWord1 AS HardWord1, ISNULL(@HardWordWinRate1, 0) AS HardWordWinRate1, ISNULL(@HardWordGames1, 0) AS HardWordGames1,
        @HardWord2 AS HardWord2, ISNULL(@HardWordWinRate2, 0) AS HardWordWinRate2, ISNULL(@HardWordGames2, 0) AS HardWordGames2,
        @HardWord3 AS HardWord3, ISNULL(@HardWordWinRate3, 0) AS HardWordWinRate3, ISNULL(@HardWordGames3, 0) AS HardWordGames3,
        @HardWord4 AS HardWord4, ISNULL(@HardWordWinRate4, 0) AS HardWordWinRate4, ISNULL(@HardWordGames4, 0) AS HardWordGames4,
        @HardWord5 AS HardWord5, ISNULL(@HardWordWinRate5, 0) AS HardWordWinRate5, ISNULL(@HardWordGames5, 0) AS HardWordGames5;
END;
GO
