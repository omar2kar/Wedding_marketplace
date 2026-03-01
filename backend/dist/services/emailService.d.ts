interface EmailTemplate {
    subject: string;
    body: string;
}
declare class EmailService {
    constructor();
    getTemplate(templateType: string): Promise<EmailTemplate | null>;
    private replacePlaceholders;
    sendVendorApprovalEmail(vendorEmail: string, vendorName: string, businessName: string): Promise<boolean>;
    sendVendorRejectionEmail(vendorEmail: string, vendorName: string, reason: string): Promise<boolean>;
    sendServiceApprovalEmail(vendorEmail: string, vendorName: string, serviceName: string): Promise<boolean>;
    private sendEmail;
    testConnection(): Promise<boolean>;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=emailService.d.ts.map