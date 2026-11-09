package expo.modules.audiodevice

import android.content.Context
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AudioDeviceModule : Module() {
  private val context: Context?
    get() = appContext.reactContext

  private var audioDeviceCallback: AudioDeviceCallback? = null

  override fun definition() = ModuleDefinition {
    Name("AudioDevice")

    Events("onAudioDeviceChanged")

    Function("getConnectedAudioDevice") {
      return@Function getConnectedDeviceMap()
    }

    OnCreate {
      setupAudioDeviceCallback()
    }

    OnDestroy {
      teardownAudioDeviceCallback()
    }
  }

  private fun getConnectedDeviceMap(): Map<String, Any?> {
    val ctx = context ?: return mapOf(
      "isConnected" to false,
      "type" to "speaker",
      "name" to ""
    )

    val audioManager = ctx.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
      ?: return mapOf(
        "isConnected" to false,
        "type" to "speaker",
        "name" to ""
      )

    val devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)

    // 1. Prioritize Bluetooth devices
    for (device in devices) {
      val type = device.type
      val isBluetooth = type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
        type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
        type == 26 || // TYPE_BLE_HEADSET
        type == 27 || // TYPE_BLE_SPEAKER
        type == 23    // TYPE_HEARING_AID

      if (isBluetooth) {
        val rawName = device.productName?.toString()?.trim()
        val name = if (!rawName.isNullOrEmpty() && !rawName.equals("null", ignoreCase = true)) {
          rawName
        } else {
          "Bluetooth Kulaklık"
        }
        return mapOf(
          "isConnected" to true,
          "type" to "bluetooth",
          "name" to name
        )
      }
    }

    // 2. Wired or USB headsets
    for (device in devices) {
      val type = device.type
      val isWired = type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
        type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
        type == 22 || // TYPE_USB_HEADSET
        type == 11    // TYPE_USB_DEVICE

      if (isWired) {
        val rawName = device.productName?.toString()?.trim()
        val name = if (!rawName.isNullOrEmpty() && !rawName.equals("null", ignoreCase = true)) {
          rawName
        } else {
          "Kablolu Kulaklık"
        }
        return mapOf(
          "isConnected" to true,
          "type" to "wired",
          "name" to name
        )
      }
    }

    return mapOf(
      "isConnected" to false,
      "type" to "speaker",
      "name" to ""
    )
  }

  private fun setupAudioDeviceCallback() {
    val ctx = context ?: return
    val audioManager = ctx.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return

    if (audioDeviceCallback != null) return

    audioDeviceCallback = object : AudioDeviceCallback() {
      override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
        try {
          this@AudioDeviceModule.sendEvent("onAudioDeviceChanged", getConnectedDeviceMap())
        } catch (_: Exception) {}
      }

      override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
        try {
          this@AudioDeviceModule.sendEvent("onAudioDeviceChanged", getConnectedDeviceMap())
        } catch (_: Exception) {}
      }
    }

    try {
      audioManager.registerAudioDeviceCallback(audioDeviceCallback, Handler(Looper.getMainLooper()))
    } catch (_: Exception) {}
  }

  private fun teardownAudioDeviceCallback() {
    val ctx = context ?: return
    val audioManager = ctx.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
    audioDeviceCallback?.let {
      try {
        audioManager.unregisterAudioDeviceCallback(it)
      } catch (_: Exception) {}
      audioDeviceCallback = null
    }
  }
}

