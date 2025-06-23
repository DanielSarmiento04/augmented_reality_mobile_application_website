import { Component, Output, EventEmitter, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { YoloClass } from '../../../core/models/annotation.model';

@Component({
  selector: 'custom-class-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="class-selector"
         role="toolbar"
         aria-label="Class selection toolbar"
         [attr.aria-activedescendant]="'class-' + selectedClassId()">

      <div class="class-selector__header">
        <h3 class="class-selector__title">Classes</h3>
        <button
          class="btn btn--icon btn--sm"
          (click)="toggleAddMode()"
          [attr.aria-label]="isAddingClass() ? 'Cancel adding class' : 'Add new class'"
          [attr.aria-expanded]="isAddingClass()">
          <span [class]="isAddingClass() ? 'icon-close' : 'icon-plus'" aria-hidden="true">
            {{ isAddingClass() ? '✕' : '+' }}
          </span>
        </button>
      </div>

      <!-- Add new class form -->
      <div class="class-form"
           [class.class-form--visible]="isAddingClass()"
           [attr.aria-hidden]="!isAddingClass()">
        <div class="form-group">
          <label for="class-name-input" class="form-label">Class Name</label>
          <input
            id="class-name-input"
            type="text"
            class="form-input"
            [(ngModel)]="newClassName"
            (keydown.enter)="addNewClass()"
            (keydown.escape)="cancelAdd()"
            placeholder="Enter class name"
            [attr.aria-describedby]="'class-name-help'"
            maxlength="50">
          <div id="class-name-help" class="form-help">
            Press Enter to add, Escape to cancel
          </div>
        </div>

        <div class="form-group">
          <label for="class-color-input" class="form-label">Color</label>
          <div class="color-input-group">
            <input
              id="class-color-input"
              type="color"
              class="form-input form-input--color"
              [(ngModel)]="newClassColor"
              [attr.aria-label]="'Color for ' + newClassName">
            <input
              type="text"
              class="form-input form-input--hex"
              [(ngModel)]="newClassColor"
              pattern="^#[0-9A-Fa-f]{6}$"
              placeholder="#000000"
              maxlength="7">
          </div>
        </div>

        <div class="form-group">
          <label for="class-shortcut-input" class="form-label">Shortcut (Optional)</label>
          <input
            id="class-shortcut-input"
            type="text"
            class="form-input"
            [(ngModel)]="newClassShortcut"
            placeholder="e.g., 1, 2, a, b"
            maxlength="1"
            (keydown)="onShortcutKeyDown($event)">
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn btn--primary btn--sm"
            (click)="addNewClass()"
            [disabled]="!newClassName.trim()">
            Add Class
          </button>
          <button
            type="button"
            class="btn btn--secondary btn--sm"
            (click)="cancelAdd()">
            Cancel
          </button>
        </div>
      </div>

      <!-- Class list -->
      <div class="class-list" role="radiogroup" aria-label="Available classes">
        <div
          *ngFor="let classItem of classes(); trackBy: trackByClassId"
          class="class-item"
          [class.class-item--selected]="classItem.id === selectedClassId()"
          [class.class-item--editing]="editingClassId() === classItem.id"
          [attr.id]="'class-' + classItem.id"
          role="radio"
          [attr.aria-checked]="classItem.id === selectedClassId()"
          [attr.aria-label]="'Class: ' + classItem.name + (classItem.shortcut ? ', shortcut: ' + classItem.shortcut : '')"
          tabindex="0"
          (click)="selectClass(classItem.id)"
          (keydown)="onClassKeyDown($event, classItem)"
          (dblclick)="startEditing(classItem)">

          <div class="class-item__color"
               [style.background-color]="classItem.color"
               [attr.aria-label]="'Color: ' + classItem.color">
          </div>

          <div class="class-item__content">
            <div class="class-item__name"
                 [class.sr-only]="editingClassId() === classItem.id">
              {{ classItem.name }}
            </div>

            <!-- Edit form -->
            <div class="class-item__edit-form"
                 [class.class-item__edit-form--visible]="editingClassId() === classItem.id">
              <input
                type="text"
                class="form-input form-input--sm"
                [(ngModel)]="editingClassName"
                (keydown.enter)="saveEdit(classItem)"
                (keydown.escape)="cancelEdit()"
                (click)="$event.stopPropagation()"
                [attr.aria-label]="'Edit name for ' + classItem.name">
            </div>

            <div class="class-item__shortcut"
                 *ngIf="classItem.shortcut"
                 [attr.aria-label]="'Shortcut: ' + classItem.shortcut">
              {{ classItem.shortcut }}
            </div>
          </div>

          <div class="class-item__actions">
            <button
              class="btn btn--icon btn--xs"
              (click)="startEditing(classItem); $event.stopPropagation()"
              [attr.aria-label]="'Edit ' + classItem.name"
              type="button">
              <span class="icon-edit" aria-hidden="true">✏️</span>
            </button>
            <button
              class="btn btn--icon btn--xs btn--danger"
              (click)="deleteClass(classItem); $event.stopPropagation()"
              [attr.aria-label]="'Delete ' + classItem.name"
              type="button">
              <span class="icon-delete" aria-hidden="true">🗑️</span>
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div class="class-list__empty" *ngIf="classes().length === 0">
          <p>No classes defined yet.</p>
          <p>Add a class to start annotating.</p>
        </div>
      </div>

      <!-- Keyboard shortcuts help -->
      <div class="class-selector__help">
        <details>
          <summary>Keyboard Shortcuts</summary>
          <dl class="shortcut-list">
            <dt>1-9</dt>
            <dd>Select class by shortcut</dd>
            <dt>Enter</dt>
            <dd>Confirm selection</dd>
            <dt>Space</dt>
            <dd>Toggle selection</dd>
            <dt>↑↓</dt>
            <dd>Navigate classes</dd>
          </dl>
        </details>
      </div>
    </div>
  `,
  styleUrls: ['./class-selector.component.scss']
})
export class ClassSelectorComponent {
  // Component inputs using the new input() function
  classes = input<YoloClass[]>([]);
  selectedClassId = input<number>(0);

  @Output() classSelected = new EventEmitter<number>();
  @Output() classAdded = new EventEmitter<{ name: string; color: string; shortcut?: string }>();
  @Output() classUpdated = new EventEmitter<{ id: number; updates: Partial<YoloClass> }>();
  @Output() classDeleted = new EventEmitter<number>();

  // Component state
  isAddingClass = signal(false);
  editingClassId = signal<number | null>(null);

  // Form fields
  newClassName = '';
  newClassColor = '#ff0000';
  newClassShortcut = '';
  editingClassName = '';

  // Computed values
  availableShortcuts = computed(() => {
    const usedShortcuts = new Set(this.classes().map(c => c.shortcut).filter(Boolean));
    const numbers = Array.from({length: 9}, (_, i) => (i + 1).toString());
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

    return [...numbers, ...letters].filter(key => !usedShortcuts.has(key));
  });

  trackByClassId(index: number, item: YoloClass): number {
    return item.id;
  }

  selectClass(classId: number) {
    this.classSelected.emit(classId);
  }

  toggleAddMode() {
    this.isAddingClass.update(current => !current);
    if (this.isAddingClass()) {
      this.resetAddForm();
      // Focus the name input after the view updates
      setTimeout(() => {
        const input = document.getElementById('class-name-input') as HTMLInputElement;
        input?.focus();
      });
    }
  }

  addNewClass() {
    const name = this.newClassName.trim();
    if (!name) return;

    // Auto-assign shortcut if none provided
    const shortcut = this.newClassShortcut || this.availableShortcuts()[0];

    this.classAdded.emit({
      name,
      color: this.newClassColor,
      shortcut
    });

    this.resetAddForm();
    this.isAddingClass.set(false);
  }

  cancelAdd() {
    this.resetAddForm();
    this.isAddingClass.set(false);
  }

  startEditing(classItem: YoloClass) {
    this.editingClassId.set(classItem.id);
    this.editingClassName = classItem.name;

    // Focus the edit input after the view updates
    setTimeout(() => {
      const input = document.querySelector('.class-item__edit-form--visible input') as HTMLInputElement;
      input?.focus();
      input?.select();
    });
  }

  saveEdit(classItem: YoloClass) {
    const newName = this.editingClassName.trim();
    if (newName && newName !== classItem.name) {
      this.classUpdated.emit({
        id: classItem.id,
        updates: { name: newName }
      });
    }
    this.cancelEdit();
  }

  cancelEdit() {
    this.editingClassId.set(null);
    this.editingClassName = '';
  }

  deleteClass(classItem: YoloClass) {
    if (confirm(`Are you sure you want to delete "${classItem.name}"? This will also remove all annotations with this class.`)) {
      this.classDeleted.emit(classItem.id);
    }
  }

  onClassKeyDown(event: KeyboardEvent, classItem: YoloClass) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectClass(classItem.id);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigateClasses(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.navigateClasses(1);
        break;
      case 'F2':
        event.preventDefault();
        this.startEditing(classItem);
        break;
      case 'Delete':
        event.preventDefault();
        this.deleteClass(classItem);
        break;
    }
  }

  onShortcutKeyDown(event: KeyboardEvent) {
    // Only allow alphanumeric characters
    if (!/^[a-zA-Z0-9]$/.test(event.key) && !['Backspace', 'Delete', 'Tab'].includes(event.key)) {
      event.preventDefault();
    }
  }

  private navigateClasses(direction: number) {
    const classes = this.classes();
    const currentIndex = classes.findIndex(c => c.id === this.selectedClassId());
    const newIndex = Math.max(0, Math.min(classes.length - 1, currentIndex + direction));

    if (newIndex !== currentIndex) {
      this.selectClass(classes[newIndex].id);

      // Focus the new class item
      const element = document.getElementById(`class-${classes[newIndex].id}`);
      element?.focus();
    }
  }

  private resetAddForm() {
    this.newClassName = '';
    this.newClassColor = this.generateRandomColor();
    this.newClassShortcut = '';
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const usedColors = new Set(this.classes().map(c => c.color));
    const availableColors = colors.filter(color => !usedColors.has(color));

    return availableColors.length > 0
      ? availableColors[Math.floor(Math.random() * availableColors.length)]
      : colors[Math.floor(Math.random() * colors.length)];
  }
}
