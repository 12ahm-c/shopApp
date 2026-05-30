Voici un document d’architecture technique complet pour ShopManager, basé sur votre cahier des charges et en reprenant la structure claire et professionnelle du document précédent (sans copier son contenu métier).

---

ShopManager — Architecture Technique & System Design

Version MVP – Juin 2025
Document de référence pour l’équipe de développement

---

Table des Matières

1. Vue d’ensemble
2. Principes architecturaux
3. Architecture en couches
4. Structure des projets
5. Acteurs du système
6. Modules backend
7. Architecture base de données
8. Relations entre collections
9. Flux principaux
10. Architecture temps réel & notifications
11. Architecture du point de vente (POS)
12. Gestion des dettes clients & fournisseurs
13. Architecture de sécurité
14. API Design
15. Tâches planifiées (Cron Jobs)
16. Cache & performances
17. Architecture déploiement (MVP)
18. Diagrammes de séquence
19. Stratégie de scalabilité
20. Périmètre MVP vs V2

---

1. Vue d’ensemble

ShopManager est une application web de gestion administrative et commerciale destinée aux petits commerces (épiceries, boutiques, pharmacies, etc.). Elle permet de :

· Gérer les ventes via un point de vente (POS) rapide
· Suivre le stock et recevoir des alertes en cas de rupture
· Gérer les dettes clients et fournisseurs
· Administrer les employés (présences, salaires, journal d’activité)
· Générer des factures et un historique complet
· Recevoir des notifications (stock faible, résumé quotidien, dettes)

L’application fonctionne en mode Admin (propriétaire) et Employé (caissier) avec des accès différenciés.

---

2. Principes architecturaux

Principe Décision Justification
Monolithe modulaire Un seul backend Node.js découpé en modules métier Rapide à développer, facile à déployer, évolutif vers microservices
API‑First Toutes les fonctionnalités exposées via REST Frontend web et futures applications mobiles partagent la même API
Temps réel sélectif Socket.IO uniquement pour les notifications critiques Allège la charge serveur
Stateless backend JWT pour l’authentification Scalabilité horizontale immédiate
Base de données unique MongoDB Atlas Flexibilité des schémas, adapté aux évolutions fréquentes

---

3. Architecture en couches

```
┌─────────────────────────────────────────────────┐
│              PRESENTATION LAYER                 │
│        React + Vite + Tailwind CSS + Zustand    │
│   Pages : POS, Dashboard, Stock, Clients, etc.  │
├─────────────────────────────────────────────────┤
│                   REST + Socket.IO              │
├─────────────────────────────────────────────────┤
│                  API LAYER                      │
│         Routes Express + Middlewares            │
│         Validation (Zod) + RBAC                 │
├─────────────────────────────────────────────────┤
│              BUSINESS LOGIC LAYER               │
│    Services : Sale, Stock, Debt, Employee       │
│         Règles métier isolées des routes        │
├─────────────────────────────────────────────────┤
│              DATA ACCESS LAYER                  │
│         Modèles Mongoose + Requêtes             │
├─────────────────────────────────────────────────┤
│            EXTERNAL SERVICES LAYER              │
│         Firebase FCM (push notifications)       │
└─────────────────────────────────────────────────┘
```

---

4. Structure des projets

4.1 Backend – Structure par modules

```
shopmanager-backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.middleware.ts
│   │   ├── user/
│   │   │   ├── user.routes.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.model.ts
│   │   ├── product/
│   │   │   ├── product.routes.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── product.service.ts
│   │   │   └── product.model.ts
│   │   ├── sale/
│   │   │   ├── sale.routes.ts
│   │   │   ├── sale.controller.ts
│   │   │   ├── sale.service.ts
│   │   │   ├── sale.model.ts
│   │   │   └── invoice.model.ts
│   │   ├── customer/
│   │   │   ├── customer.routes.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── customer.service.ts
│   │   │   └── customer.model.ts
│   │   ├── supplier/
│   │   │   ├── supplier.routes.ts
│   │   │   ├── supplier.controller.ts
│   │   │   ├── supplier.service.ts
│   │   │   └── supplier.model.ts
│   │   ├── employee/
│   │   │   ├── employee.routes.ts
│   │   │   ├── employee.controller.ts
│   │   │   ├── employee.service.ts
│   │   │   └── employee.model.ts
│   │   ├── activityLog/
│   │   │   ├── activityLog.routes.ts
│   │   │   ├── activityLog.controller.ts
│   │   │   ├── activityLog.service.ts
│   │   │   └── activityLog.model.ts
│   │   ├── notification/
│   │   │   ├── notification.routes.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts
│   │   │   └── notification.model.ts
│   │   └── storeSettings/
│   │       ├── settings.routes.ts
│   │       ├── settings.controller.ts
│   │       ├── settings.service.ts
│   │       └── settings.model.ts
│   ├── socket/
│   │   ├── socket.server.ts
│   │   └── notification.socket.ts
│   ├── jobs/
│   │   ├── dailySummary.job.ts
│   │   ├── lowStockAlert.job.ts
│   │   └── cleanup.job.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   └── validate.middleware.ts
│   └── utils/
│       ├── apiResponse.ts
│       ├── jwt.util.ts
│       └── invoiceNumber.util.ts
├── app.ts
└── server.ts
```

