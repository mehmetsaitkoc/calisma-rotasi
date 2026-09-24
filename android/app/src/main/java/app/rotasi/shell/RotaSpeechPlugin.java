package app.rotasi.shell;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;

/** Uses the system recognizer UI; this application does not record audio itself. */
@CapacitorPlugin(name = "RotaSpeech")
public class RotaSpeechPlugin extends Plugin {
    @PluginMethod public void dictate(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "tr-TR");
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Notunu söyle. Sistem ses hizmeti kullanılır.");
        try { startActivityForResult(call, intent, "recognitionResult"); }
        catch (ActivityNotFoundException ignored) { call.reject("Cihazda sesle yazma hizmeti yok. Notunu yazarak ekleyebilirsin.", "SPEECH_UNAVAILABLE"); }
    }
    @ActivityCallback private void recognitionResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) { call.reject("Sesle yazma iptal edildi.", "SPEECH_CANCELLED"); return; }
        ArrayList<String> values = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        if (values == null || values.isEmpty() || values.get(0).trim().isEmpty()) { call.reject("Ses algılanamadı.", "SPEECH_EMPTY"); return; }
        String text = values.get(0).trim();
        if (text.length() > 4000) text = text.substring(0, 4000);
        JSObject response = new JSObject(); response.put("text", text); call.resolve(response);
    }
}
