export interface ServiceImage {
    id: number;
    service_id: number;
    file_path: string;
    original_filename?: string;
    uploader_id?: number;
    upload_timestamp: Date;
    display_order: number;
    is_primary: boolean;
    file_size?: number;
    mime_type?: string;
}
export declare class ImageService {
    private imagesDir;
    constructor();
    private ensureImagesDirectory;
    private getDbConnection;
    generateUniqueFilename(originalFilename: string): string;
    validateImageFile(file: Express.Multer.File): {
        valid: boolean;
        error?: string;
    };
    saveImageFile(file: Express.Multer.File): Promise<string>;
    deleteImageFile(filePath: string): Promise<void>;
    saveImageToDatabase(serviceId: number, filePath: string, originalFilename: string, uploaderId?: number, fileSize?: number, mimeType?: string, displayOrder?: number, isPrimary?: boolean): Promise<number>;
    getServiceImages(serviceId: number): Promise<ServiceImage[]>;
    deleteImageFromDatabase(imageId: number, serviceId?: number): Promise<ServiceImage | null>;
    countServiceImages(serviceId: number): Promise<number>;
    setPrimaryImage(imageId: number, serviceId: number): Promise<boolean>;
    updateImageOrder(imageId: number, serviceId: number, newOrder: number): Promise<boolean>;
}
export declare const imageService: ImageService;
//# sourceMappingURL=imageService.d.ts.map