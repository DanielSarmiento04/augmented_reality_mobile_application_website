# RoutineComponent - Gestión de Rutinas AR

## Descripción
El RoutineComponent es una interfaz completa de administración para gestionar rutinas de realidad aumentada en el sistema. Permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre las rutinas, con un diseño moderno e interactivo siguiendo el sistema de diseño establecido.

## Características Implementadas

### 🎯 Funcionalidades CRUD Completas
- **Crear**: Formulario completo para crear nuevas rutinas con validación
- **Leer**: Vista de tabla con paginación y filtros avanzados
- **Actualizar**: Edición de rutinas existentes con pre-llenado de datos
- **Eliminar**: Confirmación de eliminación con modal de seguridad

### 🔍 Búsqueda y Filtros Avanzados
- Búsqueda en tiempo real por nombre, descripción, departamento y etiquetas
- Filtros por estado (Borrador, Activo, Completado, Archivado)
- Filtros por prioridad (Baja, Media, Alta, Urgente)
- Contador de resultados en tiempo real

### 📱 Interfaz Responsiva
- Diseño adaptable para desktop, tablet y móvil
- Tabla responsive con scroll horizontal en dispositivos pequeños
- Modales optimizados para diferentes tamaños de pantalla

### 📂 Gestión de Archivos AR
- **Modelo 3D**: Upload de archivos GLB para modelos 3D
- **Modelo de Inferencia**: Upload de archivos TFLite para IA
- Validación de tipos de archivo específicos
- Preview de archivos seleccionados

### 👥 Asignación de Usuarios
- Selección múltiple de usuarios para asignar a rutinas
- Interfaz de checkbox con información del usuario
- Visualización de usuarios asignados en la tabla

### 🎨 Sistema de Estados y Prioridades
- **Estados**: Draft, Active, Completed, Archived con badges colorados
- **Prioridades**: Low, Medium, High, Urgent (con animación pulse para urgente)
- Indicadores visuales claros y accesibles
- **Edit Routines**: Update existing routine information and modify steps
- **Delete Routines**: Remove routines from the system with confirmation
- **Duplicate Routines**: Create copies of existing routines for quick setup
- **View Routines**: Display all routines in a responsive card grid layout

### ✅ User Interface
- **Search & Filter**: Search routines by name, description, or steps content
- **Pagination**: Navigate through large routine collections
- **Card Grid Layout**: Modern card-based interface showing routine details
- **Modal Dialogs**: Clean interfaces for creating and editing routines
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### ✅ Step Management
- **Dynamic Steps**: Add and remove steps dynamically during routine creation/editing
- **Step Validation**: Ensure all steps have content before saving
- **Step Ordering**: Visual step numbering for clear sequence understanding
- **Minimum Steps**: Ensure at least one step exists in every routine

### ✅ Model Integration
- **3D Models**: Associate 3D model files with routines for AR visualization
- **Inference Models**: Link machine learning inference models for automated analysis
- **Model Status**: Visual indicators showing which models are available
- **Optional Models**: Both model types are optional and can be added independently

## Usage

### Navigation
Access the RoutineComponent by navigating to `/routine` in your application.

### Available Operations

#### Creating Routines
1. Click the "Nueva Rutina" button
2. Fill in the required fields:
   - Name (minimum 3 characters)
   - Description (minimum 10 characters)
   - Steps (at least one step required)
   - Optional: 3D Model file path
   - Optional: Inference Model file path
3. Use "Agregar Paso" to add more steps
4. Click "Crear Rutina" to save

#### Editing Routines
1. Click the edit button (✏️) on a routine card
2. Modify the desired fields
3. Add or remove steps as needed
4. Click "Actualizar Rutina" to save changes

#### Duplicating Routines
1. Click the duplicate button (📋) on a routine card
2. The form will pre-populate with the routine data
3. Modify as needed (name will have "(Copia)" appended)
4. Click "Crear Rutina" to save the duplicate

#### Deleting Routines
1. Click the delete button (🗑️) on a routine card
2. Confirm the deletion in the dialog
3. The routine will be permanently removed

#### Searching Routines
1. Use the search input at the top
2. Search by routine name, description, or step content
3. Results update automatically as you type

### Routine Structure

Each routine contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Auto-generated | Unique identifier |
| name | string | ✅ | Routine name (min 3 chars) |
| description | string | ✅ | Detailed description (min 10 chars) |
| steps | string[] | ✅ | Ordered list of procedure steps |
| createdAt | Date | Auto-generated | Creation timestamp |
| updatedAt | Date | Auto-updated | Last modification timestamp |
| model_3d | string/File | ❌ | Path to 3D model file |
| model_inference | string/File | ❌ | Path to inference model file |

### Model Status Indicators

| Status | Description | Visual Indicator |
|--------|-------------|------------------|
| Completo | Both 3D and inference models available | Green badge |
| Parcial | Only one model type available | Yellow badge |
| Sin modelos | No models associated | Gray badge |

## Technical Implementation

### Service Integration
The component uses the `RoutineService` for all CRUD operations:

