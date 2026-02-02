-- ============================================
-- WORDLE DATABASE SCHEMA & STORED PROCEDURES
-- ============================================
-- Version: 1.0
-- Date: 2026-02-02
-- For use with Kull.GenericBackend (.NET)
-- 
-- IMPORTANT: This file contains NO sensitive data.
-- Connection strings and credentials should be 
-- configured via environment variables or secrets.
-- ============================================

-- ============================================
-- SECTION 1: TABLES
-- ============================================

-- Users table: Stores player information
-- Uses anonymous users identified by a GUID (device ID)
-- Can be extended later for authenticated users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Users (
        UserId          INT IDENTITY(1,1) PRIMARY KEY,
        DeviceId        UNIQUEIDENTIFIER NOT NULL UNIQUE,  -- Anonymous user identifier
        DisplayName     NVARCHAR(50) NULL,                 -- Optional display name
        CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        LastActiveAt    DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_Users_DeviceId ON dbo.Users(DeviceId);
END;
GO

-- WordDictionary table: Stores valid 5-letter words
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WordDictionary' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.WordDictionary (
        WordId          INT IDENTITY(1,1) PRIMARY KEY,
        Word            CHAR(5) NOT NULL UNIQUE,           -- 5-letter word (uppercase)
        IsAnswer        BIT NOT NULL DEFAULT 1,            -- Can this word be the daily answer?
        IsValidGuess    BIT NOT NULL DEFAULT 1,            -- Is this word a valid guess?
        UsedAsAnswer    BIT NOT NULL DEFAULT 0,            -- Has this been used as an answer already?
        LastUsedAt      DATE NULL                          -- When was it last used as an answer?
    );

    CREATE INDEX IX_WordDictionary_Word ON dbo.WordDictionary(Word);
    CREATE INDEX IX_WordDictionary_IsAnswer ON dbo.WordDictionary(IsAnswer, UsedAsAnswer);
END;
GO

-- DailyWord table: Tracks the word of the day
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DailyWord' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.DailyWord (
        DailyWordId     INT IDENTITY(1,1) PRIMARY KEY,
        GameDate        DATE NOT NULL UNIQUE,              -- The date for this word
        WordId          INT NOT NULL FOREIGN KEY REFERENCES dbo.WordDictionary(WordId),
        CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_DailyWord_GameDate ON dbo.DailyWord(GameDate);
END;
GO

-- Games table: Stores individual game sessions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Games' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Games (
        GameId          INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserId),
        DailyWordId     INT NOT NULL FOREIGN KEY REFERENCES dbo.DailyWord(DailyWordId),
        GameStatus      VARCHAR(10) NOT NULL DEFAULT 'playing',  -- 'playing', 'won', 'lost'
        AttemptsUsed    TINYINT NOT NULL DEFAULT 0,
        StartedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CompletedAt     DATETIME2 NULL,
        
        CONSTRAINT CK_Games_GameStatus CHECK (GameStatus IN ('playing', 'won', 'lost')),
        CONSTRAINT CK_Games_AttemptsUsed CHECK (AttemptsUsed >= 0 AND AttemptsUsed <= 6),
        CONSTRAINT UQ_Games_UserDaily UNIQUE (UserId, DailyWordId)  -- One game per user per day
    );

    CREATE INDEX IX_Games_UserId ON dbo.Games(UserId);
    CREATE INDEX IX_Games_DailyWordId ON dbo.Games(DailyWordId);
    CREATE INDEX IX_Games_UserStatus ON dbo.Games(UserId, GameStatus);
END;
GO

-- Attempts table: Stores each guess in a game
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Attempts' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Attempts (
        AttemptId       INT IDENTITY(1,1) PRIMARY KEY,
        GameId          INT NOT NULL FOREIGN KEY REFERENCES dbo.Games(GameId),
        AttemptNumber   TINYINT NOT NULL,                  -- 1-6
        GuessWord       CHAR(5) NOT NULL,                  -- The guessed word (uppercase)
        Result          VARCHAR(5) NOT NULL,               -- e.g., 'CPPAA' (C=Correct, P=Present, A=Absent)
        CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        
        CONSTRAINT CK_Attempts_AttemptNumber CHECK (AttemptNumber >= 1 AND AttemptNumber <= 6),
        CONSTRAINT UQ_Attempts_GameAttempt UNIQUE (GameId, AttemptNumber)
    );

    CREATE INDEX IX_Attempts_GameId ON dbo.Attempts(GameId);
