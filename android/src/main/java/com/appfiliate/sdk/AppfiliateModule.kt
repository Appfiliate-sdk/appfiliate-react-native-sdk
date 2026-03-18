package com.appfiliate.sdk

import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AppfiliateModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppfiliateModule"

    @ReactMethod
    fun getInstallReferrer(promise: Promise) {
        try {
            val client = InstallReferrerClient.newBuilder(reactApplicationContext).build()
            client.startConnection(object : InstallReferrerStateListener {
                override fun onInstallReferrerSetupFinished(responseCode: Int) {
                    if (responseCode == InstallReferrerClient.InstallReferrerResponse.OK) {
                        try {
                            val referrer = client.installReferrer.installReferrer
                            client.endConnection()
                            promise.resolve(referrer)
                        } catch (e: Exception) {
                            client.endConnection()
                            promise.reject("REFERRER_ERROR", e.message)
                        }
                    } else {
                        client.endConnection()
                        promise.reject("REFERRER_UNAVAILABLE", "Response code: $responseCode")
                    }
                }

                override fun onInstallReferrerServiceDisconnected() {
                    promise.reject("REFERRER_DISCONNECTED", "Service disconnected")
                }
            })
        } catch (e: Exception) {
            promise.reject("REFERRER_ERROR", e.message)
        }
    }
}
