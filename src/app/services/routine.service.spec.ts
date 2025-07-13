import { TestBed } from '@angular/core/testing';
import { RoutineService } from './routine.service';
import { Routine } from '../models/routines.model';

describe('RoutineService', () => {
  let service: RoutineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoutineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all routines', (done) => {
    service.getRoutines().subscribe(routines => {
      expect(routines).toBeDefined();
      expect(Array.isArray(routines)).toBe(true);
      expect(routines.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should get routine by id', (done) => {
    const testId = '1';
    service.getRoutineById(testId).subscribe(routine => {
      expect(routine).toBeDefined();
      expect(routine?.id).toBe(testId);
      done();
    });
  });

  it('should return null for non-existent routine', (done) => {
    service.getRoutineById('999').subscribe(routine => {
      expect(routine).toBeNull();
      done();
    });
  });

  it('should create new routine', (done) => {
    const newRoutineData = {
      name: 'Test Routine',
      description: 'Test routine description',
      steps: ['Step 1', 'Step 2']
    };

    service.createRoutine(newRoutineData).subscribe(routine => {
      expect(routine).toBeDefined();
      expect(routine.name).toBe(newRoutineData.name);
      expect(routine.description).toBe(newRoutineData.description);
      expect(routine.steps).toEqual(newRoutineData.steps);
      expect(routine.id).toBeDefined();
      expect(routine.createdAt).toBeDefined();
      expect(routine.updatedAt).toBeDefined();
      done();
    });
  });

  it('should update existing routine', (done) => {
    const updateData = {
      name: 'Updated Routine',
      description: 'Updated description'
    };

    service.updateRoutine('1', updateData).subscribe(routine => {
      expect(routine).toBeDefined();
      expect(routine.name).toBe(updateData.name);
      expect(routine.description).toBe(updateData.description);
      expect(routine.id).toBe('1');
      done();
    });
  });

  it('should delete routine', (done) => {
    service.deleteRoutine('1').subscribe(result => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should search routines', (done) => {
    service.searchRoutines('Inspección').subscribe(routines => {
      expect(routines).toBeDefined();
      expect(Array.isArray(routines)).toBe(true);
      // Should find routines containing "Inspección" in name, description, or steps
      const hasSearchTerm = routines.some(routine =>
        routine.name.toLowerCase().includes('inspección') ||
        routine.description.toLowerCase().includes('inspección') ||
        routine.steps.some(step => step.toLowerCase().includes('inspección'))
      );
      expect(hasSearchTerm).toBe(true);
      done();
    });
  });

  it('should get routine statistics', (done) => {
    service.getRoutineStats().subscribe(stats => {
      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.withModel3D).toBe('number');
      expect(typeof stats.withInference).toBe('number');
      expect(typeof stats.avgSteps).toBe('number');
      expect(stats.total).toBeGreaterThan(0);
      done();
    });
  });

  it('should duplicate routine', (done) => {
    service.duplicateRoutine('1').subscribe(routine => {
      expect(routine).toBeDefined();
      expect(routine.name).toContain('(Copia)');
      expect(routine.id).not.toBe('1');
      expect(routine.createdAt).toBeDefined();
      expect(routine.updatedAt).toBeDefined();
      done();
    });
  });

  it('should handle errors for missing routine', (done) => {
    service.updateRoutine('999', { name: 'Test' }).subscribe(
      () => {
        fail('Should have thrown an error');
      },
      (error) => {
        expect(error.message).toBe('Routine not found');
        done();
      }
    );
  });

  it('should handle errors for duplicate routine name', (done) => {
    // First, get an existing routine name
    service.getRoutines().subscribe(routines => {
      const existingName = routines[0].name;

      service.createRoutine({
        name: existingName,
        description: 'Test description',
        steps: ['Step 1']
      }).subscribe(
        () => {
          fail('Should have thrown an error');
        },
        (error) => {
          expect(error.message).toBe('Routine name already exists');
          done();
        }
      );
    });
  });
});