END;
GO


-- ============================================
-- SECTION 2: STORED PROCEDURES (API ENDPOINTS)
-- ============================================

-- ============================================
-- 2.1 USER MANAGEMENT
-- ============================================

-- Get or create user by device ID
-- Endpoint: POST /api/User/GetOrCreate
CREATE OR ALTER PROCEDURE dbo.spUser_GetOrCreate
    @DeviceId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserId INT;
    
    -- Try to get existing user
    SELECT @UserId = UserId 
    FROM dbo.Users 
    WHERE DeviceId = @DeviceId;
    
    -- If not exists, create new user
    IF @UserId IS NULL
    BEGIN
        INSERT INTO dbo.Users (DeviceId)
        VALUES (@DeviceId);
        
        SET @UserId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- Update last active timestamp
        UPDATE dbo.Users 
        SET LastActiveAt = GETUTCDATE() 
        WHERE UserId = @UserId;
    END
    
    -- Return user data
    SELECT 
        UserId,
        DeviceId,
        DisplayName,
        CreatedAt,
        LastActiveAt
    FROM dbo.Users 
    WHERE UserId = @UserId;
END;
GO

-- Update user display name
-- Endpoint: PUT /api/User/UpdateDisplayName
CREATE OR ALTER PROCEDURE dbo.spUser_UpdateDisplayName
    @DeviceId UNIQUEIDENTIFIER,
    @DisplayName NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.Users 
    SET DisplayName = @DisplayName,
        LastActiveAt = GETUTCDATE()
    WHERE DeviceId = @DeviceId;
    
    SELECT 
        UserId,
        DeviceId,
        DisplayName
    FROM dbo.Users 
    WHERE DeviceId = @DeviceId;
END;
GO


-- ============================================
-- 2.2 GAME STATE MANAGEMENT
-- ============================================

-- Get today's game for a user (or create if doesn't exist)
-- Endpoint: POST /api/Game/GetTodaysGame
CREATE OR ALTER PROCEDURE dbo.spGame_GetTodaysGame
    @DeviceId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserId INT;
    DECLARE @GameId INT;
    DECLARE @Today DATE = CAST(GETUTCDATE() AS DATE);
    DECLARE @DailyWordId INT;
    DECLARE @TargetWord CHAR(5);
    
    -- Get or create user
    SELECT @UserId = UserId FROM dbo.Users WHERE DeviceId = @DeviceId;
    
    IF @UserId IS NULL
    BEGIN
        INSERT INTO dbo.Users (DeviceId) VALUES (@DeviceId);
        SET @UserId = SCOPE_IDENTITY();
    END
    
    -- Get today's daily word
    SELECT @DailyWordId = DailyWordId 
    FROM dbo.DailyWord 
    WHERE GameDate = @Today;
    
    -- If no word for today, select one
    IF @DailyWordId IS NULL
    BEGIN
        DECLARE @WordId INT;
        
        -- Select a random word that hasn't been used
        SELECT TOP 1 @WordId = WordId
        FROM dbo.WordDictionary
        WHERE 1 = IsAnswer AND 0 = UsedAsAnswer
        ORDER BY NEWID();
        
        -- If all words used, reset and pick any
        IF @WordId IS NULL
        BEGIN
            UPDATE dbo.WordDictionary SET UsedAsAnswer = 0 WHERE 1 = IsAnswer;
            
            SELECT TOP 1 @WordId = WordId
            FROM dbo.WordDictionary
            WHERE 1 = IsAnswer
            ORDER BY NEWID();
        END
        
        -- Create daily word entry
        INSERT INTO dbo.DailyWord (GameDate, WordId)
        VALUES (@Today, @WordId);
        
        SET @DailyWordId = SCOPE_IDENTITY();
        
        -- Mark word as used
        UPDATE dbo.WordDictionary 
        SET UsedAsAnswer = 1, LastUsedAt = @Today 
        WHERE WordId = @WordId;
    END
    
    -- Get target word
    SELECT @TargetWord = wd.Word
    FROM dbo.DailyWord dw
    INNER JOIN dbo.WordDictionary wd ON dw.WordId = wd.WordId
    WHERE dw.DailyWordId = @DailyWordId;
    
    -- Get or create game for this user and day
    SELECT @GameId = GameId 
    FROM dbo.Games 
    WHERE UserId = @UserId AND DailyWordId = @DailyWordId;
    
    IF @GameId IS NULL
    BEGIN
        INSERT INTO dbo.Games (UserId, DailyWordId)
        VALUES (@UserId, @DailyWordId);
        
        SET @GameId = SCOPE_IDENTITY();
    END
    
    -- Return game state
    SELECT 
        g.GameId,
        g.GameStatus,
        g.AttemptsUsed,
        g.StartedAt,
        g.CompletedAt,
        -- Only reveal word if game is over
        CASE WHEN g.GameStatus IN ('won', 'lost') THEN @TargetWord ELSE NULL END AS TargetWord
    FROM dbo.Games g
    WHERE g.GameId = @GameId;
    
    -- Return attempts for this game
    SELECT 
        AttemptNumber,
        GuessWord,
        Result
    FROM dbo.Attempts
    WHERE GameId = @GameId
    ORDER BY AttemptNumber;
