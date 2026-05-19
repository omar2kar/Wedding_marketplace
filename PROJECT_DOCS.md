# توثيق مشروع ONEDAY — Wedding Marketplace

> تاريخ التوثيق: 2026-05-19  
> المشروع: منصة زفاف متكاملة (Multi-role: Client / Vendor / Admin)  
> Stack: React 18 + TypeScript (Frontend) | Express 5 + TypeScript + MySQL (Backend)

---

## 1. هيكل المشروع الكامل

```
wedding-marketplace/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── database.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── vendorAuth.ts
│   │   │   └── rateLimiting.ts
│   │   ├── routes/
│   │   │   ├── adminAuth.ts
│   │   │   ├── adminClients.ts
│   │   │   ├── adminPermissions.ts
│   │   │   ├── adminReports.ts
│   │   │   ├── adminReviews.ts
│   │   │   ├── adminServices.ts
│   │   │   ├── adminSettings.ts
│   │   │   ├── adminVendors.ts
│   │   │   ├── availability.ts
│   │   │   ├── bookings.js
│   │   │   ├── clientAuth.ts
│   │   │   ├── clientRoutes.js
│   │   │   ├── emailRoutes.js
│   │   │   ├── favorites.ts
│   │   │   ├── featuredVendors.js
│   │   │   ├── imageRoutes.ts
│   │   │   ├── imageUpload.ts
│   │   │   ├── messageRoutes.js
│   │   │   ├── packageRoutes.js
│   │   │   ├── profile.ts
│   │   │   ├── reviews.ts
│   │   │   ├── searchRoutes.js
│   │   │   ├── serviceRoutes.js
│   │   │   ├── services.ts
│   │   │   ├── vendorAuth.ts
│   │   │   ├── vendorRoutes.js
│   │   │   ├── vendorServiceRoutes.js
│   │   │   ├── vendorServices.ts
│   │   │   └── weddingProfile.ts
│   │   └── services/
│   │       ├── emailService.ts
│   │       └── imageService.ts
│   ├── database/
│   ├── dist/
│   ├── tests/
│   ├── start-server.js
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── frontend/
    ├── public/
    │   └── images/
    ├── src/
    │   ├── App.tsx
    │   ├── index.tsx
    │   ├── App.css
    │   ├── index.css
    │   ├── scale-fix.css
    │   ├── i18n.ts
    │   ├── api/
    │   │   ├── request.ts
    │   │   ├── services.ts
    │   │   ├── bookingsApi.ts
    │   │   ├── reviews.ts
    │   │   ├── availability.ts
    │   │   └── wishlist.ts
    │   ├── config/
    │   │   └── axios.ts
    │   ├── context/
    │   │   ├── AuthContext.tsx
    │   │   ├── ClientContext.tsx
    │   │   ├── VendorContext.tsx
    │   │   ├── CompareContext.tsx
    │   │   ├── ThemeContext.tsx
    │   │   └── ToastContext.tsx
    │   ├── hooks/
    │   │   ├── useLocalizeDocumentAttributes.ts
    │   │   └── useToast.tsx
    │   ├── components/
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   ├── Chat.tsx
    │   │   ├── Notifications.tsx
    │   │   ├── Payment.tsx
    │   │   ├── ImageUpload.tsx
    │   │   ├── RatingStars.tsx
    │   │   ├── LocationMap.tsx
    │   │   ├── CategoryCard.tsx
    │   │   ├── AddReview.tsx
    │   │   ├── AvailabilityCalendar.tsx
    │   │   ├── ToastContainer.tsx
    │   │   ├── ToastRenderer.tsx
    │   │   ├── Toast.tsx
    │   │   ├── vendor/
    │   │   │   ├── VendorReviews.tsx
    │   │   │   ├── VendorCalendar.tsx
    │   │   │   ├── BookingsManagement.tsx
    │   │   │   └── AvailabilityManagement.tsx
    │   │   ├── icons/
    │   │   │   ├── CustomIcons.tsx
    │   │   │   └── index.ts
    │   │   ├── search/
    │   │   │   └── SearchBar.tsx
    │   │   ├── messaging/
    │   │   │   └── ChatWindow.tsx
    │   │   └── booking/
    │   │       └── BookingModal.tsx
    │   ├── pages/
    │   │   ├── Home.tsx
    │   │   ├── About.tsx
    │   │   ├── Categories.tsx
    │   │   ├── Search.tsx
    │   │   ├── Compare.tsx
    │   │   ├── Profile.tsx
    │   │   ├── AccountSettings.tsx
    │   │   ├── Help.tsx
    │   │   ├── ServiceProfile.tsx
    │   │   ├── VendorProfile.tsx
    │   │   ├── BrowseServices.tsx
    │   │   ├── CreateWishlist.tsx
    │   │   ├── BookServices.tsx
    │   │   ├── ManageAvailability.tsx
    │   │   ├── SearchResults.tsx
    │   │   ├── auth/
    │   │   │   ├── Login.tsx
    │   │   │   ├── Register.tsx
    │   │   │   └── ForgotPassword.tsx
    │   │   ├── client/
    │   │   │   ├── ClientDashboard.tsx
    │   │   │   ├── Favorites.tsx
    │   │   │   ├── Wishlist.tsx
    │   │   │   ├── ClientWishlist.tsx
    │   │   │   ├── Compare.tsx
    │   │   │   ├── ClientOrders.tsx
    │   │   │   ├── ClientSettings.tsx
    │   │   │   ├── ClientProfile.tsx
    │   │   │   ├── Booking.tsx
    │   │   │   └── WeddingProfile.tsx
    │   │   ├── vendor/
    │   │   │   ├── VendorLogin.tsx
    │   │   │   ├── VendorRegister.tsx
    │   │   │   ├── VendorForgotPassword.tsx
    │   │   │   └── VendorDashboard.tsx
    │   │   ├── planner/
    │   │   │   └── Dashboard.tsx
    │   │   └── admin/
    │   │       ├── AdminLogin.tsx
    │   │       ├── AdminDashboard.tsx
    │   │       ├── PendingVendors.tsx
    │   │       ├── AllVendors.tsx
    │   │       ├── AllClients.tsx
    │   │       ├── AllServices.tsx
    │   │       ├── AllReviews.tsx
    │   │       ├── AdminSettings.tsx
    │   │       ├── AdminPermissions.tsx
    │   │       ├── AdminReports.tsx
    │   │       └── FeaturedVendors.tsx
    │   ├── styles/
    │   └── types/
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## 2. Backend — Server الرئيسي

**الملف:** `backend/src/server.ts`

- إعداد Express مع CORS مفتوح لجميع الـ origins
- Body parser بحد 50MB
- تقديم الصور الثابتة من `frontend/public/images`
- جميع الـ routes تحت prefix `/api`
- Health check endpoint: `GET /health`
- Error handling middleware في النهاية

**نقاط التركيب الرئيسية:**
```
/api/vendor/*         → vendorAuth routes
/api/admin/*          → adminAuth routes
/api/client/*         → clientAuth routes
/api/services         → service routes
/api/bookings         → booking routes
/api/reviews          → review routes
/api/favorite         → favorites routes
/api/wedding-profile  → wedding profile routes
/api/availability     → availability routes
/api/images           → image upload/retrieval
/health               → health check
```

**ملف قديم:** `backend/start-server.js` (~988 سطر) — Express legacy مع multer وكل endpoint مدمج فيه مباشرة.

---

## 3. Backend — Routes

### 3.1 Client Authentication — `backend/src/routes/clientAuth.ts`

| Method | Path | Middleware | الوصف |
|--------|------|------------|-------|
| POST | `/client/register` | — | تسجيل عميل جديد |
| POST | `/client/login` | rateLimiting | تسجيل دخول (max 5 محاولات/15 دقيقة) |
| POST | `/client/refresh` | — | تجديد access token |
| POST | `/client/logout` | — | تسجيل خروج وحذف refresh token |

**Login Response:** `{ accessToken, refreshToken, expires_in: 3600 }`

---

### 3.2 Vendor Authentication — `backend/src/routes/vendorAuth.ts`

| Method | Path | Middleware | الوصف |
|--------|------|------------|-------|
| POST | `/vendor/register` | — | تسجيل vendor جديد |
| POST | `/vendor/login` | — | تسجيل دخول (يرفض: pending/rejected/suspended) |
| GET | `/vendor/validate-token` | — | Debug: التحقق من صحة التوكن |

---

### 3.3 Admin Authentication — `backend/src/routes/adminAuth.ts`

| Method | Path | الوصف |
|--------|------|-------|
| POST | `/admin/login` | تسجيل دخول admin |

---

### 3.4 Bookings — `backend/src/routes/bookings.js`

| Method | Path | Middleware | الوصف |
|--------|------|------------|-------|
| POST | `/bookings` | authMiddleware | إنشاء حجز جديد |
| GET | `/bookings` | — | جلب حجوزات العميل (clientId header) |
| PATCH | `/bookings/:id` | — | تعديل تاريخ الحجز (pending فقط) |
| DELETE | `/bookings/:id` | — | إلغاء الحجز |
| GET | `/bookings/client/:clientId` | — | حجوزات عميل محدد |
| GET | `/bookings/vendor/:vendorId` | — | حجوزات vendor محدد |
| PATCH | `/bookings/:bookingId/status` | vendorAuthMiddleware | تحديث حالة الحجز |

**الحقول المطلوبة للإنشاء:** `clientId, serviceId, eventDate`  
**الحقول الاختيارية:** `eventTime, eventLocation, guestCount, clientNotes`

---

### 3.5 Service Routes — `backend/src/routes/serviceRoutes.js`

| Method | Path | Middleware | الوصف |
|--------|------|------------|-------|
| GET | `/services` | — | قائمة vendors مع فلاتر |
| GET | `/services/:id` | — | تفاصيل خدمة محددة |
| POST | `/services` | authMiddleware | إنشاء خدمة |
| PUT | `/services/:id` | authMiddleware | تحديث خدمة |
| DELETE | `/services/:id` | authMiddleware | حذف خدمة |

**Query params للـ GET:** `category, minPrice, maxPrice, minRating, keyword, limit, offset`

---

### 3.6 Reviews — `backend/src/routes/reviews.ts`

| Method | Path | Middleware | الوصف |
|--------|------|------------|-------|
| GET | `/reviews/services/:serviceId/reviews` | — | جلب تقييمات خدمة (public) |
| POST | `/reviews/services/:serviceId/add` | — | إضافة تقييم |
| GET | `/reviews/services/:serviceId/summary` | — | إحصائيات التقييمات |

**الحقول المطلوبة للإضافة:** `clientId, rating (1-5), reviewText (min 10 chars)`  
**Summary يرجع:** `totalReviews, averageRating, ratingDistribution`

---

### 3.7 Vendor Routes — `backend/src/routes/vendorRoutes.js`

| Method | Path | Middleware | الوصف |
|--------|------|------------|-------|
| GET | `/vendor/profile` | vendorAuth | جلب بروفايل الـ vendor |
| PUT | `/vendor/profile` | vendorAuth | تحديث البروفايل |
| GET | `/vendor/:id/services` | — | خدمات vendor محدد |
| POST | `/vendor/services` | vendorAuth | إنشاء خدمة |
| PUT | `/vendor/services/:id` | vendorAuth | تحديث خدمة |
| DELETE | `/vendor/services/:id` | vendorAuth | حذف خدمة |
| GET | `/vendor/bookings` | vendorAuth | حجوزات الـ vendor |
| PATCH | `/vendor/bookings/:id/status` | vendorAuth | تحديث حالة الحجز |

---

### 3.8 باقي الـ Routes

| الملف | المسارات الرئيسية |
|-------|------------------|
| `availability.ts` | GET/POST `/availability` — إدارة التقويم |
| `favorites.ts` | GET/POST/DELETE `/favorite` — المفضلة |
| `imageRoutes.ts` | POST/GET/DELETE `/images` — رفع وإدارة الصور |
| `profile.ts` | GET/PUT `/profile` — إدارة بروفايل المستخدم |
| `weddingProfile.ts` | GET/POST `/wedding-profile` — بيانات الزفاف |
| `emailRoutes.js` | POST `/email/*` — إرسال البريد الإلكتروني |
| `searchRoutes.js` | GET `/search` — البحث |
| `messageRoutes.js` | GET/POST `/messages` — الرسائل المباشرة |
| `packageRoutes.js` | GET/POST `/packages` — باقات الخدمات |
| `adminVendors.ts` | CRUD `/admin/vendors` — إدارة vendors |
| `adminClients.ts` | CRUD `/admin/clients` — إدارة العملاء |
| `adminServices.ts` | CRUD `/admin/services` — إدارة الخدمات |
| `adminReviews.ts` | CRUD `/admin/reviews` — إدارة التقييمات |
| `adminReports.ts` | GET `/admin/reports` — التقارير |
| `adminPermissions.ts` | GET/PUT `/admin/permissions` — الصلاحيات |
| `adminSettings.ts` | GET/PUT `/admin/settings` — الإعدادات |

---

## 4. Backend — Middleware

**المسار:** `backend/src/middleware/`

### auth.ts

**`authMiddleware`** — Client authentication
- يقرأ `Authorization: Bearer <token>`
- يدعم demo token: `"demo-client-token"`
- يتحقق بـ `process.env.JWT_SECRET`
- يُضاف `req.user = { id, email, type }`

**`adminAuthMiddleware`** — Admin authentication
- يشترط prefix `"Bearer"`
- يتحقق أن `token.type === "admin"`
- يتحقق من عمر التوكن (max 8 ساعات)
- يُضاف `req.admin = { id, email, role, type }`

**`vendorAuthMiddleware`** — Vendor authentication
- يشترط prefix `"Bearer"`
- يتحقق أن `token.type === "vendor"`
- يُضاف `req.vendor = { id, email, type }`

### vendorAuth.ts
- Middleware مستقل لـ vendor authentication في الـ routes الجديدة
- JWT verification لتوكنات الـ vendor

### rateLimiting.ts
- Rate limiting middleware (معطّل في production حالياً)
- يمكن تطبيقه على routes محددة

---

## 5. Backend — Models & Database

**ملف الاتصال:** `backend/src/database.ts`

```typescript
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wedding_marketplace',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

**نوع الاتصال:** MySQL2 connection pool (promise-based)  
**ORM:** Prisma مُنصَّب (`@prisma/client ^6.14.0`) — الاستخدام محدود في الكود الحالي

### جداول قاعدة البيانات

| الجدول | الأعمدة الرئيسية |
|--------|-----------------|
| `clients` | id, email, password, name, phone, role, is_verified, last_login_at |
| `vendors` | id, email, password, name, business_name, phone, category, status, rating, total_reviews |
| `vendor_services` | id, vendor_id, name, description, category, price, is_active, created_at |
| `service_images` | id, service_id, file_path, original_filename, uploader_id, file_size, mime_type, display_order, is_primary |
| `bookings` | id, booking_number, client_id, vendor_id, service_id, event_date, event_time, status, total_amount |
| `service_reviews` | id, client_id, service_id, vendor_id, rating, review_text, created_at |
| `service_availability` | service_id, date, is_available, current_bookings, max_bookings |
| `favorites` | client_id, service_id |
| `refresh_tokens` | user_id, user_type, token, expires_at |
| `login_attempts` | email, user_type, ip_address, success, attempted_at |

---

## 6. Frontend — Pages & Routes

**الملف:** `frontend/src/App.tsx`

### React Router Structure

```
/admin/*                     → Admin panel (بدون Header/Footer)
  /admin/login               → AdminLogin
  /admin/dashboard           → AdminDashboard
  /admin/vendors/pending     → PendingVendors
  /admin/vendors             → AllVendors
  /admin/clients             → AllClients
  /admin/services            → AllServices
  /admin/reviews             → AllReviews
  /admin/settings            → AdminSettings
  /admin/permissions         → AdminPermissions
  /admin/reports             → AdminReports

/vendor/*                    → Vendor panel (بدون Header/Footer)
  /vendor/login              → VendorLogin
  /vendor/register           → VendorRegister
  /vendor/forgot-password    → VendorForgotPassword
  /vendor/dashboard          → VendorDashboard

/*                           → Main site (مع Header/Footer)
  /                          → Home
  /about                     → About
  /categories                → Categories
  /search                    → Search / SearchResults
  /browse-services           → BrowseServices
  /service/:id               → ServiceProfile
  /vendor/:id                → VendorProfile
  /login                     → Login (auth/Login)
  /register                  → Register (auth/Register)
  /forgot-password           → ForgotPassword
  /profile                   → Profile
  /settings                  → AccountSettings
  /help                      → Help
  /client/dashboard/*        → ClientDashboard
  /client/favorites          → Favorites
  /wishlist                  → Wishlist / ClientWishlist
  /create-wishlist           → CreateWishlist
  /compare                   → Compare
  /book-services             → BookServices
  /manage-availability       → ManageAvailability
  /chat                      → Chat
  /notifications             → Notifications
  /planner/dashboard         → planner/Dashboard
```

### وصف الصفحات

| الملف | الوصف |
|-------|-------|
| `pages/Home.tsx` | الصفحة الرئيسية — landing page |
| `pages/About.tsx` | صفحة "عن المنصة" |
| `pages/Categories.tsx` | تصفح تصنيفات الخدمات |
| `pages/Search.tsx` | البحث مع فلاتر |
| `pages/SearchResults.tsx` | نتائج البحث |
| `pages/BrowseServices.tsx` | تصفح جميع الخدمات |
| `pages/ServiceProfile.tsx` | تفاصيل خدمة بعينها |
| `pages/VendorProfile.tsx` | بروفايل vendor عام |
| `pages/Profile.tsx` | بروفايل المستخدم |
| `pages/AccountSettings.tsx` | إعدادات الحساب |
| `pages/Help.tsx` | صفحة المساعدة |
| `pages/Compare.tsx` | مقارنة الخدمات |
| `pages/CreateWishlist.tsx` | إنشاء قائمة أمنيات |
| `pages/BookServices.tsx` | حجز خدمة |
| `pages/ManageAvailability.tsx` | إدارة التوافر |
| `pages/auth/Login.tsx` | تسجيل دخول العملاء |
| `pages/auth/Register.tsx` | تسجيل عميل جديد |
| `pages/auth/ForgotPassword.tsx` | استعادة كلمة المرور |
| `pages/client/ClientDashboard.tsx` | لوحة تحكم العميل |
| `pages/client/Favorites.tsx` | المفضلة |
| `pages/client/Wishlist.tsx` | قائمة الأمنيات |
| `pages/client/ClientWishlist.tsx` | قائمة أمنيات العميل |
| `pages/client/ClientOrders.tsx` | طلبات العميل |
| `pages/client/ClientSettings.tsx` | إعدادات العميل |
| `pages/client/ClientProfile.tsx` | بروفايل العميل |
| `pages/client/Booking.tsx` | تفاصيل الحجز |
| `pages/client/WeddingProfile.tsx` | بيانات حفل الزفاف |
| `pages/vendor/VendorLogin.tsx` | تسجيل دخول vendor |
| `pages/vendor/VendorRegister.tsx` | تسجيل vendor جديد |
| `pages/vendor/VendorForgotPassword.tsx` | استعادة كلمة مرور vendor |
| `pages/vendor/VendorDashboard.tsx` | لوحة تحكم vendor |
| `pages/planner/Dashboard.tsx` | لوحة تحكم المُخطِّط |
| `pages/admin/AdminLogin.tsx` | تسجيل دخول admin |
| `pages/admin/AdminDashboard.tsx` | لوحة تحكم admin |
| `pages/admin/PendingVendors.tsx` | vendors بانتظار الموافقة |
| `pages/admin/AllVendors.tsx` | جميع الـ vendors |
| `pages/admin/AllClients.tsx` | جميع العملاء |
| `pages/admin/AllServices.tsx` | جميع الخدمات |
| `pages/admin/AllReviews.tsx` | جميع التقييمات |
| `pages/admin/AdminSettings.tsx` | إعدادات النظام |
| `pages/admin/AdminPermissions.tsx` | إدارة الصلاحيات |
| `pages/admin/AdminReports.tsx` | التقارير |
| `pages/admin/FeaturedVendors.tsx` | vendors المميزون |

---

## 7. Frontend — Components

### Core Components

| الملف | الوصف |
|-------|-------|
| `Header.tsx` | شريط التنقل مع قائمة المستخدم |
| `Footer.tsx` | Footer مع الروابط |
| `Chat.tsx` | واجهة المراسلة الرئيسية |
| `Notifications.tsx` | مركز الإشعارات |
| `Payment.tsx` | معالجة الدفع |
| `ImageUpload.tsx` | رفع الصور |
| `RatingStars.tsx` | عرض التقييم بالنجوم |
| `LocationMap.tsx` | خريطة الموقع (Leaflet) |
| `CategoryCard.tsx` | بطاقة تصنيف |
| `AddReview.tsx` | نموذج إضافة تقييم |
| `AvailabilityCalendar.tsx` | تقويم اختيار التاريخ |
| `ToastContainer.tsx` | حاوية إشعارات Toast |
| `Toast.tsx` | مكون Toast واحد |
| `ToastRenderer.tsx` | Renderer للـ Toast |

### Vendor Components — `components/vendor/`

| الملف | الوصف |
|-------|-------|
| `VendorReviews.tsx` | لوحة تقييمات الـ vendor مع إحصائيات |
| `VendorCalendar.tsx` | تقويم توافر الـ vendor |
| `BookingsManagement.tsx` | إدارة حجوزات الـ vendor |
| `AvailabilityManagement.tsx` | ضبط تواريخ التوافر |

### Other Components

| الملف | الوصف |
|-------|-------|
| `search/SearchBar.tsx` | شريط البحث |
| `messaging/ChatWindow.tsx` | نافذة المحادثة |
| `booking/BookingModal.tsx` | Modal نموذج الحجز |
| `icons/CustomIcons.tsx` | مكتبة أيقونات مخصصة |

---

## 8. Frontend — API Calls

### HTTP Client

**`frontend/src/api/request.ts`** — Generic `fetch()` wrapper:
- يُضيف `Authorization: Bearer <token>` من `localStorage`
- يُضيف `Content-Type: application/json`
- يُضيف `credentials: include` للـ CORS
- يرمي error على كل response غير 2xx
- يُحلل JSON responses تلقائياً

**`frontend/src/config/axios.ts`** — Axios instance:
```
Base URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
Timeout: 10,000ms
```
- **Request Interceptor:** يُضيف Authorization header حسب نوع التوكن (admin/vendor/client)
- **Response Interceptor:** يعالج 401 (unauthorized)

---

### API Endpoints المستخدمة

#### Services API — `frontend/src/api/services.ts`

| الدالة | الـ Endpoint | الصفحات المستخدمة |
|--------|-------------|-------------------|
| `getServiceById(id)` | `GET /api/services/:id` | ServiceProfile |
| `getAllServices()` | `GET /api/services` | BrowseServices, Home |
| `getServicesByCategory(cat)` | `GET /api/services?category=...` | Categories |
| `searchServices(query)` | `GET /api/services/search?q=...` | Search, SearchResults |

#### Bookings API — `frontend/src/api/bookingsApi.ts`

| الدالة | الـ Endpoint | الصفحات المستخدمة |
|--------|-------------|-------------------|
| `getBookings(clientId)` | `GET /api/bookings` | ClientOrders, ClientDashboard |
| `patchBooking(id, payload)` | `PATCH /api/bookings/:id` | ClientOrders |
| `deleteBooking(id)` | `DELETE /api/bookings/:id` | ClientOrders |

#### Reviews API — `frontend/src/api/reviews.ts`

| الدالة | الـ Endpoint | الصفحات المستخدمة |
|--------|-------------|-------------------|
| `getReviews(serviceId)` | `GET /api/reviews/services/:id/reviews` | ServiceProfile |
| `addReview(serviceId, payload)` | `POST /api/reviews/services/:id/add` | AddReview, ServiceProfile |
| `deleteReview(serviceId, reviewId)` | `DELETE /api/reviews/services/:id/reviews/:rid` | VendorReviews |

#### Availability API — `frontend/src/api/availability.ts`
- Endpoints: `/api/availability` (GET/POST)
- الصفحات: AvailabilityCalendar, ManageAvailability, BookingModal

#### Wishlist API — `frontend/src/api/wishlist.ts`
- Endpoints: `/api/wishlist` (GET/POST/DELETE)
- الصفحات: Wishlist, ClientWishlist, CreateWishlist

---

## 9. الإعدادات

### 9.1 Backend — `backend/package.json`

```json
{
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.11.5",
    "multer": "^2.0.2",
    "axios": "^1.11.0",
    "helmet": "^8.1.0",
    "uuid": "^9.0.1",
    "@prisma/client": "^6.14.0",
    "prisma": "^6.14.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.3",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.10.5",
    "@types/multer": "^2.0.0",
    "@types/cors": "^2.8.17",
    "typescript": "^5.9.2",
    "ts-node-dev": "^2.0.0"
  }
}
```

**Scripts:**
```json
{
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```

---

### 9.2 Frontend — `frontend/package.json`

```json
{
  "proxy": "http://localhost:5000",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.3.0",
    "axios": "^0.27.2",
    "react-hook-form": "^7.33.1",
    "react-hot-toast": "^2.2.0",
    "tailwindcss": "^3.1.6",
    "i18next": "^21.8.14",
    "react-i18next": "^11.18.1",
    "react-big-calendar": "^1.19.4",
    "react-day-picker": "^8.10.1",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "date-fns": "^3.6.0",
    "@heroicons/react": "^2.0.8",
    "autoprefixer": "^10.4.7",
    "postcss": "^8.4.14"
  }
}
```

**Scripts:**
```json
{
  "start": "react-scripts start",
  "build": "react-scripts build",
  "test": "react-scripts test",
  "eject": "react-scripts eject"
}
```

---

### 9.3 متغيرات البيئة المطلوبة

#### Backend `.env`

| المتغير | القيمة الافتراضية | المصدر في الكود |
|---------|-----------------|----------------|
| `DB_HOST` | `localhost` | `database.ts` |
| `DB_USER` | `root` | `database.ts` |
| `DB_PASSWORD` | `""` | `database.ts` |
| `DB_NAME` | `wedding_marketplace` | `database.ts` |
| `PORT` | `5000` | `server.ts` |
| `JWT_SECRET` | — | `middleware/auth.ts` |
| `FRONTEND_URL` | `http://localhost:3000` | `server.ts` (CORS) |

#### Frontend `.env`

| المتغير | القيمة الافتراضية | المصدر في الكود |
|---------|-----------------|----------------|
| `REACT_APP_API_URL` | `http://localhost:5000/api` | `config/axios.ts` |

---

### 9.4 ملف `.gitignore`

```
node_modules/
.env
frontend/node_modules/
```

---

### 9.5 إعدادات Vite/Build

**بناء Frontend:** Create React App (react-scripts) — لا يوجد vite.config

**`frontend/tailwind.config.js`:**
```js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5f0',   // champagne
          // ...
          900: '#8B4513'   // burnt sienna
        },
        secondary: {
          50: '#f0f8ff',   // sky blue light
          // ...
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  }
}
```

**`frontend/postcss.config.js`:**
```js
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} }
}
```

**`backend/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "sourceMap": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

---

## 10. CSS / Design

### Global Styles — `frontend/src/index.css` (517 سطر)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
}
```

### CSS Variables — Light Mode

```css
:root {
  --bg-primary: linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%);
  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --border-color: rgba(255, 255, 255, 0.2);
  --glass-bg: rgba(255, 255, 255, 0.28);
  --pink-primary: #ec4899;
  --pink-hover: #db2777;
  --green-primary: #10b981;
}
```

### CSS Variables — Dark Mode

```css
[data-theme="dark"] {
  --bg-primary: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  --text-primary: #ffffff;
  --glass-bg: rgba(15, 15, 35, 0.55);
  --pink-primary: linear-gradient(135deg, #667eea, #764ba2);
}
```

### Glassmorphism Utility

```css
.glass {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: var(--glass-bg);
  border: 1px solid var(--border-color);
}
```

### Design Features
- **Font:** Inter (Google Fonts) — weights: 300, 400, 500, 600, 700, 800
- **Theme:** Dark/Light mode مع CSS custom properties
- **Effects:** Glassmorphism (backdrop blur + rgba background)
- **Gradients:** Pink-to-blue (light), Navy-to-purple (dark)
- **Colors:** Warm champagne primary, calm sky-blue secondary
- **Responsive:** Tailwind CSS mobile-first

### React Big Calendar Overrides (`index.css`):
- خلفيات شفافة للأحداث
- ألوان نص محسّنة لكلا الـ themes

---

## 11. الملفات الناقصة المحتملة

| الفئة | الحالة | التفاصيل |
|-------|--------|----------|
| **Tests** | غائبة تقريباً | مجلد `tests/` موجود لكن فارغ — لا يوجد `*.test.ts` أو `*.spec.ts` |
| **README** | موجود جزئياً | `README.md` موجود لكن محدود ومتخصص في نظام التقييم (بالعربية) |
| **docs/** | غير موجود | لا يوجد مجلد توثيق |
| **CLAUDE.md** | غير موجود | — |
| **DB Migrations** | غير واضحة | مجلد `database/` موجود لكن بدون migration files ظاهرة |
| **.env.example** | غير موجود | لا يوجد مثال لمتغيرات البيئة |
| **API Documentation** | غير موجود | لا يوجد Swagger/OpenAPI spec |
| **Docker** | غير موجود | لا يوجد Dockerfile أو docker-compose |
| **CI/CD** | غير موجود | لا يوجد `.github/workflows` |

---

## 12. ملخص Stack التقني

### Backend
| المكوّن | التقنية |
|---------|---------|
| Runtime | Node.js |
| Framework | Express.js v5.1.0 |
| Language | TypeScript 5.9 |
| Database | MySQL (mysql2/promise) |
| Auth | JWT + bcrypt |
| File Upload | Multer v2 |
| ORM (جزئي) | Prisma 6.14 |
| Security | helmet, cors |
| Dev Server | ts-node-dev |

### Frontend
| المكوّن | التقنية |
|---------|---------|
| Framework | React 18.2 |
| Language | TypeScript |
| Routing | React Router v6 |
| HTTP Client | Axios 0.27 + fetch API |
| Styling | Tailwind CSS 3.1 |
| Forms | React Hook Form |
| Calendar | React Big Calendar + React Day Picker |
| Map | Leaflet + React Leaflet |
| i18n | i18next + react-i18next |
| Notifications | React Hot Toast |
| Build Tool | Create React App |

### Database
| المكوّن | التقنية |
|---------|---------|
| System | MySQL 5.7+ |
| Connection | mysql2/promise pool (limit: 10) |
| Default DB | `wedding_marketplace` |
| Default Port | 3306 |

---

## 13. مرجع سريع — الملفات الحرجة

| الملف | المسار |
|-------|--------|
| Backend entry | `backend/src/server.ts` |
| DB config | `backend/src/database.ts` |
| Auth middleware | `backend/src/middleware/auth.ts` |
| Client auth routes | `backend/src/routes/clientAuth.ts` |
| Vendor auth routes | `backend/src/routes/vendorAuth.ts` |
| Backend env | `backend/.env` |
| Backend deps | `backend/package.json` |
| Frontend router | `frontend/src/App.tsx` |
| Axios config | `frontend/src/config/axios.ts` |
| Auth context | `frontend/src/context/AuthContext.tsx` |
| Client context | `frontend/src/context/ClientContext.tsx` |
| API wrapper | `frontend/src/api/request.ts` |
| Global styles | `frontend/src/index.css` |
| Tailwind config | `frontend/tailwind.config.js` |
| Frontend deps | `frontend/package.json` |

---

*تم إنشاء هذا التوثيق تلقائياً — 2026-05-19*