4.2 Frontend – Structure (React + Vite)

```
shopmanager-frontend/
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.tsx
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Stock.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Suppliers.tsx
│   │   │   ├── Employees.tsx
│   │   │   ├── Invoices.tsx
│   │   │   ├── ActivityLog.tsx
│   │   │   └── Settings.tsx
│   │   └── employee/
│   │       ├── Dashboard.tsx
│   │       ├── Pos.tsx
│   │       ├── Invoices.tsx
│   │       └── ActivityLog.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── pos/
│   │   ├── notifications/
│   │   └── charts/
│   ├── layouts/
│   │   ├── AdminLayout.tsx
│   │   └── EmployeeLayout.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   └── useNotifications.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── socket.ts
│   │   └── authService.ts
│   └── store/
│       ├── authStore.ts
│       └── notifStore.ts
```

---

5. Acteurs du système

Acteur Rôle Accès Création du compte
Admin (propriétaire) Gestion complète du magasin Stock, POS, clients, fournisseurs, employés, paramètres, historique Unique (premier lancement)
Employé (caissier) Vente et consultation limitée POS, consultation stock, historique personnel, notifications Par l’admin

Principe : Pas d’inscription publique. Tous les comptes sont créés par l’admin.

---

6. Modules backend

6.1 Auth Module

· Connexion (téléphone + mot de passe)
· Génération JWT (access + refresh)
· Middleware d’authentification

Endpoints :

· POST /api/auth/login
· POST /api/auth/refresh
· POST /api/auth/logout
· GET /api/auth/me

6.2 User Module

· Gestion profil utilisateur
· Changement mot de passe
· Dernière activité

6.3 Product Module (Admin uniquement)

· CRUD produits
· Seuil d’alerte par produit
· Recherche, filtres (catégorie, stock faible)

6.4 Sale Module (POS)

· Vente avec autocomplétion produit
· Prix modifiable temporairement
· Vérification stock
· Création facture et mise à jour stock
· Annulation facture (admin) + restauration stock

6.5 Customer Module (Admin)

· Gestion clients (CRUD)
· Augmentation / diminution dette
· Historique transactions client

6.6 Supplier Module (Admin)

· Identique à Customer

6.7 Employee Module (Admin)

· Gestion employés (CRUD)
· Suivi présence / absence
· Salaire mensuel
· Journal d’activité personnel

6.8 ActivityLog Module

· Enregistrement des actions : vente, suppression facture, login, logout
· Exclusion : modifications de stock ou prix hors vente

6.9 Invoice Module

· Liste des factures
· Détail facture
· Impression (PDF / thermique) – V2

6.10 Notification Module

· Génération notifications in-app
· Envoi push FCM
· Résumé quotidien automatique

6.11 StoreSettings Module

· Paramètres magasin (nom, logo, devise, langue, thème)
· Sauvegarde / restauration BDD (MVP simple)

---

7. Architecture base de données

7.1 Collection : users

```json
{
  "_id": "ObjectId",
  "name": "string",
  "phone": "string (unique)",
  "passwordHash": "string",
  "role": "admin | employee",
  "salary": "number",
  "attendance": [
    { "date": "Date", "status": "present|absent" }
  ],
  "createdAt": "Date",
  "lastActiveAt": "Date"
}
```

Index : phone unique, role

7.2 Collection : products

