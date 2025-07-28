# Coding Standards

These standards are enforced by `@quality-guardian` and automated quality gates.

## 🎯 Core Principles

### 1. Spec-Driven Implementation
- **Never deviate from specs** - If unclear, request clarification
- **Implement exactly what's specified** in requirements
- **Trace all code to requirements** for maintainability

### 2. Minimal Changes Principle
- **Make targeted, minimal changes** to achieve requirements
- **Avoid architectural changes** without explicit approval
- **Preserve existing interfaces** and backward compatibility

### 3. Quality by Design
- **Comprehensive error handling** for all failure scenarios
- **Appropriate logging** for debugging and monitoring
- **Input validation** for all external inputs
- **Resource cleanup** to prevent leaks

## 📝 File Organization

### Directory Structure
```
src/
├── components/          # Reusable components
├── services/           # Business logic
├── utils/              # Shared utilities  
├── types/              # Type definitions
├── tests/              # Test files
└── docs/               # Code documentation
```

### File Naming
- **kebab-case** for files: `user-service.js`
- **PascalCase** for classes: `UserService`
- **camelCase** for functions: `getUserById`
- **UPPER_CASE** for constants: `MAX_RETRY_ATTEMPTS`

## 🔧 Code Style

### JavaScript/TypeScript

```javascript
// ✅ Good - Clear, documented, with error handling
/**
 * Retrieve user by ID with caching
 * @param {string} userId - The user identifier
 * @returns {Promise<User>} The user object
 * @throws {UserNotFoundError} When user doesn't exist
 */
async function getUserById(userId) {
    if (!userId) {
        throw new Error('User ID is required');
    }
    
    try {
        const cachedUser = await cache.get(`user:${userId}`);
        if (cachedUser) {
            logger.debug('User found in cache', { userId });
            return cachedUser;
        }
        
        const user = await database.users.findById(userId);
        if (!user) {
            throw new UserNotFoundError(`User ${userId} not found`);
        }
        
        await cache.set(`user:${userId}`, user, { expiry: 300 });
        logger.info('User retrieved from database', { userId });
        
        return user;
    } catch (error) {
        logger.error('Failed to retrieve user', { userId, error: error.message });
        throw error;
    }
}

// ❌ Bad - No error handling, unclear naming, no documentation
function getUser(id) {
    return db.find(id);
}
```

### Python

```python
# ✅ Good - Type hints, error handling, documentation
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def calculate_user_score(user_id: str, metrics: dict) -> Optional[float]:
    """
    Calculate user engagement score based on metrics.
    
    Args:
        user_id: The user identifier
        metrics: Dictionary of engagement metrics
        
    Returns:
        Float score between 0.0 and 1.0, or None if calculation fails
        
    Raises:
        ValueError: When required metrics are missing
    """
    required_metrics = ['page_views', 'time_spent', 'interactions']
    
    if not all(metric in metrics for metric in required_metrics):
        raise ValueError(f"Missing required metrics: {required_metrics}")
    
    try:
        # Weighted score calculation
        score = (
            metrics['page_views'] * 0.3 +
            metrics['time_spent'] * 0.4 +
            metrics['interactions'] * 0.3
        ) / 100.0
        
        # Normalize to 0-1 range
        normalized_score = min(max(score, 0.0), 1.0)
        
        logger.debug(f"Calculated score for user {user_id}: {normalized_score}")
        return normalized_score
        
    except (KeyError, TypeError) as error:
        logger.error(f"Score calculation failed for user {user_id}: {error}")
        return None

# ❌ Bad - No types, no error handling, unclear logic
def calc_score(uid, data):
    return (data['pv'] + data['ts'] + data['int']) / 3
```

## 🔒 Security Standards

### Input Validation
```javascript
// ✅ Good - Comprehensive validation
function validateUserInput(input) {
    const schema = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        name: /^[a-zA-Z\s]{2,50}$/
    };
    
    const errors = [];
    
    for (const [field, pattern] of Object.entries(schema)) {
        if (!input[field] || !pattern.test(input[field])) {
            errors.push(`Invalid ${field} format`);
        }
    }
    
    if (errors.length > 0) {
        throw new ValidationError(errors.join(', '));
    }
    
    return sanitizeInput(input);
}

// ❌ Bad - No validation
function processUser(input) {
    return database.save(input);
}
```

### Secret Management
```javascript
// ✅ Good - Environment variables
const config = {
    dbPassword: process.env.DB_PASSWORD,
    apiKey: process.env.API_KEY,
    jwtSecret: process.env.JWT_SECRET
};

// ❌ Bad - Hardcoded secrets
const config = {
    dbPassword: 'super-secret-password',
    apiKey: 'abc123-api-key',
    jwtSecret: 'my-jwt-secret'
};
```

