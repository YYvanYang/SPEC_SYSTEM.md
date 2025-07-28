# Testing Standards

Comprehensive testing strategy managed by `@test-strategist` with automated quality gates.

## 🎯 Testing Philosophy

### Test-Driven Quality
- **Test early and often** - Tests written during spec phase
- **Requirement traceability** - Every requirement has corresponding tests
- **Risk-based prioritization** - Focus testing on high-risk areas
- **User value focus** - Tests validate business impact

### Coverage Requirements
- **Unit Tests**: ≥90% line coverage
- **Integration Tests**: All API endpoints and service boundaries
- **End-to-End Tests**: Critical user journeys
- **Performance Tests**: Key performance indicators
- **Security Tests**: Authentication, authorization, input validation

## 🏗️ Test Architecture

### Test Pyramid
```
     /\     E2E Tests (Few)
    /  \    - Critical user flows
   /____\   - Cross-system integration
  /      \  
 /        \ Integration Tests (Some)  
/          \ - API endpoints
\          / - Service boundaries
 \        /  - Database interactions
  \______/   
  /        \ Unit Tests (Many)
 /          \ - Individual functions
/____________\ - Business logic
               - Edge cases
```

### Test Categories

**Unit Tests** - Managed by `@implementation-specialist`
- Individual function behavior
- Business logic validation
- Edge case handling
- Error condition testing

**Integration Tests** - Managed by `@test-strategist`
- API endpoint testing
- Database integration
- Service-to-service communication
- External service mocking

**End-to-End Tests** - Managed by `@test-strategist`
- Complete user workflows
- Cross-system functionality
- Real environment testing
- Performance validation

**Security Tests** - Managed by `@quality-guardian`
- Authentication flows
- Authorization controls
- Input validation
- Data protection

## 📝 Test Structure Standards

### Unit Test Template

```javascript
// ✅ Good - Comprehensive unit test
describe('UserService', () => {
    let userService;
    let mockRepository;
    let mockLogger;
    
    beforeEach(() => {
        mockRepository = createMockRepository();
        mockLogger = createMockLogger();
        userService = new UserService(mockRepository, mockLogger);
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('createUser', () => {
        const validUserData = {
            email: 'test@example.com',
            name: 'John Doe',
            age: 25
        };
        
        describe('Happy Path', () => {
            it('should create user with valid data', async () => {
                // Arrange
                const expectedUser = { id: 'user-123', ...validUserData };
                mockRepository.save.mockResolvedValue(expectedUser);
                
                // Act
                const result = await userService.createUser(validUserData);
                
                // Assert
                expect(result).toEqual(expectedUser);
                expect(mockRepository.save).toHaveBeenCalledWith(validUserData);
                expect(mockLogger.info).toHaveBeenCalledWith(
                    'User created successfully', 
                    { userId: expectedUser.id }
                );
            });
        });
        
        describe('Edge Cases', () => {
            it('should handle duplicate email gracefully', async () => {
                // Arrange
                mockRepository.save.mockRejectedValue(
                    new DuplicateEmailError('Email already exists')
                );
                
                // Act & Assert
                await expect(userService.createUser(validUserData))
                    .rejects.toThrow(DuplicateEmailError);
                    
                expect(mockLogger.warn).toHaveBeenCalledWith(
                    'Duplicate email attempt',
                    { email: validUserData.email }
                );
            });
            
            it('should validate required fields', async () => {
                // Arrange
                const invalidData = { name: 'John Doe' }; // missing email
                
                // Act & Assert
                await expect(userService.createUser(invalidData))
                    .rejects.toThrow(ValidationError);
            });
        });
        
        describe('Error Conditions', () => {
            it('should handle database connection failure', async () => {
                // Arrange
                mockRepository.save.mockRejectedValue(
                    new DatabaseConnectionError('Connection failed')
                );
                
                // Act & Assert
                await expect(userService.createUser(validUserData))
                    .rejects.toThrow(DatabaseConnectionError);
                    
                expect(mockLogger.error).toHaveBeenCalledWith(
                    'Database error during user creation',
                    expect.objectContaining({ error: expect.any(String) })
                );
            });
        });
    });
});
```

### Integration Test Template