```json
{
  "_id": "ObjectId",
  "name": "string",
  "category": "string",
  "price": "number",
  "quantity": "number",
  "alertThreshold": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Index : name (texte), category

7.3 Collection : sales (factures)

```json
{
  "_id": "ObjectId",
  "invoiceNumber": "number (auto-incrément)",
  "employeeId": "ObjectId",
  "customerId": "ObjectId (optionnel)",
  "customerName": "string",
  "items": [
    {
      "productId": "ObjectId",
      "name": "string",
      "quantity": "number",
      "unitPrice": "number",
      "total": "number"
    }
  ],
  "totalAmount": "number",
  "paymentMethod": "cash | card | bankily",
  "createdAt": "Date"
}
```

Index : employeeId, createdAt

7.4 Collection : customers

```json
{
  "_id": "ObjectId",
  "name": "string",
  "phone": "string",
  "totalDebt": "number",
  "transactions": [
    {
      "date": "Date",
      "amount": "number",
      "type": "increase|decrease",
      "note": "string"
    }
  ],
  "createdAt": "Date"
}
```

7.5 Collection : suppliers

```json
{
  "_id": "ObjectId",
  "name": "string",
  "phone": "string",
  "address": "string",
  "totalDebt": "number",
  "transactions": [
    {
      "date": "Date",
      "amount": "number",
      "type": "increase|decrease",
      "note": "string"
    }
  ],
  "createdAt": "Date"
}
```

7.6 Collection : activity_logs

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "action": "sale | delete_invoice | login | logout",
  "details": "string",
  "amount": "number (optionnel)",
  "timestamp": "Date"
}
```

Index : userId, timestamp

7.7 Collection : notifications

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "type": "low_stock | daily_summary | debt_updated | invoice_deleted",
  "title": "string",
  "body": "string",
  "isRead": "boolean",
  "data": "object",
  "createdAt": "Date"
}
```

7.8 Collection : store_settings (une seule ligne)

```json
{
  "_id": "ObjectId",
  "storeName": "string",
  "storeAddress": "string",
  "storePhone": "string",
  "logoUrl": "string",
  "currency": "MRU",
  "invoiceFooter": "string",
  "theme": "light|dark",
  "language": "ar|fr"
}
```

---

8. Relations entre collections

· users (1) → (0..n) sales (employé)
· users (1) → (0..n) activity_logs
· users (1) → (0..n) notifications
· products (1) → (0..n) sales.items
· customers (1) → (0..n) sales
· suppliers (1) → (aucune dépendance directe vente)

---

9. Flux principaux

9.1 Flux de vente (POS)

1. Employé sélectionne produit (autocomplétion)
2. Prix chargé depuis products
3. Employé peut modifier prix (temporaire)
4. Saisie quantité → vérification stock
5. (Optionnel) Sélection / création client
6. Choix mode paiement
7. Clic « Vendre » :
   · Création facture avec customerName
   · Décrémentation stock
   · Enregistrement activity_log
   · Mise à jour dashboard

9.2 Flux dette client

1. Admin recherche ou ajoute client
2. « Augmenter dette » → montant
3. Mise à jour totalDebt + ajout transaction
4. Notification envoyée à admin

9.3 Flux stock faible

1. Vente → quantity devient ≤ alertThreshold
2. Déclenchement notification low_stock (in-app + push)
3. Admin reçoit alerte dans son dashboard

9.4 Flux ajout employé

1. Admin remplit formulaire (nom, téléphone, mot de passe, rôle, salaire)
2. Création compte utilisateur
3. Employé se connecte avec téléphone + mot de passe

---

10. Architecture temps réel & notifications

10.1 Socket.IO – Rooms utilisées

· user:{userId} : notifications personnelles
· admin : alertes globales (stock faible, résumé quotidien)

10.2 Événements Socket.IO

Événement Direction Description
notification:new Serveur → Client Nouvelle notification in-app
stock:alert Serveur → Admin Stock faible

10.3 Notifications multi‑canaux

Événement In‑App Push FCM
Stock faible ✅ ✅
Résumé quotidien ✅ ✅
Nouvelle dette client ✅ ❌
Remboursement client ✅ ❌
Suppression facture ✅ ✅

Limites : Pas plus de 5 push par jour et par utilisateur.

---

11. Architecture du point de vente (POS)

· Autocomplétion : appel API sur /api/products/search?q=...
· Prix modifiable : stocké uniquement dans l’objet items.unitPrice de la vente, jamais dans products
· Vérification stock : avant validation, comparaison quantité demandée vs products.quantity
· Mise à jour stock : transaction MongoDB atomique (findOneAndUpdate avec condition)
· Facture : numéro auto-incrémenté stocké dans une collection dédiée counter

---

12. Gestion des dettes clients & fournisseurs

· Dette = somme des transactions.amount où type = increase moins type = decrease
· À chaque modification, totalDebt est recalculé et mis à jour
· Notification envoyée uniquement pour les clients (pas pour les fournisseurs)

---

13. Architecture de sécurité

13.1 Authentification JWT

· Access token : 24h
· Refresh token : 7 jours (stocké en DB)
· Changement mot de passe → invalidation tous les tokens

13.2 RBAC (contrôle par rôle)

```js
const ROLE_PERMISSIONS = {
  admin: ['*'],
  employee: [
    'sale:create',
    'product:read',
    'invoice:read:own',
    'activity_log:read:own'
  ]
};
```

13.3 Sécurité API

· Validation Zod sur tous les inputs
· Helmet.js (en-têtes HTTP sécurisés)
· HTTPS obligatoire en production

---

14. API Design

Conventions :

· Base URL : https://api.shopmanager.mr/v1
· Format réponse standard :

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 50 }
}
```

