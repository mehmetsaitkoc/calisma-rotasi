package app.rotasi.shell;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RotaSecureSession")
public class RotaSecureSessionPlugin extends Plugin {
    private SecureSessionStore store() { return new SecureSessionStore(getContext()); }
    @PluginMethod public synchronized void set(PluginCall call) {
        String token = call.getString("token");
        if (token == null || token.length() < 16 || token.length() > 8192 || java.util.regex.Pattern.compile("\\s").matcher(token).find()) { call.reject("Geçersiz oturum anahtarı.", "INVALID_SESSION"); return; }
        try { store().set(token); call.resolve(); }
        catch (Exception ignored) { call.reject("Oturum güvenli biçimde kaydedilemedi.", "SECURE_STORAGE_FAILED"); }
    }
    @PluginMethod public synchronized void get(PluginCall call) {
        try { JSObject result = new JSObject(); String token = store().get(); result.put("token", token == null ? JSObject.NULL : token); call.resolve(result); }
        catch (Exception ignored) { call.reject("Güvenli oturum okunamadı. Yeniden giriş yap.", "SECURE_SESSION_UNAVAILABLE"); }
    }
    @PluginMethod public synchronized void remove(PluginCall call) {
        try { store().remove(); call.resolve(); }
        catch (Exception ignored) { call.reject("Yerel oturum silinemedi.", "SECURE_STORAGE_FAILED"); }
    }
}
