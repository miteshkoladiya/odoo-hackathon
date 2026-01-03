# Contributing to Dayflow HRMS

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/dayflow-hrms.git
   cd dayflow-hrms
   ```

2. **Setup development environment**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your MongoDB connection string and other settings.

4. **Start development server**
   ```bash
   npm run dev
   ```

## Git Workflow

### Branch Naming Convention
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Production hotfixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Keep commits atomic and focused
   - Write clear, descriptive commit messages
   - Use present tense ("Add feature" not "Added feature")

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add feature: description of what was added"
   ```

### Pull Request Process

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Provide clear title and description
   - Link related issues
   - Add screenshots for UI changes

3. **Code Review**
   - At least one approval required before merge
   - Address all comments and feedback
   - Re-request review after changes

4. **Merge to develop**
   - Use "Squash and merge" for single features
   - Use "Create a merge commit" for multiple commits
   - Delete branch after merge

## Development Standards

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Use 2-space indentation
- Keep functions small and focused

### Naming Conventions
- Components: `PascalCase` (e.g., `UserProfile.tsx`)
- Functions/variables: `camelCase` (e.g., `fetchUserData`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- CSS classes: `kebab-case` (e.g., `btn-primary`)

### Component Structure
```
components/
├── ui/              # Reusable UI components
├── dashboard/       # Dashboard-specific components
├── forms/           # Form components
└── layout/          # Layout components
```

### Testing Requirements
- Write tests for critical functions
- Aim for >80% code coverage
- Use Jest and React Testing Library
- Test both success and error paths

## Git Commit Standards

### Commit Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that don't affect code meaning
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `perf:` Code change that improves performance
- `test:` Adding missing tests
- `chore:` Changes to build process or dependencies

### Example
```
feat(auth): add email verification on registration

- Implement email verification token generation
- Add verify-email API endpoint
- Update registration form to show verification status

Closes #123
```

## Deployment

### Staging Deployment
- Automatic deployment on merge to `develop` branch
- Test all features before production release

### Production Deployment
- Manual deployment from `main` branch
- Requires approval from team lead
- Tag release with version number: `git tag v1.0.0`

## Support

For questions or issues:
- Create an issue on GitHub
- Tag with appropriate labels
- Provide clear reproduction steps
