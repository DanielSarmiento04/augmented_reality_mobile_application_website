import { Component, Input, Output, EventEmitter, computed, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: string;
  tooltip?: string;
  disabled?: boolean;
  separator?: boolean;
  priority?: number; // Higher priority actions get more prominent placement
  shortcut?: string;
  visible?: boolean;
}

@Component({
  selector: 'custom-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbar" 
         [attr.aria-orientation]="orientation"
         [style.--toolbar-columns]="optimalColumns()"
         [style.--toolbar-gap]="gridGap()"
         role="toolbar">
      
      <!-- Progress section for loading states -->
      <div class="toolbar__section toolbar__section--progress" *ngIf="showProgress">
        <div class="toolbar__progress">
          <div class="toolbar__progress-bar" [style.width.%]="progress"></div>
        </div>
      </div>

      <!-- Main action grid -->
      <div class="toolbar__section toolbar__section--main">
        <div class="toolbar__grid" *ngFor="let row of actionRows(); trackBy: trackByRow">
          <button
            *ngFor="let action of row; trackBy: trackByAction"
            type="button"
            class="toolbar__button"
            [class.toolbar__button--priority]="action.priority && action.priority > 1"
            [class.toolbar__button--disabled]="action.disabled"
            [class.toolbar__button--separator]="action.separator"
            [style.grid-column-end]="getColumnSpan(action)"
            [disabled]="action.disabled"
            [title]="getTooltip(action)"
            [attr.aria-label]="action.label"
            [attr.data-action]="action.id"
            (click)="handleAction(action)"
            (keydown.enter)="handleAction(action)"
            (keydown.space)="handleAction(action)">
            
            <!-- Icon if provided -->
            <span class="toolbar__button-icon" *ngIf="action.icon" [innerHTML]="action.icon"></span>
            
            <!-- Label -->
            <span class="toolbar__button-label">{{ action.label }}</span>
            
            <!-- Keyboard shortcut hint -->
            <span class="toolbar__button-shortcut" *ngIf="action.shortcut && showShortcuts">
              {{ action.shortcut }}
            </span>
          </button>
        </div>
      </div>

      <!-- Status section -->
      <div class="toolbar__section toolbar__section--status" *ngIf="statusMessage">
        <div class="toolbar__status" [class]="'toolbar__status--' + statusType">
          {{ statusMessage }}
        </div>
      </div>
    </div>
  `,
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent implements OnInit, OnDestroy {
  @Input() actions: ToolbarAction[] = [];
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() showProgress: boolean = false;
  @Input() progress: number = 0;
  @Input() statusMessage: string = '';
  @Input() statusType: 'info' | 'success' | 'warning' | 'error' = 'info';
  @Input() showShortcuts: boolean = true;
  @Input() responsive: boolean = true;

  @Output() actionTriggered = new EventEmitter<string>();

  // Screen size tracking
  private screenWidth = signal(window.innerWidth);
  
  // Computed properties for responsive layout
  screenSize = computed(() => {
    const width = this.screenWidth();
    if (width < 480) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1440) return 'lg';
    return 'xl';
  });

  optimalColumns = computed(() => {
    if (!this.responsive) return 4;
    
    const size = this.screenSize();
    const actionCount = this.visibleActions().length;
    
    switch (size) {
      case 'xs': return Math.min(2, actionCount);
      case 'sm': return Math.min(3, actionCount);
      case 'md': return Math.min(4, actionCount);
      case 'lg': return Math.min(6, actionCount);
      case 'xl': return Math.min(8, actionCount);
      default: return 4;
    }
  });

  gridGap = computed(() => {
    const size = this.screenSize();
    switch (size) {
      case 'xs': return 'var(--spacing-xs)';
      case 'sm': return 'var(--spacing-sm)';
      default: return 'var(--spacing-md)';
    }
  });

  visibleActions = computed(() => {
    return this.actions.filter((action, index) => {
      // Always show non-separator actions
      if (!action.separator) {
        return action.visible !== false;
      }
      
      // For separators, only show if there are visible actions after them
      const hasVisibleAfter = this.actions
        .slice(index + 1)
        .some(a => !a.separator && a.visible !== false);
      
      return hasVisibleAfter;
    });
  });

  // Group actions by separators and distribute across rows
  actionGroups = computed(() => {
    const visible = this.visibleActions();
    const groups: ToolbarAction[][] = [];
    let currentGroup: ToolbarAction[] = [];

    for (const action of visible) {
      if (action.separator && currentGroup.length > 0) {
        groups.push([...currentGroup]);
        currentGroup = [];
      } else if (!action.separator) {
        currentGroup.push(action);
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  });

  // Distribute actions optimally across rows
  actionRows = computed(() => {
    const groups = this.actionGroups();
    const columns = this.optimalColumns();
    const rows: ToolbarAction[][] = [];

    for (const group of groups) {
      // Calculate how many rows this group needs
      const priorityActions = group.filter(a => a.priority && a.priority > 1);
      const normalActions = group.filter(a => !a.priority || a.priority <= 1);
      
      let currentRow: ToolbarAction[] = [];
      let currentRowWeight = 0;

      // Process priority actions first (they may span multiple columns)
      for (const action of priorityActions) {
        const span = this.getColumnSpanValue(action);
        
        if (currentRowWeight + span > columns) {
          if (currentRow.length > 0) {
            rows.push([...currentRow]);
            currentRow = [];
            currentRowWeight = 0;
          }
        }
        
        currentRow.push(action);
        currentRowWeight += span;
      }

      // Process normal actions
      for (const action of normalActions) {
        if (currentRowWeight >= columns) {
          rows.push([...currentRow]);
          currentRow = [];
          currentRowWeight = 0;
        }
        
        currentRow.push(action);
        currentRowWeight += 1;
      }

      // Add remaining actions in current row
      if (currentRow.length > 0) {
        rows.push([...currentRow]);
      }
    }

    return rows;
  });

  ngOnInit() {
    this.updateScreenSize();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateScreenSize();
  }

  private updateScreenSize() {
    this.screenWidth.set(window.innerWidth);
  }

  handleAction(action: ToolbarAction) {
    if (!action.disabled && !action.separator) {
      this.actionTriggered.emit(action.id);
    }
  }

  getTooltip(action: ToolbarAction): string {
    let tooltip = action.tooltip || action.label;
    if (action.shortcut && this.showShortcuts) {
      tooltip += ` (${action.shortcut})`;
    }
    return tooltip;
  }

  getColumnSpan(action: ToolbarAction): string | undefined {
    const span = this.getColumnSpanValue(action);
    return span > 1 ? `span ${span}` : undefined;
  }

  private getColumnSpanValue(action: ToolbarAction): number {
    if (!action.priority) return 1;
    
    const columns = this.optimalColumns();
    const size = this.screenSize();
    
    // Priority 3+ actions can span more columns on larger screens
    if (action.priority >= 3 && size === 'xl') return Math.min(3, columns);
    if (action.priority >= 2 && (size === 'lg' || size === 'xl')) return Math.min(2, columns);
    
    return 1;
  }

  // Tracking functions for *ngFor
  trackByRow(index: number, row: ToolbarAction[]): string {
    return row.map(a => a.id).join('-');
  }

  trackByAction(index: number, action: ToolbarAction): string {
    return action.id;
  }

  // Static factory methods for creating common toolbar configurations
  static createDefaultActions(): ToolbarAction[] {
    return [
      {
        id: 'new-project',
        label: 'New Project',
        icon: '📁',
        tooltip: 'Create a new annotation project',
        priority: 2,
        shortcut: 'Ctrl+N'
      },
      {
        id: 'open-project',
        label: 'Open Project',
        icon: '📂',
        tooltip: 'Open an existing project',
        shortcut: 'Ctrl+O'
      },
      {
        id: 'save-project',
        label: 'Save Project',
        icon: '💾',
        tooltip: 'Save the current project',
        shortcut: 'Ctrl+S'
      },
      {
        id: 'separator-1',
        label: '',
        separator: true
      },
      {
        id: 'upload-images',
        label: 'Upload Images',
        icon: '🖼️',
        tooltip: 'Upload images to annotate',
        priority: 2
      },
      {
        id: 'export-annotations',
        label: 'Export',
        icon: '📤',
        tooltip: 'Export annotations in YOLO format',
        shortcut: 'Ctrl+E'
      }
    ];
  }

  static createAnnotationActions(): ToolbarAction[] {
    return [
      {
        id: 'separator-2',
        label: '',
        separator: true
      },
      {
        id: 'select-tool',
        label: 'Select',
        icon: '👆',
        tooltip: 'Select and move annotations',
        shortcut: 'V'
      },
      {
        id: 'bbox-tool',
        label: 'Bounding Box',
        icon: '⬛',
        tooltip: 'Draw bounding boxes',
        priority: 2,
        shortcut: 'B'
      },
      {
        id: 'delete-selected',
        label: 'Delete',
        icon: '🗑️',
        tooltip: 'Delete selected annotation',
        shortcut: 'Delete'
      },
      {
        id: 'separator-3',
        label: '',
        separator: true
      },
      {
        id: 'zoom-in',
        label: 'Zoom In',
        icon: '🔍+',
        tooltip: 'Zoom in on the image',
        shortcut: '+'
      },
      {
        id: 'zoom-out',
        label: 'Zoom Out',
        icon: '🔍-',
        tooltip: 'Zoom out of the image',
        shortcut: '-'
      },
      {
        id: 'zoom-fit',
        label: 'Fit to Screen',
        icon: '🖼️',
        tooltip: 'Fit image to screen',
        shortcut: 'F'
      },
      {
        id: 'separator-4',
        label: '',
        separator: true
      },
      {
        id: 'prev-image',
        label: 'Previous',
        icon: '⬅️',
        tooltip: 'Go to previous image',
        shortcut: '←'
      },
      {
        id: 'next-image',
        label: 'Next',
        icon: '➡️',
        tooltip: 'Go to next image',
        shortcut: '→'
      }
    ];
  }
}