END;
GO


-- Submit a guess for the current game
-- Endpoint: POST /api/Game/SubmitGuess
CREATE OR ALTER PROCEDURE dbo.spGame_SubmitGuess
    @DeviceId UNIQUEIDENTIFIER,
    @GuessWord CHAR(5)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserId INT;
    DECLARE @GameId INT;
    DECLARE @Today DATE = CAST(GETUTCDATE() AS DATE);
    DECLARE @DailyWordId INT;
    DECLARE @TargetWord CHAR(5);
    DECLARE @CurrentAttempts TINYINT;
    DECLARE @GameStatus VARCHAR(10);
    DECLARE @Result VARCHAR(5) = '';
    DECLARE @i INT = 1;
    
    -- Normalize guess to uppercase
    SET @GuessWord = UPPER(@GuessWord);
    
    -- Validate word exists in dictionary
    IF NOT EXISTS (SELECT 1 FROM dbo.WordDictionary WHERE Word = @GuessWord AND 1 = IsValidGuess)
    BEGIN
        SELECT 
            'error' AS Status,
            'Word not in dictionary' AS Message;
        RETURN;
    END
    
    -- Get user
    SELECT @UserId = UserId FROM dbo.Users WHERE DeviceId = @DeviceId;
    
    IF @UserId IS NULL
    BEGIN
        SELECT 'error' AS Status, 'User not found' AS Message;
        RETURN;
    END
    
    -- Get today's daily word
    SELECT @DailyWordId = dw.DailyWordId, @TargetWord = wd.Word
    FROM dbo.DailyWord dw
    INNER JOIN dbo.WordDictionary wd ON dw.WordId = wd.WordId
    WHERE dw.GameDate = @Today;
    
    IF @DailyWordId IS NULL
    BEGIN
        SELECT 'error' AS Status, 'No word for today' AS Message;
        RETURN;
    END
    
    -- Get user's game
    SELECT @GameId = GameId, @CurrentAttempts = AttemptsUsed, @GameStatus = GameStatus
    FROM dbo.Games
    WHERE UserId = @UserId AND DailyWordId = @DailyWordId;
    
    IF @GameId IS NULL
    BEGIN
        SELECT 'error' AS Status, 'Game not found' AS Message;
        RETURN;
    END
    
    IF @GameStatus <> 'playing'
    BEGIN
        SELECT 'error' AS Status, 'Game already finished' AS Message;
        RETURN;
    END
    
    IF @CurrentAttempts >= 6
    BEGIN
        SELECT 'error' AS Status, 'No attempts remaining' AS Message;
        RETURN;
    END
    
    -- Calculate result (C=Correct, P=Present, A=Absent)
    -- First pass: mark correct positions
    DECLARE @TargetRemaining VARCHAR(5) = @TargetWord;
    DECLARE @GuessCheck VARCHAR(5) = @GuessWord;
    DECLARE @ResultArray CHAR(1);
    
    -- Initialize result with placeholders
    DECLARE @TempResult TABLE (Pos INT, Letter CHAR(1), Status CHAR(1));
    
    -- Check each position
    WHILE @i <= 5
    BEGIN
        DECLARE @GuessLetter CHAR(1) = SUBSTRING(@GuessWord, @i, 1);
        DECLARE @TargetLetter CHAR(1) = SUBSTRING(@TargetWord, @i, 1);
        
        IF @GuessLetter = @TargetLetter
        BEGIN
            INSERT INTO @TempResult VALUES (@i, @GuessLetter, 'C');
            -- Remove this letter from target remaining
            SET @TargetRemaining = STUFF(@TargetRemaining, CHARINDEX(@GuessLetter, @TargetRemaining), 1, '_');
        END
        ELSE
        BEGIN
            INSERT INTO @TempResult VALUES (@i, @GuessLetter, '?'); -- Placeholder
        END
        
        SET @i = @i + 1;
    END
    
    -- Second pass: check for present letters
    UPDATE tr
    SET Status = CASE 
        WHEN CHARINDEX(tr.Letter, @TargetRemaining) > 0 THEN 'P'
        ELSE 'A'
    END,
    @TargetRemaining = CASE 
        WHEN CHARINDEX(tr.Letter, @TargetRemaining) > 0 
        THEN STUFF(@TargetRemaining, CHARINDEX(tr.Letter, @TargetRemaining), 1, '_')
        ELSE @TargetRemaining
    END
    FROM @TempResult tr
    WHERE tr.Status = '?';
    
    -- Build result string
    SELECT @Result = @Result + Status 
    FROM @TempResult 
    ORDER BY Pos;
    
    -- Insert attempt
    INSERT INTO dbo.Attempts (GameId, AttemptNumber, GuessWord, Result)
    VALUES (@GameId, @CurrentAttempts + 1, @GuessWord, @Result);
    
    -- Update game
    DECLARE @NewAttempts TINYINT = @CurrentAttempts + 1;
    DECLARE @NewStatus VARCHAR(10) = 'playing';
    
    IF @Result = 'CCCCC'
        SET @NewStatus = 'won';
    ELSE IF @NewAttempts >= 6
        SET @NewStatus = 'lost';
    
    UPDATE dbo.Games
    SET AttemptsUsed = @NewAttempts,
        GameStatus = @NewStatus,
        CompletedAt = CASE WHEN @NewStatus <> 'playing' THEN GETUTCDATE() ELSE NULL END
    WHERE GameId = @GameId;
    
    -- Return result
    SELECT 
        'success' AS Status,
        @GuessWord AS GuessWord,
        @Result AS Result,
        @NewAttempts AS AttemptsUsed,
        @NewStatus AS GameStatus,
        CASE WHEN @NewStatus IN ('won', 'lost') THEN @TargetWord ELSE NULL END AS TargetWord;
