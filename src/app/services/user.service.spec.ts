import { TestBed } from '@angular/core/testing';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return users list', (done) => {
    service.getUsers().subscribe(users => {
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].id).toBeDefined();
      expect(users[0].username).toBeDefined();
      expect(users[0].email).toBeDefined();
      expect(users[0].role).toBeDefined();
      done();
    });
  });

  it('should create a new user', (done) => {
    const newUserData = {
      username: 'test_user',
      email: 'test@example.com',
      password: 'password123',
      role: 'user' as const
    };

    service.createUser(newUserData).subscribe(user => {
      expect(user.id).toBeDefined();
      expect(user.username).toBe(newUserData.username);
      expect(user.email).toBe(newUserData.email);
      expect(user.role).toBe(newUserData.role);
      done();
    });
  });

  it('should update a user', (done) => {
    const updateData = {
      username: 'updated_user',
      email: 'updated@example.com'
    };

    service.updateUser('1', updateData).subscribe(user => {
      expect(user.username).toBe(updateData.username);
      expect(user.email).toBe(updateData.email);
      expect(user.updatedAt).toBeInstanceOf(Date);
      done();
    });
  });
});
