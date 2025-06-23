import { Component, Input, Output, EventEmitter, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToolbarAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  disabled?: boolean;
  type?: 'button' | 'toggle' | 'separator' | 'hidden';
  active?: boolean;
  group?: string;
}

@Component({
  selector: 'custom-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbar"
         role="toolbar"
         [attr.aria-label]="ariaLabel()"
         [attr.aria-orientation]="orientation()">

      <div class="toolbar__section toolbar__section--main">
        <ng-container *ngFor="let action of actions(); trackBy: trackByActionId">

          <!-- Separator -->
          <div *ngIf="action.type === 'separator'"
               class="toolbar__separator"
               role="separator"
               [attr.aria-orientation]="orientation() === 'horizontal' ? 'vertical' : 'horizontal'">
          </div>

          <!-- Button/Toggle -->
          <button *ngIf="action.type !== 'separator'"
                  class="toolbar__button"
                  [class.toolbar__button--active]="action.active"
                  [class.toolbar__button--toggle]="action.type === 'toggle'"
                  [disabled]="action.disabled"
                  [attr.aria-label]="getButtonAriaLabel(action)"
                  [attr.aria-pressed]="action.type === 'toggle' ? action.active : null"
                  [attr.title]="getTooltip(action)"
                  (click)="onActionClick(action)"
                  type="button">

            <span class="toolbar__icon" [attr.aria-hidden]="true">
              {{ action.icon }}
            </span>

            <span class="toolbar__label"
                  [class.sr-only]="compact()">
              {{ action.label }}
            </span>

            <span *ngIf="action.shortcut"
                  class="toolbar__shortcut"
                  [class.sr-only]="compact()"
                  [attr.aria-label]="'Shortcut: ' + action.shortcut">
              {{ action.shortcut }}
            </span>
          </button>
        </ng-container>
      </div>

      <!-- Progress section -->
      <div class="toolbar__section toolbar__section--progress"
           *ngIf="showProgress()"
           [attr.aria-label]="'Progress: ' + progress().percentage + '%'">
        <div class="progress-bar">
          <div class="progress-bar__track">
            <div class="progress-bar__fill"
                 [style.width.%]="progress().percentage"
                 role="progressbar"
                 [attr.aria-valuenow]="progress().percentage"
                 [attr.aria-valuemin]="0"
                 [attr.aria-valuemax]="100"
                 [attr.aria-label]="'Annotation progress: ' + progress().completed + ' of ' + progress().total + ' images completed'">
            </div>
          </div>
          <span class="progress-bar__text">
            {{ progress().completed }}/{{ progress().total }}
          </span>
        </div>
      </div>

      <!-- Status section -->
      <div class="toolbar__section toolbar__section--status" *ngIf="statusText()">
        <span class="toolbar__status"
              [attr.aria-live]="statusLive() ? 'polite' : null"
              [class]="'toolbar__status--' + statusType()">
          {{ statusText() }}
        </span>
      </div>
    </div>
  `,
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  // Component inputs using the new input() function
  actions = input<ToolbarAction[]>([]);
  compact = input(false);
  orientation = input<'horizontal' | 'vertical'>('horizontal');
  ariaLabel = input('Toolbar');

  // Progress tracking
  showProgress = input(false);
  progress = input({ completed: 0, total: 0, percentage: 0 });

  // Status display
  statusText = input('');
  statusType = input<'info' | 'success' | 'warning' | 'error'>('info');
  statusLive = input(false);

  @Output() actionTriggered = new EventEmitter<string>();

  // Computed values
  visibleActions = computed(() => {
    return this.actions().filter(action => action.type !== 'hidden');
  });

  trackByActionId(index: number, action: ToolbarAction): string {
    return action.id;
  }

  onActionClick(action: ToolbarAction) {
    if (action.disabled) return;

    // Handle toggle actions
    if (action.type === 'toggle') {
      action.active = !action.active;
    }

    this.actionTriggered.emit(action.id);
  }

  getButtonAriaLabel(action: ToolbarAction): string {
    let label = action.label;

    if (action.type === 'toggle') {
      label += action.active ? ' (active)' : ' (inactive)';
    }

    if (action.shortcut) {
      label += `, shortcut ${action.shortcut}`;
    }

    if (action.disabled) {
      label += ' (disabled)';
    }

    return label;
  }

  getTooltip(action: ToolbarAction): string {
    let tooltip = action.label;

    if (action.shortcut) {
      tooltip += ` (${action.shortcut})`;
    }

    return tooltip;
  }

  // Helper method to create common toolbar actions
  static createDefaultActions(): ToolbarAction[] {
    return [
      {
        id: 'new-project',
        label: 'New Project',
        icon: '📁',
        shortcut: 'Ctrl+N'
      },
      {
        id: 'open-project',
        label: 'Open Project',
        icon: '📂',
        shortcut: 'Ctrl+O'
      },
      {
        id: 'save-project',
        label: 'Save Project',
        icon: '💾',
        shortcut: 'Ctrl+S'
      },
      { id: 'separator-1', label: '', icon: '', type: 'separator' },
      {
        id: 'undo',
        label: 'Undo',
        icon: '↶',
        shortcut: 'Ctrl+Z'
      },
      {
        id: 'redo',
        label: 'Redo',
        icon: '↷',
        shortcut: 'Ctrl+Y'
      },
      { id: 'separator-2', label: '', icon: '', type: 'separator' },
      {
        id: 'zoom-in',
        label: 'Zoom In',
        icon: '🔍+',
        shortcut: '+'
      },
      {
        id: 'zoom-out',
        label: 'Zoom Out',
        icon: '🔍-',
        shortcut: '-'
      },
      {
        id: 'zoom-reset',
        label: 'Reset Zoom',
        icon: '⊙',
        shortcut: '0'
      },
      { id: 'separator-3', label: '', icon: '', type: 'separator' },
      {
        id: 'show-labels',
        label: 'Show Labels',
        icon: '🏷️',
        type: 'toggle',
        active: true,
        shortcut: 'L'
      },
      {
        id: 'show-grid',
        label: 'Show Grid',
        icon: '⊞',
        type: 'toggle',
        active: false,
        shortcut: 'G'
      },
      { id: 'separator-4', label: '', icon: '', type: 'separator' },
      {
        id: 'export',
        label: 'Export YOLO',
        icon: '📤',
        shortcut: 'Ctrl+E'
      }
    ];
  }

  // Helper method to create annotation-specific actions
  static createAnnotationActions(): ToolbarAction[] {
    return [
      {
        id: 'select-tool',
        label: 'Select Tool',
        icon: '👆',
        type: 'toggle',
        active: true,
        shortcut: 'V',
        group: 'tools'
      },
      {
        id: 'draw-tool',
        label: 'Draw Tool',
        icon: '⬚',
        type: 'toggle',
        active: false,
        shortcut: 'D',
        group: 'tools'
      },
      {
        id: 'pan-tool',
        label: 'Pan Tool',
        icon: '✋',
        type: 'toggle',
        active: false,
        shortcut: 'H',
        group: 'tools'
      },
      { id: 'separator-tools', label: '', icon: '', type: 'separator' },
      {
        id: 'prev-image',
        label: 'Previous Image',
        icon: '⬅️',
        shortcut: 'A'
      },
      {
        id: 'next-image',
        label: 'Next Image',
        icon: '➡️',
        shortcut: 'D'
      },
      {
        id: 'mark-complete',
        label: 'Mark Complete',
        icon: '✅',
        shortcut: 'Space'
      }
    ];
  }
}