END;
GO


-- ============================================
-- 2.3 USER STATISTICS
-- ============================================

-- Get user statistics
-- Endpoint: GET /api/Stats/GetUserStats
CREATE OR ALTER PROCEDURE dbo.spStats_GetUserStats
    @DeviceId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserId INT;
    
    SELECT @UserId = UserId FROM dbo.Users WHERE DeviceId = @DeviceId;
    
    IF @UserId IS NULL
    BEGIN
        -- Return empty stats for new user
        SELECT 
            0 AS GamesPlayed,
            0 AS GamesWon,
            0.0 AS WinRate,
            0 AS CurrentStreak,
            0 AS MaxStreak,
            0 AS GuessDistribution1,
            0 AS GuessDistribution2,
            0 AS GuessDistribution3,
            0 AS GuessDistribution4,
            0 AS GuessDistribution5,
            0 AS GuessDistribution6;
        RETURN;
    END
    
    -- Calculate stats
    DECLARE @GamesPlayed INT;
    DECLARE @GamesWon INT;
    
    SELECT 
        @GamesPlayed = COUNT(*),
        @GamesWon = SUM(CASE WHEN GameStatus = 'won' THEN 1 ELSE 0 END)
    FROM dbo.Games
    WHERE UserId = @UserId AND GameStatus IN ('won', 'lost');
    
    -- Calculate current streak
    DECLARE @CurrentStreak INT = 0;
    
    SELECT @CurrentStreak = COUNT(*)
    FROM (
        SELECT 
            g.GameId,
            g.GameStatus,
            dw.GameDate,
            ROW_NUMBER() OVER (ORDER BY dw.GameDate DESC) AS RowNum
        FROM dbo.Games g
        INNER JOIN dbo.DailyWord dw ON g.DailyWordId = dw.DailyWordId
        WHERE g.UserId = @UserId AND g.GameStatus IN ('won', 'lost')
    ) AS sub
    WHERE GameStatus = 'won'
      AND NOT EXISTS (
          SELECT 1 
          FROM (
              SELECT 
                  g2.GameStatus,
                  ROW_NUMBER() OVER (ORDER BY dw2.GameDate DESC) AS RowNum2
              FROM dbo.Games g2
              INNER JOIN dbo.DailyWord dw2 ON g2.DailyWordId = dw2.DailyWordId
              WHERE g2.UserId = @UserId AND g2.GameStatus IN ('won', 'lost')
          ) AS sub2
          WHERE sub2.RowNum2 < sub.RowNum AND sub2.GameStatus = 'lost'
      );
    
    -- Calculate max streak
    DECLARE @MaxStreak INT = 0;
    
    ;WITH Streaks AS (
        SELECT 
            g.GameId,
            g.GameStatus,
            dw.GameDate,
            ROW_NUMBER() OVER (ORDER BY dw.GameDate) - 
            ROW_NUMBER() OVER (PARTITION BY g.GameStatus ORDER BY dw.GameDate) AS StreakGroup
        FROM dbo.Games g
        INNER JOIN dbo.DailyWord dw ON g.DailyWordId = dw.DailyWordId
        WHERE g.UserId = @UserId AND g.GameStatus IN ('won', 'lost')
    )
    SELECT @MaxStreak = ISNULL(MAX(StreakCount), 0)
    FROM (
        SELECT COUNT(*) AS StreakCount
        FROM Streaks
        WHERE GameStatus = 'won'
        GROUP BY StreakGroup
    ) AS StreakCounts;
    
    -- Guess distribution
    SELECT 
        ISNULL(@GamesPlayed, 0) AS GamesPlayed,
        ISNULL(@GamesWon, 0) AS GamesWon,
        CASE WHEN @GamesPlayed > 0 
             THEN CAST(@GamesWon AS FLOAT) / @GamesPlayed * 100 
             ELSE 0 END AS WinRate,
        @CurrentStreak AS CurrentStreak,
        @MaxStreak AS MaxStreak,
        ISNULL(SUM(CASE WHEN AttemptsUsed = 1 THEN 1 ELSE 0 END), 0) AS GuessDistribution1,
        ISNULL(SUM(CASE WHEN AttemptsUsed = 2 THEN 1 ELSE 0 END), 0) AS GuessDistribution2,
        ISNULL(SUM(CASE WHEN AttemptsUsed = 3 THEN 1 ELSE 0 END), 0) AS GuessDistribution3,
        ISNULL(SUM(CASE WHEN AttemptsUsed = 4 THEN 1 ELSE 0 END), 0) AS GuessDistribution4,
        ISNULL(SUM(CASE WHEN AttemptsUsed = 5 THEN 1 ELSE 0 END), 0) AS GuessDistribution5,
        ISNULL(SUM(CASE WHEN AttemptsUsed = 6 THEN 1 ELSE 0 END), 0) AS GuessDistribution6
    FROM dbo.Games
    WHERE UserId = @UserId AND GameStatus = 'won';