```typescript
// Injected in constructor
constructor(
  private fb: FormBuilder,
  private routineService: RoutineService
) { }

// Example service calls
this.routineService.getRoutines().subscribe(routines => { ... });
this.routineService.createRoutine(routineData).subscribe(newRoutine => { ... });
this.routineService.updateRoutine(id, routineData).subscribe(updatedRoutine => { ... });
this.routineService.deleteRoutine(id).subscribe(() => { ... });
this.routineService.duplicateRoutine(id).subscribe(duplicatedRoutine => { ... });
```

### Form Management
- Uses Angular Reactive Forms with FormBuilder
- Dynamic FormArray for managing steps
- Custom validators for required fields and minimum lengths
- Real-time validation feedback

### Modern Angular Features
- Uses Angular 17+ control flow syntax (@if, @for, @else)
- Standalone component architecture
- Modern imports and dependencies

### Error Handling
- Service-level error handling with observables
- User-friendly error messages
- Loading states and feedback
- Form validation with visual indicators

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- High contrast design
- Focus management

## Styling

The component uses the global design system defined in `/src/styles.scss`:

### CSS Classes Used
- `.routine-page` - Main container
- `.page-header` - Header section with title and actions
- `.routines-grid` - Card grid layout
- `.routine-card` - Individual routine cards
- `.modal-overlay` - Modal dialog overlay
- `.btn--primary`, `.btn--danger`, etc. - Button variants
- `.form-section` - Form section grouping
- `.badge--success`, `.badge--warning` - Status badges

### Card Grid Layout
- Responsive grid using CSS Grid
- Card-based design with hover effects
- Automatic sizing based on content
- Mobile-optimized single column layout

### Responsive Breakpoints
- Desktop: 1024px+ (multi-column grid)
- Tablet: 768px - 1023px (reduced columns)
- Mobile: 320px - 767px (single column)

## Unique Features

### Dynamic Step Management
Unlike other CRUD components, the RoutineComponent includes sophisticated step management:

- **Dynamic FormArray**: Steps are managed using Angular's FormArray
- **Add/Remove Steps**: Users can dynamically add or remove steps
- **Visual Step Numbers**: Each step shows its position in the sequence
- **Minimum Step Requirement**: Ensures at least one step exists

### Model Association
The component supports associating external model files:

- **3D Model Integration**: For AR visualization in mobile applications
- **Inference Model Support**: For AI-powered analysis and recommendations
- **Status Visualization**: Clear indicators of model availability
- **Optional Integration**: Models are optional and can be added independently

### Duplication Feature
Advanced duplication functionality:

- **One-Click Duplication**: Easily create copies of existing routines
- **Smart Naming**: Automatically appends "(Copia)" to duplicated names
- **Full Data Copy**: Copies all fields including steps and model associations

## Service Features

The `RoutineService` provides comprehensive functionality:

### CRUD Operations
- `getRoutines()` - Fetch all routines
- `getRoutineById(id)` - Fetch specific routine
- `createRoutine(data)` - Create new routine
- `updateRoutine(id, data)` - Update existing routine
- `deleteRoutine(id)` - Delete routine

### Advanced Features
- `searchRoutines(term)` - Search across all routine fields
- `duplicateRoutine(id)` - Create routine copies
- `getRoutineStats()` - Get usage statistics

### Validation & Error Handling
- Name uniqueness validation
- Required field validation
- Comprehensive error messages
- Observable-based error handling

## Testing

The component includes comprehensive testing:

- Unit tests for component logic
- Service tests for CRUD operations
- Form validation tests
- Mock data for development and testing

Run tests with:
```bash
npm test
```

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Select multiple routines for bulk operations
2. **Routine Templates**: Pre-defined routine templates for common tasks
3. **Step Media**: Add images or videos to individual steps
4. **Routine Versioning**: Track changes and maintain version history
5. **Execution Tracking**: Monitor routine execution and completion
6. **Collaborative Editing**: Multiple users editing routines simultaneously

### AR Integration
The component is designed to support augmented reality workflows:

1. **3D Model Visualization**: Display 3D models in AR environment
2. **Step-by-Step Guidance**: AR overlay showing current step instructions
3. **Real-time Inference**: AI-powered quality control and guidance
4. **Progress Tracking**: Monitor user progress through routine steps

### Backend Integration
Currently uses mock data through `RoutineService`. To integrate with a real backend:

1. Replace mock service methods with HTTP calls
2. Add file upload functionality for model files
3. Implement proper authentication and authorization
4. Add real-time synchronization for collaborative features

## Dependencies

- `@angular/core`
- `@angular/common`
- `@angular/forms` (ReactiveFormsModule, FormsModule)
- Custom `RoutineService`
- Custom `Routine` model

## File Structure

```
src/app/pages/routine/
├── routine.component.ts       # Component logic
├── routine.component.html     # Template with modern @if/@for syntax
├── routine.component.scss     # Comprehensive styling
└── routine.component.spec.ts  # Unit tests

src/app/services/
├── routine.service.ts         # Service implementation
└── routine.service.spec.ts    # Service tests

src/app/models/
└── routines.model.ts          # Routine interface
```

---

**Note**: This component is designed for workflow management in augmented reality applications. The routine structure supports both manual procedures and AI-assisted workflows with 3D visualization capabilities.
