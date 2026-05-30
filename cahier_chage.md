📋 Cahier des Charges — Système de Gestion des Commerces (ShopManager)

Version MVP – Juin 2025
Document de référence pour l’équipe de développement

---

Table des Matières

1. Présentation du projet
2. Objectif
3. Acteurs et rôles
4. Fonctionnalités détaillées
   · 4.1 Page de démarrage et authentification
   · 4.2 Dashboard (Admin / Employé)
   · 4.3 Gestion du stock
   · 4.4 Point de vente (POS)
   · 4.5 Clients et dettes
   · 4.6 Fournisseurs
   · 4.7 Gestion des employés
   · 4.8 Historique (journal des opérations)
   · 4.9 Factures
   · 4.10 Notifications
   · 4.11 Paramètres
5. Système de notifications
6. Architecture technique
7. Modèles de données
8. Flux principaux
9. Authentification et sécurité
10. Périmètre MVP vs V2

---

1. Présentation du projet

ShopManager est une application web complète de gestion administrative et commerciale destinée aux propriétaires de magasins, commerces de détail, boutiques, épiceries, pharmacies, etc.

L’application centralise les opérations quotidiennes : vente (POS), suivi du stock, gestion des dettes clients et fournisseurs, administration des employés.

---

2. Objectif

Fournir une solution clé en main, simple et rapide pour les petits commerces en Mauritanie et au Maghreb.

Problème actuel Solution ShopManager
Saisie manuelle lente des ventes POS rapide avec suggestion de produits et prix modifiable
Erreurs de stock Mise à jour automatique après chaque vente
Difficulté à suivre les dettes clients Page dédiée avec calcul automatique
Absence de suivi des fournisseurs Dettes fournisseurs intégrées
Plusieurs employés, pas d’historique Journal complet des actions

---

3. Acteurs et rôles

Rôle Description Accès
Admin (propriétaire) Accès complet Stock, POS, clients, fournisseurs, employés, paramètres, historique
Employé (caissier) Accès limité POS, consultation stock, historique personnel, notifications

---

4. Fonctionnalités détaillées

4.1 Page de démarrage et authentification

Premier lancement

· Écran de bienvenue avec nom du magasin, logo et description courte.
· Redirection vers la page de connexion.

Connexion uniquement (pas d’inscription publique)

· Numéro de téléphone + mot de passe.
· Redirection selon le rôle (Admin → Dashboard Admin, Employé → Dashboard Employé).
· Les comptes sont créés uniquement par l’admin (via la gestion des employés).

---

4.2 Dashboard (page principale)

4.2.1 Dashboard Employé

Cartes :

· Nombre de ventes du jour
· Total des ventes du jour
· Nombre de factures générées
· Nombre de produits en stock
· Produits en stock faible (selon seuil propre à chaque produit)
· Dernières ventes effectuées par l’employé

4.2.2 Dashboard Admin

Toutes les cartes employé + :

· Total des ventes (chiffre d’affaires)
· Dettes clients (total dû par les clients)
· Dettes fournisseurs (total dû aux fournisseurs)
· Nombre total de factures
· Nombre de produits en stock
· Alertes stock faible (liste des produits sous seuil)
· Graphique simple des ventes (journalier / mensuel)
· Dernières factures

---

4.3 Gestion du stock (Admin uniquement)

Vue liste des produits avec :

· Nom
· Quantité disponible
· Prix unitaire
· Catégorie (liste déroulante personnalisable)
· Seuil d’alerte (valeur propre à chaque produit, renseignée à l’ajout)
· Actions : Modifier, Supprimer

Outils :

· Bouton Ajouter un produit
· Recherche (nom)
· Filtres : tri par quantité, filtre par catégorie

Ajout / Modification produit :

· Nom, catégorie, prix, quantité initiale
· Seuil d’alerte (obligatoire) – déclenche une notification quand quantité <= seuil

---

4.4 Point de vente (POS) – Admin & Employé

Formulaire de vente rapide :

1. Sélection du produit
   · Champ avec autocomplétion (dès 2–3 lettres).
   · Si produit inexistant → message d’erreur, vente bloquée.
2. Affichage du prix
   · Le prix de base est chargé depuis la base de données (prix du produit).
   · L’employé peut modifier ce prix temporairement (champ de saisie du prix modifiable).
   · Cette modification ne change pas le prix en base de données – elle est valable uniquement pour la vente en cours.
   · À la prochaine sélection du même produit, le prix original réapparaît.
