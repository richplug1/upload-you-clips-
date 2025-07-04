# 🚀 Guide de Démarrage Rapide - Système de Crédits

## Test du Système de Crédits

### 1. Démarrage des Serveurs

```bash
# Démarrer le serveur backend
cd server
npm start

# Démarrer le frontend (dans un autre terminal)
cd client
npm run dev
```

### 2. Authentification

1. Accédez à l'application sur `http://localhost:3000`
2. Connectez-vous avec Google OAuth
3. Votre compte sera automatiquement créé avec 10 crédits gratuits

### 3. Test des Fonctionnalités

#### Vérification du Statut des Crédits
```bash
# API Test
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/subscription/status
```

#### Calcul des Coûts
```bash
# Test avec une vidéo de 5 minutes et 3 clips
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"video_duration": 300, "clips_count": 3}' \
     http://localhost:5000/api/subscription/calculate-cost
```

#### Mise à Niveau d'Abonnement
```bash
# Mise à niveau vers le plan Pro
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"plan_id": "pro", "payment_method": {"type": "demo"}}' \
     http://localhost:5000/api/subscription/upgrade
```

#### Achat de Crédits
```bash
# Achat de 50 crédits
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"credits_amount": 50, "payment_method": {"type": "demo"}}' \
     http://localhost:5000/api/subscription/buy-credits
```

### 4. Test du Processus de Téléchargement

1. **Téléchargement de Vidéo**
   - Utilisez le composant `VideoUploadWithCredits`
   - Sélectionnez une vidéo de test
   - Vérifiez que les métadonnées sont extraites

2. **Calcul des Coûts**
   - Ajustez le nombre de clips à générer
   - Observez le calcul des crédits en temps réel
   - Vérifiez les limites du plan

3. **Traitement**
   - Cliquez sur "Process Video"
   - Vérifiez que les crédits sont déduits
   - Observez le statut du job

### 5. Scénarios de Test

#### Scénario 1: Utilisateur Gratuit
```javascript
// Utilisateur avec 10 crédits
// Vidéo: 2 minutes, 3 clips
// Coût calculé: 4 crédits ✅ (peut traiter)
```

#### Scénario 2: Crédits Insuffisants
```javascript
// Utilisateur avec 5 crédits
// Vidéo: 10 minutes, 10 clips
// Coût calculé: 16 crédits ❌ (ne peut pas traiter)
```

#### Scénario 3: Limites de Plan
```javascript
// Plan Free: max 5 minutes
// Vidéo: 10 minutes
// Résultat: ❌ Durée dépassée
```

### 6. Interface Utilisateur

#### Composants à Tester
- **CreditStatus**: Affichage du solde de crédits
- **ProcessingCostCalculator**: Calcul des coûts en temps réel
- **SubscriptionPlans**: Gestion des plans d'abonnement
- **BuyCreditsModal**: Achat de crédits supplémentaires

#### Fonctionnalités UI
- Notifications de crédits insuffisants
- Suggestions de mise à niveau
- Historique des transactions
- Calcul des coûts en temps réel

### 7. Base de Données

#### Tables Importantes
```sql
-- Vérifier les crédits d'un utilisateur
SELECT * FROM credits WHERE user_id = 1;

-- Vérifier l'abonnement
SELECT * FROM subscriptions WHERE user_id = 1;

-- Historique des transactions
SELECT * FROM credit_transactions WHERE user_id = 1 ORDER BY created_at DESC;
```

### 8. Logs et Monitoring

#### Logs à Surveiller
```bash
# Logs des crédits
tail -f server/logs/combined.log | grep -i credit

# Logs des transactions
tail -f server/logs/combined.log | grep -i transaction

# Logs des erreurs
tail -f server/logs/error.log
```

### 9. Problèmes Courants et Solutions

#### Problème: "Insufficient Credits"
**Solution**: Vérifiez le solde de crédits avec `/api/subscription/status`

#### Problème: "Plan Limit Exceeded"
**Solution**: Réduisez la durée ou le nombre de clips, ou mettez à niveau le plan

#### Problème: "Processing Failed"
**Solution**: Vérifiez les logs pour les erreurs détaillées

### 10. Validation des Fonctionnalités

#### ✅ Checklist de Test
- [ ] Connexion utilisateur
- [ ] Affichage du statut des crédits
- [ ] Calcul des coûts correct
- [ ] Vérification des limites du plan
- [ ] Déduction des crédits
- [ ] Mise à niveau d'abonnement
- [ ] Achat de crédits
- [ ] Historique des transactions
- [ ] Messages d'erreur appropriés
- [ ] Interface utilisateur responsive

### 11. Données de Test

#### Utilisateurs de Test
```javascript
// Plan Free - 10 crédits
const freeUser = {
  plan: 'free',
  credits: 10,
  limits: { duration: 300, clips: 3 }
};

// Plan Pro - 500 crédits
const proUser = {
  plan: 'pro',
  credits: 500,
  limits: { duration: 3600, clips: 25 }
};
```

#### Vidéos de Test
```javascript
// Vidéo courte - 2 minutes
const shortVideo = { duration: 120, clips: 3, cost: 4 };

// Vidéo moyenne - 10 minutes
const mediumVideo = { duration: 600, clips: 5, cost: 7 };

// Vidéo longue - 20 minutes
const longVideo = { duration: 1200, clips: 10, cost: 17 };
```

### 12. Performance et Scalabilité

#### Métriques à Surveiller
- Temps de réponse des API
- Utilisation de la base de données
- Consommation mémoire
- Débit des transactions

#### Optimisations
- Index sur les tables de crédits
- Cache des calculs de coûts
- Pagination des historiques
- Compression des réponses API

---

## 🎯 Résultat Attendu

Après avoir suivi ce guide, vous devriez avoir :
- Un système de crédits fonctionnel
- Des plans d'abonnement opérationnels
- Une interface utilisateur complète
- Des transactions de crédits trackées
- Un système de paiement simulé

Le système est maintenant prêt pour la production avec l'intégration de vrais fournisseurs de paiement (Stripe, PayPal, etc.).
