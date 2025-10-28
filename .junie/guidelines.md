
to run all quality checks run the following:
```
npm --prefix frontend-expo run test && npm --prefix frontend-expo run typecheck && npm --prefix frontend-expo run lint
```

- the frontend folder contains the legacy frontend for reference purposes
- the frontend-expo folder contains the new frontend

- Our file names and locations are consistent
-- app (contains routes and very little logic)
-- src
---- components
---- features
------ ...featurename
------ shared (can contain ui / utils etc...)

Within each feature we can have the following structure
- domain (functional domain logic)
- view (display)
- model (apis and data persistence)
- treat linting warnings as if they are errors
- only export named imports

- We keep implement single responsibility and keep our components as small as possible
- use typescript expo
- we don't use workspaces, frontend-expo is a seperate project!
- We use Styled Components
- The styled components that are specifically needed for the current layout will be put bellow the current component in the same file
- The styled components that are generic will be put in features/shared/view
- to follow linting rules always import  styled like this: `import {default as styled} from 'styled-components/native';`
- We use the solid principles
**S - Single Responsibility Principle** A class/function should have only one reason to change (one job).
**O - Open/Closed Principle** Open for extension, closed for modification.
**L - Liskov Substitution Principle** Subtypes must be substitutable for their base types.
**I - Interface Segregation Principle** Many specific interfaces are better than one general interface.
**D - Dependency Inversion Principle** Depend on abstractions, not concretions.

Testing
- Test in jest
- Test interaction according to react native guidelines
- Don't use snapshot tests
- Tests should live alongside the implementation with the following naming convention src/somefile.tsx -> src/somefile.spec.tsx

