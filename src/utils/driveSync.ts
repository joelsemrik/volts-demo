import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { Ingreso, Gasto, Presupuesto, SistemaNotificacion } from "../types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider configuration with Google Drive File scope
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive.file");

// In-memory token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface BackupData {
  ingresos: Ingreso[];
  gastos: Gasto[];
  presupuestos: Presupuesto[];
  notificaciones: SistemaNotificacion[];
  exportedAt: string;
}

/**
 * Initialize Auth State Listener
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign In with Google & retrieve Drive File scope token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("No se pudo obtener el token de acceso de Google Drive.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Error durante el inicio de sesión con Google:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get the current active access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign Out from Firebase
 */
export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Search for the "voltio_database.json" file in user's Google Drive.
 * Returns the file ID if it exists, otherwise null.
 */
export const findBackupFile = async (token: string): Promise<string | null> => {
  try {
    const q = encodeURIComponent("name = 'voltio_database.json' and trashed = false");
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error al buscar archivo en Drive:", errorText);
      return null;
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (err) {
    console.error("Error en findBackupFile:", err);
    return null;
  }
};

/**
 * Read backup content from Google Drive by file ID.
 */
export const downloadBackupFileContent = async (
  token: string,
  fileId: string
): Promise<BackupData | null> => {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error al descargar contenido desde Drive:", errorText);
      return null;
    }

    const data = await res.json();
    return data as BackupData;
  } catch (err) {
    console.error("Error en downloadBackupFileContent:", err);
    return null;
  }
};

/**
 * Create a new backup file "voltio_database.json" in user's Google Drive.
 */
export const createBackupFile = async (
  token: string,
  dataToSave: BackupData
): Promise<string | null> => {
  try {
    // 1. Create file metadata
    const metadataRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "voltio_database.json",
        mimeType: "application/json",
      }),
    });

    if (!metadataRes.ok) {
      const errText = await metadataRes.text();
      console.error("Error al crear metadatos del archivo en Drive:", errText);
      return null;
    }

    const fileMeta = await metadataRes.json();
    const fileId = fileMeta.id;

    // 2. Upload file content to the created fileId
    const success = await updateBackupFileContent(token, fileId, dataToSave);
    return success ? fileId : null;
  } catch (err) {
    console.error("Error en createBackupFile:", err);
    return null;
  }
};

/**
 * Update the content of an existing backup file in Google Drive.
 */
export const updateBackupFileContent = async (
  token: string,
  fileId: string,
  dataToSave: BackupData
): Promise<boolean> => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Error al actualizar contenido de archivo en Drive:", errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error en updateBackupFileContent:", err);
    return false;
  }
};
