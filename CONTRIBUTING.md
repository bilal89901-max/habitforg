# Contributing to HabitForge

Thank you for your interest in contributing to HabitForge! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/habitforge.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add your commit message"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install
cd backend && npm install

# Start PostgreSQL
docker-compose up -d

# Run migrations and seed data
cd backend
npm run migrate
npm run seed

# Start development servers
npm run dev (backend)
cd .. && npm run dev (frontend)
```

## Project Structure

```
habitforge/
├── app/                    # Next.js frontend pages
├── backend/               # Express API server
│   └── src/
│       ├── controllers/   # Request handlers
│       ├── routes/        # API routes
│       ├── middleware/    # Express middleware
│       ├── database/      # Database migrations & seeds
│       └── types/         # TypeScript types
├── lib/                   # Shared utilities
└── components/            # React components
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for all data structures
- Avoid `any` type unless absolutely necessary
- Use descriptive variable and function names

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Use arrow functions where appropriate
- Keep functions small and focused
- Add comments for complex logic

### Naming Conventions

- **Files**: kebab-case (e.g., `user-controller.ts`)
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Functions**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Interfaces/Types**: PascalCase (e.g., `UserProfile`)

## Backend Development

### Adding a New Endpoint

1. Create or update a controller in `backend/src/controllers/`
2. Add the route in the appropriate file in `backend/src/routes/`
3. Update types in `backend/src/types/index.ts`
4. Test the endpoint with Postman/curl
5. Document the endpoint in `API.md`

Example:

```typescript
// backend/src/controllers/exampleController.ts
import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getExample = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM examples WHERE user_id = $1', [req.user?.userId]);
    res.json({ examples: result.rows });
  } catch (error) {
    console.error('Get examples error:', error);
    res.status(500).json({ error: 'Failed to get examples' });
  }
};
```

```typescript
// backend/src/routes/example.routes.ts
import { Router } from 'express';
import * as exampleController from '../controllers/exampleController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', authenticate, exampleController.getExample);

export default router;
```

### Database Changes

When adding new database tables or columns:

1. Update `backend/src/database/schema.sql`
2. Add types to `backend/src/types/index.ts`
3. Run `npm run migrate` to apply changes
4. Update seed data if necessary

## Frontend Development

### Adding a New Page

1. Create a new directory in `app/`
2. Add a `page.tsx` file
3. Use the existing patterns for authentication and layout
4. Add API calls in `lib/api/`

Example:

```tsx
// app/example/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api/client';

export default function ExamplePage() {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }
    
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/example');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
```

## Testing

### Manual Testing

Before submitting a PR:
1. Test all new features manually
2. Test existing features that might be affected
3. Test with different user roles (regular user, admin)
4. Test error cases (invalid input, missing data, etc.)

### API Testing

Use Postman, Insomnia, or curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get protected resource
curl -X GET http://localhost:5000/api/avatars/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Pull Request Process

1. **Update Documentation**: Update README.md, API.md, or other docs if needed
2. **Add Tests**: If applicable, add tests for your changes
3. **Check Code Quality**: Ensure your code follows the style guidelines
4. **Write Clear Commit Messages**: Use descriptive commit messages
5. **Fill PR Template**: Describe what changes you made and why

### PR Title Format

- `feat: Add new feature description`
- `fix: Fix bug description`
- `docs: Update documentation`
- `refactor: Refactor code description`
- `style: Code style changes`
- `test: Add or update tests`

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- How was this tested?
- What edge cases were considered?

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tested on local environment
```

## Feature Requests

To request a new feature:
1. Check if the feature already exists or is planned
2. Open a new issue with the "Feature Request" label
3. Describe the feature, use cases, and benefits
4. Be open to discussion and feedback

## Bug Reports

To report a bug:
1. Check if the bug has already been reported
2. Open a new issue with the "Bug" label
3. Include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots/logs if applicable
   - Environment (OS, Node version, browser, etc.)

## Questions?

If you have questions about contributing:
- Open a discussion on GitHub
- Check existing documentation
- Review closed issues and PRs

## License

By contributing to HabitForge, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to HabitForge! 🎮⚔️