END;
GO


-- ============================================
-- 2.4 WORD DICTIONARY MANAGEMENT
-- ============================================

-- Validate if a word exists in dictionary
-- Endpoint: GET /api/Word/Validate
CREATE OR ALTER PROCEDURE dbo.spWord_Validate
    @Word CHAR(5)
AS
BEGIN
    SET NOCOUNT ON;
    
    SET @Word = UPPER(@Word);
    
    SELECT 
        CASE WHEN EXISTS (
            SELECT 1 FROM dbo.WordDictionary 
            WHERE Word = @Word AND 1 = IsValidGuess
        ) THEN 1 ELSE 0 END AS IsValid;
END;
GO

-- Add words to dictionary (for bulk import)
-- Endpoint: POST /api/Word/BulkAdd
CREATE OR ALTER PROCEDURE dbo.spWord_BulkAdd
    @Words NVARCHAR(MAX),  -- Comma-separated list of words
    @IsAnswer BIT = 1,
    @IsValidGuess BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Word NVARCHAR(10);
    DECLARE @Pos INT = 1;
    DECLARE @Len INT;
    DECLARE @InsertCount INT = 0;
    
    SET @Words = UPPER(@Words) + ',';
    SET @Len = LEN(@Words);
    
    WHILE @Pos <= @Len
    BEGIN
        DECLARE @NextComma INT = CHARINDEX(',', @Words, @Pos);
        IF @NextComma = 0 SET @NextComma = @Len + 1;
        
        SET @Word = LTRIM(RTRIM(SUBSTRING(@Words, @Pos, @NextComma - @Pos)));
        
        IF LEN(@Word) = 5
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.WordDictionary WHERE Word = @Word)
            BEGIN
                INSERT INTO dbo.WordDictionary (Word, IsAnswer, IsValidGuess)
                VALUES (@Word, @IsAnswer, @IsValidGuess);
                
                SET @InsertCount = @InsertCount + 1;
            END
        END
        
        SET @Pos = @NextComma + 1;
    END
    
    SELECT @InsertCount AS WordsAdded;