## 📊 Performance Standards

### Database Queries
```javascript
// ✅ Good - Optimized with indexing hints
async function getUsersWithPosts(limit = 10) {
    return await database.query(`
        SELECT u.id, u.name, COUNT(p.id) as post_count
        FROM users u
        USE INDEX (idx_user_created)
        LEFT JOIN posts p ON u.id = p.user_id
        GROUP BY u.id, u.name
        ORDER BY u.created_at DESC
        LIMIT ?
    `, [limit]);
}

// ❌ Bad - N+1 query problem
async function getUsersWithPosts() {
    const users = await database.users.findAll();
    for (const user of users) {
        user.posts = await database.posts.findByUserId(user.id);
    }
    return users;
}
```

### Caching Strategy
```javascript
// ✅ Good - Multi-level caching
class UserService {
    constructor() {
        this.memoryCache = new Map();
        this.redisCache = new Redis();
    }
    
    async getUser(userId) {
        // L1: Memory cache
        if (this.memoryCache.has(userId)) {
            return this.memoryCache.get(userId);
        }
        
        // L2: Redis cache
        const cached = await this.redisCache.get(`user:${userId}`);
        if (cached) {
            const user = JSON.parse(cached);
            this.memoryCache.set(userId, user);
            return user;
        }
        
        // L3: Database
        const user = await database.users.findById(userId);
        if (user) {
            this.memoryCache.set(userId, user);
            await this.redisCache.setex(`user:${userId}`, 300, JSON.stringify(user));
        }
        
        return user;
    }
}
```

## 🧪 Testing Standards

### Test Structure
```javascript
// ✅ Good - Comprehensive test coverage
describe('UserService', () => {
    let userService;
    let mockDatabase;
    
    beforeEach(() => {
        mockDatabase = createMockDatabase();
        userService = new UserService(mockDatabase);
    });
    
    describe('getUserById', () => {
        it('should return user when found', async () => {
            // Arrange
            const userId = 'user-123';
            const expectedUser = { id: userId, name: 'John Doe' };
            mockDatabase.users.findById.mockResolvedValue(expectedUser);
            
            // Act
            const result = await userService.getUserById(userId);
            
            // Assert
            expect(result).toEqual(expectedUser);
            expect(mockDatabase.users.findById).toHaveBeenCalledWith(userId);
        });
        
        it('should throw UserNotFoundError when user not found', async () => {
            // Arrange
            const userId = 'nonexistent-user';
            mockDatabase.users.findById.mockResolvedValue(null);
            
            // Act & Assert
            await expect(userService.getUserById(userId))
                .rejects.toThrow(UserNotFoundError);
        });
        
        it('should validate user ID parameter', async () => {
            // Act & Assert
            await expect(userService.getUserById(''))
                .rejects.toThrow('User ID is required');
            
            await expect(userService.getUserById(null))
                .rejects.toThrow('User ID is required');
        });
    });
});
```

## 📋 Quality Checklist

### Pre-Commit Checklist
- [ ] All functions have JSDoc/docstring documentation
- [ ] Error handling covers all failure scenarios
- [ ] Input validation for all external inputs
- [ ] Logging added for debugging and monitoring
- [ ] Tests cover happy path, edge cases, and error conditions
- [ ] No hardcoded secrets or configuration
- [ ] Performance considerations addressed
- [ ] Security best practices followed

### Code Review Checklist
- [ ] Code follows established patterns
- [ ] Changes are minimal and targeted
- [ ] No breaking changes without approval
- [ ] Backward compatibility maintained
- [ ] Documentation updated
- [ ] Tests added for new functionality
- [ ] Performance impact assessed
- [ ] Security implications considered

## 🔧 Automated Enforcement

### Linting Rules
```json
{
  "extends": ["eslint:recommended", "@typescript-eslint/recommended"],
  "rules": {
    "no-console": "error",
    "no-debugger": "error",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": "error",
    "curly": "error"
  }
}
```

### Pre-commit Hooks
- **Style Check**: ESLint, Prettier, Black
- **Security Scan**: Detect hardcoded secrets
- **Test Execution**: Run affected tests
- **Type Check**: TypeScript/mypy validation

## 📚 Resources

### Documentation
- **API Documentation**: Auto-generated from code comments
- **Architecture Decisions**: Recorded in ADRs
- **Code Examples**: Live examples in documentation

### Tools
- **Linters**: ESLint, PyLint, RuboCop
- **Formatters**: Prettier, Black, RuboCop
- **Security**: SonarQube, Bandit, Brakeman
- **Testing**: Jest, PyTest, RSpec

---

**Remember**: These standards are enforced by `@quality-guardian` and will be checked automatically. Follow them consistently for smooth code reviews! 🚀