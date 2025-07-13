import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError, switchMap, map } from 'rxjs';
import { Routine } from '../models/routines.model';
import { User } from '../models/user.model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class RoutineService {
  private mockUsers: User[] = [
    {
      id: '1',
      username: 'john_doe',
      email: 'john@example.com',
      role: 'user',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      username: 'jane_smith',
      email: 'jane@example.com',
      role: 'user',
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10')
    },
    {
      id: '3',
      username: 'mike_admin',
      email: 'mike@example.com',
      role: 'admin',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  private routines: Routine[] = [
    {
      id: '1',
      name: 'Rutina de Inspección Básica',
      description: 'Rutina para inspección básica de componentes mecánicos utilizando realidad aumentada para verificar conformidad',
      steps: [
        'Verificar estado visual del componente',
        'Medir dimensiones críticas con AR',
        'Escanear códigos QR de identificación',
        'Documentar hallazgos en el sistema',
        'Generar reporte automático'
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      model_3d: 'basic_inspection_model.obj',
      model_inference: 'basic_inspection_inference.onnx',
      assignedUsers: [this.mockUsers[0], this.mockUsers[1]],
      createdBy: this.mockUsers[2],
      priority: 'high',
      status: 'active',
      estimatedDuration: 45,
      tags: ['inspección', 'calidad', 'AR'],
      department: 'Control de Calidad',
      lastExecuted: new Date('2024-03-10'),
      executionCount: 23
    },
    {
      id: '2',
      name: 'Rutina de Control de Calidad Avanzado',
      description: 'Rutina completa para control de calidad en producción con análisis de IA y modelos predictivos',
      steps: [
        'Preparar área de trabajo con marcadores AR',
        'Calibrar instrumentos de medición',
        'Ejecutar secuencia de mediciones automatizadas',
        'Analizar resultados con IA',
        'Comparar con especificaciones técnicas',
        'Aprobar o rechazar pieza con justificación',
        'Actualizar base de datos de calidad'
      ],
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10'),
      model_3d: 'quality_control_model.obj',
      model_inference: 'quality_control_inference.onnx',
      assignedUsers: [this.mockUsers[1]],
      createdBy: this.mockUsers[2],
      priority: 'urgent',
      status: 'active',
      estimatedDuration: 90,
      tags: ['calidad', 'IA', 'automatización', 'producción'],
      department: 'Producción',
      lastExecuted: new Date('2024-03-12'),
      executionCount: 156
    },
    {
      id: '3',
      name: 'Rutina de Mantenimiento Preventivo',
      description: 'Rutina para mantenimiento preventivo de maquinaria industrial con asistencia AR y checklist inteligente',
      steps: [
        'Identificar máquina con código QR',
        'Revisar niveles de lubricantes con sensores',
        'Inspeccionar conexiones eléctricas',
        'Verificar funcionamiento de componentes críticos',
        'Limpiar y lubricar según especificaciones',
        'Registrar lecturas en sistema IoT',
        'Programar próximo mantenimiento'
      ],
      createdAt: new Date('2024-03-05'),
      updatedAt: new Date('2024-03-05'),
      model_3d: null,
      model_inference: 'maintenance_inference.onnx',
      assignedUsers: [this.mockUsers[0]],
      createdBy: this.mockUsers[2],
      priority: 'medium',
      status: 'active',
      estimatedDuration: 120,
      tags: ['mantenimiento', 'preventivo', 'IoT'],
      department: 'Mantenimiento',
      lastExecuted: new Date('2024-03-08'),
      executionCount: 45
    },
    {
      id: '4',
      name: 'Rutina de Ensamblaje Guiado',
      description: 'Rutina guiada para ensamblaje de productos complejos con instrucciones AR paso a paso',
      steps: [
        'Verificar componentes disponibles con scanner',
        'Posicionar piezas según guía AR',
        'Seguir secuencia de ensamblaje holográfica',
        'Aplicar torques especificados con herramientas inteligentes',
        'Verificar conexiones con sensores',
        'Realizar pruebas funcionales automatizadas',
        'Generar certificado de ensamblaje'
      ],
      createdAt: new Date('2024-03-20'),
      updatedAt: new Date('2024-03-20'),
      model_3d: 'assembly_model.obj',
      model_inference: 'assembly_inference.onnx',
      assignedUsers: [this.mockUsers[0], this.mockUsers[1]],
      createdBy: this.mockUsers[2],
      priority: 'high',
      status: 'draft',
      estimatedDuration: 75,
      tags: ['ensamblaje', 'guiado', 'AR', 'automatización'],
      department: 'Ensamblaje',
      executionCount: 0
    }
  ];

  constructor(private userService: UserService) { }

  /**
   * Get all routines
   */
  getRoutines(): Observable<Routine[]> {
    return of([...this.routines]).pipe(delay(1000));
  }

  /**
   * Get routine by ID
   */
  getRoutineById(id: string): Observable<Routine | null> {
    const routine = this.routines.find(r => r.id === id);
    return of(routine || null).pipe(delay(500));
  }

  /**
   * Create new routine
   */
  createRoutine(routineData: Partial<Routine>): Observable<Routine> {
    // Validate required fields
    if (!routineData.name || !routineData.description) {
      return throwError(() => new Error('Missing required fields'));
    }

    // Check if name already exists
    if (this.routines.some(r => r.name === routineData.name)) {
      return throwError(() => new Error('Routine name already exists'));
    }

    const newRoutine: Routine = {
      id: Date.now().toString(),
      name: routineData.name,
      description: routineData.description,
      steps: routineData.steps || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model_3d: routineData.model_3d || null,
      model_inference: routineData.model_inference || null,
      assignedUsers: routineData.assignedUsers || [],
      createdBy: routineData.createdBy || this.mockUsers[2], // Default to admin user
      priority: routineData.priority || 'medium',
      status: 'draft',
      estimatedDuration: routineData.estimatedDuration || 60,
      tags: routineData.tags || [],
      department: routineData.department,
      executionCount: 0
    };

    this.routines.push(newRoutine);
    
    return of(newRoutine).pipe(delay(1000));
  }

  /**
   * Update routine
   */
  updateRoutine(id: string, routineData: Partial<Routine>): Observable<Routine> {
    const routineIndex = this.routines.findIndex(r => r.id === id);
    
    if (routineIndex === -1) {
      return throwError(() => new Error('Routine not found'));
    }

    // Check if name already exists (excluding current routine)
    if (routineData.name && this.routines.some(r => r.name === routineData.name && r.id !== id)) {
      return throwError(() => new Error('Routine name already exists'));
    }

    const updatedRoutine: Routine = {
      ...this.routines[routineIndex],
      ...routineData,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    this.routines[routineIndex] = updatedRoutine;
    
    return of(updatedRoutine).pipe(delay(1000));
  }

  /**
   * Delete routine
   */
  deleteRoutine(id: string): Observable<boolean> {
    const routineIndex = this.routines.findIndex(r => r.id === id);
    
    if (routineIndex === -1) {
      return throwError(() => new Error('Routine not found'));
    }

    this.routines.splice(routineIndex, 1);
    
    return of(true).pipe(delay(500));
  }

  /**
   * Search routines
   */
  searchRoutines(searchTerm: string): Observable<Routine[]> {
    const filteredRoutines = this.routines.filter(routine => 
      routine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.steps.some(step => step.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return of(filteredRoutines).pipe(delay(500));
  }

  /**
   * Get routine statistics
   */
  getRoutineStats(): Observable<{ 
    total: number; 
    withModel3D: number; 
    withInference: number; 
    avgSteps: number;
  }> {
    const stats = {
      total: this.routines.length,
      withModel3D: this.routines.filter(r => r.model_3d).length,
      withInference: this.routines.filter(r => r.model_inference).length,
      avgSteps: this.routines.reduce((sum, r) => sum + r.steps.length, 0) / this.routines.length
    };
    
    return of(stats).pipe(delay(300));
  }

  /**
   * Duplicate routine
   */
  duplicateRoutine(id: string): Observable<Routine> {
    const routine = this.routines.find(r => r.id === id);
    
    if (!routine) {
      return throwError(() => new Error('Routine not found'));
    }

    const duplicatedRoutine: Routine = {
      ...routine,
      id: Date.now().toString(),
      name: `${routine.name} (Copia)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.routines.push(duplicatedRoutine);
    
    return of(duplicatedRoutine).pipe(delay(1000));
  }

  /**
   * Get available users for assignment
   */
  getAvailableUsers(): Observable<User[]> {
    return this.userService.getUsers().pipe(
      map(users => users.filter(user => user.role !== 'admin')),
      delay(500)
    );
  }

  /**
   * Assign users to routine
   */
  assignUsersToRoutine(routineId: string, userIds: string[]): Observable<Routine> {
    const routineIndex = this.routines.findIndex(r => r.id === routineId);
    
    if (routineIndex === -1) {
      return throwError(() => new Error('Routine not found'));
    }

    const assignedUsers = this.mockUsers.filter(user => userIds.includes(user.id));
    
    this.routines[routineIndex] = {
      ...this.routines[routineIndex],
      assignedUsers,
      updatedAt: new Date()
    };
    
    return of(this.routines[routineIndex]).pipe(delay(1000));
  }

  /**
   * Update routine status
   */
  updateRoutineStatus(id: string, status: Routine['status']): Observable<Routine> {
    const routineIndex = this.routines.findIndex(r => r.id === id);
    
    if (routineIndex === -1) {
      return throwError(() => new Error('Routine not found'));
    }

    this.routines[routineIndex] = {
      ...this.routines[routineIndex],
      status,
      updatedAt: new Date()
    };
    
    return of(this.routines[routineIndex]).pipe(delay(500));
  }

  /**
   * Execute routine (increment execution count)
   */
  executeRoutine(id: string): Observable<Routine> {
    const routineIndex = this.routines.findIndex(r => r.id === id);
    
    if (routineIndex === -1) {
      return throwError(() => new Error('Routine not found'));
    }

    this.routines[routineIndex] = {
      ...this.routines[routineIndex],
      executionCount: this.routines[routineIndex].executionCount + 1,
      lastExecuted: new Date(),
      updatedAt: new Date()
    };
    
    return of(this.routines[routineIndex]).pipe(delay(1000));
  }

  /**
   * Filter routines by criteria
   */
  filterRoutines(filters: {
    status?: Routine['status'];
    priority?: Routine['priority'];
    department?: string;
    assignedUserId?: string;
    tags?: string[];
  }): Observable<Routine[]> {
    let filteredRoutines = [...this.routines];

    if (filters.status) {
      filteredRoutines = filteredRoutines.filter(r => r.status === filters.status);
    }

    if (filters.priority) {
      filteredRoutines = filteredRoutines.filter(r => r.priority === filters.priority);
    }

    if (filters.department) {
      filteredRoutines = filteredRoutines.filter(r => r.department === filters.department);
    }

    if (filters.assignedUserId) {
      filteredRoutines = filteredRoutines.filter(r => 
        r.assignedUsers.some(user => user.id === filters.assignedUserId)
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredRoutines = filteredRoutines.filter(r => 
        filters.tags!.some(tag => r.tags.includes(tag))
      );
    }

    return of(filteredRoutines).pipe(delay(500));
  }

  /**
   * Get routine analytics
   */
  getRoutineAnalytics(): Observable<{
    totalExecutions: number;
    averageDuration: number;
    mostActiveRoutine: Routine | null;
    statusDistribution: { [key: string]: number };
    priorityDistribution: { [key: string]: number };
    departmentDistribution: { [key: string]: number };
  }> {
    const analytics = {
      totalExecutions: this.routines.reduce((sum, r) => sum + r.executionCount, 0),
      averageDuration: this.routines.reduce((sum, r) => sum + r.estimatedDuration, 0) / this.routines.length,
      mostActiveRoutine: this.routines.reduce((prev, current) => 
        prev.executionCount > current.executionCount ? prev : current
      ),
      statusDistribution: this.routines.reduce((dist, routine) => {
        dist[routine.status] = (dist[routine.status] || 0) + 1;
        return dist;
      }, {} as { [key: string]: number }),
      priorityDistribution: this.routines.reduce((dist, routine) => {
        dist[routine.priority] = (dist[routine.priority] || 0) + 1;
        return dist;
      }, {} as { [key: string]: number }),
      departmentDistribution: this.routines.reduce((dist, routine) => {
        const dept = routine.department || 'Sin departamento';
        dist[dept] = (dist[dept] || 0) + 1;
        return dist;
      }, {} as { [key: string]: number })
    };
    
    return of(analytics).pipe(delay(800));
  }
}
