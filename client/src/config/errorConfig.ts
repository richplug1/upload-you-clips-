/**
 * Configuration des messages d'erreur et de leur traitement
 */

export const ERROR_MESSAGES = {
  // Erreurs de réseau
  NETWORK: {
    CONNECTION_FAILED: 'Connexion au serveur impossible. Vérifiez votre connexion Internet.',
    TIMEOUT: 'La requête a expiré. Veuillez réessayer.',
    SERVER_ERROR: 'Erreur du serveur. Nos équipes ont été notifiées.',
    RATE_LIMITED: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
    UNAUTHORIZED: 'Session expirée. Veuillez vous reconnecter.',
    FORBIDDEN: 'Accès non autorisé à cette ressource.',
    NOT_FOUND: 'Ressource non trouvée.',
    OFFLINE: 'Vous semblez être hors ligne. Vérifiez votre connexion.'
  },

  // Erreurs d'upload
  UPLOAD: {
    FILE_TOO_LARGE: 'Le fichier est trop volumineux. Taille maximale : 100 MB.',
    INVALID_FILE_TYPE: 'Type de fichier non supporté. Formats acceptés : MP4, AVI, MOV.',
    UPLOAD_FAILED: 'Échec du téléchargement. Veuillez réessayer.',
    STORAGE_FULL: 'Espace de stockage insuffisant. Supprimez des fichiers ou passez à un plan supérieur.',
    CORRUPTED_FILE: 'Le fichier semble corrompu. Veuillez essayer avec un autre fichier.'
  },

  // Erreurs de traitement vidéo
  PROCESSING: {
    PROCESSING_FAILED: 'Échec du traitement de la vidéo. Veuillez réessayer.',
    INVALID_VIDEO: 'Format vidéo non valide ou corrompu.',
    INSUFFICIENT_CREDITS: 'Crédits insuffisants pour ce traitement.',
    QUEUE_FULL: 'File d\'attente pleine. Veuillez réessayer plus tard.',
    CODEC_NOT_SUPPORTED: 'Codec vidéo non supporté.',
    DURATION_TOO_LONG: 'Vidéo trop longue pour être traitée.',
    NO_AUDIO_TRACK: 'Aucune piste audio détectée dans la vidéo.'
  },

  // Erreurs d'authentification
  AUTH: {
    INVALID_CREDENTIALS: 'Identifiants incorrects.',
    ACCOUNT_LOCKED: 'Compte temporairement verrouillé. Réessayez plus tard.',
    EMAIL_NOT_VERIFIED: 'Veuillez vérifier votre adresse email.',
    PASSWORD_TOO_WEAK: 'Mot de passe trop faible.',
    TOKEN_EXPIRED: 'Session expirée. Veuillez vous reconnecter.',
    GOOGLE_AUTH_FAILED: 'Échec de l\'authentification Google.',
    REGISTRATION_FAILED: 'Échec de la création du compte.'
  },

  // Erreurs de validation
  VALIDATION: {
    REQUIRED_FIELD: 'Ce champ est obligatoire.',
    INVALID_EMAIL: 'Adresse email invalide.',
    INVALID_PASSWORD: 'Le mot de passe doit contenir au moins 8 caractères.',
    PASSWORDS_DONT_MATCH: 'Les mots de passe ne correspondent pas.',
    INVALID_URL: 'URL invalide.',
    INVALID_DATE: 'Date invalide.',
    OUT_OF_RANGE: 'Valeur hors limites.'
  },

  // Erreurs JavaScript
  JAVASCRIPT: {
    UNEXPECTED_ERROR: 'Une erreur inattendue s\'est produite.',
    COMPONENT_CRASHED: 'Un composant a rencontré une erreur.',
    MEMORY_LEAK: 'Problème de mémoire détecté.',
    PROMISE_REJECTION: 'Erreur de traitement asynchrone.'
  },

  // Messages génériques
  GENERIC: {
    SOMETHING_WENT_WRONG: 'Une erreur est survenue. Veuillez réessayer.',
    TRY_AGAIN_LATER: 'Service temporairement indisponible. Réessayez plus tard.',
    CONTACT_SUPPORT: 'Si le problème persiste, contactez le support.',
    FEATURE_NOT_AVAILABLE: 'Cette fonctionnalité n\'est pas encore disponible.'
  }
};

export const ERROR_ACTIONS = {
  RETRY: 'Réessayer',
  LOGIN: 'Se connecter',
  CONTACT_SUPPORT: 'Contacter le support',
  REFRESH_PAGE: 'Actualiser la page',
  GO_BACK: 'Retour',
  UPGRADE_PLAN: 'Améliorer le plan',
  DELETE_FILES: 'Supprimer des fichiers',
  TRY_LATER: 'Réessayer plus tard'
};