3. Saisie de la quantité
   · Vérification : quantité ≤ stock disponible.
   · Calcul automatique du prix total = (prix modifié ou par défaut) × quantité.
4. Sélection du client (optionnel mais recommandé)
   · Champ de recherche de client existant ou création rapide d’un client (nom, téléphone).
   · Permet d’associer la vente à un client pour le suivi (facture nominative).
5. Mode de paiement :
   · Espèces / Carte / Bankily
6. Bouton « Vendre » :
   · Création de la facture avec nom du client (si renseigné, sinon « client anonyme »)
   · Mise à jour du stock (décrémentation)
   · Enregistrement dans l’historique (employé, montant, client)
   · Mise à jour des statistiques

---

4.5 Clients et dettes (Admin uniquement)

Gestion des clients à crédit.

Liste des clients : tableau avec :

· Nom, téléphone
· Champ Augmenter la dette
· Champ Diminuer la dette
· Dette totale (calcul automatique)
· Actions (modifier, supprimer)

Fonctionnement :

· Augmenter → ajout au total dû (achat sans paiement)
· Diminuer → paiement partiel, soustraction
· Recherche par nom ou téléphone
· Bouton Ajouter un client

---

4.6 Fournisseurs (Admin uniquement)

Même logique que les clients, pour les fournisseurs du magasin.

Liste des fournisseurs : nom, téléphone, augmentation dette, diminution dette, dette totale, actions.

---

4.7 Gestion des employés (Admin uniquement)

Liste des employés : nom, téléphone, salaire, actions.

Ajout / modification :

· Nom, téléphone (utilisé pour connexion), mot de passe, rôle (Admin/Employé), salaire mensuel

Section présence / absence :

· Enregistrement des présences (Présent / Absent)
· Compteur de jours présents / absents par mois

Journal d’activité propre à chaque employé :

· Ventes effectuées (montant, date, client)
· Connexions / déconnexions
· Opérations supprimées (factures annulées, etc.)
· Les modifications de stock ou de prix (hors vente) ne sont pas enregistrées dans ce journal (conforme demande n°4)

---

4.8 Historique (Admin & Employé)

Employé : affiche uniquement ses propres opérations (ventes, annulations, connexions).

Admin : affiche toutes les opérations du magasin.

· Colonnes : date, type d’opération, utilisateur, détails, montant
· Filtres : date, utilisateur, type d’action

---

4.9 Factures (Admin & Employé)

Liste de toutes les factures générées.

Détail d’une facture :

· Numéro de facture (auto-incrémenté)
· Date et heure
· Nom du client (ou « client anonyme ») – pas le nom de l’employé
· Produits : nom, quantité, prix unitaire (le prix réellement payé), total
· Total général
· Mode de paiement

Actions : visualiser, imprimer (thermique ou PDF), annuler (admin uniquement, restaure le stock)

---

4.10 Notifications

Bouton distinctif dans l’en-tête.

Types :

Type Déclencheur Destinataire
Stock faible Produit ≤ son seuil personnel Admin
Résumé quotidien Automatique à 00:00 Admin
Nouvelle dette client Ajout augmentation dette Admin
Remboursement client Diminution dette Admin
Action critique Suppression facture Admin

Résumé quotidien : bénéfice (total ventes - pas de dépenses car supprimées), nombre de factures, employé le plus actif, produit le plus vendu.

---

4.11 Paramètres

Admin

· Informations magasin : nom, adresse, téléphone, logo, devise
· Paramètres factures : nom personnalisé, notes, impression thermique/PDF
· Paramètres généraux : langue (arabe/français – RTL), fuseau horaire, thème (clair/sombre)
· Sauvegarde : exporter/restaurer la base de données, changer mot de passe admin

Employé

· Changer sa langue, son mot de passe, le thème

---

5. Système de notifications – détails techniques

Événement Canal
Stock faible In-app + Push (FCM)
Résumé quotidien In-app + Push
Dette client In-app
Suppression facture In-app + Push

In-app : centre de notifications.
Push : Firebase Cloud Messaging (PWA/mobile).

---

6. Architecture technique