```javascript
// ✅ Good - Integration test with real dependencies
describe('User API Integration', () => {
    let app;
    let database;
    let testUser;
    
    beforeAll(async () => {
        app = await createTestApp();
        database = await createTestDatabase();
    });
    
    afterAll(async () => {
        await database.close();
    });
    
    beforeEach(async () => {
        await database.clean();
        testUser = await database.users.create({
            email: 'test@example.com',
            name: 'Test User'
        });
    });
    
    describe('POST /api/users', () => {
        it('should create user and return 201', async () => {
            // Arrange
            const userData = {
                email: 'newuser@example.com',
                name: 'New User',
                age: 30
            };
            
            // Act
            const response = await request(app)
                .post('/api/users')
                .send(userData)
                .expect(201);
            
            // Assert
            expect(response.body).toMatchObject({
                id: expect.any(String),
                email: userData.email,
                name: userData.name,
                age: userData.age,
                createdAt: expect.any(String)
            });
            
            // Verify in database
            const savedUser = await database.users.findById(response.body.id);
            expect(savedUser).toBeTruthy();
            expect(savedUser.email).toBe(userData.email);
        });
        
        it('should return 400 for invalid email', async () => {
            // Arrange
            const invalidUserData = {
                email: 'invalid-email',
                name: 'Test User'
            };
            
            // Act & Assert
            const response = await request(app)
                .post('/api/users')
                .send(invalidUserData)
                .expect(400);
                
            expect(response.body.error).toContain('Invalid email format');
        });
        
        it('should return 409 for duplicate email', async () => {
            // Arrange
            const duplicateData = {
                email: testUser.email,
                name: 'Duplicate User'
            };
            
            // Act & Assert
            const response = await request(app)
                .post('/api/users')
                .send(duplicateData)
                .expect(409);
                
            expect(response.body.error).toContain('Email already exists');
        });
    });
});
```

### End-to-End Test Template

```javascript
// ✅ Good - E2E test covering complete user journey
describe('User Registration Journey', () => {
    let page;
    let browser;
    
    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: true });
    });
    
    afterAll(async () => {
        await browser.close();
    });
    
    beforeEach(async () => {
        page = await browser.newPage();
        await page.goto('http://localhost:3000');
    });
    
    afterEach(async () => {
        await page.close();
    });
    
    it('should complete full user registration flow', async () => {
        // Step 1: Navigate to registration
        await page.click('[data-testid="register-button"]');
        await page.waitForSelector('[data-testid="registration-form"]');
        
        // Step 2: Fill registration form
        await page.type('[data-testid="email-input"]', 'e2e@example.com');
        await page.type('[data-testid="name-input"]', 'E2E Test User');
        await page.type('[data-testid="password-input"]', 'SecurePass123!');
        await page.type('[data-testid="confirm-password-input"]', 'SecurePass123!');
        
        // Step 3: Submit form
        await page.click('[data-testid="submit-button"]');
        
        // Step 4: Verify success
        await page.waitForSelector('[data-testid="success-message"]');
        const successMessage = await page.textContent('[data-testid="success-message"]');
        expect(successMessage).toContain('Registration successful');
        
        // Step 5: Verify redirect to dashboard
        await page.waitForURL('**/dashboard');
        const welcomeMessage = await page.textContent('[data-testid="welcome-message"]');
        expect(welcomeMessage).toContain('Welcome, E2E Test User');
        
        // Step 6: Verify user can access protected content
        await page.click('[data-testid="profile-link"]');
        await page.waitForSelector('[data-testid="profile-page"]');
        
        const profileEmail = await page.textContent('[data-testid="profile-email"]');
        expect(profileEmail).toBe('e2e@example.com');
    });
    
    it('should handle registration validation errors', async () => {
        // Navigate to registration
        await page.click('[data-testid="register-button"]');
        await page.waitForSelector('[data-testid="registration-form"]');
        
        // Submit empty form
        await page.click('[data-testid="submit-button"]');
        
        // Verify validation errors
        await page.waitForSelector('[data-testid="email-error"]');
        const emailError = await page.textContent('[data-testid="email-error"]');
        expect(emailError).toContain('Email is required');
        
        const nameError = await page.textContent('[data-testid="name-error"]');
        expect(nameError).toContain('Name is required');
    });
});
```

## 🎯 Test Data Management

### Test Fixtures
```javascript
// fixtures/users.js
export const validUser = {
    email: 'test@example.com',
    name: 'Test User',
    age: 25,
    preferences: {
        theme: 'dark',
        notifications: true
    }
};

export const adminUser = {
    ...validUser,
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['read', 'write', 'admin']
};

export const incompleteUser = {
    name: 'Incomplete User'
    // Missing required email field
};

// Test data builders
export class UserBuilder {
    constructor() {
        this.user = { ...validUser };
    }
    
    withEmail(email) {
        this.user.email = email;
        return this;
    }
    
    withRole(role) {
        this.user.role = role;
        return this;
    }
    
    build() {
        return { ...this.user };
    }
}
```

### Database Test Setup
```javascript
// test-helpers/database.js
export class TestDatabase {
    constructor() {
        this.connection = null;
    }
    
    async setup() {
        this.connection = await createConnection({
            type: 'sqlite',
            database: ':memory:',
            entities: [User, Post, Comment],
            synchronize: true
        });
    }
    
    async clean() {
        const entities = this.connection.entityMetadatas;
        
        for (const entity of entities) {
            const repository = this.connection.getRepository(entity.name);
            await repository.clear();
        }
    }
    
    async seed() {
        const users = await this.connection.getRepository(User).save([
            { email: 'user1@example.com', name: 'User One' },
            { email: 'user2@example.com', name: 'User Two' }
        ]);
        
        return { users };
    }
    
    async teardown() {
        await this.connection.close();
    }
}
```

## 🚀 Performance Testing

