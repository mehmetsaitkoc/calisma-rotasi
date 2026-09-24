package app.rotasi.shell;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Map;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class SecureSessionStore {
    private static final byte[] AAD = "rota.session.v1".getBytes(StandardCharsets.UTF_8);
    private final SharedPreferences prefs;
    private final String alias;
    SecureSessionStore(Context context) { this(context, "rota_secure_session", "rota.session.aes.v1"); }
    SecureSessionStore(Context context, String preferenceName, String keyAlias) {
        prefs = context.getSharedPreferences(preferenceName, Context.MODE_PRIVATE); alias = keyAlias;
    }
    private static synchronized SecretKey key(String alias) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        if (store.containsAlias(alias)) return (SecretKey) store.getKey(alias, null);
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setKeySize(256).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true).build());
        return generator.generateKey();
    }
    synchronized void set(String token) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, key(alias)); cipher.updateAAD(AAD);
        String encrypted = Base64.encodeToString(cipher.doFinal(token.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
        String iv = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP);
        if (!prefs.edit().putString("ciphertext", encrypted).putString("iv", iv).commit()) throw new IllegalStateException("Secure write failed");
    }
    synchronized String get() throws Exception {
        Map<String, ?> snapshot = prefs.getAll();
        String ciphertext = (String) snapshot.get("ciphertext"), iv = (String) snapshot.get("iv");
        if (ciphertext == null || iv == null) return null;
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(alias), new GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP))); cipher.updateAAD(AAD);
            return new String(cipher.doFinal(Base64.decode(ciphertext, Base64.NO_WRAP)), StandardCharsets.UTF_8);
        } catch (Exception failure) { remove(); throw failure; }
    }
    synchronized void remove() throws Exception {
        if (!prefs.edit().clear().commit()) throw new IllegalStateException("Secure removal failed");
    }
}