export const ERROR_CATEGORIES = {
  USER_ACTION: 'user_action', // Erreur causée par l'utilisateur
  SYSTEM_ERROR: 'system_error', // Erreur système
  EXTERNAL_SERVICE: 'external_service', // Erreur de service externe
  TEMPORARY: 'temporary', // Erreur temporaire
  CONFIGURATION: 'configuration' // Erreur de configuration
};

export const ERROR_SEVERITY_CONFIG = {
  LOW: {
    color: 'yellow',
    icon: 'info',
    autoClose: true,
    duration: 3000,
    notify: false
  },
  MEDIUM: {
    color: 'orange',
    icon: 'warning',
    autoClose: true,
    duration: 5000,
    notify: false
  },
  HIGH: {
    color: 'red',
    icon: 'error',
    autoClose: false,
    duration: 0,
    notify: true
  },
  CRITICAL: {
    color: 'red',
    icon: 'error',
    autoClose: false,
    duration: 0,
    notify: true,
    requiresAction: true
  }
};

/**
 * Fonction pour obtenir un message d'erreur approprié
 */
export function getErrorMessage(error: any): string {
  // Si l'erreur a déjà un message utilisateur
  if (error.userMessage) {
    return error.userMessage;
  }

  // Basé sur le type et le code d'erreur
  if (error.type && error.code) {
    const typeKey = error.type.toUpperCase() as keyof typeof ERROR_MESSAGES;
    const typeMessages = ERROR_MESSAGES[typeKey];
    if (typeMessages) {
      const codeKey = error.code.toUpperCase();
      const message = (typeMessages as any)[codeKey];
      if (message) {
        return message;
      }
    }
  }

  // Basé sur le status HTTP
  if (error.status) {
    switch (error.status) {
      case 400:
        return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
      case 401:
        return ERROR_MESSAGES.AUTH.TOKEN_EXPIRED;
      case 403:
        return ERROR_MESSAGES.AUTH.ACCOUNT_LOCKED;
      case 404:
        return ERROR_MESSAGES.NETWORK.NOT_FOUND;
      case 413:
        return ERROR_MESSAGES.UPLOAD.FILE_TOO_LARGE;
      case 429:
        return ERROR_MESSAGES.NETWORK.RATE_LIMITED;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_MESSAGES.NETWORK.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.GENERIC.SOMETHING_WENT_WRONG;
    }
  }

  // Message par défaut
  return error.message || ERROR_MESSAGES.GENERIC.SOMETHING_WENT_WRONG;
}

/**
 * Fonction pour déterminer les actions recommandées
 */
export function getRecommendedActions(error: any): string[] {
  const actions = [];

  // Actions basées sur le type d'erreur
  if (error.type === 'network') {
    actions.push(ERROR_ACTIONS.RETRY);
    if (error.status === 401) {
      actions.push(ERROR_ACTIONS.LOGIN);
    }
  } else if (error.type === 'upload') {
    if (error.code === 'FILE_TOO_LARGE' || error.code === 'STORAGE_FULL') {
      actions.push(ERROR_ACTIONS.DELETE_FILES);
      actions.push(ERROR_ACTIONS.UPGRADE_PLAN);
    } else {
      actions.push(ERROR_ACTIONS.RETRY);
    }
  } else if (error.type === 'processing') {
    if (error.code === 'INSUFFICIENT_CREDITS') {
      actions.push(ERROR_ACTIONS.UPGRADE_PLAN);
    } else if (error.code === 'QUEUE_FULL') {
      actions.push(ERROR_ACTIONS.TRY_LATER);
    } else {
      actions.push(ERROR_ACTIONS.RETRY);
    }
  } else if (error.type === 'auth') {
    actions.push(ERROR_ACTIONS.LOGIN);
  }

  // Action par défaut
  if (actions.length === 0) {
    actions.push(ERROR_ACTIONS.RETRY);
  }

  // Toujours proposer le support pour les erreurs critiques
  if (error.severity === 'critical' || error.severity === 'high') {
    actions.push(ERROR_ACTIONS.CONTACT_SUPPORT);
  }

  return actions;
}

export default {
  ERROR_MESSAGES,
  ERROR_ACTIONS,
  ERROR_CATEGORIES,
  ERROR_SEVERITY_CONFIG,
  getErrorMessage,
  getRecommendedActions
};