Endpoints clés (non exhaustif) :

Méthode Route Rôle
POST /auth/login public
GET /products admin + employee
POST /products admin
POST /sales employee + admin
GET /sales/invoices employee (ses factures), admin (toutes)
DELETE /sales/:id admin
GET /customers admin
PUT /customers/:id/debt admin
GET /suppliers admin
POST /suppliers admin
PUT /suppliers/:id admin
PUT /suppliers/:id/debt admin
DELETE /suppliers/:id admin
GET /employees admin
POST /employees admin
GET /activity-logs admin (tous), employee (les siens)
GET /notifications tous
GET /settings admin
PUT /settings admin

---

15. Tâches planifiées (Cron Jobs)

Fréquence Tâche Description
00:00 quotidien dailySummary.job.ts Envoi résumé journalier à l’admin
Toutes les heures lowStockAlert.job.ts Vérification seuils + notifications
02:00 quotidien cleanup.job.ts Suppression logs de +6 mois

---

16. Cache & performances

Stratégie Redis (optionnel mais recommandé) :

Key TTL Contenu
products:search:{term} 10 min Résultats recherche
dashboard:admin 5 min Agrégats ventes/dettes
dashboard:employee:{id} 5 min Ventes du jour

---

17. Architecture déploiement (MVP)

```
[Vercel / Netlify]   → Frontend React
[Railway / Render]   → Backend Node.js (1 instance)
[MongoDB Atlas]      → Base de données (M0 gratuit)
[Redis Upstash]      → Cache (optionnel, gratuit)
[Firebase FCM]       → Push notifications
```

Variables d’environnement :

· NODE_ENV, PORT
· MONGODB_URI, REDIS_URL
· JWT_SECRET, JWT_REFRESH_SECRET
· FIREBASE_*

---

18. Diagrammes de séquence

18.1 Vente (POS)

```
Employé → Frontend → Backend → MongoDB → Firebase
  |          |          |          |          |
  |--sélection produit-->|          |          |
  |<--prix & stock-------|          |          |
  |--validation vente---->|          |          |
  |                      |--check stock------>|
  |                      |<--OK---------------|
  |                      |--décrément stock-->|
  |                      |--créer facture---->|
  |                      |--log activité----->|
  |                      |--notif push------->|
  |<--facture générée----|          |          |
```

18.2 Augmentation dette client

```
Admin → Frontend → Backend → MongoDB
  |          |          |          |
  |--ajout montant------>|          |
  |                      |--update customer->|
  |                      |--créer transaction>|
  |                      |--notif in-app---->|
  |<--dette mise à jour--|          |
```

---

19. Stratégie de scalabilité

Phase Architecture Capacité
MVP Monolithe Node.js, 1 instance, MongoDB M0 ~1 000 utilisateurs actifs
V1 Production 2 instances backend + Load Balancer Nginx, MongoDB M10 ~10 000 utilisateurs actifs
V2 Scale Microservices (auth, sales, stock, notifs), Redis Cluster, MongoDB sharding +100 000 utilisateurs

---

20. Périmètre MVP vs V2

Fonctionnalité MVP V2
Connexion téléphone + mot de passe ✅ ✅
Dashboard Admin & Employé ✅ Graphiques avancés
Gestion stock (CRUD + seuil produit) ✅ Import/Export Excel
POS avec autocomplétion + prix modifiable ✅ Scanner code-barres
Clients et dettes ✅ Envoi SMS relance
Fournisseurs ✅ –
Gestion employés (présence, salaire) ✅ Payroll automatisé
Historique (sans logs modifs stock) ✅ Filtres avancés
Factures (avec nom client) ✅ Envoi email/WhatsApp
Notifications in-app ✅ ✅
Push notifications FCM ❌ ✅
Paramètres (magasin, langue, thème) ✅ Sauvegarde cloud
Sauvegarde/restauration BDD Manuelle Programmée
PWA hors ligne ❌ ✅
Impression thermique / PDF ❌ ✅

---

Document prêt pour le développement – conforme au cahier des charges ShopManager.
