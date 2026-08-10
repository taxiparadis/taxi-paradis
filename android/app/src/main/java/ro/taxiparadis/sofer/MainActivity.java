package ro.taxiparadis.sofer;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.URLUtil;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {

    private static final String UPDATE_JSON =
            "https://unknown-cilantro-bunny.ngrok-free.dev/updates/update.json";

    private BroadcastReceiver downloadReceiver;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        checkForUpdate();
    }

    private void checkForUpdate() {
        new Thread(() -> {
            try {
                URL url = new URL(UPDATE_JSON);
                HttpURLConnection connection =
                        (HttpURLConnection) url.openConnection();

                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setRequestMethod("GET");

                InputStream input = connection.getInputStream();
                BufferedReader reader =
                        new BufferedReader(new InputStreamReader(input));

                StringBuilder result = new StringBuilder();
                String line;

                while ((line = reader.readLine()) != null) {
                    result.append(line);
                }

                reader.close();
                connection.disconnect();

                JSONObject update = new JSONObject(result.toString());

                int serverVersionCode = update.getInt("versionCode");
                String apkPath = update.getString("apk");

                PackageInfo packageInfo =
                        getPackageManager().getPackageInfo(getPackageName(), 0);

                long installedVersionCode;

                if (android.os.Build.VERSION.SDK_INT >= 28) {
                    installedVersionCode = packageInfo.getLongVersionCode();
                } else {
                    installedVersionCode = packageInfo.versionCode;
                }

                if (serverVersionCode > installedVersionCode) {
                    String apkUrl;

                    if (apkPath.startsWith("http")) {
                        apkUrl = apkPath;
                    } else {
                        apkUrl =
                                "https://unknown-cilantro-bunny.ngrok-free.dev"
                                        + apkPath;
                    }

                    runOnUiThread(() -> downloadUpdate(apkUrl));
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    private void downloadUpdate(String apkUrl) {

        runOnUiThread(() ->
                Toast.makeText(
                        this,
                        "Se descarcă actualizarea Taxi Paradis...",
                        Toast.LENGTH_LONG
                ).show()
        );

        DownloadManager downloadManager =
                (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);

        DownloadManager.Request request =
                new DownloadManager.Request(Uri.parse(apkUrl));

        request.setTitle("Taxi Paradis");
        request.setDescription("Actualizare Taxi Paradis");
        request.setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
        );

        request.setMimeType("application/vnd.android.package-archive");

        String fileName = URLUtil.guessFileName(
                apkUrl,
                null,
                "application/vnd.android.package-archive"
        );

        request.setDestinationInExternalFilesDir(
                this,
                Environment.DIRECTORY_DOWNLOADS,
                fileName
        );

        long downloadId = downloadManager.enqueue(request);

        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {

                long receivedId =
                        intent.getLongExtra(
                                DownloadManager.EXTRA_DOWNLOAD_ID,
                                -1
                        );

                if (receivedId != downloadId) {
                    return;
                }

                DownloadManager.Query query =
                        new DownloadManager.Query();

                query.setFilterById(downloadId);

                android.database.Cursor cursor =
                        downloadManager.query(query);

                if (cursor != null && cursor.moveToFirst()) {

                    int status = cursor.getInt(
                            cursor.getColumnIndexOrThrow(
                                    DownloadManager.COLUMN_STATUS
                            )
                    );

                    if (status == DownloadManager.STATUS_SUCCESSFUL) {

                        Uri downloadedFile =
                                downloadManager.getUriForDownloadedFile(
                                        downloadId
                                );

                        if (downloadedFile != null) {
                            installApk(downloadedFile);
                        }
                    }

                    cursor.close();
                }
            }
        };

        registerReceiver(
                downloadReceiver,
                new IntentFilter(
                        DownloadManager.ACTION_DOWNLOAD_COMPLETE
                ),
                Context.RECEIVER_NOT_EXPORTED
        );
    }

    private void installApk(Uri apkUri) {

        try {

            if (android.os.Build.VERSION.SDK_INT >= 26) {

                if (!getPackageManager()
                        .canRequestPackageInstalls()) {

                    Intent settingsIntent =
                            new Intent(
                                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES
                            );

                    settingsIntent.setData(
                            Uri.parse(
                                    "package:" + getPackageName()
                            )
                    );

                    startActivity(settingsIntent);

                    Toast.makeText(
                            this,
                            "Permite instalarea actualizărilor pentru Taxi Paradis.",
                            Toast.LENGTH_LONG
                    ).show();

                    return;
                }
            }

            Intent installIntent =
                    new Intent(Intent.ACTION_VIEW);

            installIntent.setDataAndType(
                    apkUri,
                    "application/vnd.android.package-archive"
            );

            installIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            startActivity(installIntent);

        } catch (Exception e) {
            e.printStackTrace();

            Toast.makeText(
                    this,
                    "Nu am putut porni instalarea actualizării.",
                    Toast.LENGTH_LONG
            ).show();
        }
    }

    @Override
    public void onDestroy() {

        if (downloadReceiver != null) {
            try {
                unregisterReceiver(downloadReceiver);
            } catch (Exception ignored) {
            }
        }

        super.onDestroy();
    }
}
