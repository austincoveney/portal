# DigiGrow Client Portal - Project Structure

## Overview
This document outlines the restructured project architecture focused on scalability, maintainability, and separation of concerns.

## Directory Structure

```
src/
├── features/           # Feature-based modules
│   ├── auth/          # Authentication features
│   │   └── callback.tsx
│   ├── dashboard/     # Dashboard features
│   │   ├── index.tsx
│   │   ├── admin-tools.tsx
│   │   └── settings.tsx
│   └── admin/         # Admin-specific features
├── shared/            # Shared resources across features
│   ├── components/    # Reusable UI components
│   │   └── ProfileAvatar.tsx
│   ├── lib/          # Shared libraries and utilities
│   │   └── supabase.ts
│   └── types/        # Shared TypeScript types
│       └── database.types.ts
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── pages/            # Next.js page routing
│   ├── _app.tsx
│   ├── index.tsx
│   ├── auth/
│   │   └── callback.tsx
│   └── dashboard/
│       ├── index.tsx
│       ├── admin-tools.tsx
│       └── settings.tsx
└── styles/           # Global styles
    └── globals.css
```

## Architecture Principles

### 1. Feature-Based Organization
- Each major feature has its own directory under `src/features/`
- Features are self-contained with their own components, logic, and types
- Promotes modularity and easier maintenance

### 2. Shared Resources
- Common components, utilities, and types are placed in `src/shared/`
- Prevents code duplication across features
- Establishes clear boundaries between shared and feature-specific code

### 3. Page Routing
- Next.js pages act as thin routing layers
- Actual feature logic resides in `src/features/`
- Maintains Next.js file-based routing while keeping components organized

## Path Aliases

The following TypeScript path aliases are configured:

```typescript
"@/*": ["./src/*"]
"@/features/*": ["./src/features/*"]
"@/shared/*": ["./src/shared/*"]
"@/hooks/*": ["./src/hooks/*"]
"@/utils/*": ["./src/utils/*"]
"@/styles/*": ["./src/styles/*"]
```

## Development Guidelines

### Adding New Features
1. Create a new directory under `src/features/`
2. Implement feature components and logic
3. Create corresponding page routes in `src/pages/`
4. Add shared components to `src/shared/components/` if reusable

### Import Conventions
- Use path aliases for cleaner imports
- Import from `@/shared/` for shared resources
- Import from `@/features/` for feature-specific components

### Code Organization
- Keep feature-specific logic within feature directories
- Place reusable components in `src/shared/components/`
- Use `src/shared/types/` for shared TypeScript interfaces
- Implement custom hooks in `src/hooks/`

## Benefits of This Structure

1. **Scalability**: Easy to add new features without affecting existing code
2. **Maintainability**: Clear separation of concerns and logical organization
3. **Reusability**: Shared components and utilities prevent code duplication
4. **Developer Experience**: Intuitive structure with clear naming conventions
5. **Team Collaboration**: Well-defined boundaries make parallel development easier

## Migration Notes

- All import paths have been updated to use the new structure
- TypeScript path aliases have been reconfigured
- Next.js page routing maintained for backward compatibility
- Existing functionality preserved during restructuring