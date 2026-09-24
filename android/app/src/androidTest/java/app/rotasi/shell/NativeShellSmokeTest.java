package app.rotasi.shell;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NativeShellSmokeTest {
    private String evaluate(ActivityScenario<MainActivity> scenario, String js) throws Exception {
        CountDownLatch result = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>("null");
        scenario.onActivity(activity -> activity.getBridge().getWebView().evaluateJavascript(js, text -> { value.set(text); result.countDown(); }));
        assertTrue("WebView callback did not return", result.await(3, TimeUnit.SECONDS));
        return value.get();
    }
    private void ready(ActivityScenario<MainActivity> scenario) throws Exception {
        for (int i = 0; i < 100; i++) {
            if ("true".equals(evaluate(scenario, "Boolean(window.RotaNative?.isNative && window.RotaQuestionBank?.topicTests().length === 256)"))) return;
            Thread.sleep(200);
        }
        fail("Bundled native app did not load its complete question bank");
    }
    @Test public void loadsBundledBankAndSecureBridgeAcrossActivityRecreation() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            ready(scenario);
            String data = (String) new JSONTokener(evaluate(scenario, "JSON.stringify({count:RotaQuestionBank.topicTests().flatMap(t=>t.questions).length,base:RotaNative.apiBase,scheme:location.protocol,host:location.hostname})")).nextValue();
            JSONObject object = new JSONObject(data);
            assertEquals(3072, object.getInt("count"));
            assertTrue(object.getString("base").startsWith("https://"));
            assertFalse(object.getString("base").contains("localhost"));
            assertEquals("https:", object.getString("scheme"));
            assertEquals("localhost", object.getString("host"));
            if ("true".equals(InstrumentationRegistry.getArguments().getString("rotaOffline"))) {
                evaluate(scenario,"window.__networkTest='pending';Capacitor.Plugins.Network.getStatus().then(v=>window.__networkTest=v.connected)");
                boolean offline=false;
                for(int i=0;i<30;i++){if("false".equals(evaluate(scenario,"window.__networkTest"))){offline=true;break;}Thread.sleep(100);}
                assertTrue("Offline fixture requires a disconnected native Network status",offline);
            }
            evaluate(scenario, "window.__nativeSecureTest='pending';RotaNative.secureSession.set('instrumentation-bridge-session-0123456789').then(()=>RotaNative.secureSession.get()).then(v=>window.__nativeSecureTest=v).catch(()=>window.__nativeSecureTest='failed')");
            boolean stored = false;
            for (int i = 0; i < 50; i++) {
                if ("\"instrumentation-bridge-session-0123456789\"".equals(evaluate(scenario,"window.__nativeSecureTest"))) { stored = true; break; }
                Thread.sleep(100);
            }
            assertTrue("Secure plugin roundtrip failed", stored);
            scenario.recreate(); ready(scenario);
            // The account client may read the token at launch, but must not persist it in Web Storage.
            assertEquals("false", evaluate(scenario,"JSON.stringify(localStorage).includes('instrumentation-bridge-session-0123456789')"));
            evaluate(scenario,"window.__nativeRemoved=false;RotaNative.secureSession.remove().then(()=>RotaNative.secureSession.get()).then(v=>window.__nativeRemoved=v===null)");
            for (int i = 0; i < 50; i++) { if ("true".equals(evaluate(scenario,"window.__nativeRemoved"))) return; Thread.sleep(100); }
            fail("Secure plugin cleanup failed");
        }
    }
}
