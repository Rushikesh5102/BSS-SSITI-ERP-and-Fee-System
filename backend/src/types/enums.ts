export enum Role {
    ADMIN = 'ADMIN',
    ACCOUNTANT = 'ACCOUNTANT',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
    PARENT = 'PARENT',
    DEVELOPER = 'DEVELOPER',
    STORE_MANAGER = 'STORE_MANAGER',
    LIBRARIAN = 'LIBRARIAN',
    SUPERADMIN = 'SUPERADMIN'
}

export enum PaymentMode {
    CASH = 'CASH',
    CHEQUE = 'CHEQUE',
    BANK_TRANSFER = 'BANK_TRANSFER',
    UPI = 'UPI',
    CARD = 'CARD',
    NET_BANKING = 'NET_BANKING',
    RAZORPAY = 'RAZORPAY',
    STRIPE = 'STRIPE'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

export enum NotificationChannel {
    SMS = 'SMS',
    EMAIL = 'EMAIL',
    WHATSAPP = 'WHATSAPP',
    IN_APP = 'IN_APP'
}

export enum NotificationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED'
}

export enum AuditAction {
    // ── Payments & Receipts ──────────────────────────────────────────────────────
    PAYMENT_RECORDED = 'PAYMENT_RECORDED',
    PAYMENT_APPROVED = 'PAYMENT_APPROVED',
    PAYMENT_UPDATED = 'PAYMENT_UPDATED',
    PAYMENT_DELETED = 'PAYMENT_DELETED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    RECEIPT_GENERATED = 'RECEIPT_GENERATED',

    // ── Fee Structures ───────────────────────────────────────────────────────────
    FEE_STRUCTURE_CREATED = 'FEE_STRUCTURE_CREATED',
    FEE_STRUCTURE_MODIFIED = 'FEE_STRUCTURE_MODIFIED',
    FEE_STRUCTURE_DELETED = 'FEE_STRUCTURE_DELETED',
    FEE_ASSIGNED = 'FEE_ASSIGNED',
    FEE_CATEGORY_CREATED = 'FEE_CATEGORY_CREATED',
    FEE_CATEGORY_UPDATED = 'FEE_CATEGORY_UPDATED',

    // ── Students ─────────────────────────────────────────────────────────────────
    STUDENT_CREATED = 'STUDENT_CREATED',
    STUDENT_UPDATED = 'STUDENT_UPDATED',
    STUDENT_DELETED = 'STUDENT_DELETED',

    // ── Users / Staff ────────────────────────────────────────────────────────────
    USER_CREATED = 'USER_CREATED',
    USER_UPDATED = 'USER_UPDATED',
    USER_DELETED = 'USER_DELETED',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',

    // ── Branches ─────────────────────────────────────────────────────────────────
    BRANCH_CREATED = 'BRANCH_CREATED',
    BRANCH_UPDATED = 'BRANCH_UPDATED',

    // ── Store / Inventory ────────────────────────────────────────────────────────
    STOCK_INWARD = 'STOCK_INWARD',
    STOCK_OUTWARD = 'STOCK_OUTWARD',
    STOCK_ADJUSTED = 'STOCK_ADJUSTED',
    ITEM_CREATED = 'ITEM_CREATED',
    ITEM_UPDATED = 'ITEM_UPDATED',
    ITEM_DELETED = 'ITEM_DELETED',
    SUPPLIER_ADDED = 'SUPPLIER_ADDED',
    SUPPLIER_UPDATED = 'SUPPLIER_UPDATED',
    SUPPLIER_DELETED = 'SUPPLIER_DELETED',

    // ── Library ──────────────────────────────────────────────────────────────────
    BOOK_CREATED = 'BOOK_CREATED',
    BOOK_UPDATED = 'BOOK_UPDATED',
    BOOK_DELETED = 'BOOK_DELETED',
    BOOK_ISSUED = 'BOOK_ISSUED',
    BOOK_RETURNED = 'BOOK_RETURNED',

    // ── Inquiries ────────────────────────────────────────────────────────────────
    INQUIRY_CREATED = 'INQUIRY_CREATED',
    INQUIRY_UPDATED = 'INQUIRY_UPDATED',
    INQUIRY_DELETED = 'INQUIRY_DELETED',
}