END;
GO


-- ============================================
-- SECTION 3: HELPER VIEWS (Optional)
-- ============================================

-- View for today's word (admin use only - DO NOT EXPOSE VIA API)
CREATE OR ALTER VIEW dbo.vw_TodaysWord AS
SELECT 
    dw.GameDate,
    wd.Word AS TodaysWord
FROM dbo.DailyWord dw
INNER JOIN dbo.WordDictionary wd ON dw.WordId = wd.WordId
WHERE dw.GameDate = CAST(GETUTCDATE() AS DATE);
GO

-- Leaderboard view (for future use)
CREATE OR ALTER VIEW dbo.vw_Leaderboard AS
SELECT 
    u.UserId,
    ISNULL(u.DisplayName, 'Anonymous') AS DisplayName,
    COUNT(g.GameId) AS GamesPlayed,
    SUM(CASE WHEN g.GameStatus = 'won' THEN 1 ELSE 0 END) AS GamesWon,
    CASE WHEN COUNT(g.GameId) > 0 
         THEN CAST(SUM(CASE WHEN g.GameStatus = 'won' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(g.GameId) * 100 
         ELSE 0 END AS WinRate,
    AVG(CASE WHEN g.GameStatus = 'won' THEN g.AttemptsUsed ELSE NULL END) AS AvgGuesses
FROM dbo.Users u
LEFT JOIN dbo.Games g ON u.UserId = g.UserId AND g.GameStatus IN ('won', 'lost')
GROUP BY u.UserId, u.DisplayName
HAVING COUNT(g.GameId) >= 5;  -- Minimum games to appear on leaderboard
GO


-- ============================================
-- SECTION 4: SEED DATA (Sample words for testing)
-- ============================================
-- Uncomment and run separately if you want test data

/*
-- Insert some common 5-letter words for testing
INSERT INTO dbo.WordDictionary (Word, IsAnswer, IsValidGuess) VALUES
('CRANE', 1, 1),
('SLATE', 1, 1),
('TRACE', 1, 1),
('AUDIO', 1, 1),
('RAISE', 1, 1),
('STARE', 1, 1),
('ADIEU', 1, 1),
('ARISE', 1, 1),
('ALONE', 1, 1),
('APPLE', 1, 1),
('BEACH', 1, 1),
('BRAIN', 1, 1),
('CHAIR', 1, 1),
('DANCE', 1, 1),
('EARTH', 1, 1),
('FLAME', 1, 1),
('GRACE', 1, 1),
('HEART', 1, 1),
('LIGHT', 1, 1),
('MUSIC', 1, 1),
('NIGHT', 1, 1),
('PEACE', 1, 1),
('PRIDE', 1, 1),
('QUEEN', 1, 1),
('RIVER', 1, 1),
('SMILE', 1, 1),
('STONE', 1, 1),
('STORM', 1, 1),
('SWEET', 1, 1),
('TIGER', 1, 1),
('WORLD', 1, 1),
('YOUTH', 1, 1);
*/
