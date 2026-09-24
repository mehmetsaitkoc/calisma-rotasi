package app.rotasi.shell;

import android.content.Context;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.security.KeyStore;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class SecureSessionStoreTest {
    private final String pref = "rota_secure_session_instrumentation";
    private final String alias = "rota.session.instrumentation.aes";
    private Context context;
    private SecureSessionStore store;
    @Before public void setup() throws Exception {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        store = new SecureSessionStore(context, pref, alias); store.remove();
    }
    @After public void cleanup() throws Exception {
        store.remove(); KeyStore keys = KeyStore.getInstance("AndroidKeyStore"); keys.load(null); if (keys.containsAlias(alias)) keys.deleteEntry(alias);
    }
    @Test public void encryptsAtRestAndSurvivesAStoreRecreation() throws Exception {
        String token = "instrumentation-only-session-0123456789";
        store.set(token);
        String ciphertext = context.getSharedPreferences(pref, Context.MODE_PRIVATE).getString("ciphertext", "");
        assertFalse(ciphertext.contains(token)); assertFalse(ciphertext.isEmpty());
        assertEquals(token, new SecureSessionStore(context, pref, alias).get());
        String oldIv = context.getSharedPreferences(pref, Context.MODE_PRIVATE).getString("iv", "");
        store.set(token); assertNotEquals(oldIv, context.getSharedPreferences(pref, Context.MODE_PRIVATE).getString("iv", ""));
        store.remove(); assertNull(store.get());
    }
    @Test public void rejectsModifiedCiphertextInsteadOfUsingAPlaintextFallback() throws Exception {
        store.set("instrumentation-only-session-0123456789");
        context.getSharedPreferences(pref, Context.MODE_PRIVATE).edit().putString("ciphertext", "aW52YWxpZA==").commit();
        try { store.get(); fail("Modified ciphertext must fail authentication"); } catch (Exception expected) { assertNull(store.get()); }
    }
    @Test public void concurrentStoreInstancesKeepOneDecryptableSession() throws Exception {
        var workers = Executors.newFixedThreadPool(2);
        try {
            for (int i = 0; i < 8; i++) {
                String first = "concurrent-first-session-" + i, second = "concurrent-second-session-" + i;
                CountDownLatch start = new CountDownLatch(1);
                var one = workers.submit(() -> { start.await(); new SecureSessionStore(context,pref,alias).set(first); return null; });
                var two = workers.submit(() -> { start.await(); new SecureSessionStore(context,pref,alias).set(second); return null; });
                start.countDown(); one.get(5,TimeUnit.SECONDS); two.get(5,TimeUnit.SECONDS);
                String stored = new SecureSessionStore(context,pref,alias).get();
                assertTrue("Latest atomic session must remain decryptable", first.equals(stored) || second.equals(stored));
            }
        } finally { workers.shutdownNow(); }
    }
}
