import { Injectable } from '@angular/core';
import { Observable, from, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { AnnotationProject, ImageAnnotation, BoundingBox, ExportSettings } from '../models/annotation.model';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ExportResult {
  success: boolean;
  message: string;
  fileName?: string;
  errors?: string[];
}

export interface DatasetSplit {
  train: ImageAnnotation[];
  validation: ImageAnnotation[];
  test: ImageAnnotation[];
}

@Injectable({
  providedIn: 'root'
})
export class YoloExportService {

  constructor() {}

  /**
   * Export project as YOLO format ZIP file
   */
  exportProject(project: AnnotationProject): Observable<ExportResult> {
    return from(this.generateYoloExport(project)).pipe(
      map(result => ({
        success: true,
        message: `Successfully exported ${project.name}`,
        fileName: result.fileName
      })),
      catchError(error => of({
        success: false,
        message: 'Export failed',
        errors: [error.message]
      }))
    );
  }

  /**
   * Generate YOLO format labels for a single image
   */
  generateYoloLabelsForImage(image: ImageAnnotation, classes: any[]): string {
    if (!image.boundingBoxes.length) return '';

    const lines = image.boundingBoxes.map(box => {
      const classIndex = classes.findIndex(c => c.id === box.classId);
      if (classIndex === -1) return null;

      // YOLO format: class_id center_x center_y width height (normalized)
      const centerX = box.x + (box.width / 2);
      const centerY = box.y + (box.height / 2);

      return `${classIndex} ${centerX.toFixed(6)} ${centerY.toFixed(6)} ${box.width.toFixed(6)} ${box.height.toFixed(6)}`;
    }).filter(line => line !== null);

    return lines.join('\n');
  }

  /**
   * Generate classes.txt file content
   */
  generateClassesFile(classes: any[]): string {
    return classes
      .sort((a, b) => a.id - b.id)
      .map(c => c.name)
      .join('\n');
  }

  /**
   * Generate data.yaml file for YOLO training
   */
  generateDataYaml(project: AnnotationProject, split?: DatasetSplit): string {
    const classNames = project.classes
      .sort((a, b) => a.id - b.id)
      .map(c => c.name);

    let yaml = `# YOLO Dataset Configuration
# Generated from ${project.name}
# Date: ${new Date().toISOString()}

`;

    if (split) {
      yaml += `# Dataset splits
train: train/images
val: val/images
test: test/images

`;
    } else {
      yaml += `# Dataset path
path: ./
train: images
val: images

`;
    }

    yaml += `# Number of classes
nc: ${classNames.length}

# Class names
names:
`;

    classNames.forEach((name, index) => {
      yaml += `  ${index}: '${name}'\n`;
    });

    return yaml;
  }

  /**
   * Split dataset into train/validation/test sets
   */
  splitDataset(images: ImageAnnotation[], settings: ExportSettings): DatasetSplit {
    if (!settings.splitDataset) {
      return {
        train: images,
        validation: [],
        test: []
      };
    }

    const shuffled = [...images].sort(() => Math.random() - 0.5);
    const totalImages = shuffled.length;

    const trainRatio = settings.trainRatio || 0.7;
    const validationRatio = settings.validationRatio || 0.2;
    const testRatio = settings.testRatio || 0.1;

    // Normalize ratios to ensure they sum to 1
    const totalRatio = trainRatio + validationRatio + testRatio;
    const normalizedTrainRatio = trainRatio / totalRatio;
    const normalizedValRatio = validationRatio / totalRatio;

    const trainCount = Math.floor(totalImages * normalizedTrainRatio);
    const valCount = Math.floor(totalImages * normalizedValRatio);

    return {
      train: shuffled.slice(0, trainCount),
      validation: shuffled.slice(trainCount, trainCount + valCount),
      test: shuffled.slice(trainCount + valCount)
    };
  }

  /**
   * Validate annotations before export
   */
  validateProject(project: AnnotationProject): string[] {
    const errors: string[] = [];

    // Check if project has classes
    if (!project.classes.length) {
      errors.push('Project must have at least one class defined');
    }

    // Check if project has images
    if (!project.images.length) {
      errors.push('Project must have at least one image');
    }

    // Check for duplicate class IDs
    const classIds = project.classes.map(c => c.id);
    const uniqueClassIds = new Set(classIds);
    if (classIds.length !== uniqueClassIds.size) {
      errors.push('Duplicate class IDs found');
    }

    // Check for invalid bounding boxes
    project.images.forEach((image, imageIndex) => {
      image.boundingBoxes.forEach((box, boxIndex) => {
        // Check bounds
        if (box.x < 0 || box.y < 0 || box.x > 1 || box.y > 1) {
          errors.push(`Image ${imageIndex + 1}, Box ${boxIndex + 1}: Coordinates out of bounds`);
        }

        if (box.width <= 0 || box.height <= 0) {
          errors.push(`Image ${imageIndex + 1}, Box ${boxIndex + 1}: Invalid dimensions`);
        }

        if (box.x + box.width > 1 || box.y + box.height > 1) {
          errors.push(`Image ${imageIndex + 1}, Box ${boxIndex + 1}: Box extends beyond image bounds`);
        }

        // Check if class exists
        if (!project.classes.find(c => c.id === box.classId)) {
          errors.push(`Image ${imageIndex + 1}, Box ${boxIndex + 1}: Invalid class ID ${box.classId}`);
        }
      });
    });

    return errors;
  }

  /**
   * Generate export statistics
   */
  generateExportStats(project: AnnotationProject, split?: DatasetSplit): any {
    const stats = {
      totalImages: project.images.length,
      totalAnnotations: project.images.reduce((sum, img) => sum + img.boundingBoxes.length, 0),
      completedImages: project.images.filter(img => img.isCompleted).length,
      classDistribution: {} as any,
      averageBoxesPerImage: 0,
      split: split ? {
        train: split.train.length,
        validation: split.validation.length,
        test: split.test.length
      } : null
    };

    // Calculate class distribution
    project.classes.forEach(cls => {
      stats.classDistribution[cls.name] = 0;
    });

    project.images.forEach(image => {
      image.boundingBoxes.forEach(box => {
        const className = project.classes.find(c => c.id === box.classId)?.name;
        if (className) {
          stats.classDistribution[className]++;
        }
      });
    });

    stats.averageBoxesPerImage = stats.totalImages > 0 
      ? Math.round((stats.totalAnnotations / stats.totalImages) * 100) / 100 
      : 0;

    return stats;
  }

  /**
   * Main export generation method
   */
  private async generateYoloExport(project: AnnotationProject): Promise<{ fileName: string }> {
    // Validate project
    const validationErrors = this.validateProject(project);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const zip = new JSZip();
    const settings = project.exportSettings;

    // Split dataset if requested
    const split = this.splitDataset(project.images, settings);

    // Generate data.yaml
    const dataYaml = this.generateDataYaml(project, settings.splitDataset ? split : undefined);
    zip.file('data.yaml', dataYaml);

    // Generate classes.txt
    const classesContent = this.generateClassesFile(project.classes);
    zip.file('classes.txt', classesContent);

    // Generate export statistics
    const stats = this.generateExportStats(project, settings.splitDataset ? split : undefined);
    zip.file('export_stats.json', JSON.stringify(stats, null, 2));

    // Generate README
    const readme = this.generateReadme(project, stats);
    zip.file('README.md', readme);

    if (settings.splitDataset) {
      // Create split structure
      await this.addSplitToZip(zip, 'train', split.train, project.classes, settings.includeImages);
      await this.addSplitToZip(zip, 'val', split.validation, project.classes, settings.includeImages);
      if (split.test.length > 0) {
        await this.addSplitToZip(zip, 'test', split.test, project.classes, settings.includeImages);
      }
    } else {
      // Single directory structure
      await this.addSplitToZip(zip, '', project.images, project.classes, settings.includeImages);
    }

    // Generate and download ZIP
    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_yolo_${new Date().toISOString().slice(0, 10)}.zip`;
    saveAs(content, fileName);

    return { fileName };
  }

  private async addSplitToZip(
    zip: JSZip, 
    splitName: string, 
    images: ImageAnnotation[], 
    classes: any[],
    includeImages: boolean
  ): Promise<void> {
    const baseFolder = splitName ? `${splitName}/` : '';
    const labelsFolder = zip.folder(`${baseFolder}labels`);
    const imagesFolder = includeImages ? zip.folder(`${baseFolder}images`) : null;

    for (const image of images) {
      // Generate label file
      const labelContent = this.generateYoloLabelsForImage(image, classes);
      const labelFileName = image.filename.replace(/\.[^/.]+$/, '.txt');
      labelsFolder?.file(labelFileName, labelContent);

      // Add image file if requested
      if (includeImages && imagesFolder) {
        try {
          const imageBlob = await this.loadImageAsBlob(image.path);
          imagesFolder.file(image.filename, imageBlob);
        } catch (error) {
          console.warn(`Failed to load image ${image.filename}:`, error);
          // Continue with other images
        }
      }
    }
  }

  private async loadImageAsBlob(imagePath: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      fetch(imagePath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then(resolve)
        .catch(reject);
    });
  }

  private generateReadme(project: AnnotationProject, stats: any): string {
    return `# ${project.name}

## Dataset Information

- **Total Images**: ${stats.totalImages}
- **Total Annotations**: ${stats.totalAnnotations}
- **Completed Images**: ${stats.completedImages}
- **Average Boxes per Image**: ${stats.averageBoxesPerImage}
- **Export Date**: ${new Date().toISOString()}

## Classes

${project.classes.map((cls, index) => `${index}. **${cls.name}** (${stats.classDistribution[cls.name]} annotations)`).join('\n')}

## Dataset Structure

\`\`\`
${project.exportSettings.splitDataset ? `
train/
├── images/     # Training images
└── labels/     # Training labels

val/
├── images/     # Validation images  
└── labels/     # Validation labels

test/
├── images/     # Test images (if available)
└── labels/     # Test labels
` : `
images/         # All images
labels/         # All labels
`}
data.yaml       # YOLO configuration file
classes.txt     # Class names list
export_stats.json # Export statistics
README.md       # This file
\`\`\`

## Usage with YOLO

This dataset is ready to use with YOLOv5, YOLOv8, or other YOLO variants.

### YOLOv8 Example:
\`\`\`bash
# Train a model
yolo train data=data.yaml model=yolov8n.pt epochs=100

# Validate
yolo val data=data.yaml model=runs/detect/train/weights/best.pt
\`\`\`

## Label Format

Labels are in YOLO format (normalized coordinates):
\`class_id center_x center_y width height\`

${project.description ? `\n## Description\n\n${project.description}` : ''}

---
*Generated by YOLO Annotation Tool*
`;
  }

  /**
   * Import YOLO format annotations
   */
  importYoloAnnotations(
    labelContent: string, 
    imageWidth: number, 
    imageHeight: number, 
    classes: any[]
  ): BoundingBox[] {
    const lines = labelContent.trim().split('\n').filter(line => line.trim());
    const boxes: BoundingBox[] = [];

    lines.forEach((line, index) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length !== 5) {
        console.warn(`Invalid label format at line ${index + 1}: ${line}`);
        return;
      }

      const [classIdStr, centerXStr, centerYStr, widthStr, heightStr] = parts;
      const classId = parseInt(classIdStr);
      const centerX = parseFloat(centerXStr);
      const centerY = parseFloat(centerYStr);
      const width = parseFloat(widthStr);
      const height = parseFloat(heightStr);

      // Validate values
      if (isNaN(classId) || isNaN(centerX) || isNaN(centerY) || isNaN(width) || isNaN(height)) {
        console.warn(`Invalid numeric values at line ${index + 1}: ${line}`);
        return;
      }

      if (classId < 0 || classId >= classes.length) {
        console.warn(`Invalid class ID ${classId} at line ${index + 1}. Available classes: 0-${classes.length - 1}`);
        return;
      }

      // Convert from center coordinates to top-left coordinates
      const x = centerX - (width / 2);
      const y = centerY - (height / 2);

      const box: BoundingBox = {
        id: crypto.randomUUID(),
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        width: Math.max(0, Math.min(1 - x, width)),
        height: Math.max(0, Math.min(1 - y, height)),
        classId: classes[classId].id,
        className: classes[classId].name
      };

      boxes.push(box);
    });

    return boxes;
  }

  /**
   * Export preview (without downloading)
   */
  generateExportPreview(project: AnnotationProject): Observable<any> {
    const split = this.splitDataset(project.images, project.exportSettings);
    const stats = this.generateExportStats(project, project.exportSettings.splitDataset ? split : undefined);
    const validationErrors = this.validateProject(project);

    return of({
      stats,
      validationErrors,
      dataYaml: this.generateDataYaml(project, project.exportSettings.splitDataset ? split : undefined),
      classesFile: this.generateClassesFile(project.classes),
      sampleLabels: project.images.slice(0, 3).map(img => ({
        filename: img.filename,
        content: this.generateYoloLabelsForImage(img, project.classes)
      }))
    });
  }
}