Couche Technologie
Frontend React + Vite + Tailwind CSS
Backend Node.js + Express.js
Base de données MongoDB Atlas
Authentification JWT + bcrypt
Notifications Socket.IO + FCM
Hébergement Railway / Render / VPS

---

7. Modèles de données (principaux)

User

```json
{
  "_id": "ObjectId",
  "name": "string",
  "phone": "string (unique)",
  "passwordHash": "string",
  "role": "admin | employee",
  "salary": "number",
  "attendance": [{ "date": "Date", "status": "present|absent" }],
  "createdAt": "Date",
  "lastActiveAt": "Date"
}
```

Product

```json
{
  "_id": "ObjectId",
  "name": "string",
  "category": "string",
  "price": "number",
  "quantity": "number",
  "alertThreshold": "number (seuil propre au produit)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Sale (Invoice)

```json
{
  "_id": "ObjectId",
  "invoiceNumber": "number",
  "employeeId": "ObjectId",
  "customerId": "ObjectId (optionnel)",
  "customerName": "string (dénormalisé)",
  "items": [
    {
      "productId": "ObjectId",
      "name": "string",
      "quantity": "number",
      "unitPrice": "number (prix réellement payé, modifiable à la vente)",
      "total": "number"
    }
  ],
  "totalAmount": "number",
  "paymentMethod": "cash | card | bankily",
  "createdAt": "Date"
}
```

Customer

```json
{
  "_id": "ObjectId",
  "name": "string",
  "phone": "string",
  "totalDebt": "number",
  "transactions": [{ "date": "Date", "amount": "number", "type": "increase|decrease", "note": "string" }],
  "createdAt": "Date"
}
```

Supplier (identique à Customer)

ActivityLog

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "action": "sale | delete_invoice | login | logout | ...",
  "details": "string",
  "amount": "number (optionnel)",
  "timestamp": "Date"
}
```

(Note : pas de log pour update_product ou update_price sauf si suppression)

StoreSettings

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

8. Flux principaux

Flux de vente (POS)

1. Employé sélectionne produit (autocomplétion)
2. Prix par défaut chargé, modifiable à la main
3. Saisie quantité → vérification stock → calcul total
4. (Optionnel) Sélection ou création client
5. Choix mode de paiement
6. Clic « Vendre » → facture créée avec nom client, stock diminué, historique enregistré

Flux de dette client

1. Admin ouvre page Clients
2. Recherche client ou ajout
3. Clic « Augmenter dette » → saisie montant
4. totalDebt mis à jour, notification envoyée

Flux stock faible

1. quantity devient ≤ alertThreshold (propre au produit)
2. Notification in-app + push à l’admin

Flux ajout employé

1. Admin remplit formulaire (nom, téléphone, mot de passe, rôle, salaire)
2. Création compte utilisateur
3. L’employé se connecte avec téléphone + mot de passe

---

9. Authentification et sécurité

Connexion uniquement – pas d’inscription publique.

· Tous les comptes sont créés par l’admin.
· Identifiants : numéro de téléphone + mot de passe.
· Pas d’OTP, pas d’inscription, pas de récupération par SMS dans le MVP (simple changement de mot de passe possible par l’admin si perte).

JWT :

· Access token : 24h
· Refresh token : 7 jours

Sécurité :

· Bcrypt pour mots de passe
· HTTPS obligatoire
· Rate limiting sur routes sensibles (POS, suppression)

---

10. Périmètre MVP vs V2

Fonctionnalité MVP V2
Connexion téléphone + mot de passe ✅ –
Dashboard Admin & Employé ✅ Graphiques avancés
Gestion stock (CRUD + seuil par produit) ✅ Import/export Excel
POS avec autocomplétion + prix modifiable ✅ Scanner code-barres
Clients et dettes ✅ Envoi SMS relance
Fournisseurs ✅ –
Gestion employés (présence, salaire) ✅ Payroll automatisé
Historique (sans logs modifs stock) ✅ Filtres avancés
Factures (avec nom client) ✅ Envoi email/WhatsApp
Notifications in-app ✅ Push FCM
Paramètres (magasin, langue, thème) ✅ Sauvegarde cloud
Sauvegarde/restauration BD ✅ Programmation
PWA hors ligne ❌ ✅
Impression thermique / PDF ❌ ✅

---

Document prêt pour l’équipe de développement – conforme aux modifications demandées.