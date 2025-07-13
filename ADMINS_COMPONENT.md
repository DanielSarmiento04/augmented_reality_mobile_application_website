# AdminsComponent - User Management Interface

## Overview

The AdminsComponent provides a comprehensive user management interface for administrators to perform CRUD (Create, Read, Update, Delete) operations on users. This component is specifically designed to prevent administrators from creating or managing other admin accounts.

## Features

### ✅ User Management
- **Create Users**: Add new users with username, email, password, and role
- **Edit Users**: Update existing user information (except admin users)
- **Delete Users**: Remove users from the system (except admin users)
- **View Users**: Display all users in a paginated table

### ✅ User Interface
- **Search & Filter**: Search users by username, email, or role
- **Pagination**: Navigate through large user lists
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modal Dialogs**: Clean interfaces for creating and editing users
- **Confirmation Dialogs**: Safety confirmation for delete operations

### ✅ Security & Restrictions
- **Admin Protection**: Administrators cannot create, edit, or delete other admin accounts
- **Role Restrictions**: Only 'user' and 'guest' roles can be assigned through this interface
- **Validation**: Form validation for all required fields
- **Error Handling**: Comprehensive error handling for all operations

## Usage

### Navigation
Access the AdminsComponent by navigating to `/admins` in your application.

### Available Operations

#### Creating Users
1. Click the "Nuevo Usuario" button
2. Fill in the required fields:
   - Username (minimum 3 characters)
   - Email (valid email format)
   - Password (minimum 6 characters)
   - Role (user or guest)
3. Click "Crear Usuario" to save

#### Editing Users
1. Click the edit button (✏️) next to a user
2. Modify the desired fields
3. Click "Actualizar Usuario" to save changes
4. Note: Admin users cannot be edited

#### Deleting Users
1. Click the delete button (🗑️) next to a user
2. Confirm the deletion in the dialog
3. Note: Admin users cannot be deleted

#### Searching Users
1. Use the search input at the top
2. Search by username, email, or role
3. Results update automatically

### User Roles

| Role | Description | Can Create | Can Edit | Can Delete |
|------|-------------|------------|----------|------------|
| admin | System administrator | ❌ | ❌ | ❌ |
| user | Regular application user | ✅ | ✅ | ✅ |
| guest | Limited access user | ✅ | ✅ | ✅ |

## Technical Implementation

### Service Integration
The component uses the `UserService` for all CRUD operations:

```typescript
// Injected in constructor
constructor(
  private fb: FormBuilder,
  private userService: UserService
) { }

// Example service calls
this.userService.getUsers().subscribe(users => { ... });
this.userService.createUser(userData).subscribe(newUser => { ... });
this.userService.updateUser(id, userData).subscribe(updatedUser => { ... });
this.userService.deleteUser(id).subscribe(() => { ... });
```

### Form Validation
- Uses Angular Reactive Forms
- Validators for required fields, email format, and minimum lengths
- Real-time validation feedback

### Error Handling
- Service-level error handling
- User-friendly error messages
- Loading states and feedback

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- High contrast design

## Styling

The component uses the global design system defined in `/src/styles.scss`:

### CSS Classes Used
- `.admin-page` - Main container
- `.page-header` - Header section with title and actions
- `.users-table` - Main data table
- `.modal-overlay` - Modal dialog overlay
- `.btn--primary`, `.btn--danger`, etc. - Button variants
- `.form-group`, `.form-input` - Form styling
- `.badge--primary`, `.badge--secondary` - Role badges

### Responsive Breakpoints
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: 320px - 767px

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Select multiple users for bulk delete/update
2. **Advanced Filtering**: Filter by role, creation date, etc.
3. **Export Functionality**: Export user list to CSV/Excel
4. **User Groups**: Organize users into groups
5. **Audit Trail**: Track user creation/modification history
6. **Real-time Updates**: WebSocket integration for real-time user list updates

### Backend Integration
Currently uses mock data through `UserService`. To integrate with a real backend:

1. Replace the mock `UserService` methods with HTTP calls
2. Add proper authentication headers
3. Implement server-side pagination and filtering
4. Add proper error handling for network failures

## Testing

The component includes:
- Unit tests for the component logic
- Service tests for CRUD operations
- Mock data for development and testing

Run tests with:
```bash
npm test
```

## Dependencies

- `@angular/core`
- `@angular/common`
- `@angular/forms` (ReactiveFormsModule, FormsModule)
- Custom `UserService`
- Custom `User` model

## File Structure

```
src/app/pages/admins/
├── admins.component.ts       # Component logic
├── admins.component.html     # Template
├── admins.component.scss     # Styles
└── admins.component.spec.ts  # Tests
```

---

**Note**: This component is designed for administrator use only. Ensure proper authentication and authorization are in place before allowing access to this interface.