### Load Testing
```javascript
// performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '2m', target: 100 }, // Ramp up
        { duration: '5m', target: 100 }, // Stay at 100 users
        { duration: '2m', target: 200 }, // Ramp up to 200
        { duration: '5m', target: 200 }, // Stay at 200
        { duration: '2m', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
        http_req_failed: ['rate<0.1'],    // Error rate under 10%
    },
};

export default function() {
    // Test user creation endpoint
    const payload = JSON.stringify({
        email: `user-${Math.random()}@example.com`,
        name: `Test User ${Math.random()}`,
        age: Math.floor(Math.random() * 50) + 18
    });
    
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const response = http.post(
        'http://localhost:3000/api/users',
        payload,
        params
    );
    
    check(response, {
        'status is 201': (r) => r.status === 201,
        'response time < 500ms': (r) => r.timings.duration < 500,
        'has user id': (r) => JSON.parse(r.body).id !== undefined,
    });
    
    sleep(1);
}
```

### Memory and Resource Testing
```javascript
// performance/memory-test.js
describe('Memory Usage Tests', () => {
    it('should not leak memory during bulk operations', async () => {
        const initialMemory = process.memoryUsage().heapUsed;
        
        // Perform bulk operations
        for (let i = 0; i < 1000; i++) {
            await userService.createUser({
                email: `user${i}@example.com`,
                name: `User ${i}`
            });
        }
        
        // Force garbage collection
        if (global.gc) {
            global.gc();
        }
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        
        // Memory increase should be reasonable (less than 100MB)
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
});
```

## 🔒 Security Testing

### Authentication Tests
```javascript
describe('Authentication Security', () => {
    it('should prevent brute force attacks', async () => {
        const invalidCredentials = {
            email: 'test@example.com',
            password: 'wrongpassword'
        };
        
        // Attempt login 5 times with wrong password
        for (let i = 0; i < 5; i++) {
            await request(app)
                .post('/api/auth/login')
                .send(invalidCredentials)
                .expect(401);
        }
        
        // 6th attempt should be rate limited
        await request(app)
            .post('/api/auth/login')
            .send(invalidCredentials)
            .expect(429);
    });
    
    it('should prevent SQL injection', async () => {
        const maliciousInput = {
            email: "'; DROP TABLE users; --",
            name: 'Malicious User'
        };
        
        const response = await request(app)
            .post('/api/users')
            .send(maliciousInput)
            .expect(400);
            
        expect(response.body.error).toContain('Invalid email format');
        
        // Verify users table still exists
        const users = await database.users.findAll();
        expect(users).toBeDefined();
    });
});
```

## 📊 Test Reporting

### Coverage Reports
```javascript
// jest.config.js
module.exports = {
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 90,
            lines: 90,
            statements: 90
        }
    },
    collectCoverageFrom: [
        'src/**/*.{js,ts}',
        '!src/**/*.test.{js,ts}',
        '!src/**/*.spec.{js,ts}',
        '!src/tests/**'
    ]
};
```

### Test Result Analytics
```javascript
// test-reporters/custom-reporter.js
class MetricsReporter {
    onRunComplete(contexts, results) {
        const metrics = {
            timestamp: new Date().toISOString(),
            totalTests: results.numTotalTests,
            passedTests: results.numPassedTests,
            failedTests: results.numFailedTests,
            skippedTests: results.numTodoTests,
            testSuites: results.numTotalTestSuites,
            coverage: results.coverageMap,
            duration: results.testResults.reduce(
                (total, result) => total + result.perfStats.end - result.perfStats.start,
                0
            )
        };
        
        // Send to analytics system
        this.sendToAnalytics(metrics);
    }
    
    async sendToAnalytics(metrics) {
        // Implementation to send metrics to analytics dashboard
        console.log('📊 Test metrics collected:', metrics);
    }
}
```

## ✅ Quality Gates

### Pre-Commit Testing
```bash
#!/bin/bash
# .husky/pre-commit

echo "🧪 Running pre-commit tests..."

# Run unit tests
npm run test:unit
if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed"
    exit 1
fi

# Run linting
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed"
    exit 1
fi

# Run type checking
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Type checking failed"
    exit 1
fi

echo "✅ Pre-commit tests passed"
```

### CI/CD Testing Pipeline
```yaml
# .github/workflows/test.yml
name: Test Pipeline

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
      
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm audit
      - run: npm run test:security
```

## 📚 Testing Resources

### Documentation
- **Test Strategy**: Defined by `@test-strategist`
- **Quality Gates**: Enforced automatically
- **Coverage Reports**: Generated with each build
- **Performance Benchmarks**: Tracked over time

### Tools & Frameworks
- **Unit Testing**: Jest, Mocha, PyTest
- **Integration Testing**: Supertest, TestContainers
- **E2E Testing**: Puppeteer, Cypress, Playwright  
- **Performance Testing**: k6, Artillery, JMeter
- **Security Testing**: OWASP ZAP, Snyk, SonarQube

---

**Remember**: All tests are managed by `@test-strategist` and quality gates are enforced automatically. Comprehensive testing ensures reliable, secure, and performant software! 🚀